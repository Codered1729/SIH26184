"""
Unit and integration tests for Officer Authentication and Authorization in SENTINEL.
Validates strict enforcement of 401 Unauthorized for unauthenticated or invalid tokens.
"""

import sys
import unittest
from pathlib import Path

# Ensure backend root on sys.path
_BACKEND_ROOT = str(Path(__file__).resolve().parents[1])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from fastapi.testclient import TestClient

from app.main import app
from app.api.routes import _ALERTS_STORE, MAHARASHTRA_ATMS


class TestOfficerAuthentication(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Ensure a dummy alert exists in _ALERTS_STORE
        _ALERTS_STORE["CYB-MAH-2026-TEST"] = {
            "complaint_id": "CYB-MAH-2026-TEST",
            "utr": "UTR9999999999",
            "amount": 48000.0,
            "victim_account": "ACC-VICTIM-01",
            "beneficiary_account": "ACC-MULE-01",
            "target_bank": "State Bank of India",
            "channel": "UPI",
            "leading_atm": MAHARASHTRA_ATMS[0],
            "cashout_probability": 0.88,
            "incident_timestamp": 1700000000.0,
            "total_window_seconds": 1800,
        }

    def tearDown(self):
        _ALERTS_STORE.pop("CYB-MAH-2026-TEST", None)

    def test_unauthenticated_request_rejected(self):
        """Verifies HTTP 401 when no token header is supplied to protected endpoints."""
        resp = self.client.post("/api/v1/notices/generate", json={"complaint_id": "CYB-MAH-2026-TEST"})
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Authentication required", resp.json().get("detail", ""))

        resp_disp = self.client.post("/api/v1/alerts/CYB-MAH-2026-TEST/dispatch")
        self.assertEqual(resp_disp.status_code, 401)

    def test_invalid_token_rejected(self):
        """Verifies HTTP 401 when an invalid/bogus officer token is provided."""
        headers = {"X-Officer-Token": "bogus_unauthorized_token"}
        resp = self.client.post("/api/v1/notices/generate", json={"complaint_id": "CYB-MAH-2026-TEST"}, headers=headers)
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Invalid officer credentials", resp.json().get("detail", ""))

    def test_valid_officer_token_accepted(self):
        """Verifies HTTP 200 when a valid officer token is supplied."""
        headers = {"X-Officer-Token": "DEMO_OFFICER_TOKEN_2026"}
        resp = self.client.post("/api/v1/notices/generate", json={"complaint_id": "CYB-MAH-2026-TEST"}, headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("notice_id", data)
        self.assertEqual(data["officer_verification"]["authenticated"], True)

    def test_bearer_authorization_header(self):
        """Verifies Authorization: Bearer <valid_token> works seamlessly."""
        headers = {"Authorization": "Bearer MH-POLICE-SEC-1930"}
        resp = self.client.post("/api/v1/notices/generate", json={"complaint_id": "CYB-MAH-2026-TEST"}, headers=headers)
        self.assertEqual(resp.status_code, 200)


if __name__ == "__main__":
    unittest.main()
