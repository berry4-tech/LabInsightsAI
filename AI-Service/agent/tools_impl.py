"""
Tool implementations for the LabInsight agent.

These are plain functions over a pymongo-style database handle, kept apart
from LangGraph so they can be unit tested without an LLM or a running MongoDB.

Every function receives the patient's email from the verified JWT, never from
the model, so a prompt cannot make the agent read or act on another patient's
data.
"""

import os
import pickle
import re
import time
from datetime import datetime, timezone

import numpy as np

MAX_MESSAGE_CHARS = 500
INACTIVE_DOCTOR_STATUSES = {"inactive", "suspended"}

# Common shorthand patients use, mapped to the words lab reports use.
_SYNONYMS = {
    "wbc": "white blood",
    "hgb": "hemoglobin",
    "hb": "hemoglobin",
    "sugar": "glucose",
    "vit": "vitamin",
    "hba1c": "a1c",
    "thyroid": "tsh",
}
_FILLER = {"my", "the", "level", "levels", "test", "result", "results", "count", "blood", "cell", "cells", "value"}


# ------------------------------------------------------------------
# helpers
# ------------------------------------------------------------------

def _canon(text):
    words = re.sub(r"[^a-z0-9 ]", " ", (text or "").lower()).split()
    return " ".join(_SYNONYMS.get(w, w) for w in words)


def test_name_matches(query, test_name):
    """True if a patient's wording ('blood sugar', 'wbc') refers to a report test name."""
    q, n = _canon(query), _canon(test_name)
    if not q or not n:
        return False
    if q in n:
        return True
    q_words = [w for w in q.split() if w not in _FILLER]
    n_words = set(n.split())
    return bool(q_words) and all(w in n_words for w in q_words)


def _to_float(value):
    try:
        return float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def _normalize_test(t):
    # Older reports use testName/referenceRange; newer ones use name/normalRange.
    return {
        "name": t.get("name") or t.get("testName") or "Unknown test",
        "value": t.get("value"),
        "unit": t.get("unit") or "",
        "normal_range": t.get("normalRange") or t.get("referenceRange") or "",
        "status": (t.get("status") or "normal").lower(),
    }


def _latest_report(db, email):
    return db["reports"].find_one({"user_email": email}, sort=[("uploaded_at", -1)])


def _specialization_matches(wanted, actual):
    """Loose match so 'endocrinology' finds 'Endocrinologist' and 'cardio' finds 'Cardiology'."""
    wanted_words = _canon(wanted).split()
    actual_words = _canon(actual).split()
    for w in wanted_words:
        for a in actual_words:
            if w == a or (len(w) >= 6 and len(a) >= 6 and w[:6] == a[:6]) or (len(w) >= 4 and a.startswith(w)):
                return True
    return False


def _doctor_summary(d, assigned_email=None):
    email = (d.get("doctorEmail") or "").lower()
    return {
        "name": d.get("name") or email,
        "email": email,
        "specialization": d.get("specialization") or "General",
        "is_your_doctor": bool(assigned_email) and email == assigned_email,
    }


# ------------------------------------------------------------------
# read tools
# ------------------------------------------------------------------

def get_latest_report(db, email):
    report = _latest_report(db, email)
    if not report:
        return {"found": False, "message": "This patient has not uploaded any lab reports yet."}

    summary = report.get("ai_summary") or {}
    tests = [_normalize_test(t) for t in report.get("testResults") or []]
    return {
        "found": True,
        "file_name": report.get("file_name"),
        "uploaded_at": str(report.get("uploaded_at", ""))[:10],
        "overall_summary": summary.get("overall") or summary.get("summary") or "",
        "severity": summary.get("severity", "low"),
        "flagged_tests": [t for t in tests if t["status"] != "normal"],
        "tests": tests,
        "doctor_comment": report.get("doctor_comment"),
    }


def get_test_history(db, email, test_name):
    reports = list(db["reports"].find({"user_email": email}).sort("uploaded_at", 1))
    if not reports:
        return {"found": False, "message": "This patient has not uploaded any lab reports yet."}

    readings = []
    for r in reports:
        for t in r.get("testResults") or []:
            nt = _normalize_test(t)
            if test_name_matches(test_name, nt["name"]):
                readings.append({"date": str(r.get("uploaded_at", ""))[:10], "file_name": r.get("file_name"), **nt})
                break

    if not readings:
        latest_names = sorted({_normalize_test(t)["name"] for t in reports[-1].get("testResults") or []})
        return {
            "found": False,
            "message": f"No result matching '{test_name}' in any of the patient's {len(reports)} report(s).",
            "tests_in_latest_report": latest_names,
        }

    numeric = [v for v in (_to_float(r["value"]) for r in readings) if v is not None]
    if len(numeric) < 2:
        trend = "only one reading" if len(readings) == 1 else "not numeric"
    else:
        first, last = numeric[0], numeric[-1]
        change = (last - first) / abs(first) if first else 0.0
        trend = "stable" if abs(change) < 0.05 else ("increasing" if change > 0 else "decreasing")

    return {"found": True, "test_name": readings[-1]["name"], "readings": readings, "trend": trend}


def search_report_text(db, email, query, encode, base_dir, k=3, max_chars=1200):
    """Vector search over the latest report's chunks, using the embeddings saved by /analyze."""
    report = _latest_report(db, email)
    if not report:
        return {"found": False, "message": "This patient has not uploaded any lab reports yet."}

    path = report.get("embedding_path") or ""
    if path and not os.path.isabs(path):
        path = os.path.join(base_dir, path)
    if not path or not os.path.exists(path):
        return {"found": False, "message": "The latest report has no searchable text. Re-uploading it would fix this."}

    with open(path, "rb") as f:
        emb = pickle.load(f)
    texts, vectors = emb.get("texts"), emb.get("vectors")
    if texts is None or vectors is None or len(texts) == 0:
        return {"found": False, "message": "The latest report's search index is empty."}

    sims = np.dot(np.asarray(vectors), np.asarray(encode(query)))
    top = sims.argsort()[-k:][::-1]
    return {
        "found": True,
        "file_name": report.get("file_name"),
        "passages": [texts[i][:max_chars] for i in top],
    }


def find_doctors(db, email, specialization=None, limit=10):
    assigned = db["assigned_doctors"].find_one({"userEmail": email.lower()})
    assigned_email = (assigned or {}).get("doctorEmail", "").lower() or None

    doctors = [
        _doctor_summary(d, assigned_email)
        for d in db["doctor_profiles"].find({})
        if (d.get("status") or "active") not in INACTIVE_DOCTOR_STATUSES
    ]
    if not doctors:
        return {"doctors": [], "message": "No doctors are available on LabInsight right now."}

    if specialization:
        matched = [d for d in doctors if _specialization_matches(specialization, d["specialization"])]
        if matched:
            return {"doctors": matched[:limit], "matched_specialization": True}
        return {
            "doctors": doctors[:limit],
            "matched_specialization": False,
            "message": f"No available doctor lists '{specialization}', so these are all available doctors.",
        }
    return {"doctors": doctors[:limit]}


# ------------------------------------------------------------------
# action tool (two steps around the human approval)
# ------------------------------------------------------------------

def prepare_doctor_request(db, email, doctor_email):
    """Validate before asking the patient to approve. Read-only, safe to re-run."""
    doctor_email = (doctor_email or "").strip().lower()
    doctor = db["doctor_profiles"].find_one({"doctorEmail": doctor_email})
    if not doctor or (doctor.get("status") or "active") in INACTIVE_DOCTOR_STATUSES:
        return {"ok": False, "reason": "unknown_doctor",
                "message": f"No available doctor with email {doctor_email}. Call find_doctors and pick from that list."}

    assigned = db["assigned_doctors"].find_one({"userEmail": email.lower()})
    assigned_email = (assigned or {}).get("doctorEmail", "").lower() or None
    summary = _doctor_summary(doctor, assigned_email)

    if assigned_email == doctor_email:
        return {"ok": False, "reason": "already_connected", "doctor": summary,
                "message": f"The patient is already connected to {summary['name']}, who can already see their reports."}

    pending = db["connection_requests"].find_one(
        {"patientId": email, "status": "pending"}, sort=[("requestDate", -1)]
    )
    if pending and (pending.get("doctorId") or "").lower() == doctor_email:
        return {"ok": False, "reason": "already_pending", "doctor": summary,
                "message": f"A request to {summary['name']} is already pending."}

    warning = None
    if assigned_email:
        current = db["doctor_profiles"].find_one({"doctorEmail": assigned_email}) or {}
        warning = (f"If {summary['name']} accepts, they replace your current doctor, "
                   f"{current.get('name') or assigned_email}.")
    elif pending:
        warning = "You already have a pending request with another doctor."

    return {"ok": True, "doctor": summary, "warning": warning}


def create_doctor_request(db, email, doctor_email, message):
    """Write the connection request in the same shape the Node /send-request route uses."""
    profile = db["profiles"].find_one({"email": email.lower()}) or {}
    user = db["users"].find_one({"email": email.lower()}) or {}
    doctor = db["doctor_profiles"].find_one({"doctorEmail": doctor_email}) or {}

    request_id = f"req_{int(time.time() * 1000)}"
    db["connection_requests"].insert_one({
        "id": request_id,
        "doctorId": doctor_email,
        "patientId": email,
        "patientName": profile.get("name") or user.get("name") or "Unknown",
        "patientEmail": email,
        "patientPhone": profile.get("phone") or "N/A",
        "message": (message or "").strip()[:MAX_MESSAGE_CHARS],
        "reportsCount": db["reports"].count_documents({"user_email": email}),
        "requestDate": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
        "rejectionMessage": "",
    })
    return {"sent": True, "request_id": request_id, "doctor_name": doctor.get("name") or doctor_email}
