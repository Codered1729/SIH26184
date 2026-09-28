import React, { useState } from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  Copy, 
  Check, 
  Layers,
  ArrowRight,
  GitFork,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Shield,
  Zap,
  DollarSign,
  TrendingDown,
  CornerDownRight
} from 'lucide-react';

export default function SyndicateGraph({ dossier }) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [viewMode, setViewMode] = useState('multi_split'); // 'multi_split' or 'linear'
  const [activeBranchId, setActiveBranchId] = useState('BRANCH_2A'); // Default highlight active threat

  const graph = dossier?.syndicate_graph || { nodes: [], edges: [] };
  const device = dossier?.device_fingerprint || {};
  const attestation = dossier?.attestation_chain || {};
  const details = dossier?.details || {};

  const totalAmount = Number(details.amount || 78000);
  const targetCity = details.leading_atm?.city || details.victim_city || 'Pune';
  const targetBank = details.leading_atm?.bank || 'HDFC';
  const targetArea = details.leading_atm?.area || 'Hinjawadi Phase 1';
  const targetAtmId = details.leading_atm?.atm_id || 'ATM-MAH-PUN-00202';

  // Dynamic Hierarchical Structuring & Tranches
  const multiSplit = graph.multi_split_subgraph || {};
  const branches = multiSplit.branches || [];
  const N = Math.max(1, Number(multiSplit.hop_depth || details.hop_depth || (branches.length > 1 ? branches.length - 1 : 1)));
  const isDuplicate = details.authenticity_decision === 'DUPLICATE_UTR' || multiSplit.topology === 'BLOCKED_AT_INGESTION';
  const isExpired = details.status === 'EXPIRED';

  const extractedBranches = branches.filter(b => b.status === 'EXTRACTED');
  const activeThreatBranch = branches.find(b => b.status === 'ACTIVE_THREAT') || branches.find(b => b.branch_id.endsWith('A'));
  const preservedLienBranch = branches.find(b => b.status === 'PRESERVED') || branches.find(b => b.branch_id.endsWith('B'));

  const totalExtracted = extractedBranches.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalActiveThreat = activeThreatBranch ? activeThreatBranch.amount : 0;
  const totalPreserved = preservedLienBranch ? preservedLienBranch.amount : 0;

  const b1 = branches[0] || {};
  const b2a = activeThreatBranch || branches[1] || {};
  const b2b = preservedLienBranch || branches[2] || {};
  const hop2Total = multiSplit.hop1_split?.outflow_layering || (Number(b2a.amount || 0) + Number(b2b.amount || 0));

  const colSpacing = 280;
  const svgWidth = Math.max(1220, 240 + (N - 1) * colSpacing + 560);

  const handleCopyHash = () => {
    if (attestation.chain_hash) {
      navigator.clipboard.writeText(attestation.chain_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Main Graph Card with Hierarchical Multi-Split Subgraph View */}
      <div className="card" style={{ padding: '20px 24px', backgroundColor: '#FFFFFF' }}>
        
        {/* Header Bar with View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
              <GitFork size={20} color="var(--color-teal)" />
              Hierarchical Money Flow Subgraph (Layered Smurfing)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
              Real-world syndicates split funds into immediate cash-out and secondary transit, then sub-split again across terminals.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Mode Toggle Controls */}
            <div style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              borderRadius: 'var(--radius-sm)',
              padding: '3px',
              border: '1px solid var(--border-medium)'
            }}>
              <button
                onClick={() => setViewMode('multi_split')}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'multi_split' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'multi_split' ? 'var(--color-navy)' : 'var(--color-muted)',
                  boxShadow: viewMode === 'multi_split' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <GitFork size={13} color={viewMode === 'multi_split' ? 'var(--color-teal)' : '#64748B'} />
                <span>{N === 1 ? 'Single-Hop Direct Flow' : `Hierarchical Structuring (${N}-Hop Structuring)`}</span>
              </button>
              <button
                onClick={() => setViewMode('linear')}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'linear' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'linear' ? 'var(--color-navy)' : 'var(--color-muted)',
                  boxShadow: viewMode === 'linear' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <ArrowRight size={13} color={viewMode === 'linear' ? 'var(--color-teal)' : '#64748B'} />
                <span>Linear Trajectory</span>
              </button>
            </div>

            <span className="badge badge-teal" style={{ padding: '5px 10px', fontSize: '11px', fontWeight: '800' }}>
              FLOW BALANCED (100%)
            </span>
          </div>
        </div>

        {/* Conservation of Flow Live Financial Triage Bar */}
        <div style={{
          backgroundColor: '#F8FAFC',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          padding: '14px 18px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Disputed Capital Conservation:
              </span>
              <span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--color-navy)', fontFamily: 'var(--font-mono)' }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                ({isDuplicate ? 'Blocked at Gateway - Zero Mule Outflow' : `${N} ${N === 1 ? 'Hop (Direct)' : 'Layering Hops'} • ${branches.length} Structured Tranches`})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11.5px', flexWrap: 'wrap' }}>
              {isDuplicate ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#64748B' }}></span>
                  <span style={{ color: 'var(--color-muted)' }}>Intake Blocked:</span>
                  <span style={{ fontWeight: '800', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: totalExtracted === 0 ? '#10B981' : '#DC2626' }}></span>
                    <span style={{ color: 'var(--color-muted)' }}>Cashed-Out / Extracted:</span>
                    <span style={{ fontWeight: '800', color: totalExtracted === 0 ? '#059669' : '#DC2626', fontFamily: 'var(--font-mono)' }}>
                      ₹{totalExtracted.toLocaleString('en-IN')} {totalExtracted === 0 && <span style={{ fontSize: '10px', fontWeight: '700', color: '#059669' }}>(0% — Zero Cashout)</span>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#B91C1C' }}></span>
                    <span style={{ color: 'var(--color-muted)' }}>Active Threat (In Flight):</span>
                    <span style={{ fontWeight: '800', color: '#B91C1C', fontFamily: 'var(--font-mono)' }}>
                      ₹{totalActiveThreat.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#059669' }}></span>
                    <span style={{ color: 'var(--color-muted)' }}>BNSS §106 Preserved Lien:</span>
                    <span style={{ fontWeight: '800', color: '#059669', fontFamily: 'var(--font-mono)' }}>
                      ₹{totalPreserved.toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Visual Proportional Segmented Progress Bar */}
          <div style={{
            height: '8px',
            width: '100%',
            backgroundColor: '#E2E8F0',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex'
          }}>
            {branches.map((b) => (
              <div 
                key={b.branch_id}
                style={{ 
                  width: `${b.percentage}%`, 
                  backgroundColor: b.status_color || '#64748B',
                  transition: 'width 0.4s ease'
                }} 
                title={`${b.tranche_name}: ₹${b.amount?.toLocaleString('en-IN')} (${b.percentage}%)`}
              />
            ))}
          </div>
        </div>

        {/* Conditional SVG Rendering based on ViewMode */}
        {viewMode === 'multi_split' ? (
          isDuplicate ? (
            /* ========================================================================= */
            /* INGESTION BLOCKED GATEWAY TOPOLOGY (DUPLICATE UTR OR HARD-FAIL)          */
            /* ========================================================================= */
            <div style={{
              width: '100%',
              overflowX: 'auto',
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              padding: '24px 16px',
            }}>
              <svg viewBox="0 0 920 220" role="img" aria-label="Duplicate UTR Ingestion Block Diagram" style={{ width: '100%', minWidth: '720px', height: '220px' }}>
                <defs>
                  <marker id="arrow-slate" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748B" />
                  </marker>
                </defs>

                {/* Connecting path */}
                <path d="M 220 110 L 420 110" stroke="#64748B" strokeWidth="2.5" strokeDasharray="6,4" markerEnd="url(#arrow-slate)" />
                <g transform="translate(260, 88)">
                  <rect width="120" height="24" rx="4" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="60" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="#475569">Ingestion Audit</text>
                </g>

                {/* Node 1: Origin Complainant */}
                <g transform="translate(50, 55)">
                  <rect width="170" height="110" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                  <rect width="170" height="4" rx="2" fill="#2563EB" />
                  <text x="14" y="24" fontSize="10" fontWeight="700" fill="#2563EB">ORIGIN COMPLAINANT</text>
                  <text x="14" y="46" fontSize="13" fontWeight="800" fill="#0B1F3A">{details.victim_city || 'Mumbai'}</text>
                  <text x="14" y="66" fontSize="10" fill="#64748B" fontFamily="var(--font-mono)">
                    {(details.victim_account || 'SBIN0001928:***').slice(0, 18)}
                  </text>
                  <text x="14" y="86" fontSize="12" fontWeight="800" fill="#0B1F3A" fontFamily="var(--font-mono)">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </text>
                  <text x="14" y="102" fontSize="9.5" fontWeight="600" fill="#DC2626">Duplicate UTR Submitted</text>
                </g>

                {/* Node 2: Ingestion Gate Freeze */}
                <g transform="translate(420, 45)">
                  <rect width="460" height="130" rx="8" fill="#FEF2F2" stroke="#EF4444" strokeWidth="2" />
                  <rect width="460" height="5" rx="2.5" fill="#DC2626" />
                  <text x="18" y="28" fontSize="11" fontWeight="900" fill="#DC2626">
                    ⛔ INGESTION HARD-FAIL: DUPLICATE UTR ATTESTATION GATE
                  </text>
                  <text x="18" y="52" fontSize="13.5" fontWeight="800" fill="#0B1F3A">
                    RBI Central Switch • Immediate Audit Freeze
                  </text>
                  <text x="18" y="74" fontSize="11" fill="#7F1D1D">
                    UTR {details.utr || '429104829102'} already indexed in ledger. Zero mule outflows authorized.
                  </text>
                  <text x="18" y="96" fontSize="11" fontWeight="800" fill="#DC2626" fontFamily="var(--font-mono)">
                    Held Under Section 105 BNSS Pre-Interception Statutory Screen
                  </text>
                  <text x="18" y="116" fontSize="10" fontWeight="700" fill="#15803D">
                    ✓ Ledger Immutability Preserved • Citizen & Bank Protected from Erroneous Dispatches
                  </text>
                </g>
              </svg>
            </div>
          ) : (
            /* ========================================================================= */
            /* DYNAMIC N-HOP HIERARCHICAL STRUCTURING SUBGRAPH VIEW                      */
            /* ========================================================================= */
            <div style={{
              width: '100%',
              overflowX: 'auto',
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              padding: '16px 12px',
            }}>
              <svg 
                viewBox={`0 0 ${svgWidth} 440`} 
                role="img" 
                aria-label="Hierarchical Money Flow Subgraph Diagram" 
                style={{ width: '100%', minWidth: `${Math.min(svgWidth, 1220)}px`, height: '440px' }}
              >
                <defs>
                  <marker id="split-arrow-teal" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#00A896" />
                  </marker>
                  <marker id="split-arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#DC2626" />
                  </marker>
                  <marker id="split-arrow-crimson" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#B91C1C" />
                  </marker>
                  <marker id="split-arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#059669" />
                  </marker>
                </defs>

                {/* Background Flow Zone Labels */}
                <text x="25" y="20" fontSize="10.5" fontWeight="800" fill="#94A3B8" letterSpacing="0.05em">LEVEL 0: INGESTION</text>
                {Array.from({ length: N }).map((_, idx) => (
                  <text 
                    key={idx} 
                    x={230 + idx * colSpacing} 
                    y="20" 
                    fontSize="10.5" 
                    fontWeight="800" 
                    fill="#94A3B8" 
                    letterSpacing="0.05em"
                  >
                    HOP {idx + 1}: {idx === 0 ? 'GATEWAY SPLIT' : (idx === N - 1 ? 'TERMINAL SUB-SPLIT' : 'STRUCTURING RELAY')}
                  </text>
                ))}
                <text x={230 + (N - 1) * colSpacing + 230} y="20" fontSize="10.5" fontWeight="800" fill="#94A3B8" letterSpacing="0.05em">
                  FINAL EXTRACTION & PRESERVATION
                </text>

                {/* --- Origin Complainant -> Hub 1 Path --- */}
                <path d="M 180 220 L 230 220" stroke="#00A896" strokeWidth="2.5" markerEnd="url(#split-arrow-teal)" />
                <g transform="translate(185, 200)">
                  <rect width="45" height="18" rx="3" fill="#FFFFFF" stroke="#99F6E4" strokeWidth="1" />
                  <text x="22.5" y="12" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#0F766E">{details.channel || 'UPI'}</text>
                </g>

                {/* Node 0: Origin Complainant */}
                <g transform="translate(25, 170)">
                  <rect width="155" height="95" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
                  <rect width="155" height="4" rx="2" fill="#2563EB" />
                  <text x="12" y="20" fontSize="9" fontWeight="700" fill="#2563EB">ORIGIN COMPLAINANT</text>
                  <text x="12" y="38" fontSize="12" fontWeight="800" fill="#0B1F3A">{details.victim_city || 'Pune'}</text>
                  <text x="12" y="54" fontSize="9.5" fill="#64748B" fontFamily="var(--font-mono)">
                    {(details.victim_account || 'SBIN0004123:3819').slice(0, 16)}
                  </text>
                  <text x="12" y="72" fontSize="11" fontWeight="800" fill="#0B1F3A" fontFamily="var(--font-mono)">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </text>
                  <text x="12" y="86" fontSize="9" fontWeight="600" fill="#15803D">Verified Complainant</text>
                </g>

                {/* Intermediate Hops 1 through N-1 */}
                {Array.from({ length: N - 1 }).map((_, idx) => {
                  const k = idx + 1;
                  const x_k = 230 + (k - 1) * colSpacing;
                  const next_x = 230 + k * colSpacing;
                  const b_k = branches.find(b => b.hop_level === k && b.status === 'EXTRACTED') || branches[idx] || {};
                  const relayAmount = b_k ? Math.round(totalAmount - branches.slice(0, k).reduce((s, b) => s + (b.amount || 0), 0)) : 0;

                  return (
                    <g key={`hop_group_${k}`}>
                      {/* Siphon Branch Curves (Upward to Fast Exit Mule & ATM) */}
                      <path 
                        d={`M ${x_k + 120} 170 C ${x_k + 120} 105, ${x_k + 120} 65, ${x_k + 40 + 150} 65`} 
                        stroke="#DC2626" 
                        strokeWidth="2" 
                        strokeDasharray="5,4" 
                        markerEnd="url(#split-arrow-red)" 
                      />
                      <path 
                        d={`M ${x_k + 40 + 150} 65 L ${x_k + 205} 65`} 
                        stroke="#DC2626" 
                        strokeWidth="2" 
                        markerEnd="url(#split-arrow-red)" 
                      />

                      {/* Siphon Tranche Amount Badge */}
                      <g transform={`translate(${x_k + 40}, 90)`}>
                        <rect width="80" height="28" rx="4" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1" />
                        <text x="40" y="12" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#DC2626">
                          ₹{(b_k.amount || 0).toLocaleString('en-IN')}
                        </text>
                        <text x="40" y="22" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#991B1B">
                          Fork {k}: Cash-Out
                        </text>
                      </g>

                      {/* Relay Line from Hub k to Hub k+1 */}
                      <path 
                        d={`M ${x_k + 165} 220 L ${next_x} 220`} 
                        stroke="#00A896" 
                        strokeWidth="2.5" 
                        markerEnd="url(#split-arrow-teal)" 
                      />
                      <g transform={`translate(${x_k + 175}, 200)`}>
                        <rect width="80" height="28" rx="4" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="1" />
                        <text x="40" y="12" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#0F766E">
                          ₹{relayAmount.toLocaleString('en-IN')}
                        </text>
                        <text x="40" y="22" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#0D9488">
                          Relay to Hop {k + 1}
                        </text>
                      </g>

                      {/* Upper Siphon Mule Node */}
                      <g transform={`translate(${x_k + 40}, 25)`}>
                        <rect width="150" height="80" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
                        <rect width="150" height="3" rx="1.5" fill="#DC2626" />
                        <text x="10" y="18" fontSize="8.5" fontWeight="700" fill="#DC2626">MULE {k} (FAST EXIT)</text>
                        <text x="10" y="34" fontSize="11" fontWeight="800" fill="#0B1F3A">{b_k.mule_city || 'Transit'} Mule</text>
                        <text x="10" y="48" fontSize="9" fill="#64748B" fontFamily="var(--font-mono)">
                          {(b_k.mule_account || 'SBIN000:***').slice(0, 16)}
                        </text>
                        <text x="10" y="66" fontSize="9.5" fontWeight="700" fill="#DC2626">
                          {b_k.status_label || 'Confirmed Cash-Out'}
                        </text>
                      </g>

                      {/* Upper Siphon Terminal ATM Node */}
                      <g transform={`translate(${x_k + 205}, 25)`}>
                        <rect width="210" height="80" rx="6" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.2" />
                        <rect width="210" height="3" rx="1.5" fill="#DC2626" />
                        <text x="10" y="18" fontSize="8.5" fontWeight="800" fill="#B91C1C">[ ❌ CASH-OUT DISPENSED ]</text>
                        <text x="10" y="34" fontSize="11" fontWeight="800" fill="#0B1F3A">
                          {(b_k.terminal_name || 'Physical ATM').slice(0, 26)}
                        </text>
                        <text x="10" y="48" fontSize="9" fontWeight="700" fill="#DC2626">
                          ₹{(b_k.amount || 0).toLocaleString('en-IN')} Physically Dispensed
                        </text>
                        <text x="10" y="66" fontSize="8" fill="#7F1D1D" fontWeight="600">
                          ⚡ {b_k.hawkes_impact?.slice(0, 36)}...
                        </text>
                      </g>

                      {/* Structuring Hub k Node */}
                      <g transform={`translate(${x_k}, 170)`}>
                        <rect width="165" height="95" rx="6" fill="#FFFFFF" stroke="#0B1F3A" strokeWidth="1.5" />
                        <rect width="165" height="4" rx="2" fill="#0B1F3A" />
                        <text x="12" y="20" fontSize="9" fontWeight="900" fill="#0B1F3A">
                          {k === 1 ? 'HOP 1: GATEWAY SPLIT' : `HOP ${k}: STRUCTURING HUB`}
                        </text>
                        <text x="12" y="38" fontSize="11.5" fontWeight="800" fill="#0B1F3A">
                          {k === 1 ? 'Primary Structuring Hub' : `Transit Relay Mule ${k}`}
                        </text>
                        <text x="12" y="54" fontSize="9" fill="#64748B" fontFamily="var(--font-mono)">
                          Account: {(b_k.mule_account || 'SBIN000:***').slice(0, 16)}
                        </text>
                        <text x="12" y="70" fontSize="8.5" fontWeight="700" fill="#DC2626">
                          ➔ Siphon: ₹{(b_k.amount || 0).toLocaleString('en-IN')}
                        </text>
                        <text x="12" y="84" fontSize="8.5" fontWeight="700" fill="#0D9488">
                          ➔ Forward: ₹{relayAmount.toLocaleString('en-IN')}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* --- Terminal Hop N & Terminal Sub-Splits --- */}
                {(() => {
                  const x_N = 230 + (N - 1) * colSpacing;
                  const x_exit = x_N + 230;
                  const b_active = branches.find(b => b.branch_id.endsWith('A')) || branches[branches.length - 2] || branches[0] || {};
                  const b_lien = branches.find(b => b.branch_id.endsWith('B')) || branches[branches.length - 1] || branches[1] || {};
                  const activeAmount = b_active.amount || 0;
                  const lienAmount = b_lien.amount || 0;
                  const hubNInflow = activeAmount + lienAmount;

                  return (
                    <g key="terminal_hop_group">
                      {/* Hub N Node */}
                      <g transform={`translate(${x_N}, 170)`}>
                        <rect width="165" height="95" rx="6" fill="#F0FDFA" stroke="#00A896" strokeWidth="1.5" />
                        <rect width="165" height="4" rx="2" fill="#00A896" />
                        <text x="12" y="20" fontSize="9" fontWeight="900" fill="#0F766E">
                          {N === 1 ? 'HOP 1: DIRECT STRUCTURING' : `HOP ${N}: TERMINAL HUB`}
                        </text>
                        <text x="12" y="38" fontSize="11.5" fontWeight="800" fill="#0B1F3A">
                          {targetCity} Mule Hub
                        </text>
                        <text x="12" y="54" fontSize="9" fill="#64748B" fontFamily="var(--font-mono)">
                          Inflow: ₹{hubNInflow.toLocaleString('en-IN')}
                        </text>
                        <text x="12" y="70" fontSize="8.5" fontWeight="700" fill={isExpired ? '#64748B' : '#B91C1C'}>
                          ➔ {isExpired ? 'Drained' : 'Active'}: ₹{activeAmount.toLocaleString('en-IN')}
                        </text>
                        <text x="12" y="84" fontSize="8.5" fontWeight="700" fill="#047857">
                          ➔ Preserved: ₹{lienAmount.toLocaleString('en-IN')}
                        </text>
                      </g>

                      {/* Sub-Fork NA (Active Runway / Drained) Paths */}
                      <path 
                        d={`M ${x_N + 165} 195 C ${x_N + 195} 195, ${x_exit - 30} 145, ${x_exit} 145`} 
                        stroke="#B91C1C" 
                        strokeWidth="3" 
                        markerEnd="url(#split-arrow-crimson)" 
                      />
                      <path 
                        d={`M ${x_exit + 155} 145 L ${x_exit + 175} 145`} 
                        stroke="#B91C1C" 
                        strokeWidth="3" 
                        strokeDasharray="6,3" 
                        markerEnd="url(#split-arrow-crimson)" 
                      />
                      <g transform={`translate(${x_N + 175}, 130)`}>
                        <rect width="78" height="28" rx="4" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1.2" />
                        <text x="39" y="12" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#B91C1C">
                          ₹{activeAmount.toLocaleString('en-IN')}
                        </text>
                        <text x="39" y="22" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#991B1B">
                          {isExpired ? 'Drained' : 'Active Runway'}
                        </text>
                      </g>

                      {/* Mule NA Account Node */}
                      <g transform={`translate(${x_exit}, 105)`}>
                        <rect width="155" height="85" rx="6" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1.5" />
                        <rect width="155" height="3" rx="1.5" fill="#DC2626" />
                        <text x="10" y="18" fontSize="8.5" fontWeight="800" fill="#DC2626">
                          {isExpired ? `MULE ${N}A (EXPIRED)` : `MULE ${N}A (IN FLIGHT)`}
                        </text>
                        <text x="10" y="34" fontSize="11" fontWeight="800" fill="#0B1F3A">{targetCity} Beneficiary</text>
                        <text x="10" y="50" fontSize="9" fill="#64748B" fontFamily="var(--font-mono)">
                          {(b_active.mule_account || details.beneficiary_account || 'HDFC000:***').slice(0, 16)}
                        </text>
                        <text x="10" y="68" fontSize="9" fontWeight="800" fill="#B91C1C">
                          {b_active.status_label || 'Active Threat Tranche'}
                        </text>
                      </g>

                      {/* Target ATM Terminal Node */}
                      <g transform={`translate(${x_exit + 175}, 105)`}>
                        <rect width="250" height="85" rx="6" fill={isExpired ? '#F8FAFC' : '#FEF2F2'} stroke={isExpired ? '#CBD5E1' : '#DC2626'} strokeWidth={isExpired ? 1.5 : 2} />
                        <rect width="250" height="4" rx="2" fill={isExpired ? '#64748B' : '#DC2626'} />
                        <text x="12" y="18" fontSize="9" fontWeight="900" fill={isExpired ? '#64748B' : '#B91C1C'}>
                          {isExpired ? '[ ⏱️ WINDOW EXPIRED TERMINAL ]' : '[ 🚨 ACTIVE INTERCEPTION TARGET ]'}
                        </text>
                        <text x="12" y="34" fontSize="11.5" fontWeight="800" fill="#0B1F3A">
                          {(b_active.terminal_name || `${targetBank} - ${targetArea}`).slice(0, 32)}
                        </text>
                        <text x="12" y="50" fontSize="9.5" fontWeight="800" fill={isExpired ? '#64748B' : '#DC2626'}>
                          ₹{activeAmount.toLocaleString('en-IN')} • {b_active.event_time || 'In Flight'}
                        </text>
                        <text x="12" y="68" fontSize="8" fontWeight="700" fill={isExpired ? '#64748B' : '#15803D'}>
                          {isExpired ? '45m Window Depleted' : `${b_active.hawkes_impact?.slice(0, 32)} • Intercept Active`}
                        </text>
                      </g>

                      {/* Sub-Fork NB (Preserved Lien) Paths */}
                      <path 
                        d={`M ${x_N + 165} 245 C ${x_N + 195} 245, ${x_exit - 30} 295, ${x_exit} 295`} 
                        stroke="#059669" 
                        strokeWidth="2.5" 
                        markerEnd="url(#split-arrow-green)" 
                      />
                      <path 
                        d={`M ${x_exit + 155} 295 L ${x_exit + 175} 295`} 
                        stroke="#059669" 
                        strokeWidth="2.5" 
                        markerEnd="url(#split-arrow-green)" 
                      />
                      <g transform={`translate(${x_N + 175}, 265)`}>
                        <rect width="78" height="28" rx="4" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="1.2" />
                        <text x="39" y="12" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#047857">
                          ₹{lienAmount.toLocaleString('en-IN')}
                        </text>
                        <text x="39" y="22" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="#065F46">
                          BNSS Lien
                        </text>
                      </g>

                      {/* Mule NB Account Node */}
                      <g transform={`translate(${x_exit}, 255)`}>
                        <rect width="155" height="85" rx="6" fill="#FFFFFF" stroke="#059669" strokeWidth="1.2" />
                        <rect width="155" height="3" rx="1.5" fill="#059669" />
                        <text x="10" y="18" fontSize="8.5" fontWeight="700" fill="#059669">MULE {N}B (HOLD WALLET)</text>
                        <text x="10" y="34" fontSize="11" fontWeight="800" fill="#0B1F3A">{targetCity} Wallet</text>
                        <text x="10" y="50" fontSize="9" fill="#64748B" fontFamily="var(--font-mono)">
                          {(b_lien.mule_account || 'BARB000:***').slice(0, 16)}
                        </text>
                        <text x="10" y="68" fontSize="9" fontWeight="700" fill="#047857">
                          Sec 106 Lien Placed
                        </text>
                      </g>

                      {/* Preserved Terminal Kiosk Node */}
                      <g transform={`translate(${x_exit + 175}, 255)`}>
                        <rect width="250" height="85" rx="6" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="1.5" />
                        <rect width="250" height="3" rx="1.5" fill="#059669" />
                        <text x="12" y="18" fontSize="9" fontWeight="800" fill="#047857">[ 🛡️ BNSS §106 LIEN ACTIVE ]</text>
                        <text x="12" y="34" fontSize="11.5" fontWeight="800" fill="#0B1F3A">
                          {(b_lien.terminal_name || 'AePS Escrow Hub').slice(0, 32)}
                        </text>
                        <text x="12" y="50" fontSize="9" fontWeight="800" fill="#047857">
                          ₹{lienAmount.toLocaleString('en-IN')} Preserved ({b_lien.event_time || 'Preserved'})
                        </text>
                        <text x="12" y="68" fontSize="8" fill="#065F46" fontWeight="600">
                          Targeted Lien: Only disputed proceeds held
                        </text>
                      </g>
                    </g>
                  );
                })()}
              </svg>
            </div>
          )
        ) : (
          /* ========================================================================= */
          /* LINEAR TRAJECTORY VIEW (DYNAMIC ACTIVE RUNWAY PATH)                       */
          /* ========================================================================= */
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
              <path d="M 200 90 L 330 90" stroke="#00A896" strokeWidth="2" strokeDasharray="5,4" markerEnd="url(#arrow)" />
              <g transform="translate(222, 69)">
                <rect width="86" height="42" rx="5" fill="#FFFFFF" stroke="#99F6E4" strokeWidth="1.5" />
                <text x="43" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#028071">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </text>
                <text x="43" y="32" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#64748B">
                  {details.channel || 'UPI'} • 1.2m
                </text>
              </g>

              <path d="M 500 90 L 630 90" stroke="#00A896" strokeWidth="2" strokeDasharray="5,4" markerEnd="url(#arrow)" />
              <g transform="translate(522, 69)">
                <rect width="86" height="42" rx="5" fill="#FFFFFF" stroke="#99F6E4" strokeWidth="1.5" />
                <text x="43" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#028071">
                  ₹{hop2Total.toLocaleString('en-IN')}
                </text>
                <text x="43" y="32" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#64748B">
                  IMPS • 2.8m
                </text>
              </g>

              <path d="M 805 90 L 935 90" stroke="#DC2626" strokeWidth="2.5" markerEnd="url(#arrow-red)" />
              <g transform="translate(817, 69)">
                <rect width="106" height="42" rx="5" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
                <text x="53" y="18" textAnchor="middle" fontSize="11" fontWeight="800" fill="#DC2626">
                  ₹{Number(b2a.amount || 0).toLocaleString('en-IN')}
                </text>
                <text x="53" y="32" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#B91C1C">
                  {b2a.event_time || 'In Flight • 3.2m'}
                </text>
              </g>

              {/* Node 1: Complainant */}
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

              {/* Node 2: Gateway Mule */}
              <g transform="translate(330, 42)">
                <rect width="170" height="96" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
                <rect width="170" height="4" rx="2" fill="#0B1F3A" />
                <text x="14" y="24" fontSize="10.5" fontWeight="700" fill="#0B1F3A">HOP 1: GATEWAY MULE</text>
                <text x="14" y="44" fontSize="13" fontWeight="800" fill="#0B1F3A">{b1.mule_city || details.victim_city || 'Pune'} Mule</text>
                <text x="14" y="62" fontSize="10.5" fill="#64748B" fontFamily="var(--font-mono)">
                  {b1.mule_account || 'SBIN000:***'}
                </text>
                <text x="14" y="82" fontSize="10.5" fontWeight="600" fill="#0B1F3A">Structuring Split</text>
              </g>

              {/* Node 3: Layering Transit Mule */}
              <g transform="translate(630, 42)">
                <rect width="175" height="96" rx="6" fill="#FFFFFF" stroke={device.is_cluster_flagged ? '#FCA5A5' : '#CBD5E1'} strokeWidth="1.2" />
                <rect width="175" height="4" rx="2" fill={device.is_cluster_flagged ? '#DC2626' : '#D97706'} />
                <text x="14" y="24" fontSize="10.5" fontWeight="700" fill={device.is_cluster_flagged ? '#DC2626' : '#D97706'}>
                  HOP 2: LAYERING RELAY
                </text>
                <text x="14" y="44" fontSize="12.5" fontWeight="800" fill="#0B1F3A">
                  {b2a.mule_city || targetCity} Mule
                </text>
                <text x="14" y="62" fontSize="10.5" fill="#64748B" fontFamily="var(--font-mono)">
                  {(b2a.mule_account || details.beneficiary_account || 'HDFC0001048:***').slice(0, 16)}
                </text>
                <text x="14" y="82" fontSize="10.5" fontWeight="700" fill={device.is_cluster_flagged ? '#B91C1C' : '#B45309'}>
                  Sub-Split: Active + Lien
                </text>
              </g>

              {/* Node 4: Target ATM */}
              <g transform="translate(935, 42)">
                <rect width="155" height="96" rx="6" fill={details.status === 'EXPIRED' ? '#F8FAFC' : '#FEF2F2'} stroke={details.status === 'EXPIRED' ? '#CBD5E1' : '#FCA5A5'} strokeWidth="1.5" />
                <rect width="155" height="4" rx="2" fill={details.status === 'EXPIRED' ? '#64748B' : '#DC2626'} />
                <text x="14" y="24" fontSize="10.5" fontWeight="800" fill={details.status === 'EXPIRED' ? '#64748B' : '#B91C1C'}>
                  {details.status === 'EXPIRED' ? 'EXPIRED TERMINAL' : 'TARGET ATM'}
                </text>
                <text x="14" y="44" fontSize="12" fontWeight="800" fill="#0B1F3A">
                  {targetBank} • {targetCity}
                </text>
                <text x="14" y="62" fontSize="10" fill="#64748B">
                  {targetArea.slice(0, 18)}
                </text>
                <text x="14" y="82" fontSize="10.5" fontWeight="700" fill={details.status === 'EXPIRED' ? '#64748B' : '#B91C1C'}>
                  {details.status === 'EXPIRED' ? '45m Window Expired' : 'Active Runway Target'}
                </text>
              </g>
            </svg>
          </div>
        )}

        {/* Interactive Tranche Cards Grid (Detailed Breakdown of Each Hierarchical Tranche) */}
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {branches.map((b) => {
            const isSelected = activeBranchId === b.branch_id;
            return (
              <div 
                key={b.branch_id}
                onClick={() => setActiveBranchId(b.branch_id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? '#FFFFFF' : '#F8FAFC',
                  border: isSelected ? `2px solid ${b.status_color}` : '1px solid var(--border-medium)',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: b.status_color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {b.hop_level === 2 && <CornerDownRight size={12} />}
                    {b.tranche_name}
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    padding: '2px 6px', 
                    borderRadius: '3px',
                    backgroundColor: b.status === 'EXTRACTED' ? '#FEE2E2' : (b.status === 'ACTIVE_THREAT' ? '#FEF2F2' : '#DCFCE7'),
                    color: b.status === 'EXTRACTED' ? '#DC2626' : (b.status === 'ACTIVE_THREAT' ? '#B91C1C' : '#15803D')
                  }}>
                    {b.status_label}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--color-navy)', fontFamily: 'var(--font-mono)' }}>
                    ₹{b.amount.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                    {b.channel} • {b.velocity_min}m hop
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div><strong>Terminal:</strong> {b.terminal_name}</div>
                  <div><strong>Mule Account:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{b.mule_account}</span></div>
                  <div style={{ fontSize: '10.5px', color: b.status_color, fontWeight: '700', marginTop: '4px' }}>
                    {b.hawkes_impact}
                  </div>
                </div>
              </div>
            );
          })}
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
