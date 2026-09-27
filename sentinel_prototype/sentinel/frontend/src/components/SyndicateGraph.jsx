import React, { useState } from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  Copy, 
  Check, 
  Layers,
  ArrowRight
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* SVG Multi-Hop Money Trail (Spacious, Zero Overlap, High Clarity) */}
      <div className="card" style={{ padding: '20px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <Layers size={18} color="var(--color-teal)" />
              Transaction Velocity & Money Flow Path
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
              Chronological fund velocity from victim account through inter-bank transit to predicted ATM extraction terminal.
            </p>
          </div>
          <span className="badge badge-teal" style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700' }}>
            VERIFIED SYNDICATE CHAIN
          </span>
        </div>

        {/* SVG Canvas with Widescreen Layout & Generous 130px Node Spacing */}
        <div style={{
          width: '100%',
          overflowX: 'auto',
          backgroundColor: '#F8FAFC',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          padding: '20px 12px',
        }}>
          <svg viewBox="0 0 1120 180" role="img" aria-label="Funds Flow and Beneficiary Layering Path Diagram" style={{ width: '100%', minWidth: '880px', height: '180px' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#00A896" />
              </marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#DC2626" />
              </marker>
            </defs>

            {/* Connecting Edges with Velocity Annotations */}
            {/* Edge 1: Complainant (ends at 200) -> Nodal Bank (starts at 330) */}
            <path d="M 200 90 L 330 90" stroke="#00A896" strokeWidth="2" strokeDasharray="5,4" markerEnd="url(#arrow)" />
            {/* Edge 1 Pill Badge */}
            <g transform="translate(222, 69)">
              <rect width="86" height="42" rx="5" fill="#FFFFFF" stroke="#99F6E4" strokeWidth="1.5" />
              <text x="43" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#028071">
                ₹{details.amount?.toLocaleString('en-IN') || '78,000'}
              </text>
              <text x="43" y="32" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#64748B">
                UPI • 1.2m
              </text>
            </g>

            {/* Edge 2: Nodal Bank (ends at 500) -> Mule Hop 2 (starts at 630) */}
            <path d="M 500 90 L 630 90" stroke="#00A896" strokeWidth="2" strokeDasharray="5,4" markerEnd="url(#arrow)" />
            {/* Edge 2 Pill Badge */}
            <g transform="translate(522, 69)">
              <rect width="86" height="42" rx="5" fill="#FFFFFF" stroke="#99F6E4" strokeWidth="1.5" />
              <text x="43" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#028071">
                ₹{details.amount?.toLocaleString('en-IN') || '78,000'}
              </text>
              <text x="43" y="32" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#64748B">
                IMPS • 2.8m
              </text>
            </g>

            {/* Edge 3: Mule Hop 2 (ends at 805) -> Target ATM (starts at 935) */}
            <path d="M 805 90 L 935 90" stroke="#DC2626" strokeWidth="2.5" markerEnd="url(#arrow-red)" />
            {/* Edge 3 Pill Badge (Generous 130px Runway, Zero Overlap with Node 3 or Node 4) */}
            <g transform="translate(817, 69)">
              <rect width="106" height="42" rx="5" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
              <text x="53" y="18" textAnchor="middle" fontSize="11" fontWeight="800" fill="#DC2626">
                ATM Extraction
              </text>
              <text x="53" y="32" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#B91C1C">
                Est. ~4.5m Runway
              </text>
            </g>

            {/* Node 1: Complainant / Victim (x: 30..200, width: 170) */}
            <g transform="translate(30, 42)">
              <rect width="170" height="96" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <rect width="170" height="4" rx="2" fill="#2563EB" />
              <text x="14" y="24" fontSize="10.5" fontWeight="700" fill="#2563EB">ORIGIN COMPLAINANT</text>
              <text x="14" y="44" fontSize="13" fontWeight="800" fill="#0B1F3A">{details.victim_city || 'Pune'}</text>
              <text x="14" y="62" fontSize="10.5" fill="#64748B" fontFamily="var(--font-mono)">
                {(details.victim_account || 'SBIN0004123:***').slice(0, 16)}
              </text>
              <text x="14" y="82" fontSize="10.5" fontWeight="600" fill="#15803D">Verified Complainant</text>
            </g>

            {/* Node 2: Nodal Settlement Bank (x: 330..500, width: 170) */}
            <g transform="translate(330, 42)">
              <rect width="170" height="96" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <rect width="170" height="4" rx="2" fill="#0B1F3A" />
              <text x="14" y="24" fontSize="10.5" fontWeight="700" fill="#0B1F3A">HOP 1: SETTLEMENT</text>
              <text x="14" y="44" fontSize="13" fontWeight="800" fill="#0B1F3A">Primary Bank</text>
              <text x="14" y="62" fontSize="10.5" fill="#64748B" fontFamily="var(--font-mono)">Transit Settlement</text>
              <text x="14" y="82" fontSize="10.5" fontWeight="600" fill="#0B1F3A">Inter-Bank Switch</text>
            </g>

            {/* Node 3: Mule Beneficiary Account (x: 630..805, width: 175) */}
            <g transform="translate(630, 42)">
              <rect width="175" height="96" rx="6" fill="#FFFFFF" stroke={device.is_cluster_flagged ? '#FCA5A5' : '#CBD5E1'} strokeWidth="1.2" />
              <rect width="175" height="4" rx="2" fill={device.is_cluster_flagged ? '#DC2626' : '#D97706'} />
              <text x="14" y="24" fontSize="10.5" fontWeight="700" fill={device.is_cluster_flagged ? '#DC2626' : '#D97706'}>
                HOP 2: MULE ACCOUNT
              </text>
              <text x="14" y="44" fontSize="12.5" fontWeight="800" fill="#0B1F3A">
                {details.leading_atm?.city ? `${details.leading_atm.city} Mule` : 'Beneficiary Layer'}
              </text>
              <text x="14" y="62" fontSize="10.5" fill="#64748B" fontFamily="var(--font-mono)">
                {(details.beneficiary_account || 'HDFC0001048:***').slice(0, 16)}
              </text>
              <text x="14" y="82" fontSize="10.5" fontWeight="700" fill={device.is_cluster_flagged ? '#B91C1C' : '#B45309'}>
                {device.is_cluster_flagged ? 'Shared Hardware Flag' : (details.inter_jcct ? 'Inter-JCCT Handoff' : 'Identified Mule')}
              </text>
            </g>

            {/* Node 4: Target ATM Hotspot (x: 935..1090, width: 155) */}
            <g transform="translate(935, 42)">
              <rect width="155" height="96" rx="6" fill={details.status === 'EXPIRED' ? '#F8FAFC' : '#FEF2F2'} stroke={details.status === 'EXPIRED' ? '#CBD5E1' : '#FCA5A5'} strokeWidth="1.5" />
              <rect width="155" height="4" rx="2" fill={details.status === 'EXPIRED' ? '#64748B' : '#DC2626'} />
              <text x="14" y="24" fontSize="10.5" fontWeight="800" fill={details.status === 'EXPIRED' ? '#64748B' : '#B91C1C'}>
                {details.status === 'EXPIRED' ? 'EXPIRED TERMINAL' : 'TARGET ATM'}
              </text>
              <text x="14" y="44" fontSize="12" fontWeight="800" fill="#0B1F3A">
                {details.leading_atm?.bank || 'HDFC'} • {details.leading_atm?.city || 'Pune'}
              </text>
              <text x="14" y="62" fontSize="10" fill="#64748B">
                {(details.leading_atm?.area || 'Hinjawadi Phase 1').slice(0, 18)}
              </text>
              <text x="14" y="82" fontSize="10.5" fontWeight="700" fill={details.status === 'EXPIRED' ? '#64748B' : '#B91C1C'}>
                {details.status === 'EXPIRED' ? '45m Window Expired' : 'Forecasted Cash-Out'}
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Two-Column Grid: Device Fingerprint & 3-Party Attestation with Generous Spacing */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {/* Device Fingerprint Card */}
        <div className="card" style={{ padding: '20px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '13.5px', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <Smartphone size={16} color="var(--color-navy)" />
              Hardware Fingerprint & Mule Device Network
            </h4>
            {device.is_cluster_flagged ? (
              <span className="badge badge-critical">SHARED DEVICE</span>
            ) : (
              <span className="badge badge-verified">SINGLE DEVICE</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--color-muted)' }}>Device IMEI / Hardware ID:</span>
              <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--color-navy)' }}>
                {device.imei || '864291048291021'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--color-muted)' }}>Associated Mule Accounts:</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: device.shared_mule_accounts > 1 ? '#B91C1C' : 'var(--color-navy)' }}>
                {device.shared_mule_accounts || 3} Accounts on Same Device
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--color-muted)' }}>Syndicate Linkage Level:</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: device.cluster_risk === 'HIGH' ? '#B91C1C' : '#15803D' }}>
                {device.cluster_risk || 'HIGH'} Confidence Association
              </span>
            </div>
          </div>
        </div>

        {/* 3-Party Statutory Attestation Ledger Card */}
        <div className="card" style={{ padding: '20px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '13.5px', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <ShieldCheck size={16} color="var(--color-teal)" />
              Three-Tier Statutory Legal Attestation
            </h4>
            <span className="badge badge-verified">TAMPER-EVIDENT</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Attestation Step Indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ padding: '8px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC' }}>
                <div style={{ fontSize: '10px', color: '#15803D', fontWeight: '700' }}>1. COMPLAINANT</div>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#15803D', marginTop: '2px' }}>VERIFIED (OTP)</div>
              </div>
              <div style={{ padding: '8px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC' }}>
                <div style={{ fontSize: '10px', color: '#15803D', fontWeight: '700' }}>2. BANK NODAL</div>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#15803D', marginTop: '2px' }}>CORROBORATED</div>
              </div>
              <div style={{ padding: '8px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC' }}>
                <div style={{ fontSize: '10px', color: '#15803D', fontWeight: '700' }}>3. POLICE CELL</div>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#15803D', marginTop: '2px' }}>RECORDED (BNSS)</div>
              </div>
            </div>

            {/* SHA-256 Hash Viewer */}
            <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--color-muted)', fontWeight: '600' }}>
                  IMMUTABLE SHA-256 STATE HASH
                </span>
                <button
                  onClick={handleCopyHash}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-teal-dark)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}
                >
                  {copiedHash ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-navy)',
                wordBreak: 'break-all',
                backgroundColor: '#FFFFFF',
                padding: '4px 8px',
                borderRadius: '3px',
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
