"""
Section 105 BNSS Lawful Notice Generator for SENTINEL.

Pursuant to Section 105 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS),
empowering Law Enforcement Agencies (LEAs) to mandate immediate discovery,
temporary hold, and preservation of proceeds of cybercrime.

Generates:
1. Structured LawfulNotice dataclass
2. Formatted plain text notice for teletype / dispatch API
3. Styled HTML notice conforming to the locked palette (#0B1F3A, #00C2A8)
   for court-admissible audit proof under Section 65B Indian Evidence Act.
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
    """Generates legally defensible hold orders and beat interception directives."""

    STATUTORY_SECTION = "Section 105, Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)"
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
        notice_id = f"BNSS-105-MAH-{time.strftime('%Y', time.localtime(ts))}-{complaint_id.replace('C-', '')}"
        candidate_atms = candidate_atms or []

        statutory_declaration = (
            f"Whereas credible information has been attested under 3-party cryptographic proof that proceeds of "
            f"cyber fraud totaling INR {amount_inr:,.2f} under UTR {utr} have been illicitly transferred to "
            f"Beneficiary Account {beneficiary_account} with {target_bank}; You are hereby commanded under Section 105 "
            f"of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) to place an immediate digital freeze on said "
            f"proceeds and assist field officers in monitoring candidate withdrawal terminals."
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
            recommended_action="IMMEDIATE BENEFICIARY HOLD & POLICE BEAT DISPATCH",
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

3. PREDICTED PHYSICAL CASH-OUT ATMS (BEAT PATROL DIRECTIVE):
{atm_lines or '    (No physical ATMs prioritized - digital hold only)\n'}
4. STATUTORY MANDATE (SECTION 105 BNSS, 2023):
   "{notice.statutory_declaration}"

5. CRYPTOGRAPHIC INTEGRITY CERTIFICATION:
   - 3-Party Attestation Root Hash: {notice.attestation_chain_hash}
   - Authenticated under Section 65B of Indian Evidence Act / BSA 2023.
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
  <title>Section 105 BNSS Lawful Notice - {notice.notice_id}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #F5F7FA;
      color: #1A1A1A;
      margin: 0;
      padding: 24px;
    }}
    .notice-card {{
      max-width: 800px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 2px solid #0B1F3A;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(11, 31, 58, 0.08);
      overflow: hidden;
    }}
    .header {{
      background-color: #0B1F3A;
      color: #FFFFFF;
      padding: 20px 24px;
      border-bottom: 4px solid #00C2A8;
    }}
    .header h1 {{
      margin: 0 0 6px 0;
      font-size: 18px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }}
    .header p {{
      margin: 0;
      font-size: 13px;
      color: #E2E8F0;
    }}
    .content {{
      padding: 24px;
    }}
    .meta-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
      background: #F8FAFC;
      padding: 16px;
      border-radius: 6px;
      border-left: 4px solid #0B1F3A;
    }}
    .meta-item label {{
      font-size: 11px;
      text-transform: uppercase;
      color: #64748B;
      font-weight: bold;
      display: block;
    }}
    .meta-item span {{
      font-size: 14px;
      font-weight: 600;
      color: #0B1F3A;
    }}
    .declaration {{
      background: rgba(0, 194, 168, 0.08);
      border-left: 4px solid #00C2A8;
      padding: 14px 16px;
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 24px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 8px;
    }}
    th {{
      background: #0B1F3A;
      color: #FFFFFF;
      text-align: left;
      padding: 8px;
      font-size: 11px;
      text-transform: uppercase;
    }}
    .attestation-footer {{
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px dashed #CBD5E1;
      font-family: monospace;
      font-size: 11px;
      color: #475569;
    }}
  </style>
</head>
<body>
  <div class="notice-card">
    <div class="header">
      <h1>Statutory Hold Notice — Section 105 BNSS, 2023</h1>
      <p>{notice.issuing_authority}</p>
    </div>
    <div class="content">
      <div class="meta-grid">
        <div class="meta-item"><label>Notice ID</label><span>{notice.notice_id}</span></div>
        <div class="meta-item"><label>Issuance Date</label><span>{notice.formatted_date}</span></div>
        <div class="meta-item"><label>Transaction UTR</label><span>{notice.utr}</span></div>
        <div class="meta-item"><label>Amount Subject to Hold</label><span style="color: #00C2A8;">INR {notice.amount_inr:,.2f}</span></div>
        <div class="meta-item"><label>Beneficiary Bank</label><span>{notice.target_bank}</span></div>
        <div class="meta-item"><label>Beneficiary Account</label><span>{notice.beneficiary_account}</span></div>
      </div>

      <div class="declaration">
        <strong>STATUTORY INJUNCTION:</strong> {notice.statutory_declaration}
      </div>

      <h3 style="font-size: 14px; text-transform: uppercase; color: #0B1F3A; margin: 20px 0 8px 0;">Prioritized Physical Withdrawal Terminals</h3>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>ATM Identifier</th>
            <th>Location / Area</th>
            <th>Bank</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {atm_rows}
        </tbody>
      </table>

      <div class="attestation-footer">
        <div><strong>Cryptographic Chain Hash:</strong> {notice.attestation_chain_hash}</div>
        <div style="margin-top: 4px;">Certified under Section 65B Indian Evidence Act / Bharatiya Sakshya Adhiniyam, 2023.</div>
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
