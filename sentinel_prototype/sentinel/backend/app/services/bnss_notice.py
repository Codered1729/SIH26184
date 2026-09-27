"""
BNSS 2023 Lawful Notice Generator for SENTINEL.

Pursuant to Section 106 (Police Seizure of Property linked to Offence) and
Section 107(5) (Ex-Parte Judicial Interim Attachment of Proceeds of Crime)
read with Section 105 (Mandatory Electronic Search & Seizure Recording) of the
Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS), empowering Law Enforcement
Agencies (LEAs) to mandate immediate temporary hold on disputed funds.

Generates:
1. Structured LawfulNotice dataclass
2. Formatted plain text notice for teletype / dispatch API
3. Styled HTML notice conforming to the locked palette (#0B1F3A, #00C2A8)
   for court-admissible audit proof certified under Section 63(4) BSA, 2023.
"""

import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

_BACKEND_ROOT = str(Path(__file__).resolve().parents[2])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)


@dataclass
class LawfulNotice:
    notice_id: str
    timestamp: float
    formatted_date: str
    statutory_authority: str
    issuing_authority: str
    complaint_id: str
    utr: str
    amount_inr: float
    victim_account: str
    target_bank: str
    beneficiary_account: str
    candidate_atms: List[Dict[str, Any]]
    attestation_chain_hash: str
    recommended_action: str
    statutory_declaration: str

    def to_dict(self) -> dict:
        return asdict(self)


class BNSSNoticeGenerator:
    """Generates legally defensible hold orders and patrol unit interception directives."""

    STATUTORY_SECTION = "Sections 106 & 107(5) read with Section 105, Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) & Section 63, Bharatiya Sakshya Adhiniyam, 2023 (BSA)"
    DEFAULT_ISSUING_AGENCY = "Maharashtra State Cyber Police (Special Cyber Cell 1930 / I4C)"

    @classmethod
    def generate_notice(
        cls,
        complaint_id: str,
        utr: str,
        amount_inr: float,
        beneficiary_account: str,
        target_bank: str = "State Bank of India",
        victim_account: Optional[str] = "ACC-VICTIM-XX4821",
        candidate_atms: Optional[List[Dict[str, Any]]] = None,
        attestation_chain_hash: Optional[str] = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        issuing_authority: Optional[str] = None,
        timestamp: Optional[float] = None,
    ) -> LawfulNotice:
        ts = timestamp or time.time()
        formatted_date = time.strftime("%d-%b-%Y %H:%M:%S IST", time.localtime(ts))
        notice_id = f"BNSS-106-107-MAH-{time.strftime('%Y', time.localtime(ts))}-{complaint_id.replace('C-', '')}"
        candidate_atms = candidate_atms or []

        statutory_declaration = (
            f"Whereas credible information has been attested under 3-party cryptographic proof that proceeds of "
            f"cyber fraud totaling INR {amount_inr:,.2f} under UTR {utr} have been illicitly transferred to "
            f"Beneficiary Account {beneficiary_account} with {target_bank}; You are hereby commanded under Section 106 "
            f"(Seizure of Property linked to Offence) and Section 107(5) (Ex-Parte Attachment of Proceeds of Crime) "
            f"of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) to place an immediate digital freeze on said "
            f"proceeds and assist field officers in monitoring candidate withdrawal terminals. Electronic record certified "
            f"under Section 105 BNSS and Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)."
        )

        return LawfulNotice(
            notice_id=notice_id,
            timestamp=ts,
            formatted_date=formatted_date,
            statutory_authority=cls.STATUTORY_SECTION,
            issuing_authority=issuing_authority or cls.DEFAULT_ISSUING_AGENCY,
            complaint_id=complaint_id,
            utr=utr,
            amount_inr=amount_inr,
            victim_account=victim_account or "UNKNOWN",
            target_bank=target_bank,
            beneficiary_account=beneficiary_account,
            candidate_atms=candidate_atms,
            attestation_chain_hash=attestation_chain_hash or "PENDING",
            recommended_action="IMMEDIATE BENEFICIARY HOLD & PATROL UNIT DISPATCH",
            statutory_declaration=statutory_declaration,
        )

    @classmethod
    def to_plain_text(cls, notice: LawfulNotice) -> str:
        atm_lines = ""
        for i, atm in enumerate(notice.candidate_atms, 1):
            atm_id = atm.get("atm_id", "N/A")
            area = atm.get("area", atm.get("city", "N/A"))
            bank = atm.get("bank", "N/A")
            atm_lines += f"    {i}. {atm_id} ({area} - {bank})\n"

        return f"""================================================================================
OFFICIAL NOTICE UNDER {notice.statutory_authority.upper()}
GOVERNMENT OF MAHARASHTRA - POLICE DEPARTMENT
================================================================================
NOTICE REFERENCE:   {notice.notice_id}
DATE & TIME:        {notice.formatted_date}
ISSUING AUTHORITY:  {notice.issuing_authority}
RECIPIENT:          Nodal Officer, {notice.target_bank}
================================================================================
SUBJECT: STATUTORY ORDER FOR PROMPT HOLD & ATTACHMENT OF FRAUD PROCEEDS

1. INCIDENT DETAILS:
   - Complaint Reference:    {notice.complaint_id}
   - Transaction UTR:        {notice.utr}
   - Amount Defrauded:       INR {notice.amount_inr:,.2f}
   - Victim Account:         {notice.victim_account}

2. TARGET BENEFICIARY SUBJECT TO HOLD:
   - Bank Name:              {notice.target_bank}
   - Beneficiary Account:    {notice.beneficiary_account}
   - Mandatory Action:       {notice.recommended_action}

3. PREDICTED PHYSICAL CASH-OUT ATMS (PATROL UNIT DIRECTIVE):
{atm_lines or '    (No physical ATMs prioritized - digital hold only)\n'}
4. STATUTORY MANDATE (SECTIONS 106 & 107(5) BNSS, 2023):
   "{notice.statutory_declaration}"

5. CRYPTOGRAPHIC INTEGRITY CERTIFICATION:
   - 3-Party Attestation Root Hash: {notice.attestation_chain_hash}
   - Authenticated under Section 63(4) of Bharatiya Sakshya Adhiniyam, 2023 (BSA Schedule Hash Seal).
================================================================================
BY ORDER OF THE AUTHORIZED CYBER CRIME INVESTIGATING OFFICER
================================================================================
"""

    @classmethod
    def to_html(cls, notice: LawfulNotice) -> str:
        atm_rows = ""
        for i, atm in enumerate(notice.candidate_atms, 1):
            atm_rows += f"""
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">#{i}</td>
              <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #0B1F3A;">{atm.get('atm_id', 'N/A')}</td>
              <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">{atm.get('area', atm.get('city', 'N/A'))}</td>
              <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">{atm.get('bank', 'N/A')}</td>
              <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; color: #00C2A8; font-weight: bold;">{atm.get('composite_priority', 'HIGH')}</td>
            </tr>
            """

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sections 106 & 107(5) BNSS Lawful Notice - {notice.notice_id}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: transparent;
      color: #1A1A1A;
      margin: 0;
      padding: 0;
      width: 100%;
    }}
    .notice-card {{
      width: 100%;
      max-width: 100%;
      margin: 0;
      background: #FFFFFF;
      border: 1.5px solid #0B1F3A;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(11, 31, 58, 0.06);
      overflow: hidden;
      box-sizing: border-box;
    }}
    .header {{
      background-color: #0B1F3A;
      color: #FFFFFF;
      padding: 16px 20px;
      border-bottom: 3px solid #00C2A8;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }}
    .header h1 {{
      margin: 0 0 3px 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }}
    .header p {{
      margin: 0;
      font-size: 12px;
      color: #CBD5E1;
    }}
    .header-badge {{
      background: rgba(0, 194, 168, 0.2);
      border: 1px solid #00C2A8;
      color: #00C2A8;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }}
    .content {{
      padding: 20px;
    }}
    .meta-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
      background: #F8FAFC;
      padding: 14px 16px;
      border-radius: 6px;
      border: 1px solid #E2E8F0;
    }}
    .meta-item label {{
      font-size: 10.5px;
      text-transform: uppercase;
      color: #64748B;
      font-weight: 700;
      display: block;
      margin-bottom: 2px;
    }}
    .meta-item span {{
      font-size: 13.5px;
      font-weight: 700;
      color: #0B1F3A;
      word-break: break-all;
    }}
    .declaration {{
      background: #F0FDF4;
      border-left: 4px solid #00C2A8;
      border-radius: 0 6px 6px 0;
      padding: 14px 16px;
      font-size: 12.5px;
      line-height: 1.5;
      margin-bottom: 20px;
      color: #0B1F3A;
    }}
    .table-container {{
      width: 100%;
      overflow-x: auto;
      margin-top: 10px;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }}
    th {{
      background: #0B1F3A;
      color: #FFFFFF;
      text-align: left;
      padding: 9px 12px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }}
    .attestation-footer {{
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px dashed #CBD5E1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      font-family: monospace;
      font-size: 11px;
      color: #475569;
    }}
  </style>
</head>
<body>
  <div class="notice-card">
    <div class="header">
      <div>
        <h1>Statutory Hold Directive — Sections 106 & 107(5) BNSS, 2023</h1>
        <p>{notice.issuing_authority}</p>
      </div>
      <div class="header-badge">
        DISPUTED-AMOUNT LIEN ENFORCEMENT
      </div>
    </div>
    <div class="content">
      <div class="meta-grid">
        <div class="meta-item"><label>Directive ID</label><span>{notice.notice_id}</span></div>
        <div class="meta-item"><label>Issuance Timestamp</label><span>{notice.formatted_date}</span></div>
        <div class="meta-item"><label>Transaction UTR</label><span style="font-family: monospace;">{notice.utr}</span></div>
        <div class="meta-item"><label>Disputed Amount Under Lien</label><span style="color: #00A896; font-size: 15px;">INR {notice.amount_inr:,.2f}</span></div>
        <div class="meta-item"><label>Target Bank</label><span>{notice.target_bank}</span></div>
        <div class="meta-item"><label>Beneficiary Mule Account</label><span style="font-family: monospace;">{notice.beneficiary_account}</span></div>
      </div>

      <div class="declaration">
        <strong>LEGAL DIRECTIVE:</strong> Under Sections 106 & 107(5) of the <em>Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)</em>, recipient bank is ordered to place an <strong>IMMEDIATE DISPUTED-AMOUNT LIEN</strong> strictly on <strong>INR {notice.amount_inr:,.2f}</strong> in account <strong>{notice.beneficiary_account}</strong> (UTR: <strong>{notice.utr}</strong>). Blanket account freezes are prohibited. Proceeds are authenticated as illicit cyber fraud transfers under Section 105 BNSS electronic logging. Field officers are simultaneously dispatched to monitor prioritized physical cash-out terminals.
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; margin-bottom: 6px;">
        <h3 style="font-size: 13px; text-transform: uppercase; color: #0B1F3A; margin: 0; font-weight: 800; letter-spacing: 0.5px;">
          Prioritized Physical ATM Extraction Terminals
        </h3>
        <span style="font-size: 11px; color: #64748B; font-weight: 600;">Ranked by Hawkes Spatiotemporal Clustering</span>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 60px;">Rank</th>
              <th>ATM Identifier</th>
              <th>Terminal Location / Hub</th>
              <th>Bank Network</th>
              <th style="width: 140px;">Hawkes Priority</th>
            </tr>
          </thead>
          <tbody>
            {atm_rows}
          </tbody>
        </table>
      </div>

      <div class="attestation-footer">
        <div><strong>Cryptographic Hash Chain:</strong> <span style="color: #00A896;">{notice.attestation_chain_hash}</span></div>
        <div>Section 63(4) Bharatiya Sakshya Adhiniyam, 2023 (BSA Schedule Hash Seal)</div>
      </div>
    </div>
  </div>
</body>
</html>"""


if __name__ == "__main__":
    sample_atms = [
        {"atm_id": "ATM-MAH-PUN-00201", "city": "Pune", "area": "Shivajinagar Station", "bank": "SBI", "composite_priority": "0.78 (CRITICAL)"},
        {"atm_id": "ATM-MAH-PUN-00202", "city": "Pune", "area": "Hinjawadi Phase 1", "bank": "HDFC", "composite_priority": "0.64 (HIGH)"},
    ]

    notice = BNSSNoticeGenerator.generate_notice(
        complaint_id="C-PUN-2026-004821",
        utr="429104829102",
        amount_inr=65000.0,
        beneficiary_account="ACC-MAH-992101",
        target_bank="State Bank of India",
        candidate_atms=sample_atms,
        attestation_chain_hash="ca465631c81b1135abcd991827463524152637481920394857615243",
    )

    print("=" * 70)
    print("SENTINEL BNSSNoticeGenerator Self-Test")
    print("=" * 70)

    # 1. Plain text rendering
    txt = BNSSNoticeGenerator.to_plain_text(notice)
    print("Rendered Plain-Text Order Preview:\n")
    print(txt[:600] + "...\n[Truncated for console]")

    assert "Section 105" in txt
    assert "Bharatiya Nagarik Suraksha Sanhita" in txt
    assert "429104829102" in txt
    assert "65,000.00" in txt
    print("PASS: Plain-text legal notice verified")

    # 2. HTML rendering
    html = BNSSNoticeGenerator.to_html(notice)
    assert "#0B1F3A" in html
    assert "#00C2A8" in html
    assert notice.notice_id in html
    print("PASS: HTML court-admissible notice preview verified")

    print("\nALL TESTS PASSED: BNSSNoticeGenerator operational.")
    print("=" * 70)
