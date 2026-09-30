import json
from pathlib import Path
import numpy as np

rng = np.random.default_rng(42)

canonical = [
    {"atm_id": "ATM-MAH-MUM-00101", "city": "Mumbai", "area": "Bandra Kurla Complex", "lat": 19.0660, "lon": 72.8677, "bank": "SBI", "cluster_id": "CLUSTER-MUM-MMR"},
    {"atm_id": "ATM-MAH-MUM-00102", "city": "Mumbai", "area": "Andheri East Metro", "lat": 19.1197, "lon": 72.8464, "bank": "HDFC", "cluster_id": "CLUSTER-MUM-MMR"},
    {"atm_id": "ATM-MAH-MUM-00103", "city": "Mumbai", "area": "Dadar TT Circle", "lat": 19.0178, "lon": 72.8478, "bank": "ICICI", "cluster_id": "CLUSTER-MUM-MMR"},
    {"atm_id": "ATM-MAH-MUM-00104", "city": "Mumbai", "area": "Kurla West Station", "lat": 19.0688, "lon": 72.8833, "bank": "Axis", "cluster_id": "CLUSTER-MUM-MMR"},
    {"atm_id": "ATM-MAH-PUN-00201", "city": "Pune", "area": "Shivajinagar Station", "lat": 18.5314, "lon": 73.8446, "bank": "SBI", "cluster_id": "CLUSTER-PUN-METRO"},
    {"atm_id": "ATM-MAH-PUN-00202", "city": "Pune", "area": "Hinjawadi Phase 1", "lat": 18.5912, "lon": 73.7389, "bank": "HDFC", "cluster_id": "CLUSTER-PUN-METRO"},
    {"atm_id": "ATM-MAH-PUN-00203", "city": "Pune", "area": "Kothrud Paud Road", "lat": 18.5074, "lon": 73.8077, "bank": "ICICI", "cluster_id": "CLUSTER-PUN-METRO"},
    {"atm_id": "ATM-MAH-PUN-00204", "city": "Pune", "area": "Viman Nagar Central", "lat": 18.5679, "lon": 73.9143, "bank": "Axis", "cluster_id": "CLUSTER-PUN-METRO"},
    {"atm_id": "ATM-MAH-THA-00301", "city": "Thane", "area": "Thane West Station", "lat": 19.1860, "lon": 72.9759, "bank": "SBI", "cluster_id": "CLUSTER-THA-SUB"},
    {"atm_id": "ATM-MAH-THA-00302", "city": "Thane", "area": "Ghodbunder Road", "lat": 19.2612, "lon": 72.9644, "bank": "HDFC", "cluster_id": "CLUSTER-THA-SUB"},
    {"atm_id": "ATM-MAH-THA-00303", "city": "Thane", "area": "Kalyan Station West", "lat": 19.2437, "lon": 73.1355, "bank": "BoB", "cluster_id": "CLUSTER-THA-SUB"},
    {"atm_id": "ATM-MAH-NAS-00401", "city": "Nashik", "area": "CBS Old City", "lat": 19.9975, "lon": 73.7898, "bank": "SBI", "cluster_id": "CLUSTER-NAS-NORTH"},
    {"atm_id": "ATM-MAH-NAS-00402", "city": "Nashik", "area": "College Road", "lat": 20.0063, "lon": 73.7639, "bank": "HDFC", "cluster_id": "CLUSTER-NAS-NORTH"},
    {"atm_id": "ATM-MAH-NAS-00403", "city": "Nashik", "area": "Satpur MIDC", "lat": 19.9866, "lon": 73.7225, "bank": "ICICI", "cluster_id": "CLUSTER-NAS-NORTH"},
    {"atm_id": "ATM-MAH-NAG-00501", "city": "Nagpur", "area": "Sitabuldi Main Road", "lat": 21.1458, "lon": 79.0882, "bank": "SBI", "cluster_id": "CLUSTER-NAG-EAST"},
    {"atm_id": "ATM-MAH-NAG-00502", "city": "Nagpur", "area": "Dharampeth Square", "lat": 21.1428, "lon": 79.0601, "bank": "HDFC", "cluster_id": "CLUSTER-NAG-EAST"},
    {"atm_id": "ATM-MAH-NAG-00503", "city": "Nagpur", "area": "MIDC Hingna", "lat": 21.1166, "lon": 78.9833, "bank": "Axis", "cluster_id": "CLUSTER-NAG-EAST"},
    {"atm_id": "ATM-GUJ-AHM-00601", "city": "Ahmedabad", "area": "SG Highway Tech Park", "lat": 23.0489, "lon": 72.5097, "bank": "SBI", "cluster_id": "CLUSTER-AHM-WEST"},
    {"atm_id": "ATM-GUJ-AHM-00602", "city": "Ahmedabad", "area": "Ashram Road Commercial", "lat": 23.0300, "lon": 72.5695, "bank": "HDFC", "cluster_id": "CLUSTER-AHM-WEST"},
    {"atm_id": "ATM-GUJ-AHM-00603", "city": "Ahmedabad", "area": "Maninagar Station", "lat": 22.9978, "lon": 72.6026, "bank": "ICICI", "cluster_id": "CLUSTER-AHM-WEST"},
    {"atm_id": "ATM-GUJ-SUR-00701", "city": "Surat", "area": "Ring Road Textile Market", "lat": 21.1926, "lon": 72.8424, "bank": "SBI", "cluster_id": "CLUSTER-SUR-TEXTILE"},
    {"atm_id": "ATM-GUJ-SUR-00702", "city": "Surat", "area": "Athwa Lines Central", "lat": 21.1764, "lon": 72.8055, "bank": "HDFC", "cluster_id": "CLUSTER-SUR-TEXTILE"},
    {"atm_id": "ATM-GUJ-BRD-00801", "city": "Vadodara", "area": "Alkapuri Station Hub", "lat": 22.3107, "lon": 73.1812, "bank": "BoB", "cluster_id": "CLUSTER-BRD-CENTRAL"},
    {"atm_id": "ATM-GUJ-BRD-00802", "city": "Vadodara", "area": "Sayajigunj Market", "lat": 22.3088, "lon": 73.1895, "bank": "Axis", "cluster_id": "CLUSTER-BRD-CENTRAL"},
]

banks = ["SBI", "HDFC", "ICICI", "Bank of Baroda", "Axis Bank", "Kotak Mahindra", "Punjab National Bank", "Canara Bank", "Union Bank"]
zones = {
    "Mumbai": {"center": (19.0760, 72.8777), "radius": 0.12, "count": 100, "cluster": "CLUSTER-MUM-MMR", "code": "MAH-MUM"},
    "Pune": {"center": (18.5204, 73.8567), "radius": 0.09, "count": 60, "cluster": "CLUSTER-PUN-METRO", "code": "MAH-PUN"},
    "Thane": {"center": (19.2183, 72.9781), "radius": 0.08, "count": 40, "cluster": "CLUSTER-THA-SUB", "code": "MAH-THA"},
    "Nashik": {"center": (19.9975, 73.7898), "radius": 0.06, "count": 25, "cluster": "CLUSTER-NAS-NORTH", "code": "MAH-NAS"},
    "Nagpur": {"center": (21.1458, 79.0882), "radius": 0.07, "count": 25, "cluster": "CLUSTER-NAG-EAST", "code": "MAH-NAG"},
    "Ahmedabad": {"center": (23.0225, 72.5714), "radius": 0.08, "count": 25, "cluster": "CLUSTER-AHM-WEST", "code": "GUJ-AHM"},
}

all_atms = list(canonical)
start_idx = 1000

for city, zinfo in zones.items():
    c_lat, c_lon = zinfo["center"]
    for i in range(zinfo["count"]):
        lat = float(c_lat + rng.normal(0, zinfo["radius"] * 0.45))
        lon = float(c_lon + rng.normal(0, zinfo["radius"] * 0.45))
        bank = rng.choice(banks)
        atm_id = f"ATM-{zinfo['code']}-{start_idx}"
        start_idx += 1
        all_atms.append({
            "atm_id": atm_id,
            "city": city,
            "area": f"{city} Cluster Node {i+1}",
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "bank": bank,
            "cluster_id": zinfo["cluster"],
            "has_deposit_kiosk": bool(rng.random() < 0.45),
            "is_24_7": bool(rng.random() < 0.85)
        })

out_dir = Path(__file__).resolve().parent.parent / "data" / "atms"
out_dir.mkdir(parents=True, exist_ok=True)
out_file = out_dir / "maharashtra_osm_atms.json"
out_file.write_text(json.dumps(all_atms, indent=2), encoding="utf-8")
print(f"Successfully generated {len(all_atms)} ATMs to {out_file}")
