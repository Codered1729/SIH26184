"""
FastAPI Sub-Router for ATM Spatial Queries, Leaflet Cartography, and Hawkes Point-Process Hotspots.
"""

import time
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException

from app.core.state import (
    MAHARASHTRA_ATMS,
    MAHARASHTRA_CLUSTERS,
    _ALERTS_STORE,
    _DISPATCH_COOLDOWNS,
    _spatiotemporal,
    AtmStatusUpdateRequest,
)

router = APIRouter(tags=["ATMs & Spatial"])


def _evaluate_atms_and_clusters():
    now = time.time()
    candidates = [(atm["atm_id"], atm["lat"], atm["lon"]) for atm in MAHARASHTRA_ATMS]
    ranked = _spatiotemporal.hawkes.rank(candidates, t=now, history=_spatiotemporal.withdrawal_history, top_k=len(candidates))
    ranked_dict = {a.atm_id: a.intensity for a in ranked}

    # Find active alerts and targeted banks/ATMs
    active_alerts = [a for a in _ALERTS_STORE.values() if a.get("status") not in ("DISPATCHED", "EXPIRED", "HELD_FOR_REVIEW")]
    alerted_banks = set()
    alerted_atm_ids = set()
    for a in active_alerts:
        if a.get("target_bank"):
            alerted_banks.add(a["target_bank"].upper())
        if a.get("target_atm"):
            alerted_atm_ids.add(a["target_atm"])
        if a.get("leading_atm") and a["leading_atm"].get("atm_id"):
            alerted_atm_ids.add(a["leading_atm"]["atm_id"])

    # Build enriched ATMs
    enriched_atms = []
    atm_lookup = {}
    for i, atm in enumerate(MAHARASHTRA_ATMS):
        atm_id = atm["atm_id"]
        intensity = round(float(ranked_dict.get(atm_id, 0.45 - i * 0.02)), 3)
        vulnerability_score = max(0.05, min(0.99, intensity))

        # Check cooldown
        cooldown_sec = 0
        if atm_id in _DISPATCH_COOLDOWNS:
            elapsed = now - _DISPATCH_COOLDOWNS[atm_id]
            if elapsed < 900:
                cooldown_sec = int(900 - elapsed)

        # Status determination
        bank_upper = (atm.get("bank") or "").upper()
        has_direct_alert = (atm_id in alerted_atm_ids) or (bank_upper in alerted_banks)

        if cooldown_sec > 0:
            status = "PATROL_DEPLOYED"
            status_label = f"Patrol Dispatched ({cooldown_sec // 60}m cooldown)"
            vulnerability_tier = "PATROL_SUPPRESSED" if vulnerability_score < 0.8 else "CRITICAL"
        elif has_direct_alert and vulnerability_score >= 0.70:
            status = "ACTIVE_THREAT"
            status_label = "Active Cash-Out Threat"
            vulnerability_tier = "CRITICAL"
        elif vulnerability_score >= 0.80:
            status = "ACTIVE_THREAT"
            status_label = "Imminent Extraction Risk"
            vulnerability_tier = "CRITICAL"
        elif vulnerability_score >= 0.60:
            status = "SUSPICIOUS_VELOCITY"
            status_label = "Elevated Velocity Corridor"
            vulnerability_tier = "ELEVATED"
        elif vulnerability_score >= 0.40:
            status = "NORMAL_SURVEILLANCE"
            status_label = "Baseline Surveillance Nominal"
            vulnerability_tier = "MODERATE"
        else:
            status = "NORMAL_SURVEILLANCE"
            status_label = "Normal / Low Exposure"
            vulnerability_tier = "LOW"

        atm_item = {
            **atm,
            "hawkes_intensity": vulnerability_score,
            "vulnerability_score": vulnerability_score,
            "vulnerability_tier": vulnerability_tier,
            "status": status,
            "status_label": status_label,
            "composite_priority": round(min(0.99, vulnerability_score * 1.5), 3),
            "is_pulsing_hotspot": status == "ACTIVE_THREAT" or (vulnerability_score >= 0.80 and cooldown_sec == 0),
            "is_in_cooldown": cooldown_sec > 0,
            "cooldown_remaining_sec": cooldown_sec,
            "linked_alerts_count": 1 if has_direct_alert else 0,
        }
        enriched_atms.append(atm_item)
        atm_lookup[atm_id] = atm_item

    # Build enriched Clusters
    enriched_clusters = []
    for c in MAHARASHTRA_CLUSTERS:
        cluster_atms = [atm_lookup[aid] for aid in c["atm_ids"] if aid in atm_lookup]
        total_cluster_atms = len(cluster_atms)
        if total_cluster_atms > 0:
            avg_vuln = round(sum(a["vulnerability_score"] for a in cluster_atms) / total_cluster_atms, 3)
            max_vuln = round(max(a["vulnerability_score"] for a in cluster_atms), 3)
        else:
            avg_vuln = 0.5
            max_vuln = 0.5

        if max_vuln >= 0.85 or avg_vuln >= 0.75:
            cluster_tier = "CRITICAL"
        elif max_vuln >= 0.65 or avg_vuln >= 0.60:
            cluster_tier = "ELEVATED"
        elif avg_vuln >= 0.40:
            cluster_tier = "MODERATE"
        else:
            cluster_tier = "LOW"

        active_threat_atms = [a for a in cluster_atms if a["status"] == "ACTIVE_THREAT"]
        deployed_atms = [a for a in cluster_atms if a["status"] == "PATROL_DEPLOYED"]

        if active_threat_atms:
            c_status = "ACTIVE_THREAT"
            c_status_label = f"Under Active Threat ({len(active_threat_atms)} ATMs flagged)"
        elif deployed_atms:
            c_status = "PATROL_DEPLOYED"
            c_status_label = f"Patrol Deployed ({len(deployed_atms)} units dispatched)"
        elif cluster_tier in ("CRITICAL", "ELEVATED"):
            c_status = "SUSPICIOUS_VELOCITY"
            c_status_label = "Elevated Extraction Risk Detected"
        else:
            c_status = "NORMAL_SURVEILLANCE"
            c_status_label = "Normal Corridor Surveillance"

        # Bounds calculation [[min_lat, min_lon], [max_lat, max_lon]]
        lats = [a["lat"] for a in cluster_atms] if cluster_atms else [c["center"][0]]
        lons = [a["lon"] for a in cluster_atms] if cluster_atms else [c["center"][1]]
        bounds = [
            [min(lats) - 0.05, min(lons) - 0.05],
            [max(lats) + 0.05, max(lons) + 0.05],
        ]

        # Dominant banks in cluster
        bank_counts: Dict[str, int] = {}
        for a in cluster_atms:
            b = a.get("bank", "SBI")
            bank_counts[b] = bank_counts.get(b, 0) + 1
        sorted_banks = sorted(bank_counts.items(), key=lambda x: x[1], reverse=True)
        dominant_banks = [b[0] for b in sorted_banks[:2]]

        enriched_clusters.append({
            **c,
            "total_atms": total_cluster_atms,
            "vulnerability_score": avg_vuln,
            "max_vulnerability_score": max_vuln,
            "vulnerability_tier": cluster_tier,
            "status": c_status,
            "status_label": c_status_label,
            "active_threat_count": len(active_threat_atms),
            "patrol_deployed_count": len(deployed_atms),
            "bounds": bounds,
            "dominant_banks": dominant_banks,
            "atms": cluster_atms,
        })

    return enriched_atms, enriched_clusters


@router.get("/atms/hotspots")
def get_atm_hotspots():
    """
    Returns all calibrated Maharashtra ATMs with live Hawkes point-process intensity scores,
    vulnerability metrics, and active cooldown indicators.
    """
    atms, _ = _evaluate_atms_and_clusters()
    return {
        "status": "success",
        "total_atms": len(atms),
        "atms": atms,
    }


@router.get("/leaflet/clusters")
def get_leaflet_clusters():
    """
    Leaflet API: Returns regional ATM clusters with vulnerability scores, tier classifications,
    operational statuses, and member ATMs for Leaflet cartography.
    """
    atms, clusters = _evaluate_atms_and_clusters()
    critical_count = sum(1 for c in clusters if c["vulnerability_tier"] == "CRITICAL")
    elevated_count = sum(1 for c in clusters if c["vulnerability_tier"] == "ELEVATED")
    active_threats = sum(c["active_threat_count"] for c in clusters)
    deployed_patrols = sum(c["patrol_deployed_count"] for c in clusters)

    return {
        "status": "success",
        "total_clusters": len(clusters),
        "total_atms": len(atms),
        "statewide_vulnerability_index": round(sum(c["vulnerability_score"] for c in clusters) / max(1, len(clusters)), 3),
        "summary": {
            "critical_clusters": critical_count,
            "elevated_clusters": elevated_count,
            "active_threats_count": active_threats,
            "patrol_deployed_count": deployed_patrols,
        },
        "clusters": clusters,
    }


@router.get("/leaflet/geojson")
def get_leaflet_geojson():
    """
    Leaflet API: Returns RFC 7946 compliant GeoJSON FeatureCollection for Leaflet L.geoJSON consumption.
    Includes Point features for ATMs and Cluster circle centroids with vulnerability and status properties.
    """
    atms, clusters = _evaluate_atms_and_clusters()
    features = []

    for c in clusters:
        features.append({
            "type": "Feature",
            "id": c["cluster_id"],
            "geometry": {
                "type": "Point",
                "coordinates": [c["center"][1], c["center"][0]],  # GeoJSON: [lon, lat]
            },
            "properties": {
                "feature_type": "cluster",
                "cluster_id": c["cluster_id"],
                "name": c["name"],
                "city": c["city"],
                "state": c.get("state", "Maharashtra"),
                "jcct_team": c.get("jcct_team", "JCCT-Maharashtra"),
                "corridor_desc": c["corridor_desc"],
                "radius_meters": c["radius_meters"],
                "bounds": c["bounds"],
                "total_atms": c["total_atms"],
                "vulnerability_score": c["vulnerability_score"],
                "max_vulnerability_score": c["max_vulnerability_score"],
                "vulnerability_tier": c["vulnerability_tier"],
                "status": c["status"],
                "status_label": c["status_label"],
                "active_threat_count": c["active_threat_count"],
                "patrol_deployed_count": c["patrol_deployed_count"],
                "dominant_banks": c["dominant_banks"],
            }
        })

    for a in atms:
        features.append({
            "type": "Feature",
            "id": a["atm_id"],
            "geometry": {
                "type": "Point",
                "coordinates": [a["lon"], a["lat"]],
            },
            "properties": {
                "feature_type": "atm",
                "atm_id": a["atm_id"],
                "bank": a["bank"],
                "area": a["area"],
                "city": a["city"],
                "state": a.get("state", "Maharashtra"),
                "jcct_team": a.get("jcct_team", "JCCT-Maharashtra"),
                "cluster_id": a.get("cluster_id"),
                "vulnerability_score": a["vulnerability_score"],
                "vulnerability_tier": a["vulnerability_tier"],
                "status": a["status"],
                "status_label": a["status_label"],
                "hawkes_intensity": a["hawkes_intensity"],
                "composite_priority": a["composite_priority"],
                "is_pulsing_hotspot": a["is_pulsing_hotspot"],
                "is_in_cooldown": a["is_in_cooldown"],
                "cooldown_remaining_sec": a["cooldown_remaining_sec"],
                "linked_alerts_count": a["linked_alerts_count"],
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.post("/leaflet/atms/{atm_id}/status")
def update_leaflet_atm_status(atm_id: str, payload: AtmStatusUpdateRequest):
    """
    Leaflet API: Updates the operational status of a specific ATM kiosk.
    Supports dispatching patrol (activating 15m cooldown), clearing cooldown, or escalating threat.
    """
    matched = [a for a in MAHARASHTRA_ATMS if a["atm_id"] == atm_id]
    if not matched:
        raise HTTPException(status_code=404, detail=f"ATM '{atm_id}' not found in registry")

    now = time.time()
    atm = matched[0]
    action = payload.action.upper()

    if action == "DISPATCH_PATROL":
        cd_sec = payload.cooldown_seconds or 900
        _DISPATCH_COOLDOWNS[atm_id] = now
        new_status = "PATROL_DEPLOYED"
        message = f"Patrol squad dispatched to {atm['bank']} ATM {atm_id} ({atm['area']}). 15m suppression active."
    elif action in ("MARK_SECURE", "CLEAR_STATUS"):
        if atm_id in _DISPATCH_COOLDOWNS:
            del _DISPATCH_COOLDOWNS[atm_id]
        new_status = "NORMAL_SURVEILLANCE"
        message = f"ATM {atm_id} marked secure. Telemetry reset to baseline."
    elif action == "ESCALATE_THREAT":
        _spatiotemporal.record_withdrawal(atm_id=atm_id, lat=atm["lat"], lon=atm["lon"], timestamp=now)
        new_status = "ACTIVE_THREAT"
        message = f"Threat escalated for {atm_id}. Hawkes self-excitation triggered."
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported action '{payload.action}'")

    return {
        "status": "success",
        "atm_id": atm_id,
        "action": action,
        "new_status": new_status,
        "cooldown_remaining_sec": 900 if new_status == "PATROL_DEPLOYED" else 0,
        "message": message,
    }


@router.post("/leaflet/atms/{atm_id}/dispatch")
def dispatch_leaflet_atm(atm_id: str):
    """Convenience shortcut to dispatch patrol to an ATM directly via Leaflet UI."""
    return update_leaflet_atm_status(atm_id, AtmStatusUpdateRequest(action="DISPATCH_PATROL"))
