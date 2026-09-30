"""
Unit and integration tests for SimulationEngine, WebSocket stream, and Audit Ledger.
"""

import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

_BACKEND_ROOT = str(Path(__file__).resolve().parents[1])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.main import app
from app.services.simulation_engine import SimulationEngine


class TestSimulationAndAudit(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, headers={"X-Officer-Token": "DEMO_OFFICER_TOKEN_2026"})
        self.engine = SimulationEngine()

    def test_scenarios_metadata(self):
        """Validates the 4 canonical presentation scenarios are registered."""
        response = self.client.get("/api/v1/simulation/scenarios")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        scenarios = data["scenarios"]
        self.assertEqual(len(scenarios), 4)
        scenario_ids = [s["id"] for s in scenarios]
        self.assertIn("genuine_pune_upi", scenario_ids)
        self.assertIn("duplicate_utr_fail", scenario_ids)
        self.assertIn("bank_outage_resilience", scenario_ids)
        self.assertIn("multihop_decay", scenario_ids)

    def test_trigger_genuine_pune_upi(self):
        """Validates triggering genuine UPI fraud generates critical forecast and notice."""
        response = self.client.post("/api/v1/simulation/trigger/genuine_pune_upi")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["complaint_id"], "CYB-MAH-2026-0901")
        alert = data["alert"]
        self.assertEqual(alert["victim_city"], "Pune")
        self.assertGreaterEqual(alert["cashout_probability"], 0.85)
        self.assertEqual(alert["authenticity_decision"], "VERIFIED")
        self.assertIn("champion_model", alert)
        self.assertEqual(alert["champion_model"]["model_name"], "LightGBM / GBDT (Champion)")

    def test_trigger_duplicate_utr_hard_fail(self):
        """Validates duplicate UTR hard-fails to HELD_FOR_REVIEW with score 0.0."""
        response = self.client.post("/api/v1/simulation/trigger/duplicate_utr_fail")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["complaint_id"], "CYB-MAH-2026-0902")
        alert = data["alert"]
        self.assertEqual(alert["authenticity_decision"], "DUPLICATE_UTR")
        self.assertEqual(alert["authenticity_score"], 0.0)
        self.assertEqual(alert["status"], "HELD_FOR_REVIEW")

    def test_trigger_bank_outage(self):
        """Validates bank outage trips circuit breaker to OPEN."""
        response = self.client.post("/api/v1/simulation/trigger/bank_outage_resilience")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        # Check outbox status
        outbox_res = self.client.get("/api/v1/outbox/status")
        self.assertEqual(outbox_res.status_code, 200)
        outbox_data = outbox_res.json()
        self.assertEqual(outbox_data["circuit_breaker"]["state"], "OPEN")

    def test_trigger_multihop_decay(self):
        """Validates multi-hop decay marks status EXPIRED."""
        response = self.client.post("/api/v1/simulation/trigger/multihop_decay")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        alert = data["alert"]
        self.assertEqual(alert["status"], "EXPIRED")

    def test_dispatch_scenario4_multihop_decay(self):
        """Validates officer can alert patrol unit on Scenario 4 and status transitions to DISPATCHED."""
        # 1. Trigger Scenario 4
        trigger_res = self.client.post("/api/v1/simulation/trigger/multihop_decay")
        self.assertEqual(trigger_res.status_code, 200)
        cid = trigger_res.json()["complaint_id"]
        
        # 2. Dispatch patrol unit
        dispatch_res = self.client.post(f"/api/v1/alerts/{cid}/dispatch")
        self.assertEqual(dispatch_res.status_code, 200)
        disp_data = dispatch_res.json()
        self.assertEqual(disp_data["status"], "success")
        self.assertEqual(disp_data["cooldown_seconds"], 900)
        self.assertEqual(disp_data["audit_entry"]["event_type"], "PATROL_DISPATCHED")
        
        # 3. Verify GET /alerts preserves DISPATCHED (does NOT revert to EXPIRED)
        alerts_res = self.client.get("/api/v1/alerts?filter_tab=all")
        alerts_map = {a["complaint_id"]: a for a in alerts_res.json()["alerts"]}
        self.assertIn(cid, alerts_map)
        self.assertEqual(alerts_map[cid]["status"], "DISPATCHED")
        self.assertGreater(alerts_map[cid]["dispatch_cooldown_remaining"], 0)
        
        # 4. Verify case dossier details status is DISPATCHED
        dossier_res = self.client.get(f"/api/v1/alerts/{cid}")
        self.assertEqual(dossier_res.status_code, 200)
        self.assertEqual(dossier_res.json()["details"]["status"], "DISPATCHED")
        self.assertGreater(dossier_res.json()["details"]["dispatch_cooldown_remaining"], 0)


    def test_audit_logs_query(self):
        """Validates audit logs endpoint returns chronological ledger with chain hashes."""
        response = self.client.get("/api/v1/audit/logs?limit=50")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        logs = data["logs"]
        self.assertGreater(len(logs), 0)
        # Check chain hash format
        for log in logs:
            self.assertEqual(len(log["chain_hash"]), 64)
            self.assertIn("event_type", log)
            self.assertIn("complaint_id", log)

    def test_simulation_reset(self):
        """Validates demo reset restores initial seed state and closes circuit breaker."""
        response = self.client.post("/api/v1/simulation/reset")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        outbox_res = self.client.get("/api/v1/outbox/status")
        outbox_data = outbox_res.json()
        self.assertEqual(outbox_data["circuit_breaker"]["state"], "CLOSED")

    def test_websocket_connection(self):
        """Validates WebSocket connection handshakes and receives connection envelope."""
        with self.client.websocket_connect("/api/v1/ws/alerts") as websocket:
            data = websocket.receive_json()
            self.assertEqual(data["event_type"], "CONNECTED")
            websocket.send_text("ping")
            pong = websocket.receive_text()
            self.assertEqual(pong, "pong")


if __name__ == "__main__":
    unittest.main()
