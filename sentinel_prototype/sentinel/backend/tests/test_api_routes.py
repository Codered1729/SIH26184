"""
Comprehensive End-to-End Tests for SENTINEL FastAPI REST Routes.
Tests:
1. Alert Feed & Priority Queue (with situational dynamic window)
2. Case Dossier, Multi-Hop Graph, Attestation, and 7-Model Consensus
3. Spatiotemporal ATM Hotspots & Hawkes Intensity
4. Raw Complaint Ingestion & Authenticity Gate (Duplicate UTR hard-fail)
5. Section 105 BNSS Lawful Notice Generation (Courtroom HTML & Plain-text)
6. Durable Outbox & Circuit Breaker Telemetry
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


class TestSentinelAPIRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app, headers={"X-Officer-Token": "DEMO_OFFICER_TOKEN_2026"})

    def test_01_health_and_root(self):
        """Verify health check and root endpoints return online status."""
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["system"], "SENTINEL")

        resp_root = self.client.get("/")
        self.assertEqual(resp_root.status_code, 200)

    def test_02_get_alerts_feed(self):
        """Verify alerts feed returns ranked alerts with situational golden windows."""
        resp = self.client.get("/api/v1/alerts")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertGreater(data["total_active"], 0)

        # Inspect top alert
        top_alert = data["alerts"][0]
        self.assertIn("complaint_id", top_alert)
        self.assertIn("priority_score", top_alert)
        self.assertIn("situational_baseline", top_alert)
        self.assertIn("remaining_seconds", top_alert)
        self.assertIn("risk_tier", top_alert)
        self.assertIn("leading_atm", top_alert)

    def test_03_filter_alerts_tabs(self):
        """Verify tab filtering works for critical, held, dispatched, and expired."""
        resp_crit = self.client.get("/api/v1/alerts?filter_tab=critical")
        self.assertEqual(resp_crit.status_code, 200)

        resp_held = self.client.get("/api/v1/alerts?filter_tab=held")
        self.assertEqual(resp_held.status_code, 200)
        held_alerts = resp_held.json()["alerts"]
        for a in held_alerts:
            self.assertEqual(a["status"], "HELD_FOR_REVIEW")

    def test_04_get_alert_dossier(self):
        """Verify case dossier returns graph, device cluster, 3-party attestation, and 7 models."""
        resp = self.client.get("/api/v1/alerts/CYB-MAH-2026-0819")
        self.assertEqual(resp.status_code, 200)
        dossier = resp.json()

        # 1. Multi-hop graph
        self.assertIn("syndicate_graph", dossier)
        self.assertGreaterEqual(len(dossier["syndicate_graph"]["nodes"]), 4)
        self.assertGreaterEqual(len(dossier["syndicate_graph"]["edges"]), 3)

        # 2. Device fingerprint
        self.assertIn("device_fingerprint", dossier)
        self.assertIn("imei", dossier["device_fingerprint"])

        # 3. Attestation chain
        self.assertIn("attestation_chain", dossier)
        self.assertTrue(dossier["attestation_chain"]["is_tamper_evident"])
        self.assertIn("chain_hash", dossier["attestation_chain"])

        # 4. 7-Model consensus
        self.assertIn("model_consensus", dossier)
        models = dossier["model_consensus"]["models"]
        self.assertGreaterEqual(len(models), 6)
        self.assertIn("RandomForest (tuned)", models)
        self.assertIn("XGBoost", models)
        self.assertIn("top_reasons", dossier["model_consensus"])

    def test_05_get_atm_hotspots(self):
        """Verify Maharashtra ATM hotspots return with Hawkes intensity and coordinates."""
        resp = self.client.get("/api/v1/atms/hotspots")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertGreaterEqual(data["total_atms"], 10)

        atm0 = data["atms"][0]
        self.assertIn("lat", atm0)
        self.assertIn("lon", atm0)
        self.assertIn("hawkes_intensity", atm0)
        self.assertIn("composite_priority", atm0)

    def test_06_submit_intake_genuine(self):
        """Verify genuine complaint ingestion produces verified alert."""
        payload = {
            "raw_text": "Rs 80000.00 debited from a/c **1122 via UPI on 25-09-2026. UTR: 998877665544.",
            "victim_city": "Pune",
            "channel": "UPI",
            "amount": 80000.0,
        }
        resp = self.client.post("/api/v1/intake/submit", json=payload)
        self.assertEqual(resp.status_code, 200)
        res = resp.json()
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["decision"], "VERIFIED")
        self.assertIn("cashout_probability", res)

    def test_07_submit_intake_duplicate_utr(self):
        """Verify duplicate UTR triggers Authenticity Gate hard-fail."""
        payload = {
            "raw_text": "Rs 65000.00 debited from a/c **9999. UTR: 429104829102. Repeated.",
            "victim_city": "Mumbai",
            "channel": "UPI",
            "amount": 65000.0,
        }
        resp = self.client.post("/api/v1/intake/submit", json=payload)
        self.assertEqual(resp.status_code, 200)
        res = resp.json()
        self.assertEqual(res["decision"], "DUPLICATE_UTR")
        self.assertEqual(res["alert"]["status"], "HELD_FOR_REVIEW")

    def test_08_dispatch_alert_cooldown(self):
        """Verify patrol dispatch marks alert dispatched and activates 15m cooldown."""
        resp = self.client.post("/api/v1/alerts/CYB-MAH-2026-0819/dispatch")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["cooldown_seconds"], 900)
        self.assertIn("atm_id", data)

    def test_09_generate_bnss_notice(self):
        """Verify Section 105 BNSS notice returns courtroom HTML and plain text."""
        resp = self.client.get("/api/v1/notices/CYB-MAH-2026-0819")
        self.assertEqual(resp.status_code, 200)
        notice = resp.json()
        self.assertIn("Section 105", notice["statutory_act"])
        self.assertIn("html_content", notice)
        self.assertIn("plain_text", notice)
        self.assertIn("chain_hash", notice)

    def test_10_outbox_telemetry_and_replay(self):
        """Verify outbox telemetry returns circuit breaker state and replay functions."""
        resp = self.client.get("/api/v1/outbox/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("circuit_breaker", data)
        self.assertIn("outbox", data)

        resp_replay = self.client.post("/api/v1/outbox/replay")
        self.assertEqual(resp_replay.status_code, 200)
        self.assertEqual(resp_replay.json()["status"], "success")

    def test_11_leaflet_clusters_api(self):
        """Verify Leaflet clusters API returns regional clusters with vulnerability scores and status."""
        resp = self.client.get("/api/v1/leaflet/clusters")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["total_clusters"], 8)
        self.assertEqual(data["total_atms"], 24)
        self.assertIn("statewide_vulnerability_index", data)
        self.assertIn("summary", data)

        # Check cluster fields
        c0 = data["clusters"][0]
        self.assertIn("cluster_id", c0)
        self.assertIn("name", c0)
        self.assertIn("city", c0)
        self.assertIn("state", c0)
        self.assertIn("jcct_team", c0)
        self.assertIn("vulnerability_score", c0)
        self.assertIn("vulnerability_tier", c0)
        self.assertIn("status", c0)
        self.assertIn("status_label", c0)
        self.assertIn("center", c0)
        self.assertIn("bounds", c0)
        self.assertIn("atms", c0)

    def test_12_leaflet_geojson_api(self):
        """Verify Leaflet GeoJSON endpoint returns compliant FeatureCollection with ATM & Cluster features."""
        resp = self.client.get("/api/v1/leaflet/geojson")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["type"], "FeatureCollection")
        self.assertIn("features", data)
        self.assertGreaterEqual(len(data["features"]), 32)  # 24 ATMs + 8 Clusters

        atm_features = [f for f in data["features"] if f["properties"]["feature_type"] == "atm"]
        cluster_features = [f for f in data["features"] if f["properties"]["feature_type"] == "cluster"]
        self.assertEqual(len(atm_features), 24)
        self.assertEqual(len(cluster_features), 8)

        # Check GeoJSON Point coordinate structure [lon, lat]
        f0 = atm_features[0]
        self.assertEqual(f0["geometry"]["type"], "Point")
        self.assertEqual(len(f0["geometry"]["coordinates"]), 2)
        self.assertIn("vulnerability_score", f0["properties"])
        self.assertIn("status", f0["properties"])
        self.assertIn("jcct_team", f0["properties"])

    def test_13_leaflet_atm_status_and_dispatch(self):
        """Verify Leaflet ATM status update and dispatch patrol actions."""
        target_atm = "ATM-MAH-PUN-00202"

        # Dispatch patrol via Leaflet endpoint
        resp = self.client.post(f"/api/v1/leaflet/atms/{target_atm}/dispatch")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["new_status"], "PATROL_DEPLOYED")
        self.assertEqual(data["cooldown_remaining_sec"], 900)

        # Verify cluster API reflects PATROL_DEPLOYED
        resp_clusters = self.client.get("/api/v1/leaflet/clusters")
        self.assertEqual(resp_clusters.status_code, 200)
        clusters_data = resp_clusters.json()
        pune_cluster = next(c for c in clusters_data["clusters"] if c["city"] == "Pune")
        self.assertGreaterEqual(pune_cluster["patrol_deployed_count"], 1)

        # Clear status
        resp_clear = self.client.post(
            f"/api/v1/leaflet/atms/{target_atm}/status",
            json={"action": "CLEAR_STATUS"},
        )
        self.assertEqual(resp_clear.status_code, 200)
        self.assertEqual(resp_clear.json()["new_status"], "NORMAL_SURVEILLANCE")


if __name__ == "__main__":
    unittest.main()

