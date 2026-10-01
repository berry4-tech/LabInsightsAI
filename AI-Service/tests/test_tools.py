"""
Unit tests for agent tool logic. No LLM, network or MongoDB needed.

Run from AI-Service/:  python -m unittest discover tests -v
"""

import os
import pickle
import sys
import tempfile
import unittest

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent import tools_impl as t  # noqa: E402


# ---------------- minimal in-memory stand-in for pymongo ----------------

class FakeCursor(list):
    def sort(self, key, direction=1):
        return FakeCursor(sorted(self, key=lambda d: d.get(key, ""), reverse=direction == -1))


class FakeCollection:
    def __init__(self, docs=None):
        self.docs = [dict(d) for d in (docs or [])]

    def _match(self, doc, flt):
        return all(doc.get(k) == v for k, v in (flt or {}).items())

    def find(self, flt=None):
        return FakeCursor(d for d in self.docs if self._match(d, flt))

    def find_one(self, flt=None, sort=None):
        rows = self.find(flt)
        if sort:
            key, direction = sort[0]
            rows = rows.sort(key, direction)
        return rows[0] if rows else None

    def count_documents(self, flt):
        return len(self.find(flt))

    def insert_one(self, doc):
        self.docs.append(dict(doc))


class FakeDB(dict):
    def __missing__(self, name):
        self[name] = FakeCollection()
        return self[name]


PATIENT = "pat@example.com"


def make_db():
    db = FakeDB()
    db["reports"] = FakeCollection([
        {"user_email": PATIENT, "file_name": "jan.pdf", "uploaded_at": "2026-01-10T09:00:00",
         "ai_summary": {"overall": "Mostly normal.", "severity": "low"},
         "testResults": [
             {"name": "Fasting Glucose", "value": "98", "unit": "mg/dL", "normalRange": "70 - 99", "status": "normal"},
             {"testName": "WBC Count", "value": "7,900", "unit": "/uL", "referenceRange": "4,000 - 11,000", "status": "normal"},
         ]},
        {"user_email": PATIENT, "file_name": "jun.pdf", "uploaded_at": "2026-06-02T09:00:00",
         "ai_summary": {"overall": "Glucose is elevated.", "severity": "medium"},
         "embedding_path": "",
         "testResults": [
             {"name": "Fasting Glucose", "value": "118", "unit": "mg/dL", "normalRange": "70 - 99", "status": "high"},
             {"name": "Hemoglobin", "value": "14.1", "unit": "g/dL", "normalRange": "12 - 16", "status": "normal"},
         ]},
        {"user_email": "other@example.com", "file_name": "other.pdf", "uploaded_at": "2026-09-01",
         "testResults": [{"name": "Fasting Glucose", "value": "300", "status": "high"}]},
    ])
    db["doctor_profiles"] = FakeCollection([
        {"doctorEmail": "endo@example.com", "name": "Dr. Rao", "specialization": "Endocrinologist", "status": "active"},
        {"doctorEmail": "cardio@example.com", "name": "Dr. Lee", "specialization": "Cardiology", "status": "active"},
        {"doctorEmail": "gone@example.com", "name": "Dr. Gone", "specialization": "Endocrinology", "status": "suspended"},
    ])
    db["profiles"] = FakeCollection([{"email": PATIENT, "name": "Pat Doe", "phone": "555-0100"}])
    return db


class TestNameMatching(unittest.TestCase):
    def test_shorthand_and_plain_words(self):
        self.assertTrue(t.test_name_matches("glucose", "Fasting Glucose"))
        self.assertTrue(t.test_name_matches("blood sugar", "Fasting Glucose"))
        self.assertTrue(t.test_name_matches("wbc", "White Blood Cells"))
        self.assertTrue(t.test_name_matches("white blood cells", "WBC Count"))
        self.assertTrue(t.test_name_matches("vitamin d", "Vitamin D, 25-Hydroxy"))
        self.assertFalse(t.test_name_matches("cholesterol", "Fasting Glucose"))
        self.assertFalse(t.test_name_matches("", "Fasting Glucose"))


class TestReadTools(unittest.TestCase):
    def setUp(self):
        self.db = make_db()

    def test_latest_report_is_newest_and_flags_abnormal(self):
        r = t.get_latest_report(self.db, PATIENT)
        self.assertTrue(r["found"])
        self.assertEqual(r["file_name"], "jun.pdf")
        self.assertEqual([x["name"] for x in r["flagged_tests"]], ["Fasting Glucose"])

    def test_latest_report_none(self):
        self.assertFalse(t.get_latest_report(self.db, "new@example.com")["found"])

    def test_history_trend_and_isolation(self):
        h = t.get_test_history(self.db, PATIENT, "glucose")
        self.assertEqual([r["value"] for r in h["readings"]], ["98", "118"])  # other patient's 300 excluded
        self.assertEqual(h["trend"], "increasing")

    def test_history_handles_old_field_names(self):
        h = t.get_test_history(self.db, PATIENT, "wbc")
        self.assertTrue(h["found"])
        self.assertEqual(h["readings"][0]["normal_range"], "4,000 - 11,000")

    def test_history_missing_test_lists_alternatives(self):
        h = t.get_test_history(self.db, PATIENT, "cholesterol")
        self.assertFalse(h["found"])
        self.assertIn("Hemoglobin", h["tests_in_latest_report"])

    def test_search_report_text_ranks_by_similarity(self):
        with tempfile.TemporaryDirectory() as d:
            with open(os.path.join(d, "jun.pkl"), "wb") as f:
                pickle.dump({"texts": ["glucose notes", "hemoglobin notes", "lab address"],
                             "vectors": np.array([[1, 0, 0], [0, 1, 0], [0, 0, 1]], dtype=float)}, f)
            self.db["reports"].docs[1]["embedding_path"] = "jun.pkl"
            res = t.search_report_text(self.db, PATIENT, "q", lambda q: np.array([0.1, 0.9, 0.0]), d, k=2)
        self.assertEqual(res["passages"], ["hemoglobin notes", "glucose notes"])

    def test_search_without_embeddings(self):
        self.assertFalse(t.search_report_text(self.db, PATIENT, "q", lambda q: None, "/tmp")["found"])

    def test_find_doctors_by_specialization_skips_suspended(self):
        r = t.find_doctors(self.db, PATIENT, "endocrinology")
        self.assertTrue(r["matched_specialization"])
        self.assertEqual([d["email"] for d in r["doctors"]], ["endo@example.com"])

    def test_find_doctors_falls_back_to_all(self):
        r = t.find_doctors(self.db, PATIENT, "dermatology")
        self.assertFalse(r["matched_specialization"])
        self.assertEqual(len(r["doctors"]), 2)


class TestDoctorRequest(unittest.TestCase):
    def setUp(self):
        self.db = make_db()

    def test_unknown_or_suspended_doctor_blocked(self):
        self.assertEqual(t.prepare_doctor_request(self.db, PATIENT, "nobody@example.com")["reason"], "unknown_doctor")
        self.assertEqual(t.prepare_doctor_request(self.db, PATIENT, "gone@example.com")["reason"], "unknown_doctor")

    def test_already_connected_blocked(self):
        self.db["assigned_doctors"] = FakeCollection([{"userEmail": PATIENT, "doctorEmail": "endo@example.com"}])
        self.assertEqual(t.prepare_doctor_request(self.db, PATIENT, "endo@example.com")["reason"], "already_connected")

    def test_switching_doctor_warns(self):
        self.db["assigned_doctors"] = FakeCollection([{"userEmail": PATIENT, "doctorEmail": "cardio@example.com"}])
        r = t.prepare_doctor_request(self.db, PATIENT, "ENDO@example.com")
        self.assertTrue(r["ok"])
        self.assertIn("Dr. Lee", r["warning"])

    def test_duplicate_pending_blocked(self):
        t.create_doctor_request(self.db, PATIENT, "endo@example.com", "Please review")
        self.assertEqual(t.prepare_doctor_request(self.db, PATIENT, "endo@example.com")["reason"], "already_pending")

    def test_created_request_matches_node_schema(self):
        out = t.create_doctor_request(self.db, PATIENT, "endo@example.com", "x" * 900)
        self.assertTrue(out["sent"])
        doc = self.db["connection_requests"].docs[0]
        for key in ["id", "doctorId", "patientId", "patientName", "patientEmail", "patientPhone",
                    "message", "reportsCount", "requestDate", "status"]:
            self.assertIn(key, doc)
        self.assertEqual(doc["patientName"], "Pat Doe")
        self.assertEqual(doc["reportsCount"], 2)
        self.assertEqual(doc["status"], "pending")
        self.assertEqual(len(doc["message"]), t.MAX_MESSAGE_CHARS)


if __name__ == "__main__":
    unittest.main()
