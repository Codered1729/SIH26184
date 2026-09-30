"""
Unit and integration tests for Pydantic Complaint Ingestion and Real SHAP TreeExplainer.
Validates:
1. Strict Pydantic input schema validation (NPCI UPI 2,00,000 ceiling, regex, range constraints).
2. Authentic SHAP TreeExplainer feature attributions returned in prediction result.
3. Fail-closed error handling when model bundle is absent.
"""

import sys
import unittest
from pathlib import Path
from pydantic import ValidationError

_BACKEND_ROOT = str(Path(__file__).resolve().parents[1])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.schemas.complaint import ComplaintInput
from app.services.predictor import CashoutPredictor, get_predictor


class TestComplaintValidationAndSHAP(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.predictor = get_predictor()

    def test_valid_complaint_input(self):
        """Verifies valid compliant payload instantiates correctly."""
        valid_data = {
            "complaint_id": "CMP-MAH-2026-001",
            "amount": 45000.0,
            "channel_type": "UPI",
            "hop_depth": 2,
            "hop_velocity_min": 8.5,
            "sim_swap_last_48h": 0,
            "remote_access_tool_flag": 0,
            "structuring_flag": 1,
            "source_bank_tier": "PRIVATE_TIER1",
            "jcct_origin": "Mumbai",
        }
        complaint = ComplaintInput(**valid_data)
        self.assertEqual(complaint.complaint_id, "CMP-MAH-2026-001")
        self.assertEqual(complaint.amount, 45000.0)

    def test_npci_upi_limit_exceeded(self):
        """Verifies UPI amounts > 200,000 trigger NPCI regulatory ValidationError."""
        invalid_upi = {
            "complaint_id": "CMP-MAH-2026-002",
            "amount": 250000.0,
            "channel_type": "UPI",
            "hop_depth": 2,
            "hop_velocity_min": 10.0,
            "jcct_origin": "Pune",
        }
        with self.assertRaises(ValidationError) as ctx:
            ComplaintInput(**invalid_upi)
        self.assertIn("NPCI ₹2,00,000 threshold", str(ctx.exception))

    def test_non_upi_high_amount_allowed(self):
        """Verifies non-UPI channels (e.g. NEFT, IMPS) can exceed 200,000 up to max limit."""
        neft_data = {
            "complaint_id": "CMP-MAH-2026-003",
            "amount": 850000.0,
            "channel_type": "NEFT",
            "hop_depth": 1,
            "hop_velocity_min": 60.0,
            "jcct_origin": "Nagpur",
        }
        complaint = ComplaintInput(**neft_data)
        self.assertEqual(complaint.amount, 850000.0)

    def test_invalid_channel_and_id_regex(self):
        """Verifies invalid payment channel or complaint_id pattern is rejected."""
        with self.assertRaises(ValidationError):
            ComplaintInput(
                complaint_id="INVALID_ID_FORMAT",
                amount=10000.0,
                channel_type="UPI",
                jcct_origin="Mumbai",
            )

        with self.assertRaises(ValidationError):
            ComplaintInput(
                complaint_id="CMP-9999",
                amount=10000.0,
                channel_type="CRYPTO_RAIL",  # Unsupported / invalid channel
                jcct_origin="Mumbai",
            )

    def test_shap_factors_returned_in_prediction(self):
        """Verifies authentic SHAP feature attributions are returned in PredictionResult."""
        payload = {
            "channel_type": "AEPS_KIOSK",
            "jcct_origin": "Pune",
            "amount": 48000.0,
            "hop_depth": 4,
            "hop_velocity_min": 4.2,
            "time_to_file_min": 85.0,
            "structuring_flag": 1,
            "sim_swap_last_48h": 1,
        }
        res = self.predictor.predict_risk(payload)
        self.assertIsNotNone(res.top_shap_factors)
        self.assertGreaterEqual(len(res.top_shap_factors), 3)

        # Inspect factor schema
        top_factor = res.top_shap_factors[0]
        self.assertIn("feature", top_factor)
        self.assertIn("impact", top_factor)
        self.assertIn("direction", top_factor)
        self.assertIn("text", top_factor)
        self.assertIn(top_factor["direction"], ["elevates", "reduces"])

    def test_fail_closed_when_bundle_missing(self):
        """Verifies predict_risk raises RuntimeError when bundle is unlinked or None."""
        unloaded_predictor = CashoutPredictor(model_path="non_existent_bundle.pkl")
        unloaded_predictor.bundle = None

        with self.assertRaises(RuntimeError) as ctx:
            unloaded_predictor.predict_risk({"amount": 10000.0})
        self.assertIn("ML model bundle not loaded", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
