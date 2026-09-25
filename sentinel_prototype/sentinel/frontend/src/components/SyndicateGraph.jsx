import React, { useState } from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  Copy, 
  Check, 
  Layers
} from 'lucide-react';

export default function SyndicateGraph({ dossier }) {
  const [copiedHash, setCopiedHash] = useState(false);

  const graph = dossier?.syndicate_graph || { nodes: [], edges: [] };
  const device = dossier?.device_fingerprint || {};
  const attestation = dossier?.attestation_chain || {};
  const details = dossier?.details || {};

  const handleCopyHash = () => {
    if (attestation.chain_hash) {
      navigator.clipboard.writeText(attestation.chain_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* SVG Multi-Hop Money Trail (Flat Solid, No Gradients) */}
      <div className="card" style={{ padding: '16px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="var(--color-teal)" />
              Funds Flow & Beneficiary Layering Path
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--color-muted)', marginTop: '1px' }}>
              Chronological transaction velocity from complainant account to destination ATM cash withdrawal point.
            </p>
          </div>
          <span className="badge badge-teal">VERIFIED CHAIN</span>
        </div>

        {/* SVG Canvas (Strict Flat Colors, No Gradients) */}
        <div style={{
          width: '100%',
          overflowX: 'auto',
          backgroundColor: '#F8FAFC',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-medium)',
          padding: '16px 8px',
        }}>
          <svg viewBox="0 0 860 170" style={{ width: '100%', minWidth: '680px', height: '170px' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#00A896" />
              </marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
              </marker>
            </defs>

            {/* Connecting Edges with Velocity Annotations */}
            {/* Edge 1: Complainant -> Nodal Bank */}
            <path d="M 180 85 L 290 85" stroke="#00A896" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#arrow)" />
            <text x="235" y="75" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#028071">
              ₹{details.amount?.toLocaleString('en-IN')}
            </text>
            <text x="235" y="102" textAnchor="middle" fontSize="10" fill="#64748B">
              UPI • 1.2m
            </text>

            {/* Edge 2: Nodal Bank -> Mule Hop 2 */}
            <path d="M 430 85 L 540 85" stroke="#00A896" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#arrow)" />
            <text x="485" y="75" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#028071">
              ₹{details.amount?.toLocaleString('en-IN')}
            </text>
            <text x="485" y="102" textAnchor="middle" fontSize="10" fill="#64748B">
              IMPS • 2.8m
            </text>

            {/* Edge 3: Mule Hop 2 -> Target ATM */}
            <path d="M 680 85 L 730 85" stroke="#DC2626" strokeWidth="2.5" markerEnd="url(#arrow-red)" />
            <text x="705" y="75" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#DC2626">
              ATM Extraction
            </text>
            <text x="705" y="102" textAnchor="middle" fontSize="10" fill="#64748B">
              4.5m Target
            </text>

            {/* Node 1: Complainant / Victim */}
            <g transform="translate(40, 40)">
              <rect width="140" height="88" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
              <rect width="140" height="4" fill="#2563EB" />
              <text x="10" y="24" fontSize="10" fontWeight="700" fill="#2563EB">COMPLAINANT</text>
              <text x="10" y="42" fontSize="12" fontWeight="800" fill="#0B1F3A">{details.victim_city || 'Pune'}</text>
              <text x="10" y="58" fontSize="10" fill="#64748B" fontFamily="monospace">
                {(details.victim_account || 'SBIN0004123:***').slice(0, 14)}
              </text>
              <text x="10" y="76" fontSize="10" fontWeight="600" fill="#15803D">Verified Complainant</text>
            </g>

            {/* Node 2: Nodal Settlement Bank */}
            <g transform="translate(290, 40)">
              <rect width="140" height="88" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
              <rect width="140" height="4" fill="#0B1F3A" />
              <text x="10" y="24" fontSize="10" fontWeight="700" fill="#0B1F3A">HOP 1: SETTLEMENT</text>
              <text x="10" y="42" fontSize="12" fontWeight="800" fill="#0B1F3A">Primary Bank</text>
              <text x="10" y="58" fontSize="10" fill="#64748B" fontFamily="monospace">Transit Settlement</text>
              <text x="10" y="76" fontSize="10" fontWeight="600" fill="#0B1F3A">Inter-Bank Switch</text>
            </g>

            {/* Node 3: Mule Beneficiary Account */}
            <g transform="translate(540, 40)">
              <rect width="140" height="88" rx="4" fill="#FFFFFF" stroke={device.is_cluster_flagged ? '#FCA5A5' : '#CBD5E1'} strokeWidth="1" />
              <rect width="140" height="4" fill={device.is_cluster_flagged ? '#DC2626' : '#D97706'} />
              <text x="10" y="24" fontSize="10" fontWeight="700" fill={device.is_cluster_flagged ? '#DC2626' : '#D97706'}>
                HOP 2: MULE ACCOUNT
              </text>
              <text x="10" y="42" fontSize="12" fontWeight="800" fill="#0B1F3A">Beneficiary Layer</text>
              <text x="10" y="58" fontSize="10" fill="#64748B" fontFamily="monospace">
                {(details.beneficiary_account || 'HDFC0001048:***').slice(0, 14)}
              </text>
              <text x="10" y="76" fontSize="10" fontWeight="700" fill={device.is_cluster_flagged ? '#B91C1C' : '#B45309'}>
                {device.is_cluster_flagged ? 'Shared Hardware Flag' : 'Identified Mule'}
              </text>
            </g>

            {/* Node 4: Target ATM Hotspot */}
            <g transform="translate(730, 40)">
              <rect width="120" height="88" rx="4" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
              <rect width="120" height="4" fill="#DC2626" />
              <text x="10" y="24" fontSize="10" fontWeight="800" fill="#B91C1C">TARGET ATM</text>
              <text x="10" y="42" fontSize="12" fontWeight="800" fill="#0B1F3A">
                {details.leading_atm?.bank || 'SBI'} Kiosk
              </text>
              <text x="10" y="58" fontSize="10" fill="#64748B">
                {(details.leading_atm?.area || 'Hinjawadi').slice(0, 14)}
              </text>
              <text x="10" y="76" fontSize="10" fontWeight="700" fill="#B91C1C">
                Forecasted Cash-Out
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Two-Column Grid: Device Fingerprint & 3-Party Attestation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px' }}>
        {/* Device Fingerprint Card */}
        <div className="card" style={{ padding: '16px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={15} color="var(--color-navy)" />
              Hardware Device Fingerprint & Linked Accounts
            </h4>
            {device.is_cluster_flagged ? (
              <span className="badge badge-critical">SHARED DEVICE</span>
            ) : (
              <span className="badge badge-verified">SINGLE DEVICE</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Device IMEI / Hardware ID:</span>
              <span style={{ fontSize: '11.5px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--color-navy)' }}>
                {device.imei || '864291048291021'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Associated Mule Accounts:</span>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: device.shared_mule_accounts > 1 ? '#B91C1C' : 'var(--color-navy)' }}>
                {device.shared_mule_accounts} Accounts on Same Device
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Syndicate Linkage Level:</span>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: device.cluster_risk === 'HIGH' ? '#B91C1C' : '#15803D' }}>
                {device.cluster_risk || 'ELEVATED'} Confidence Association
              </span>
            </div>
          </div>
        </div>

        {/* 3-Party Statutory Attestation Ledger Card */}
        <div className="card" style={{ padding: '16px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} color="var(--color-teal)" />
              Three-Tier Statutory Attestation Ledger
            </h4>
            <span className="badge badge-verified">TAMPER-EVIDENT</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Attestation Step Indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center' }}>
              <div style={{ padding: '6px 4px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC' }}>
                <div style={{ fontSize: '9.5px', color: '#15803D', fontWeight: '700' }}>1. COMPLAINANT</div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#15803D' }}>VERIFIED (OTP)</div>
              </div>
              <div style={{ padding: '6px 4px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC' }}>
                <div style={{ fontSize: '9.5px', color: '#15803D', fontWeight: '700' }}>2. BANK NODAL</div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#15803D' }}>CORROBORATED</div>
              </div>
              <div style={{ padding: '6px 4px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC' }}>
                <div style={{ fontSize: '9.5px', color: '#15803D', fontWeight: '700' }}>3. POLICE CELL</div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#15803D' }}>RECORDED (BNSS)</div>
              </div>
            </div>

            {/* SHA-256 Hash Viewer */}
            <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: '600' }}>
                  IMMUTABLE SHA-256 STATE HASH
                </span>
                <button
                  onClick={handleCopyHash}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-teal-dark)',
                    cursor: 'pointer',
                    fontSize: '10.5px',
                    fontWeight: '700',
                  }}
                >
                  {copiedHash ? <Check size={11} /> : <Copy size={11} />}
                  <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div style={{
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-navy)',
                wordBreak: 'break-all',
                backgroundColor: '#FFFFFF',
                padding: '3px 5px',
                borderRadius: '2px',
                border: '1px solid var(--border-medium)',
              }}>
                {attestation.chain_hash || 'a4f8e9102c4b82d710f293847291a4b5c6d7e8f90123456789abcdef01234567'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
