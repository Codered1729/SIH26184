/**
 * SENTINEL API Service Layer
 * Connects frontend to FastAPI backend with graceful offline fallback
 */

const API_BASE = '/api/v1';

// Offline fallback dataset if backend server is unreachable
const OFFLINE_FALLBACK = {
  alerts: [
    {
      complaint_id: "CYB-MAH-2026-0819",
      utr: "429104829102",
      victim_city: "Pune",
      state: "Maharashtra",
      jcct_team: "JCCT-Maharashtra",
      area: "Hinjawadi IT Corridor",
      amount: 78000.0,
      channel: "UPI",
      hop_depth: 1,
      has_prior_cashout: false,
      situational_baseline: "⚡ Fresh UPI Single-Hop (20m Window)",
      total_window_seconds: 1200,
      elapsed_seconds: 90,
      remaining_seconds: 1110,
      window_status: "ACTIVE",
      priority_score: 0.91,
      risk_tier: "CRITICAL",
      cashout_probability: 0.91,
      authenticity_score: 0.96,
      authenticity_decision: "VERIFIED",
      status: "PENDING_DISPATCH",
      dispatch_cooldown_remaining: 0,
      leading_atm: {
        atm_id: "ATM-MAH-PUN-00202",
        city: "Pune",
        state: "Maharashtra",
        jcct_team: "JCCT-Maharashtra",
        area: "Hinjawadi Phase 1",
        bank: "HDFC",
        lat: 18.5912,
        lon: 73.7389,
        composite_score: 0.92,
      },
      device_imei: "864291048291021",
      shared_mule_devices: 3,
      chain_hash: "a4f8e9102c4b82d710f293847291a4b5c6d7e8f90123456789abcdef01234567",
      top_reasons: [
        "Fresh UPI incident logged 90s ago with zero ATM extraction dispensed",
        "100% of disputed capital active in transit or lien-preservable under BNSS §106",
        "Target ATM exhibits high spatiotemporal Hawkes excitation (0.92)",
      ],
    },
    {
      complaint_id: "CYB-INT-2026-0822",
      utr: "429105938203",
      victim_city: "Thane",
      state: "Maharashtra",
      jcct_team: "JCCT-Maharashtra",
      inter_jcct: "JCCT-Maharashtra -> JCCT-Gujarat",
      area: "Thane West Station Hub",
      amount: 165000.0,
      channel: "IMPS",
      hop_depth: 2,
      situational_baseline: "🔄 Cross-Corridor Mule (Hop 2) (45m Window)",
      total_window_seconds: 2700,
      elapsed_seconds: 660,
      remaining_seconds: 2040,
      window_status: "ACTIVE",
      priority_score: 0.89,
      risk_tier: "CRITICAL",
      cashout_probability: 0.89,
      authenticity_score: 0.94,
      authenticity_decision: "VERIFIED",
      status: "PENDING_DISPATCH",
      dispatch_cooldown_remaining: 0,
      leading_atm: {
        atm_id: "ATM-GUJ-AHM-00602",
        city: "Ahmedabad",
        state: "Gujarat",
        jcct_team: "JCCT-Gujarat",
        area: "Ashram Road Banking Axis",
        bank: "HDFC",
        lat: 23.0378,
        lon: 72.5714,
        composite_score: 0.90,
      },
      device_imei: "864291048291021",
      shared_mule_devices: 3,
      chain_hash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f80918273645a4b5c6d7e8f901234567",
      top_reasons: [
        "Inter-JCCT interstate flight path detected (Thane -> Ahmedabad)",
        "Shared syndicate IMEI: 864291048291021 operating across state borders",
        "High-value tranche split into Ahmedabad commercial cash-out vector",
      ],
    },
    {
      complaint_id: "CYB-MAH-2026-0824",
      utr: "429108392104",
      victim_city: "Mumbai",
      state: "Maharashtra",
      jcct_team: "JCCT-Maharashtra",
      area: "Bandra Kurla Complex",
      amount: 140000.0,
      channel: "IMPS",
      hop_depth: 2,
      situational_baseline: "🔄 Multi-Hop Mule (Hop 2) (45m Window)",
      total_window_seconds: 2700,
      elapsed_seconds: 980,
      remaining_seconds: 1720,
      window_status: "ACTIVE",
      priority_score: 0.86,
      risk_tier: "CRITICAL",
      cashout_probability: 0.86,
      authenticity_score: 0.92,
      authenticity_decision: "VERIFIED",
      status: "DISPATCHED",
      dispatch_cooldown_remaining: 720,
      leading_atm: {
        atm_id: "ATM-MAH-MUM-00101",
        city: "Mumbai",
        state: "Maharashtra",
        jcct_team: "JCCT-Maharashtra",
        area: "Bandra Kurla Complex",
        bank: "SBI",
        lat: 19.0660,
        lon: 72.8677,
        composite_score: 0.94,
      },
      device_imei: "864291048291021",
      shared_mule_devices: 3,
      chain_hash: "c8b1e42091d74a2b8e9f1048291c4d5e6f7a8b90123456789abcdef01234568",
      top_reasons: [
        "Layered mule hop movement with high tranche amount (> ₹1,00,000)",
        "Daily ATM limit forces sequential cash extractions at BKC hub",
        "Patrol unit already dispatched to BKC corridor (12m cooldown active)",
      ],
    },
    {
      complaint_id: "CYB-GUJ-2026-0828",
      utr: "429109482915",
      victim_city: "Surat",
      state: "Gujarat",
      jcct_team: "JCCT-Gujarat",
      area: "Ring Road Textile Market",
      amount: 48000.0,
      channel: "AEPS_KIOSK",
      hop_depth: 2,
      has_prior_cashout: true,
      situational_baseline: "🔄 AEPS Layered Mule (Hop 2) (35m Window)",
      total_window_seconds: 2100,
      elapsed_seconds: 480,
      remaining_seconds: 1620,
      window_status: "ACTIVE",
      priority_score: 0.85,
      risk_tier: "CRITICAL",
      cashout_probability: 0.85,
      authenticity_score: 0.91,
      authenticity_decision: "VERIFIED",
      status: "PENDING_DISPATCH",
      dispatch_cooldown_remaining: 0,
      leading_atm: {
        atm_id: "ATM-GUJ-SUR-00701",
        city: "Surat",
        state: "Gujarat",
        jcct_team: "JCCT-Gujarat",
        area: "Ring Road Market Sub-Branch",
        bank: "SBI",
        lat: 21.1895,
        lon: 72.8312,
        composite_score: 0.86,
      },
      device_imei: "359104829104899",
      shared_mule_devices: 2,
      chain_hash: "d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90123456789",
      top_reasons: [
        "AEPS Aadhaar biometric spoofing extraction flagged in commercial zone",
        "Target ATM kiosk cluster within high-density textile market corridor",
        "Linked to duplicate mule accounts in Gujarat southern zone",
      ],
    },
    {
      complaint_id: "CYB-MAH-2026-0831",
      utr: "429112948201",
      victim_city: "Nagpur",
      state: "Maharashtra",
      jcct_team: "JCCT-Maharashtra",
      area: "Sitabuldi Metro",
      amount: 35000.0,
      channel: "ATM_CARDLESS",
      hop_depth: 1,
      has_prior_cashout: false,
      situational_baseline: "⚡ Ultra-Fresh Cardless ATM (20m Window)",
      total_window_seconds: 1200,
      elapsed_seconds: 60,
      remaining_seconds: 1140,
      window_status: "ACTIVE",
      priority_score: 0.82,
      risk_tier: "CRITICAL",
      cashout_probability: 0.82,
      authenticity_score: 0.89,
      authenticity_decision: "VERIFIED",
      status: "PENDING_DISPATCH",
      dispatch_cooldown_remaining: 0,
      leading_atm: {
        atm_id: "ATM-MAH-NAG-00501",
        city: "Nagpur",
        state: "Maharashtra",
        jcct_team: "JCCT-Maharashtra",
        area: "Sitabuldi Main Road",
        bank: "SBI",
        lat: 21.1458,
        lon: 79.0882,
        composite_score: 0.72,
      },
      device_imei: "359104829104812",
      shared_mule_devices: 1,
      chain_hash: "e1f2a3b4c5d6e7f80918273645a4b5c6d7e8f90123456789abcdef01234569",
      top_reasons: [
        "Ultra-fresh complaint logged 60 seconds ago with zero ATM extraction dispensed",
        "100% of disputed capital active in flight; prime police interdiction opportunity",
        "Beneficiary branch matched to known Vidarbha transit mule ring",
      ],
    },
    {
      complaint_id: "CYB-MAH-2026-0835",
      utr: "429104829102",
      victim_city: "Mumbai",
      state: "Maharashtra",
      jcct_team: "JCCT-Maharashtra",
      area: "Andheri East",
      amount: 65000.0,
      channel: "UPI",
      hop_depth: 1,
      situational_baseline: "⛔ Window Suspended (Gate Hard-Fail)",
      total_window_seconds: 0,
      elapsed_seconds: 300,
      remaining_seconds: 0,
      window_status: "SUSPENDED",
      priority_score: 0.00,
      risk_tier: "HELD_FOR_REVIEW",
      cashout_probability: 0.00,
      authenticity_score: 0.00,
      authenticity_decision: "DUPLICATE_UTR",
      status: "HELD_FOR_REVIEW",
      dispatch_cooldown_remaining: 0,
      leading_atm: {
        atm_id: "ATM-MAH-MUM-00102",
        city: "Mumbai",
        state: "Maharashtra",
        jcct_team: "JCCT-Maharashtra",
        area: "Andheri East Metro",
        bank: "HDFC",
        lat: 19.1197,
        lon: 72.8464,
        composite_score: 0.40,
      },
      device_imei: "864291048291099",
      shared_mule_devices: 0,
      chain_hash: "f0e1d2c3b4a5968778695a4b3c2d1e0f0123456789abcdef0123456789abcdef",
      top_reasons: [
        "DUPLICATE UTR HARD-FAIL: Transaction reference already claimed in CYB-MAH-2026-0819",
        "Authenticity Score: 0.00 | Preservation hold & patrol dispatch suppressed",
        "Held for administrative review to prevent wrongful account freeze",
      ],
    },
    {
      complaint_id: "CYB-GUJ-2026-0840",
      utr: "429118492019",
      victim_city: "Vadodara",
      state: "Gujarat",
      jcct_team: "JCCT-Gujarat",
      area: "Alkapuri Financial Hub",
      amount: 92000.0,
      channel: "NEFT",
      hop_depth: 3,
      situational_baseline: "⏱️ Window Expired (>50m elapsed)",
      total_window_seconds: 2700,
      elapsed_seconds: 3120,
      remaining_seconds: 0,
      window_status: "EXPIRED",
      priority_score: 0.22,
      risk_tier: "EXPIRED",
      cashout_probability: 0.22,
      authenticity_score: 0.88,
      authenticity_decision: "VERIFIED",
      status: "EXPIRED",
      dispatch_cooldown_remaining: 0,
      leading_atm: {
        atm_id: "ATM-GUJ-BRD-00801",
        city: "Vadodara",
        state: "Gujarat",
        jcct_team: "JCCT-Gujarat",
        area: "Alkapuri Main Branch",
        bank: "BOB",
        lat: 22.3125,
        lon: 73.1789,
        composite_score: 0.58,
      },
      device_imei: "359104829104777",
      shared_mule_devices: 1,
      chain_hash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f80918273645a4b5c6d7e8f9012345",
      top_reasons: [
        "Golden extraction window concluded (52 mins elapsed since tranche debit)",
        "Bayesian likelihood decayed below operational threshold for immediate physical interdiction",
        "Case forwarded to Cyber Cell investigative ledger for follow-up asset recovery",
      ],
    },
    {
      complaint_id: "CYB-MAH-2026-0845",
      utr: "429124810294",
      victim_city: "Nashik",
      state: "Maharashtra",
      jcct_team: "JCCT-Maharashtra",
      area: "CBS Old City Commercial Axis",
      amount: 210000.0,
      channel: "IMPS",
      hop_depth: 4,
      situational_baseline: "⚡ Multi-Hop Mule (Hop 4) (45m Window)",
      total_window_seconds: 2700,
      elapsed_seconds: 510,
      remaining_seconds: 2190,
      window_status: "ACTIVE",
      priority_score: 0.94,
      risk_tier: "CRITICAL",
      cashout_probability: 0.94,
      authenticity_score: 0.95,
      authenticity_decision: "VERIFIED",
      status: "PENDING_DISPATCH",
      dispatch_cooldown_remaining: 0,
      leading_atm: {
        atm_id: "ATM-MAH-NAS-00401",
        city: "Nashik",
        state: "Maharashtra",
        jcct_team: "JCCT-Maharashtra",
        area: "CBS Old City Main",
        bank: "SBI",
        lat: 20.0063,
        lon: 73.7902,
        composite_score: 0.88,
      },
      device_imei: "864291048291021",
      shared_mule_devices: 3,
      chain_hash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f80918273645a4b5c6d7e8f90123456780",
      top_reasons: [
        "High-value structuring: 4 sequential smurfing hops across commercial ATM corridor",
        "Syndicate device IMEI matched across 3 active mule accounts",
        "Immediate cash extraction predicted at Nashik CBS Old City terminal",
      ],
    },
  ],
};

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[SENTINEL API] Failed to fetch ${url}, using offline fallback:`, err.message);
    return null;
  }
}

export const api = {
  async getAlerts(filterTab = 'all') {
    const data = await safeFetch(`${API_BASE}/alerts?filter_tab=${filterTab}`);
    if (data && data.alerts) return data;
    
    // Offline fallback filtering
    let list = [...OFFLINE_FALLBACK.alerts];
    if (filterTab === 'critical') list = list.filter(a => a.risk_tier === 'CRITICAL' && a.status !== 'HELD_FOR_REVIEW');
    if (filterTab === 'held') list = list.filter(a => a.status === 'HELD_FOR_REVIEW');
    if (filterTab === 'dispatched') list = list.filter(a => a.status === 'DISPATCHED');
    if (filterTab === 'expired') list = list.filter(a => a.status === 'EXPIRED');
    
    return { status: 'offline_mode', total_active: list.length, alerts: list };
  },

  async getAlertDossier(complaintId) {
    const data = await safeFetch(`${API_BASE}/alerts/${complaintId}`);
    if (data) return data;

    // Fallback dossier synthesis
    let item = OFFLINE_FALLBACK.alerts.find(a => a.complaint_id === complaintId);
    if (!item) {
      if (complaintId === 'CYB-MAH-2026-0904') {
        item = {
          complaint_id: 'CYB-MAH-2026-0904',
          utr: '429104829108',
          victim_city: 'Thane',
          area: 'Thane West Commercial Hub',
          amount: 135000.0,
          channel: 'IMPS',
          hop_depth: 2,
          situational_baseline: 'Dynamic Window Expired (45m elapsed)',
          total_window_seconds: 2700,
          remaining_seconds: 0,
          window_status: 'EXPIRED',
          status: 'EXPIRED',
          priority_score: 0.38,
          cashout_probability: 0.35,
          authenticity_score: 0.91,
          authenticity_decision: 'VERIFIED',
          inter_jcct: 'JCCT-Maharashtra -> JCCT-Gujarat',
          leading_atm: {
            atm_id: 'ATM-GUJ-AHM-00602',
            city: 'Ahmedabad',
            state: 'Gujarat',
            area: 'Ashram Road Commercial',
            bank: 'HDFC',
            lat: 23.0300,
            lon: 72.5695,
          },
          device_imei: '359104829104812',
          shared_mule_devices: 1,
          top_reasons: [
            'Inter-JCCT layered transfer: JCCT-Maharashtra (Thane) -> JCCT-Gujarat (Ahmedabad)',
            'Dynamic 45-minute golden window expired without cash extraction at Ahmedabad Ashram Road ATM',
            'Bayesian spatiotemporal belief decayed to _missed state below operational threshold',
          ],
        };
      } else {
        item = OFFLINE_FALLBACK.alerts[0];
      }
    }
    const targetCity = item.leading_atm?.city || item.victim_city || 'Pune';
    const targetBank = item.leading_atm?.bank || 'HDFC';
    const targetArea = item.leading_atm?.area || 'Hinjawadi Phase 1';
    const targetAtmId = item.leading_atm?.atm_id || 'ATM-MAH-PUN-00202';
    const totalAmount = Number(item.amount || 78000.0);
    const victimCity = item.victim_city || 'Pune';
    const victimAccount = item.victim_account || 'SBIN0004123:3819201948';

    // Dynamic Terminal 1 Resolution per Victim City
    const cityTerminalMap = {
      'Pune': { id: 'ATM-MAH-PUN-00201', name: 'SBI - Shivajinagar Station (Pune)', bank: 'SBI', area: 'Shivajinagar' },
      'Mumbai': { id: 'ATM-MAH-MUM-00102', name: 'HDFC - Andheri East Metro (Mumbai)', bank: 'HDFC', area: 'Andheri East' },
      'Thane': { id: 'ATM-MAH-THA-00301', name: 'SBI - Thane West Station (Thane)', bank: 'SBI', area: 'Thane West' },
      'Nagpur': { id: 'ATM-MAH-NAG-00501', name: 'SBI - Sitabuldi Main Road (Nagpur)', bank: 'SBI', area: 'Sitabuldi' },
      'Nashik': { id: 'ATM-MAH-NAS-00401', name: 'SBI - CBS Old City (Nashik)', bank: 'SBI', area: 'CBS Old City' },
      'Surat': { id: 'ATM-GUJ-SUR-00701', name: 'SBI - Ring Road Textile Market (Surat)', bank: 'SBI', area: 'Ring Road' },
      'Ahmedabad': { id: 'ATM-GUJ-AHM-00601', name: 'SBI - SG Highway Tech Park (Ahmedabad)', bank: 'SBI', area: 'SG Highway' },
    };
    const term1 = cityTerminalMap[victimCity] || { id: 'ATM-MAH-PUN-00201', name: `SBI - Station Hub (${victimCity})`, bank: 'SBI', area: 'Station Hub' };

    // Dynamic N-Hop Hierarchical Structuring matching backend engine
    const rawHop = item.hop_depth != null ? item.hop_depth : 1;
    const N = Math.max(1, Number(rawHop));
    const hasPriorCashout = item.has_prior_cashout !== undefined ? Boolean(item.has_prior_cashout) : (N > 1);
    const isExpired = item.status === 'EXPIRED';
    const isDuplicate = item.authenticity_decision === 'DUPLICATE_UTR';
    const charCodeSum = (item.complaint_id || 'CYB-MAH-2026-0819').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    const candidateAtms = [
      { id: 'ATM-MAH-PUN-00201', name: 'SBI - Shivajinagar Station (Pune)', bank: 'SBI', area: 'Shivajinagar', city: 'Pune' },
      { id: 'ATM-MAH-MUM-00102', name: 'HDFC - Andheri East Metro (Mumbai)', bank: 'HDFC', area: 'Andheri East', city: 'Mumbai' },
      { id: 'ATM-MAH-THA-00301', name: 'SBI - Thane West Station (Thane)', bank: 'SBI', area: 'Thane West', city: 'Thane' },
      { id: 'ATM-MAH-NAG-00501', name: 'SBI - Sitabuldi Main Road (Nagpur)', bank: 'SBI', area: 'Sitabuldi', city: 'Nagpur' },
      { id: 'ATM-MAH-NAS-00401', name: 'SBI - CBS Old City (Nashik)', bank: 'SBI', area: 'CBS Old City', city: 'Nashik' },
      { id: 'ATM-GUJ-SUR-00701', name: 'SBI - Ring Road Textile Market (Surat)', bank: 'SBI', area: 'Ring Road', city: 'Surat' },
      { id: 'ATM-GUJ-AHM-00601', name: 'SBI - SG Highway Tech Park (Ahmedabad)', bank: 'SBI', area: 'SG Highway', city: 'Ahmedabad' },
    ];

    let rem = totalAmount;
    const siphons = [];
    const branches = [];
    const nodes = [
      { id: "victim", label: `Complainant (${victimCity})`, type: "victim", account: victimAccount, city: victimCity, hop_level: 0 }
    ];
    const edges = [];
    const hopSplits = [];

    if (isDuplicate) {
      nodes.push({ id: "gate_blocked", label: "Ingestion Gate (Duplicate UTR Freeze)", type: "blocked_gateway", city: victimCity, status: "BLOCKED", hop_level: 0 });
      edges.push({ source: "victim", target: "gate_blocked", amount: totalAmount, velocity_min: 0.0, channel: "BLOCKED_INGESTION" });
      branches.push({
        branch_id: "BRANCH_BLOCKED",
        parent_id: "victim",
        hop_level: 0,
        tranche_name: "Ingestion Gate (Duplicate UTR Blocked)",
        amount: totalAmount,
        percentage: 100.0,
        channel: item.channel || "UPI",
        velocity_min: 0.0,
        status: "BLOCKED",
        status_label: "Blocked at Gateway",
        status_color: "#64748B",
        mule_account: "N/A - Intercepted Before Mule Inflow",
        mule_city: victimCity,
        terminal_id: "N/A",
        terminal_name: "Ingestion Audit Freeze",
        bank: "RBI Central Switch",
        event_time: "Blocked at Intake",
        hawkes_impact: "Zero spatiotemporal excitation (fraud thwarted at intake)",
        lien_status: "Complete Intake Block - Non-Authentic Claim",
        description: "Disputed UTR identified as duplicate or non-authentic during 3-tier gateway intake."
      });
    } else {
      // Intermediate Hops 1 through N-1
      for (let k = 1; k < N; k++) {
        const remainingHops = N - k;
        let s_k = 0;
        let relayAmt = rem;
        if (hasPriorCashout) {
          const f_k = (1.0 / (remainingHops + 1.2)) * (0.85 + 0.3 * (((charCodeSum >> (k * 3)) % 10) / 10.0));
          s_k = Math.round(Math.min(40000.0, Math.max(5000.0, rem * 0.45, rem * f_k)));
          if (rem - s_k < 1500.0 * remainingHops) {
            s_k = Math.round(rem * 0.3);
          }
          relayAmt = Math.round(rem - s_k);
        }
        siphons.push(s_k);

        const siphonAtm = candidateAtms[(charCodeSum + k * 3) % candidateAtms.length];
        const muleAcc = `${siphonAtm.bank.slice(0, 4).toUpperCase()}000${(charCodeSum + k * 17) % 899 + 100}:${((charCodeSum + k) * 3) % 8999999999 + 1000000000}`;
        const hubAcc = `SBIN000${(charCodeSum + k * 13) % 899 + 100}:${((charCodeSum + k) * 7) % 8999999999 + 1000000000}`;

        const hubNodeId = `mule_hop${k}`;
        nodes.push({
          id: hubNodeId,
          label: k === 1 ? `Primary Gateway Mule (${victimCity})` : `Hop ${k}: Structuring Mule (${siphonAtm.city})`,
          type: k === 1 ? "mule_gateway" : "mule_layering",
          account: hubAcc,
          city: k === 1 ? victimCity : siphonAtm.city,
          hop_level: k
        });

        if (k === 1) {
          edges.push({ source: "victim", target: hubNodeId, amount: totalAmount, velocity_min: 1.2, channel: item.channel || "UPI" });
        } else {
          edges.push({ source: `mule_hop${k-1}`, target: hubNodeId, amount: rem, velocity_min: Number((1.0 + k * 1.4).toFixed(1)), channel: "IMPS" });
        }

        if (s_k > 0) {
          const siphonMuleId = `mule_siphon_h${k}`;
          const siphonAtmId = `atm_siphon_h${k}`;
          nodes.push({
            id: siphonMuleId,
            label: `Mule ${k} - Fast Exit (${siphonAtm.city})`,
            type: "mule",
            account: muleAcc,
            city: siphonAtm.city,
            bank: siphonAtm.bank,
            hop_level: k
          });
          nodes.push({
            id: siphonAtmId,
            label: `Terminal ${k} (${siphonAtm.name})`,
            type: "atm_extracted",
            atm_id: siphonAtm.id,
            area: siphonAtm.area,
            city: siphonAtm.city,
            bank: siphonAtm.bank,
            hop_level: k
          });

          edges.push({ source: hubNodeId, target: siphonMuleId, amount: s_k, velocity_min: Number((1.0 + k * 1.2).toFixed(1)), channel: k === 1 ? "UPI" : "IMPS" });
          edges.push({ source: siphonMuleId, target: siphonAtmId, amount: s_k, velocity_min: Number((1.5 + k * 1.2).toFixed(1)), channel: "CASH_EXTRACTION" });

          branches.push({
            branch_id: `BRANCH_${k}`,
            parent_id: hubNodeId,
            hop_level: k,
            tranche_name: `Fork ${k} (Hop ${k} Direct Cash-Out)`,
            amount: s_k,
            percentage: Number(((s_k / totalAmount) * 100).toFixed(1)),
            channel: k === 1 ? "UPI" : "IMPS",
            velocity_min: Number((1.0 + k * 1.2).toFixed(1)),
            status: "EXTRACTED",
            status_label: "Confirmed Cash-Out",
            status_color: "#DC2626",
            mule_account: muleAcc,
            mule_city: siphonAtm.city,
            terminal_id: siphonAtm.id,
            terminal_name: siphonAtm.name,
            bank: siphonAtm.bank,
            event_time: `Completed ${Math.max(1, Math.round(4 * k))}m ago`,
            hawkes_impact: `Injected Hawkes excitation impulse (α=0.8) from ${siphonAtm.area} to ${targetArea}`,
            lien_status: "Drained prior to report",
            description: `Immediate partial ATM withdrawal executed at Hop ${k} mule kiosk.`
          });
        }

        hopSplits.push({
          node_id: hubNodeId,
          hop_level: k,
          name: `Hop ${k} Mule Hub (${siphonAtm.city})`,
          inflow: rem,
          outflow_extracted: s_k,
          outflow_layering: relayAmt
        });

        rem = relayAmt;
      }

      // Terminal Hop N
      const hubNId = `mule_hop${N}`;
      const muleNAcc = item.beneficiary_account || `${targetBank.slice(0, 4).toUpperCase()}000${(charCodeSum + N * 19) % 899 + 100}:${((charCodeSum + N) * 5) % 8999999999 + 1000000000}`;
      nodes.push({
        id: hubNId,
        label: N === 1 ? `Primary Gateway Mule (${victimCity})` : `Hop ${N}: Terminal Structuring Mule (${targetCity})`,
        type: N === 1 ? "mule_gateway" : "mule_layering",
        account: muleNAcc,
        city: targetCity,
        hop_level: N
      });

      if (N === 1) {
        edges.push({ source: "victim", target: hubNId, amount: totalAmount, velocity_min: 1.2, channel: item.channel || "UPI" });
      } else {
        edges.push({ source: `mule_hop${N-1}`, target: hubNId, amount: rem, velocity_min: Number((1.0 + N * 1.4).toFixed(1)), channel: "IMPS" });
      }

      let activeThreatAmt = 0;
      let drainedAmt = 0;
      let preservedAmt = 0;

      if (isExpired) {
        drainedAmt = Math.round(rem * 0.65);
        preservedAmt = Math.round(rem - drainedAmt);
      } else {
        const activeRatio = 0.58 + (((charCodeSum >> 6) % 15) / 100.0);
        activeThreatAmt = Math.round(rem * activeRatio);
        preservedAmt = Math.round(rem - activeThreatAmt);
      }
      const targetAmt = isExpired ? drainedAmt : activeThreatAmt;

      const muleNAId = `mule_h${N}a`;
      const atmTargetId = "atm_target";
      nodes.push({
        id: muleNAId,
        label: `Mule ${N}A - ${isExpired ? 'Expired Target' : 'Active Target'} (${targetCity})`,
        type: "mule",
        account: muleNAcc,
        city: targetCity,
        bank: targetBank,
        hop_level: N
      });
      nodes.push({
        id: atmTargetId,
        label: `Target ATM (${targetBank} - ${targetArea}, ${targetCity})`,
        type: "atm",
        atm_id: targetAtmId,
        area: targetArea,
        city: targetCity,
        bank: targetBank,
        hop_level: N
      });

      edges.push({ source: hubNId, target: muleNAId, amount: targetAmt, velocity_min: Number((1.2 + N * 1.8).toFixed(1)), channel: item.channel || "IMPS" });
      edges.push({ source: muleNAId, target: atmTargetId, amount: targetAmt, velocity_min: Number((1.5 + N * 1.8).toFixed(1)), channel: isExpired ? "DRAINED_PRE_REPORT" : "ACTIVE_RUNWAY" });

      const muleNBId = `mule_h${N}b`;
      const kioskPreservedId = "kiosk_preserved";
      const muleNBAcc = `BARB000${(charCodeSum % 499) + 100}:${((charCodeSum * 11) % 8999999999) + 1000000000}`;
      const term3Id = `ATM-MAH-${targetCity.slice(0, 3).toUpperCase()}-00203`;
      const term3Name = `AePS Micro-ATM Hub (${targetCity})`;

      nodes.push({
        id: muleNBId,
        label: `Mule ${N}B - Holding (${targetCity})`,
        type: "mule_holding",
        account: muleNBAcc,
        city: targetCity,
        bank: "Bank of Baroda",
        hop_level: N
      });
      nodes.push({
        id: kioskPreservedId,
        label: `Terminal 3 (${term3Name})`,
        type: "kiosk_preserved",
        atm_id: term3Id,
        city: targetCity,
        bank: "Bank of Baroda",
        hop_level: N
      });

      edges.push({ source: hubNId, target: muleNBId, amount: preservedAmt, velocity_min: Number((2.5 + N * 2.0).toFixed(1)), channel: "NEFT" });
      edges.push({ source: muleNBId, target: kioskPreservedId, amount: preservedAmt, velocity_min: Number((2.8 + N * 2.0).toFixed(1)), channel: "BNSS_SEC106_LIEN" });

      branches.push({
        branch_id: `BRANCH_${N}A`,
        parent_id: hubNId,
        hop_level: N,
        tranche_name: `Sub-Fork ${N}A (Hop ${N}: ${isExpired ? 'Drained Pre-Report' : (N > 1 ? 'Active Runway Target' : 'Direct Withdrawal Attempt')})`,
        amount: targetAmt,
        percentage: Number(((targetAmt / totalAmount) * 100).toFixed(1)),
        channel: item.channel || "IMPS",
        velocity_min: Number((1.2 + N * 1.8).toFixed(1)),
        status: isExpired ? "EXTRACTED" : "ACTIVE_THREAT",
        status_label: isExpired ? "Drained Pre-Report (Expired)" : (!hasPriorCashout ? "Active Interception Target (0% Cashed Out)" : "Active Interception Target"),
        status_color: isExpired ? "#DC2626" : "#B91C1C",
        mule_account: muleNAcc,
        mule_city: targetCity,
        terminal_id: targetAtmId,
        terminal_name: `${targetBank} - ${targetArea} (${targetCity})`,
        bank: targetBank,
        event_time: isExpired ? "Extracted Prior to Ingestion" : "In Flight (~5.5m remaining)",
        hawkes_impact: `Hawkes Intensity: 0.94` + (N > 1 && hasPriorCashout ? ` (Excited by Hop 1 extraction)` : ' (High risk runner hotspot)'),
        lien_status: isExpired ? "Drained prior to report" : "Immediate Police Patrol Interception",
        description: isExpired ? "45m Golden Window depleted prior to citizen complaint." : (!hasPriorCashout ? "Fresh complaint with zero cashout. Full disputed capital active in flight / prime police intercept opportunity." : "Layered smurfing tranche in flight inside 15-45m Golden Window.")
      });

      branches.push({
        branch_id: `BRANCH_${N}B`,
        parent_id: hubNId,
        hop_level: N,
        tranche_name: `Sub-Fork ${N}B (Hop ${N}: Preserved Lien)`,
        amount: preservedAmt,
        percentage: Number(((preservedAmt / totalAmount) * 100).toFixed(1)),
        channel: "NEFT",
        velocity_min: Number((2.5 + N * 2.0).toFixed(1)),
        status: "PRESERVED",
        status_label: "BNSS §106 Lien Applied",
        status_color: "#059669",
        mule_account: muleNBAcc,
        mule_city: targetCity,
        terminal_id: term3Id,
        terminal_name: term3Name,
        bank: "Bank of Baroda",
        event_time: "Preserved in Transit",
        hawkes_impact: "Suppression cooldown active",
        lien_status: "Section 106 & 107(5) Disputed Hold Order Confirmed",
        description: "Targeted disputed-amount hold order placed; account balance preserved."
      });

      hopSplits.push({
        node_id: hubNId,
        hop_level: N,
        name: `Hop ${N} Terminal Mule (${targetCity})`,
        inflow: rem,
        outflow_active_threat: isExpired ? 0 : targetAmt,
        outflow_extracted: isExpired ? drainedAmt : 0,
        outflow_preserved_lien: preservedAmt,
        outflow_layering: rem
      });
    }

    const totalCashedOut = siphons.reduce((a, b) => a + b, 0) + (isExpired ? (branches.find(b => b.branch_id.endsWith('A'))?.amount || 0) : 0);
    const totalActiveThreat = isExpired ? 0 : (branches.find(b => b.branch_id.endsWith('A'))?.amount || 0);
    const preservedLienAmt = branches.find(b => b.branch_id.endsWith('B'))?.amount || 0;

    const multiSplitData = {
      is_multi_split: N > 1 || (!isExpired && totalActiveThreat > 0),
      topology: isDuplicate ? "BLOCKED_AT_INGESTION" : `HIERARCHICAL_${N}_HOP_STRUCTURING`,
      hop_depth: isDuplicate ? 0 : N,
      total_disputed_amount: totalAmount,
      flow_balanced: true,
      cashed_out_amount: totalCashedOut,
      active_threat_amount: totalActiveThreat,
      preserved_lien_amount: preservedLienAmt,
      residual_quantum: totalActiveThreat + preservedLienAmt,
      hop_splits: hopSplits,
      branches: branches,
      conservation_audit: {
        discrepancy: Math.round(Math.abs(totalAmount - branches.reduce((sum, b) => sum + (b.amount || 0), 0)) * 100) / 100,
        status: Math.round(Math.abs(totalAmount - branches.reduce((sum, b) => sum + (b.amount || 0), 0)) * 100) / 100 === 0 ? "EXACT_CONSERVATION" : "DISCREPANCY_DETECTED",
        allocated_sum: branches.reduce((sum, b) => sum + (b.amount || 0), 0),
        total_disputed: totalAmount
      },
      hop1_split: hopSplits[0] || { inflow: totalAmount, outflow_extracted: totalCashedOut, outflow_layering: totalAmount - totalCashedOut },
      hop2_split: hopSplits[1] || hopSplits[0] || { inflow: totalAmount, outflow_active_threat: totalActiveThreat, outflow_preserved_lien: preservedLienAmt }
    };

    return {
      complaint_id: item.complaint_id,
      details: item,
      syndicate_graph: {
        nodes: nodes,
        edges: edges,
        multi_split_subgraph: multiSplitData,
      },
      device_fingerprint: {
        imei: item.device_imei,
        shared_mule_accounts: item.shared_mule_devices,
        is_cluster_flagged: item.shared_mule_devices > 1,
        cluster_risk: item.shared_mule_devices > 1 ? "HIGH" : "LOW",
      },
      attestation_chain: {
        complainant_verified: true,
        bank_verified: item.authenticity_decision === "VERIFIED",
        police_verified: true,
        chain_hash: item.chain_hash,
        is_tamper_evident: true,
        status: "VALID_IMMUTABLE",
      },
      champion_model: {
        model_name: "LightGBM (Primary Operational Engine)",
        f1_optimal_threshold: 0.291,
        pr_auc: 0.654,
        f1_score: 0.591,
        latency_ms: 0.0016,
        cashout_probability: item.cashout_probability,
        exceeds_threshold: item.cashout_probability >= 0.291,
        risk_tier: item.cashout_probability >= 0.70 ? "CRITICAL" : (item.cashout_probability >= 0.45 ? "HIGH" : "ELEVATED"),
        top_features: [
          { feature: "Malicious Remote Access / APK Tool", weight: 0.41, direction: "+Risk" },
          { feature: "Transaction Velocity & Layering", weight: 0.32, direction: "+Risk" },
          { feature: "Target Pincode ATM Density Cluster", weight: 0.27, direction: "+Risk" }
        ]
      },
      model_consensus: {
        primary_model: "LightGBM (Primary Operational Engine)",
        primary_probability: item.cashout_probability,
        consensus_average: item.cashout_probability,
        models: {
          "LightGBM (Primary Engine)": item.cashout_probability,
          "XGBoost": Math.min(0.95, item.cashout_probability + 0.02),
          "CatBoost": Math.max(0.70, item.cashout_probability - 0.02),
          "GradientBoosting": Math.min(0.95, item.cashout_probability + 0.01),
          "RandomForest (tuned)": item.cashout_probability,
          "RandomForest (baseline)": 0.78,
          "Hawkes Spatiotemporal": 0.88,
        },
        top_reasons: item.top_reasons,
      },
    };
  },

  async getAtmHotspots() {
    const data = await safeFetch(`${API_BASE}/atms/hotspots`);
    if (data && data.atms) return data;

    // Built-in Maharashtra coordinate registry fallback
    return {
      status: 'offline_mode',
      total_atms: 10,
      atms: [
        { atm_id: "ATM-MAH-MUM-00101", city: "Mumbai", area: "Bandra Kurla Complex", lat: 19.0660, lon: 72.8677, bank: "SBI", hawkes_intensity: 0.94, composite_priority: 0.91, vulnerability_score: 0.94, vulnerability_tier: "CRITICAL", status: "PATROL_DEPLOYED", status_label: "Patrol Dispatched (12m cooldown)", is_pulsing_hotspot: true, is_in_cooldown: true, cooldown_remaining_sec: 720 },
        { atm_id: "ATM-MAH-PUN-00202", city: "Pune", area: "Hinjawadi Phase 1", lat: 18.5912, lon: 73.7389, bank: "HDFC", hawkes_intensity: 0.91, composite_priority: 0.89, vulnerability_score: 0.91, vulnerability_tier: "CRITICAL", status: "ACTIVE_THREAT", status_label: "Active Cash-Out Threat", is_pulsing_hotspot: true, is_in_cooldown: false, cooldown_remaining_sec: 0 },
        { atm_id: "ATM-MAH-PUN-00201", city: "Pune", area: "Shivajinagar Station", lat: 18.5314, lon: 73.8446, bank: "SBI", hawkes_intensity: 0.85, composite_priority: 0.83, vulnerability_score: 0.85, vulnerability_tier: "CRITICAL", status: "ACTIVE_THREAT", status_label: "Active Cash-Out Threat", is_pulsing_hotspot: true, is_in_cooldown: false, cooldown_remaining_sec: 0 },
        { atm_id: "ATM-MAH-MUM-00102", city: "Mumbai", area: "Andheri East Metro", lat: 19.1197, lon: 72.8464, bank: "HDFC", hawkes_intensity: 0.76, composite_priority: 0.74, vulnerability_score: 0.76, vulnerability_tier: "ELEVATED", status: "SUSPICIOUS_VELOCITY", status_label: "Elevated Velocity Corridor", is_pulsing_hotspot: false, is_in_cooldown: false, cooldown_remaining_sec: 0 },
        { atm_id: "ATM-MAH-NAG-00501", city: "Nagpur", area: "Sitabuldi Main Road", lat: 21.1458, lon: 79.0882, bank: "SBI", hawkes_intensity: 0.72, composite_priority: 0.70, vulnerability_score: 0.72, vulnerability_tier: "ELEVATED", status: "SUSPICIOUS_VELOCITY", status_label: "Elevated Velocity Corridor", is_pulsing_hotspot: false, is_in_cooldown: false, cooldown_remaining_sec: 0 },
        { atm_id: "ATM-MAH-NAS-00401", city: "Nashik", area: "CBS Old City", lat: 19.9975, lon: 73.7898, bank: "SBI", hawkes_intensity: 0.68, composite_priority: 0.65, vulnerability_score: 0.68, vulnerability_tier: "ELEVATED", status: "SUSPICIOUS_VELOCITY", status_label: "Elevated Velocity Corridor", is_pulsing_hotspot: false, is_in_cooldown: false, cooldown_remaining_sec: 0 },
        { atm_id: "ATM-MAH-THA-00301", city: "Thane", area: "Thane West Station", lat: 19.1860, lon: 72.9759, bank: "SBI", hawkes_intensity: 0.64, composite_priority: 0.62, vulnerability_score: 0.64, vulnerability_tier: "ELEVATED", status: "SUSPICIOUS_VELOCITY", status_label: "Elevated Velocity Corridor", is_pulsing_hotspot: false, is_in_cooldown: false, cooldown_remaining_sec: 0 },
      ],
    };
  },

  async getLeafletClusters() {
    const data = await safeFetch(`${API_BASE}/leaflet/clusters`);
    if (data && data.clusters) return data;

    // Offline fallback for 5 Maharashtra clusters
    return {
      status: 'offline_mode',
      total_clusters: 5,
      total_atms: 17,
      statewide_vulnerability_index: 0.73,
      summary: {
        critical_clusters: 2,
        elevated_clusters: 2,
        active_threats_count: 3,
        patrol_deployed_count: 1,
      },
      clusters: [
        {
          cluster_id: 'CLUSTER-MUM-MMR',
          name: 'Mumbai MMR Financial Hub',
          city: 'Mumbai',
          corridor_desc: 'Western Express Highway & BKC Core Financial Corridor',
          center: [19.0681, 72.8613],
          radius_meters: 13000,
          bounds: [[19.00, 72.80], [19.15, 72.92]],
          total_atms: 4,
          vulnerability_score: 0.86,
          max_vulnerability_score: 0.94,
          vulnerability_tier: 'CRITICAL',
          status: 'ACTIVE_THREAT',
          status_label: 'Under Active Threat (BKC flagged)',
          active_threat_count: 1,
          patrol_deployed_count: 1,
          dominant_banks: ['Axis', 'HDFC', 'ICICI', 'SBI'],
          atms: [
            { atm_id: 'ATM-MAH-MUM-00101', city: 'Mumbai', area: 'Bandra Kurla Complex', lat: 19.0660, lon: 72.8677, bank: 'SBI', hawkes_intensity: 0.94, vulnerability_score: 0.94, vulnerability_tier: 'CRITICAL', status: 'PATROL_DEPLOYED', status_label: 'Patrol Dispatched (12m cooldown)', is_in_cooldown: true, cooldown_remaining_sec: 720 },
            { atm_id: 'ATM-MAH-MUM-00102', city: 'Mumbai', area: 'Andheri East Metro', lat: 19.1197, lon: 72.8464, bank: 'HDFC', hawkes_intensity: 0.76, vulnerability_score: 0.76, vulnerability_tier: 'ELEVATED', status: 'SUSPICIOUS_VELOCITY', status_label: 'Elevated Velocity Corridor', is_in_cooldown: false, cooldown_remaining_sec: 0 },
            { atm_id: 'ATM-MAH-MUM-00103', city: 'Mumbai', area: 'Dadar TT Circle', lat: 19.0178, lon: 72.8478, bank: 'ICICI', hawkes_intensity: 0.62, vulnerability_score: 0.62, vulnerability_tier: 'ELEVATED', status: 'NORMAL_SURVEILLANCE', status_label: 'Normal Surveillance', is_in_cooldown: false, cooldown_remaining_sec: 0 },
            { atm_id: 'ATM-MAH-MUM-00104', city: 'Mumbai', area: 'Kurla West Station', lat: 19.0688, lon: 72.8833, bank: 'Axis', hawkes_intensity: 0.58, vulnerability_score: 0.58, vulnerability_tier: 'MODERATE', status: 'NORMAL_SURVEILLANCE', status_label: 'Normal Surveillance', is_in_cooldown: false, cooldown_remaining_sec: 0 },
          ],
        },
        {
          cluster_id: 'CLUSTER-PUN-METRO',
          name: 'Pune IT & Industrial Corridor',
          city: 'Pune',
          corridor_desc: 'Hinjawadi Infotech Park & Pune-Bangalore Corridor',
          center: [18.5494, 73.8264],
          radius_meters: 12000,
          bounds: [[18.48, 73.70], [18.62, 73.94]],
          total_atms: 4,
          vulnerability_score: 0.88,
          max_vulnerability_score: 0.91,
          vulnerability_tier: 'CRITICAL',
          status: 'ACTIVE_THREAT',
          status_label: 'Under Active Threat (Hinjawadi Phase 1 flagged)',
          active_threat_count: 2,
          patrol_deployed_count: 0,
          dominant_banks: ['Axis', 'HDFC', 'ICICI', 'SBI'],
          atms: [
            { atm_id: 'ATM-MAH-PUN-00201', city: 'Pune', area: 'Shivajinagar Station', lat: 18.5314, lon: 73.8446, bank: 'SBI', hawkes_intensity: 0.85, vulnerability_score: 0.85, vulnerability_tier: 'CRITICAL', status: 'ACTIVE_THREAT', status_label: 'Active Cash-Out Threat', is_in_cooldown: false, cooldown_remaining_sec: 0 },
            { atm_id: 'ATM-MAH-PUN-00202', city: 'Pune', area: 'Hinjawadi Phase 1', lat: 18.5912, lon: 73.7389, bank: 'HDFC', hawkes_intensity: 0.91, vulnerability_score: 0.91, vulnerability_tier: 'CRITICAL', status: 'ACTIVE_THREAT', status_label: 'Active Cash-Out Threat', is_in_cooldown: false, cooldown_remaining_sec: 0 },
            { atm_id: 'ATM-MAH-PUN-00203', city: 'Pune', area: 'Kothrud Paud Road', lat: 18.5074, lon: 73.8077, bank: 'ICICI', hawkes_intensity: 0.55, vulnerability_score: 0.55, vulnerability_tier: 'MODERATE', status: 'NORMAL_SURVEILLANCE', status_label: 'Normal Surveillance', is_in_cooldown: false, cooldown_remaining_sec: 0 },
            { atm_id: 'ATM-MAH-PUN-00204', city: 'Pune', area: 'Viman Nagar Central', lat: 18.5679, lon: 73.9143, bank: 'Axis', hawkes_intensity: 0.52, vulnerability_score: 0.52, vulnerability_tier: 'MODERATE', status: 'NORMAL_SURVEILLANCE', status_label: 'Normal Surveillance', is_in_cooldown: false, cooldown_remaining_sec: 0 },
          ],
        },
        {
          cluster_id: 'CLUSTER-THA-SUB',
          name: 'Thane-Kalyan Industrial Belt',
          city: 'Thane',
          corridor_desc: 'Ghodbunder Road & Central Railway Junction Corridor',
          center: [19.2303, 73.0253],
          radius_meters: 11000,
          bounds: [[19.16, 72.93], [19.28, 73.16]],
          total_atms: 3,
          vulnerability_score: 0.64,
          max_vulnerability_score: 0.69,
          vulnerability_tier: 'ELEVATED',
          status: 'SUSPICIOUS_VELOCITY',
          status_label: 'Elevated Risk Detected',
          active_threat_count: 0,
          patrol_deployed_count: 0,
          dominant_banks: ['BoB', 'HDFC', 'SBI'],
          atms: [
            { atm_id: 'ATM-MAH-THA-00301', city: 'Thane', area: 'Thane West Station', lat: 19.1860, lon: 72.9759, bank: 'SBI', hawkes_intensity: 0.64, vulnerability_score: 0.64, vulnerability_tier: 'ELEVATED', status: 'SUSPICIOUS_VELOCITY', status_label: 'Elevated Velocity Corridor', is_in_cooldown: false, cooldown_remaining_sec: 0 },
            { atm_id: 'ATM-MAH-THA-00302', city: 'Thane', area: 'Ghodbunder Road', lat: 19.2612, lon: 72.9644, bank: 'HDFC', hawkes_intensity: 0.69, vulnerability_score: 0.69, vulnerability_tier: 'ELEVATED', status: 'SUSPICIOUS_VELOCITY', status_label: 'Elevated Velocity Corridor', is_in_cooldown: false, cooldown_remaining_sec: 0 },
            { atm_id: 'ATM-MAH-THA-00303', city: 'Thane', area: 'Kalyan Station West', lat: 19.2437, lon: 73.1355, bank: 'BoB', hawkes_intensity: 0.52, vulnerability_score: 0.52, vulnerability_tier: 'MODERATE', status: 'NORMAL_SURVEILLANCE', status_label: 'Normal Surveillance', is_in_cooldown: false, cooldown_remaining_sec: 0 },
          ],
        },
        {
          cluster_id: 'CLUSTER-NAS-NORTH',
          name: 'Nashik Urban & MIDC Corridor',
          city: 'Nashik',
          corridor_desc: 'Mumbai-Agra Highway & Satpur Industrial Belt',
          center: [19.9968, 73.7587],
          radius_meters: 9000,
          bounds: [[19.95, 73.70], [20.03, 73.81]],
          total_atms: 3,
          vulnerability_score: 0.61,
          max_vulnerability_score: 0.68,
          vulnerability_tier: 'ELEVATED',
          status: 'SUSPICIOUS_VELOCITY',
          status_label: 'Elevated Risk Detected',
          active_threat_count: 0,
          patrol_deployed_count: 0,
          dominant_banks: ['HDFC', 'ICICI', 'SBI'],
          atms: [
            { atm_id: 'ATM-MAH-NAS-00401', city: 'Nashik', area: 'CBS Old City', lat: 19.9975, lon: 73.7898, bank: 'SBI', hawkes_intensity: 0.68, vulnerability_score: 0.68, vulnerability_tier: 'ELEVATED', status: 'SUSPICIOUS_VELOCITY', status_label: 'Elevated Velocity Corridor', is_in_cooldown: false, cooldown_remaining_sec: 0 },
            { atm_id: 'ATM-MAH-NAS-00402', city: 'Nashik', area: 'College Road', lat: 20.0063, lon: 73.7639, bank: 'HDFC', hawkes_intensity: 0.60, vulnerability_score: 0.60, vulnerability_tier: 'ELEVATED', status: 'NORMAL_SURVEILLANCE', status_label: 'Normal Surveillance', is_in_cooldown: false, cooldown_remaining_sec: 0 },
            { atm_id: 'ATM-MAH-NAS-00403', city: 'Nashik', area: 'Satpur MIDC', lat: 19.9866, lon: 73.7225, bank: 'ICICI', hawkes_intensity: 0.48, vulnerability_score: 0.48, vulnerability_tier: 'MODERATE', status: 'NORMAL_SURVEILLANCE', status_label: 'Normal Surveillance', is_in_cooldown: false, cooldown_remaining_sec: 0 },
          ],
        },
        {
          cluster_id: 'CLUSTER-NAG-EAST',
          name: 'Nagpur Vidarbha Corridor',
          city: 'Nagpur',
          corridor_desc: 'Sitabuldi Interchange & Wardha Road Tech Hub',
          center: [21.1351, 79.0439],
          radius_meters: 10000,
          bounds: [[21.09, 78.96], [21.17, 79.11]],
          total_atms: 3,
          vulnerability_score: 0.58,
          max_vulnerability_score: 0.72,
          vulnerability_tier: 'MODERATE',
          status: 'NORMAL_SURVEILLANCE',
          status_label: 'Normal Corridor Surveillance',
          active_threat_count: 0,
          patrol_deployed_count: 0,
          dominant_banks: ['Axis', 'HDFC', 'SBI'],
          atms: [
            { atm_id: 'ATM-MAH-NAG-00501', city: 'Nagpur', area: 'Sitabuldi Main Road', lat: 21.1458, lon: 79.0882, bank: 'SBI', hawkes_intensity: 0.72, vulnerability_score: 0.72, vulnerability_tier: 'ELEVATED', status: 'SUSPICIOUS_VELOCITY', status_label: 'Elevated Velocity Corridor', is_in_cooldown: false, cooldown_remaining_sec: 0 },
            { atm_id: 'ATM-MAH-NAG-00502', city: 'Nagpur', area: 'Dharampeth Square', lat: 21.1428, lon: 79.0601, bank: 'HDFC', hawkes_intensity: 0.55, vulnerability_score: 0.55, vulnerability_tier: 'MODERATE', status: 'NORMAL_SURVEILLANCE', status_label: 'Normal Surveillance', is_in_cooldown: false, cooldown_remaining_sec: 0 },
            { atm_id: 'ATM-MAH-NAG-00503', city: 'Nagpur', area: 'MIDC Hingna', lat: 21.1166, lon: 78.9833, bank: 'Axis', hawkes_intensity: 0.44, vulnerability_score: 0.44, vulnerability_tier: 'MODERATE', status: 'NORMAL_SURVEILLANCE', status_label: 'Normal Surveillance', is_in_cooldown: false, cooldown_remaining_sec: 0 },
          ],
        },
      ],
    };
  },

  async getLeafletGeoJSON() {
    const data = await safeFetch(`${API_BASE}/leaflet/geojson`);
    if (data && data.features) return data;
    return null;
  },

  async updateAtmStatus(atmId, action = 'DISPATCH_PATROL', notes = '') {
    const data = await safeFetch(`${API_BASE}/leaflet/atms/${atmId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes }),
    });
    if (data) return data;
    return {
      status: 'success',
      atm_id: atmId,
      action,
      new_status: action === 'DISPATCH_PATROL' ? 'PATROL_DEPLOYED' : 'NORMAL_SURVEILLANCE',
      cooldown_remaining_sec: action === 'DISPATCH_PATROL' ? 900 : 0,
      message: `Offline mode: ATM ${atmId} status updated to ${action}`,
    };
  },

  async dispatchAtmPatrol(atmId) {
    return this.updateAtmStatus(atmId, 'DISPATCH_PATROL');
  },


  async submitComplaint(payload) {
    const data = await safeFetch(`${API_BASE}/intake/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (data && data.alert) {
      OFFLINE_FALLBACK.alerts = [
        data.alert,
        ...OFFLINE_FALLBACK.alerts.filter((a) => a.complaint_id !== data.alert.complaint_id),
      ];
      return data;
    }
    if (data) return data;

    // Local fallback for offline simulation
    const cid = `CYB-MAH-${Date.now()}`;
    const isDup = payload.raw_text && payload.raw_text.includes('429104829102');
    const newAlert = {
      complaint_id: cid,
      utr: isDup ? '429104829102' : `UTR${Date.now()}`,
      victim_city: payload.victim_city || 'Pune',
      area: payload.victim_city === 'Mumbai' ? 'Bandra Kurla Complex' : (payload.victim_city === 'Thane' ? 'Thane West Hub' : (payload.victim_city === 'Ahmedabad' ? 'Ashram Road Commercial' : 'Hinjawadi IT Corridor')),
      amount: payload.amount || 78000.0,
      channel: payload.channel || 'UPI',
      hop_depth: payload.hop_depth || 1,
      situational_baseline: isDup ? 'Window Suspended (Gate Rejected)' : '⚡ Instant UPI Single-Hop (20m Window)',
      total_window_seconds: isDup ? 0 : 1200,
      elapsed_seconds: 0,
      remaining_seconds: isDup ? 0 : 1190,
      window_status: isDup ? 'SUSPENDED' : 'ACTIVE',
      priority_score: isDup ? 0.00 : 0.92,
      risk_tier: isDup ? 'HELD_FOR_REVIEW' : 'CRITICAL',
      cashout_probability: isDup ? 0.00 : 0.91,
      authenticity_score: isDup ? 0.0 : 0.96,
      authenticity_decision: isDup ? 'DUPLICATE_UTR' : 'VERIFIED',
      status: isDup ? 'HELD_FOR_REVIEW' : 'PENDING_DISPATCH',
      top_reasons: isDup ? [
        'Duplicate transaction UTR 429104829102 detected in ledger',
        'Authenticity Gate hard-fail triggered: Score = 0.00',
        'Preservation hold & patrol dispatch suppressed — Duplicate UTR griefing neutralized to protect innocent accounts',
      ] : [
        'High-velocity single-hop transfer',
        `Hawkes spatiotemporal cluster spike in ${payload.victim_city || 'Pune'} corridor`,
      ],
      leading_atm: payload.victim_city === 'Mumbai' ? {
        atm_id: 'ATM-MAH-MUM-00101',
        city: 'Mumbai',
        area: 'Bandra Kurla Complex',
        bank: 'SBI',
        lat: 19.0660,
        lon: 72.8677,
      } : (payload.victim_city === 'Ahmedabad' ? {
        atm_id: 'ATM-GUJ-AHM-00602',
        city: 'Ahmedabad',
        area: 'Ashram Road Commercial',
        bank: 'HDFC',
        lat: 23.0300,
        lon: 72.5695,
      } : {
        atm_id: 'ATM-MAH-PUN-00202',
        city: 'Pune',
        area: 'Hinjawadi Phase 1',
        bank: 'HDFC',
        lat: 18.5912,
        lon: 73.7389,
      }),
      device_imei: '864291048291044',
      shared_mule_devices: 1,
      chain_hash: `hash-${cid}`,
    };

    OFFLINE_FALLBACK.alerts = [newAlert, ...OFFLINE_FALLBACK.alerts];

    return {
      status: 'success',
      complaint_id: cid,
      decision: isDup ? 'DUPLICATE_UTR' : 'VERIFIED',
      risk_tier: isDup ? 'HELD_FOR_REVIEW' : 'CRITICAL',
      cashout_probability: isDup ? 0.00 : 0.91,
      alert: newAlert,
    };
  },

  async dispatchAlert(complaintId) {
    const data = await safeFetch(`${API_BASE}/alerts/${complaintId}/dispatch`, { method: 'POST' });
    if (data) return data;
    return { status: 'success', complaint_id: complaintId, cooldown_seconds: 900 };
  },

  async getBnssNotice(complaintId) {
    const data = await safeFetch(`${API_BASE}/notices/${complaintId}`);
    if (data) return data;

    return {
      complaint_id: complaintId,
      notice_id: `NOTICE-BNSS105-${complaintId}`,
      statutory_act: "Section 105, Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
      issuing_authority: "Maharashtra State Cyber Police / I4C Special Cyber Cell",
      html_content: `
        <div style="font-family: sans-serif; color: #1A1A1A; padding: 24px; border: 2px solid #0B1F3A; border-radius: 8px;">
          <div style="text-align: center; border-bottom: 2px solid #00C2A8; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #0B1F3A; margin: 0;">GOVERNMENT OF MAHARASHTRA — STATE CYBER CRIME INVESTIGATION WING</h2>
            <h4 style="color: #64748B; margin: 4px 0;">SPECIAL DIRECTIVE UNDER SECTION 105 BHARATIYA NAGARIK SURAKSHA SANHITA, 2023</h4>
          </div>
          <p><strong>CASE REF:</strong> ${complaintId} | <strong>STATUTORY SEAL:</strong> SHA-256 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
          <p>TO: <strong>NODAL OFFICER, BENEFICIARY SCHEDULED COMMERCIAL BANK</strong></p>
          <p>Under statutory powers vested in the Superintendent of Police under Section 105 BNSS, 2023, you are hereby directed to immediately place an <strong>ADMINISTRATIVE DEBIT FREEZE</strong> on the beneficiary mule account identified in this notice, to prevent unlawful ATM physical cash extraction within the Maharashtra operational corridor.</p>
        </div>
      `,
      plain_text: `GOVERNMENT OF MAHARASHTRA - CYBER CELL\nSTATUTORY NOTICE U/S 105 BNSS 2023\nCASE: ${complaintId}\nDIRECTIVE: IMMEDIATE DEBIT FREEZE ON BENEFICIARY ACCOUNT.\nISSUING AUTHORITY: SUPT OF POLICE, CYBER COMMAND.`,
      chain_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      timestamp: Date.now() / 1000,
    };
  },

  async getOutboxStatus() {
    const data = await safeFetch(`${API_BASE}/outbox/status`);
    if (data) return data;
    return {
      circuit_breaker: {
        state: 'CLOSED',
        failure_count: 0,
        failure_threshold: 3,
        retry_cooldown_remaining_sec: 0,
      },
      outbox: {
        pending_count: 0,
        delivered_count: 14,
        db_path: 'local/outbox.db',
      },
    };
  },

  async replayOutbox() {
    const data = await safeFetch(`${API_BASE}/outbox/replay`, { method: 'POST' });
    if (data) return data;
    return { status: 'success', replayed_count: 0, pending_remaining: 0 };
  },

  async getDemoFixtures() {
    const data = await safeFetch(`${API_BASE}/fixtures/demo`);
    if (data) return data;
    return {
      genuine_case: {
        name: "Genuine Cyber Fraud (Hinjawadi IT Corridor - ₹65,000)",
        raw_text: "Rs 65000.00 debited from a/c **4123 via UPI on 25-09-2026. UTR: 429104829102. If not you, report to cyber cell.",
        victim_city: "Pune",
        channel: "UPI",
        amount: 65000.0,
        hop_depth: 1,
      },
      duplicate_utr_fake: {
        name: "Duplicate UTR Hard-Fail (Mumbai BKC - Fake Alert Rejected)",
        raw_text: "Rs 65000.00 debited from a/c **9999 via UPI on 25-09-2026. UTR: 429104829102. Repeated complaint.",
        victim_city: "Mumbai",
        channel: "UPI",
        amount: 65000.0,
        hop_depth: 1,
      },
      high_value_neft: {
        name: "High-Value Multi-Hop Mule (Nagpur Industrial Corridor - ₹1,40,000)",
        raw_text: "NEFT transaction of Rs 140000.00 credited to account 20194829104. Immediate cash-out flagged.",
        victim_city: "Nagpur",
        channel: "NEFT",
        amount: 140000.0,
        hop_depth: 2,
      },
    };
  },

  async getScenarios() {
    const data = await safeFetch(`${API_BASE}/simulation/scenarios`);
    if (data && data.scenarios) return data.scenarios;
    return [
      { id: 'genuine_pune_upi', title: 'Pune Genuine UPI', badge: 'CRITICAL (0.91)' },
      { id: 'duplicate_utr_fail', title: 'Duplicate UTR Hard-Fail', badge: 'HELD FOR REVIEW' },
      { id: 'bank_outage_resilience', title: 'Bank API Outage', badge: 'OUTBOX QUEUED' },
      { id: 'multihop_decay', title: 'Multi-Hop & Decay', badge: 'BAYESIAN DECAY' },
    ];
  },

  async triggerScenario(scenarioId) {
    const data = await safeFetch(`${API_BASE}/simulation/trigger/${scenarioId}`, { method: 'POST' });
    if (data) return data;
    // Fallback simulation mock
    const cid = scenarioId === 'genuine_pune_upi' ? 'CYB-MAH-2026-0901'
      : scenarioId === 'duplicate_utr_fail' ? 'CYB-MAH-2026-0902'
      : scenarioId === 'bank_outage_resilience' ? 'CYB-MAH-2026-0903'
      : 'CYB-MAH-2026-0904';
    const alertData = scenarioId === 'multihop_decay' ? {
      complaint_id: cid,
      victim_city: 'Thane',
      amount: 135000.0,
      channel: 'IMPS',
      hop_depth: 2,
      status: 'EXPIRED',
      window_status: 'EXPIRED',
      inter_jcct: 'JCCT-Maharashtra -> JCCT-Gujarat',
      leading_atm: {
        atm_id: 'ATM-GUJ-AHM-00602',
        city: 'Ahmedabad',
        state: 'Gujarat',
        area: 'Ashram Road Commercial',
        bank: 'HDFC',
      }
    } : {
      complaint_id: cid,
      status: scenarioId === 'duplicate_utr_fail' ? 'HELD_FOR_REVIEW' : 'PENDING_DISPATCH'
    };
    return {
      status: 'success',
      scenario_id: scenarioId,
      complaint_id: cid,
      alert: alertData,
      audit_entry: { event_type: 'SIMULATION_TRIGGERED', complaint_id: cid, summary: `Injected ${scenarioId}` }
    };
  },

  async resetSimulationState() {
    const data = await safeFetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
    if (data) return data;
    return { status: 'success', message: 'Demo state reset' };
  },

  async getOutboxStatus() {
    const data = await safeFetch(`${API_BASE}/outbox/status`);
    if (data) return data;
    return {
      circuit_breaker: {
        state: "CLOSED",
        failure_count: 0,
        failure_threshold: 3,
        retry_cooldown_remaining_sec: 0,
      },
      outbox: {
        pending_count: 0,
        delivered_count: 14,
        db_path: "local/outbox.db",
      },
      timestamp: Date.now() / 1000,
    };
  },

  async replayOutbox() {
    const data = await safeFetch(`${API_BASE}/outbox/replay`, { method: 'POST' });
    if (data) return data;
    return {
      status: "success",
      replayed_count: 0,
      pending_remaining: 0,
    };
  },

  async getAuditLogs(limit = 500, eventType = null) {
    let url = `${API_BASE}/audit/logs?limit=${limit}`;
    if (eventType) url += `&event_type=${encodeURIComponent(eventType)}`;
    const data = await safeFetch(url);
    if (data && data.logs) return data;
    return {
      status: 'success',
      total: 4,
      logs: [
        {
          log_id: "LOG-0001",
          timestamp: Date.now() / 1000 - 1800,
          iso_time: new Date(Date.now() - 1800000).toLocaleString(),
          event_type: "SYSTEM_INIT",
          complaint_id: "SYS-MAH-0001",
          summary: "SENTINEL core initialized with Maharashtra Regional Calibrator",
          chain_hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          details: { action: "system_baseline_seed" }
        },
        {
          log_id: "LOG-0002",
          timestamp: Date.now() / 1000 - 420,
          iso_time: new Date(Date.now() - 420000).toLocaleString(),
          event_type: "AUTHENTICITY_VERIFIED",
          complaint_id: "CYB-MAH-2026-0819",
          summary: "Authenticity Gate verified OTP & bank corroboration (Score: 0.95)",
          chain_hash: "a4f8e9102c4b82d710f293847291a4b5c6d7e8f90123456789abcdef01234567",
          details: { score: 0.95, decision: "VERIFIED" }
        },
        {
          log_id: "LOG-0003",
          timestamp: Date.now() / 1000 - 300,
          iso_time: new Date(Date.now() - 300000).toLocaleString(),
          event_type: "AUTHENTICITY_HARD_FAIL",
          complaint_id: "CYB-MAH-2026-0835",
          summary: "Duplicate UTR 429104829102 hard-failed (Score 0.00) -> HELD_FOR_REVIEW",
          chain_hash: "f0e1d2c3b4a5968778695a4b3c2d1e0f0123456789abcdef0123456789abcdef",
          details: { utr: "429104829102", score: 0.0 }
        }
      ]
    };
  },
};

/**
 * Initializes WebSocket connection to /api/v1/ws/alerts with automatic fallback
 */
export function initAlertsWebSocket(onMessage, onStatusChange) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/api/v1/ws/alerts`;

  let ws = null;
  let reconnectTimer = null;
  let isClosedCleanly = false;

  function connect() {
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (onStatusChange) onStatusChange(true);
      };

      ws.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data);
          if (onMessage) onMessage(envelope);
        } catch (e) {
          console.warn('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = () => {
        if (onStatusChange) onStatusChange(false);
      };

      ws.onclose = () => {
        if (onStatusChange) onStatusChange(false);
        if (!isClosedCleanly) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      if (onStatusChange) onStatusChange(false);
      reconnectTimer = setTimeout(connect, 5000);
    }
  }

  connect();

  return () => {
    isClosedCleanly = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) ws.close();
  };
}

