"""Tests for the deterministic emergency guardrail. Run: python -m unittest discover tests -v"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.prompts import EMERGENCY_PATTERN  # noqa: E402


class TestEmergencyGuardrail(unittest.TestCase):
    def test_triggers_on_first_person_emergencies(self):
        for text in ["I'm having chest pain right now", "I have severe chest pain",
                     "I can't breathe", "i think i overdosed", "I want to kill myself",
                     "I fainted this morning", "I'm feeling shortness of breath"]:
            self.assertRegex(text, EMERGENCY_PATTERN, text)

    def test_ignores_general_health_questions(self):
        for text in ["Can high cholesterol cause chest pain?", "Does my glucose raise my stroke risk?",
                     "Can you overdose on vitamin D?", "Explain my hemoglobin result",
                     "Is my breathing test included in this report?"]:
            self.assertNotRegex(text, EMERGENCY_PATTERN, text)


if __name__ == "__main__":
    unittest.main()
