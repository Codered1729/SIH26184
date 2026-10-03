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
  
  // Compute N cleanly based on metadata or branches
  const rawN = multiSplit.hop_depth ?? details.hop_depth;
  const N = Math.max(1, Number(rawN != null ? rawN : (branches.length > 2 ? branches.length - 1 : 1)));
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

  // Generous column spacing to guarantee zero card overlap
  const colSpacing = 420;
  const x_N = 220 + (N - 1) * colSpacing;
  const x_exit = x_N + 320;
  const svgWidth = Math.max(1520, x_exit + 560);

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
      <div className="card astrix-card" style={{ padding: '20px 24px', backgroundColor: 'var(--card)' }}>
        
        {/* Header Bar with View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
              <GitFork size={20} style={{ color: 'var(--primary)' }} />
              Hierarchical Money Flow Subgraph (Layered Smurfing)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
              Real-world syndicates split funds into immediate cash-out and secondary transit, then sub-split again across terminals.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Mode Toggle Controls */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px',
              border: '1px solid var(--border)'
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
                  backgroundColor: viewMode === 'multi_split' ? 'var(--card)' : 'transparent',
                  color: viewMode === 'multi_split' ? 'var(--foreground)' : 'var(--muted-foreground)',
                  boxShadow: viewMode === 'multi_split' ? 'var(--shadow-xs)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <GitFork size={13} style={{ color: viewMode === 'multi_split' ? 'var(--primary)' : 'var(--muted-foreground)' }} />
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
                  backgroundColor: viewMode === 'linear' ? 'var(--card)' : 'transparent',
                  color: viewMode === 'linear' ? 'var(--foreground)' : 'var(--muted-foreground)',
                  boxShadow: viewMode === 'linear' ? 'var(--shadow-xs)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <ArrowRight size={13} style={{ color: viewMode === 'linear' ? 'var(--primary)' : 'var(--muted-foreground)' }} />
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
          backgroundColor: 'var(--secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          padding: '14px 18px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Disputed Capital Conservation:
              </span>
              <span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                ({isDuplicate ? 'Blocked at Gateway - Zero Mule Outflow' : `${N} ${N === 1 ? 'Hop (Direct)' : 'Layering Hops'} • ${branches.length} Structured Tranches`})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11.5px', flexWrap: 'wrap' }}>
              {isDuplicate ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#64748B' }}></span>
                  <span style={{ color: 'var(--muted-foreground)' }}>Intake Blocked:</span>
                  <span style={{ fontWeight: '800', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: totalExtracted === 0 ? '#10B981' : '#DC2626' }}></span>
                    <span style={{ color: 'var(--muted-foreground)' }}>Cashed-Out / Extracted:</span>
                    <span style={{ fontWeight: '800', color: totalExtracted === 0 ? '#059669' : '#DC2626', fontFamily: 'var(--font-mono)' }}>
                      ₹{totalExtracted.toLocaleString('en-IN')} {totalExtracted === 0 && <span style={{ fontSize: '10px', fontWeight: '700', color: '#059669' }}>(0% — Zero Cashout)</span>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#B91C1C' }}></span>
                    <span style={{ color: 'var(--muted-foreground)' }}>Active Threat (In Flight):</span>
                    <span style={{ fontWeight: '800', color: '#B91C1C', fontFamily: 'var(--font-mono)' }}>
                      ₹{totalActiveThreat.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#059669' }}></span>
                    <span style={{ color: 'var(--muted-foreground)' }}>BNSS Sec. 106 Preserved Lien:</span>
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
            backgroundColor: 'var(--card)',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex',
            border: '1px solid var(--border)'
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
              backgroundColor: 'var(--background)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
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
                  <rect width="120" height="24" rx="4" className="svg-node-card" style={{ fill: 'var(--card)', stroke: 'var(--border)' }} strokeWidth="1" />
                  <text x="60" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--muted-foreground)">Ingestion Audit</text>
                </g>

                {/* Node 1: Origin Complainant */}
                <g transform="translate(50, 55)">
                  <rect width="170" height="110" rx="8" className="svg-node-card" style={{ fill: 'var(--card)', stroke: 'var(--border)' }} strokeWidth="1.5" />
                  <rect width="170" height="4" rx="2" fill="#2563EB" />
                  <text x="14" y="24" fontSize="10" fontWeight="700" fill="#3B82F6">ORIGIN COMPLAINANT</text>
                  <text x="14" y="46" fontSize="13" fontWeight="800" fill="var(--foreground)">{details.victim_city || 'Mumbai'}</text>
                  <text x="14" y="66" fontSize="10" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                    {(details.victim_account || 'SBIN0001928:***').slice(0, 18)}
                  </text>
                  <text x="14" y="86" fontSize="12" fontWeight="800" fill="var(--foreground)" fontFamily="var(--font-mono)">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </text>
                  <text x="14" y="102" fontSize="9.5" fontWeight="600" fill="#EF4444">Duplicate UTR Submitted</text>
                </g>

                {/* Node 2: Ingestion Gate Freeze */}
                <g transform="translate(420, 45)">
                  <rect width="470" height="130" rx="8" fill="rgba(239, 68, 68, 0.08)" stroke="#EF4444" strokeWidth="2" />
                  <rect width="470" height="5" rx="2.5" fill="#DC2626" />
                  <text x="18" y="28" fontSize="11" fontWeight="900" fill="#EF4444">
                    ⛔ INGESTION HARD-FAIL: DUPLICATE UTR ATTESTATION GATE
                  </text>
                  <text x="18" y="52" fontSize="13.5" fontWeight="800" fill="var(--foreground)">
                    RBI Central Switch • Immediate Audit Freeze
                  </text>
                  <text x="18" y="74" fontSize="11" fill="var(--muted-foreground)">
                    UTR {details.utr || '429104829102'} already indexed in ledger. Zero mule outflows authorized.
                  </text>
                  <text x="18" y="96" fontSize="11" fontWeight="800" fill="#EF4444" fontFamily="var(--font-mono)">
                    Held Under Section 105 BNSS Pre-Interception Statutory Screen
                  </text>
                  <text x="18" y="116" fontSize="10" fontWeight="700" fill="#10B981">
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
              backgroundColor: 'var(--background)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
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
                <text x="25" y="20" fontSize="10.5" fontWeight="800" fill="var(--muted-foreground)" letterSpacing="0.05em">LEVEL 0: INGESTION</text>
                {Array.from({ length: N }).map((_, idx) => (
                  <text 
                    key={idx} 
                    x={220 + idx * colSpacing} 
                    y="20" 
                    fontSize="10.5" 
                    fontWeight="800" 
                    fill="var(--muted-foreground)" 
                    letterSpacing="0.05em"
                  >
                    HOP {idx + 1}: {idx === 0 ? 'GATEWAY SPLIT' : (idx === N - 1 ? 'TERMINAL SUB-SPLIT' : 'STRUCTURING RELAY')}
                  </text>
                ))}
                <text x={x_exit} y="20" fontSize="10.5" fontWeight="800" fill="var(--muted-foreground)" letterSpacing="0.05em">
                  FINAL EXTRACTION & PRESERVATION
                </text>

                {/* --- Origin Complainant -> Hub 1 Path --- */}
                <path d="M 180 215 L 220 215" stroke="#00A896" strokeWidth="2.5" markerEnd="url(#split-arrow-teal)" />
                <g transform="translate(182, 193)">
                  <rect width="40" height="18" rx="3" className="svg-node-card" style={{ fill: 'var(--card)', stroke: '#00A896' }} strokeWidth="1" />
                  <text x="20" y="12" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#00A896">{details.channel || 'UPI'}</text>
                </g>

                {/* Node 0: Origin Complainant */}
                <g transform="translate(20, 165)">
                  <rect width="160" height="100" rx="6" className="svg-node-card" style={{ fill: 'var(--card)', stroke: 'var(--border)' }} strokeWidth="1.2" />
                  <rect width="160" height="4" rx="2" fill="#2563EB" />
                  <text x="12" y="20" fontSize="9" fontWeight="700" fill="#3B82F6">ORIGIN COMPLAINANT</text>
                  <text x="12" y="40" fontSize="12" fontWeight="800" fill="var(--foreground)">{(details.victim_city || 'Pune').slice(0, 16)}</text>
                  <text x="12" y="58" fontSize="9.5" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                    {(details.victim_account || 'SBIN0004123:3819').slice(0, 16)}
                  </text>
                  <text x="12" y="76" fontSize="11.5" fontWeight="800" fill="var(--foreground)" fontFamily="var(--font-mono)">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </text>
                  <text x="12" y="92" fontSize="9" fontWeight="600" fill="#10B981">Verified Complainant</text>
                </g>

                {/* Intermediate Hops 1 through N-1 */}
                {Array.from({ length: N - 1 }).map((_, idx) => {
                  const k = idx + 1;
                  const x_k = 220 + (k - 1) * colSpacing;
                  const next_x = 220 + k * colSpacing;
                  const b_k = branches.find(b => b.hop_level === k && b.status === 'EXTRACTED') || branches[idx] || {};
                  const relayAmount = b_k ? Math.round(totalAmount - branches.slice(0, k).reduce((s, b) => s + (b.amount || 0), 0)) : 0;

                  return (
                    <g key={`hop_group_${k}`}>
                      {/* Siphon Branch Curves (Upward to Fast Exit Mule & ATM) */}
                      <path 
                        d={`M ${x_k + 90} 165 C ${x_k + 90} 105, ${x_k + 90} 65, ${x_k + 20 + 150} 65`} 
                        stroke="#DC2626" 
                        strokeWidth="2" 
                        strokeDasharray="5,4" 
                        markerEnd="url(#split-arrow-red)" 
                      />
                      <path 
                        d={`M ${x_k + 170} 65 L ${x_k + 185} 65`} 
                        stroke="#DC2626" 
                        strokeWidth="2" 
                        markerEnd="url(#split-arrow-red)" 
                      />

                      {/* Siphon Tranche Amount Badge */}
                      <g transform={`translate(${x_k + 40}, 90)`}>
                        <rect width="80" height="28" rx="4" fill="rgba(239, 68, 68, 0.12)" stroke="#EF4444" strokeWidth="1" />
                        <text x="40" y="12" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#EF4444">
                          ₹{(b_k.amount || 0).toLocaleString('en-IN')}
                        </text>
                        <text x="40" y="22" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#EF4444">
                          Fork {k}: Cash-Out
                        </text>
                      </g>

                      {/* Relay Line from Hub k to Hub k+1 */}
                      <path 
                        d={`M ${x_k + 165} 215 L ${next_x} 215`} 
                        stroke="#00A896" 
                        strokeWidth="2.5" 
                        markerEnd="url(#split-arrow-teal)" 
                      />
                      <g transform={`translate(${x_k + 195}, 195)`}>
                        <rect width="85" height="28" rx="4" className="svg-node-card" style={{ fill: 'var(--card)', stroke: '#00A896' }} strokeWidth="1" />
                        <text x="42.5" y="12" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#00A896">
                          ₹{relayAmount.toLocaleString('en-IN')}
                        </text>
                        <text x="42.5" y="22" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="var(--muted-foreground)">
                          Relay to Hop {k + 1}
                        </text>
                      </g>

                      {/* Upper Siphon Mule Node */}
                      <g transform={`translate(${x_k + 20}, 20)`}>
                        <rect width="150" height="96" rx="6" className="svg-node-card" style={{ fill: 'var(--card)', stroke: 'var(--border)' }} strokeWidth="1.2" />
                        <rect width="150" height="3" rx="1.5" fill="#DC2626" />
                        <text x="10" y="20" fontSize="8.5" fontWeight="700" fill="#EF4444">MULE {k} (FAST EXIT)</text>
                        <text x="10" y="40" fontSize="11" fontWeight="800" fill="var(--foreground)">{(b_k.mule_city || 'Transit').slice(0, 16)} Mule</text>
                        <text x="10" y="60" fontSize="9" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                          {(b_k.mule_account || 'SBIN000:***').slice(0, 18)}
                        </text>
                        <text x="10" y="80" fontSize="9.5" fontWeight="700" fill="#EF4444">
                          {(b_k.status_label || 'Confirmed Cash-Out').replace('§', 'Sec.').replace('Â', '').slice(0, 22)}
                        </text>
                      </g>

                      {/* Upper Siphon Terminal ATM Node */}
                      <g transform={`translate(${x_k + 185}, 20)`}>
                        <rect width="180" height="96" rx="6" style={{ fill: 'rgba(239, 68, 68, 0.08)', stroke: '#EF4444' }} strokeWidth="1.2" />
                        <rect width="180" height="3" rx="1.5" fill="#DC2626" />
                        <text x="10" y="20" fontSize="8.5" fontWeight="800" fill="#DC2626">[ ❌ CASH-OUT ]</text>
                        <text x="10" y="40" fontSize="10.5" fontWeight="800" fill="var(--foreground)">
                          {(b_k.terminal_name || 'Physical ATM').slice(0, 28)}
                        </text>
                        <text x="10" y="60" fontSize="9" fontWeight="700" fill="#EF4444">
                          ₹{(b_k.amount || 0).toLocaleString('en-IN')} Dispensed
                        </text>
                        <text x="10" y="80" fontSize="8" fill="var(--muted-foreground)" fontWeight="600">
                          ⚡ {(b_k.hawkes_impact || 'Excitation surge').slice(0, 28)}
                        </text>
                      </g>

                      {/* Structuring Hub k Node */}
                      <g transform={`translate(${x_k + 20}, 165)`}>
                        <rect width="165" height="100" rx="6" className="svg-node-card" style={{ fill: 'var(--card)', stroke: 'var(--border)' }} strokeWidth="1.5" />
                        <rect width="165" height="4" rx="2" fill="var(--primary)" />
                        <text x="12" y="20" fontSize="9" fontWeight="900" fill="var(--primary)">
                          {k === 1 ? 'HOP 1: GATEWAY SPLIT' : `HOP ${k}: STRUCTURING HUB`}
                        </text>
                        <text x="12" y="40" fontSize="11" fontWeight="800" fill="var(--foreground)">
                          {k === 1 ? 'Primary Structuring Hub' : `Transit Mule ${k}`}
                        </text>
                        <text x="12" y="58" fontSize="9" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                          Account: {(b_k.mule_account || 'SBIN000:***').slice(0, 18)}
                        </text>
                        <text x="12" y="76" fontSize="8.5" fontWeight="700" fill="#EF4444">
                          ➔ Siphon: ₹{(b_k.amount || 0).toLocaleString('en-IN')}
                        </text>
                        <text x="12" y="92" fontSize="8.5" fontWeight="700" fill="#00A896">
                          ➔ Forward: ₹{relayAmount.toLocaleString('en-IN')}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* --- Terminal Hop N & Terminal Sub-Splits --- */}
                {(() => {
                  const b_active = branches.find(b => b.branch_id.endsWith('A')) || branches[branches.length - 2] || branches[0] || {};
                  const b_lien = branches.find(b => b.branch_id.endsWith('B')) || branches[branches.length - 1] || branches[1] || {};
                  const activeAmount = b_active.amount || 0;
                  const lienAmount = b_lien.amount || 0;
                  const hubNInflow = activeAmount + lienAmount;

                  return (
                    <g key="terminal_hop_group">
                      {/* Hub N Node */}
                      <g transform={`translate(${x_N}, 165)`}>
                        <rect width="180" height="100" rx="6" className="svg-node-card" style={{ fill: 'var(--card)', stroke: '#00A896' }} strokeWidth="1.5" />
                        <rect width="180" height="4" rx="2" fill="#00A896" />
                        <text x="12" y="20" fontSize="9" fontWeight="900" fill="#00A896">
                          {N === 1 ? 'HOP 1: DIRECT STRUCTURING' : `HOP ${N}: TERMINAL HUB`}
                        </text>
                        <text x="12" y="40" fontSize="11.5" fontWeight="800" fill="var(--foreground)">
                          {(targetCity || 'Mule Hub')} Mule Hub
                        </text>
                        <text x="12" y="58" fontSize="9" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                          Inflow: ₹{hubNInflow.toLocaleString('en-IN')}
                        </text>
                        <text x="12" y="76" fontSize="8.5" fontWeight="700" fill={isExpired ? 'var(--muted-foreground)' : '#DC2626'}>
                          ➔ {isExpired ? 'Drained' : 'Active'}: ₹{activeAmount.toLocaleString('en-IN')}
                        </text>
                        <text x="12" y="92" fontSize="8.5" fontWeight="700" fill="#10B981">
                          ➔ Preserved: ₹{lienAmount.toLocaleString('en-IN')}
                        </text>
                      </g>

                      {/* Sub-Fork NA (Active Runway / Drained) Paths */}
                      <path 
                        d={`M ${x_N + 180} 190 C ${x_N + 235} 190, ${x_exit - 50} 147, ${x_exit} 147`} 
                        stroke="#B91C1C" 
                        strokeWidth="2.5" 
                        markerEnd="url(#split-arrow-crimson)" 
                      />
                      <g transform={`translate(${x_N + 198}, 116)`}>
                        <rect width="104" height="34" rx="5" className="svg-node-card" style={{ fill: 'var(--card)', stroke: '#EF4444' }} strokeWidth="1.5" />
                        <rect width="104" height="34" rx="5" fill="rgba(239, 68, 68, 0.12)" />
                        <text x="52" y="15" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#EF4444">
                          ₹{activeAmount.toLocaleString('en-IN')}
                        </text>
                        <text x="52" y="27" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#EF4444">
                          {isExpired ? 'Drained' : 'Active Runway'}
                        </text>
                      </g>

                      {/* Mule NA Account Node */}
                      <g transform={`translate(${x_exit}, 97)`}>
                        <rect width="190" height="100" rx="6" className="svg-node-card" style={{ fill: 'var(--card)', stroke: '#DC2626' }} strokeWidth="1.5" />
                        <rect width="190" height="3.5" rx="1.5" fill="#DC2626" />
                        <text x="14" y="22" fontSize="9.5" fontWeight="800" fill="#EF4444">
                          {isExpired ? `MULE ${N}A (EXPIRED)` : `MULE ${N}A (IN FLIGHT)`}
                        </text>
                        <text x="14" y="44" fontSize="12" fontWeight="800" fill="var(--foreground)">{(targetCity || 'Beneficiary')} Beneficiary</text>
                        <text x="14" y="64" fontSize="9.5" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                          {(b_active.mule_account || details.beneficiary_account || 'HDFC0001048:501004')}
                        </text>
                        <text x="14" y="84" fontSize="9.5" fontWeight="800" fill="#EF4444">
                          Active Interception Target
                        </text>
                      </g>

                      {/* Target ATM Terminal Node */}
                      <path 
                        d={`M ${x_exit + 190} 147 L ${x_exit + 225} 147`} 
                        stroke="#B91C1C" 
                        strokeWidth="2.5" 
                        strokeDasharray="5,3" 
                        markerEnd="url(#split-arrow-crimson)" 
                      />
                      <g transform={`translate(${x_exit + 225}, 97)`}>
                        <rect width="300" height="100" rx="6" style={{ fill: isExpired ? 'var(--secondary)' : 'rgba(239, 68, 68, 0.1)', stroke: isExpired ? 'var(--border)' : '#EF4444' }} strokeWidth={isExpired ? 1.5 : 2} />
                        <rect width="300" height="4" rx="2" fill={isExpired ? 'var(--muted-foreground)' : '#DC2626'} />
                        <text x="14" y="22" fontSize="9.5" fontWeight="900" fill={isExpired ? 'var(--muted-foreground)' : '#DC2626'}>
                          {isExpired ? '[ ⏱️ WINDOW EXPIRED ]' : '[ 🚨 ACTIVE INTERCEPTION TARGET ]'}
                        </text>
                        <text x="14" y="44" fontSize="12" fontWeight="800" fill="var(--foreground)">
                          {(b_active.terminal_name || `${targetBank} - ${targetArea}`).slice(0, 34)}
                        </text>
                        <text x="14" y="64" fontSize="10" fontWeight="800" fill={isExpired ? 'var(--muted-foreground)' : '#DC2626'}>
                          ₹{activeAmount.toLocaleString('en-IN')} • {b_active.event_time ? b_active.event_time.replace(/remaining|\(|\)/g, '').trim() : 'In Flight'}
                        </text>
                        <text x="14" y="84" fontSize="8.5" fontWeight="700" fill={isExpired ? 'var(--muted-foreground)' : '#10B981'}>
                          {isExpired ? '45m Golden Window Depleted' : `${(b_active.hawkes_impact || 'Hawkes: 0.92').slice(0, 26)} • Intercept Active`}
                        </text>
                      </g>

                      {/* Sub-Fork NB (Preserved Lien) Paths */}
                      <path 
                        d={`M ${x_N + 180} 240 C ${x_N + 235} 240, ${x_exit - 50} 295, ${x_exit} 295`} 
                        stroke="#059669" 
                        strokeWidth="2.5" 
                        markerEnd="url(#split-arrow-green)" 
                      />
                      <g transform={`translate(${x_N + 198}, 264)`}>
                        <rect width="104" height="34" rx="5" className="svg-node-card" style={{ fill: 'var(--card)', stroke: '#10B981' }} strokeWidth="1.5" />
                        <rect width="104" height="34" rx="5" fill="rgba(16, 185, 129, 0.12)" />
                        <text x="52" y="15" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#10B981">
                          ₹{lienAmount.toLocaleString('en-IN')}
                        </text>
                        <text x="52" y="27" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#10B981">
                          BNSS Sec. 106 Lien
                        </text>
                      </g>

                      {/* Mule NB Account Node */}
                      <g transform={`translate(${x_exit}, 245)`}>
                        <rect width="190" height="100" rx="6" className="svg-node-card" style={{ fill: 'var(--card)', stroke: '#059669' }} strokeWidth="1.5" />
                        <rect width="190" height="3.5" rx="1.5" fill="#059669" />
                        <text x="14" y="22" fontSize="9.5" fontWeight="700" fill="#10B981">MULE {N}B (HOLD WALLET)</text>
                        <text x="14" y="44" fontSize="12" fontWeight="800" fill="var(--foreground)">{(targetCity || 'Hold')} Wallet</text>
                        <text x="14" y="64" fontSize="9.5" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                          {(b_lien.mule_account || 'BARB000256:4672988')}
                        </text>
                        <text x="14" y="84" fontSize="9.5" fontWeight="700" fill="#10B981">
                          Sec. 106 Lien Placed
                        </text>
                      </g>

                      {/* Preserved Terminal ATM Node */}
                      <path 
                        d={`M ${x_exit + 190} 295 L ${x_exit + 225} 295`} 
                        stroke="#059669" 
                        strokeWidth="2.5" 
                        markerEnd="url(#split-arrow-green)" 
                      />
                      <g transform={`translate(${x_exit + 225}, 245)`}>
                        <rect width="300" height="100" rx="6" style={{ fill: 'rgba(16, 185, 129, 0.08)', stroke: '#10B981' }} strokeWidth="1.5" />
                        <rect width="300" height="3.5" rx="1.5" fill="#059669" />
                        <text x="14" y="22" fontSize="9.5" fontWeight="800" fill="#10B981">[ 🛡️ BNSS SEC. 106 LIEN ACTIVE ]</text>
                        <text x="14" y="44" fontSize="12" fontWeight="800" fill="var(--foreground)">
                          {(b_lien.terminal_name || 'AePS Escrow ATM Hub').slice(0, 34)}
                        </text>
                        <text x="14" y="64" fontSize="10" fontWeight="800" fill="#10B981">
                          ₹{lienAmount.toLocaleString('en-IN')} Preserved ({b_lien.event_time || 'Preserved'})
                        </text>
                        <text x="14" y="84" fontSize="8.5" fill="var(--muted-foreground)" fontWeight="600">
                          Targeted Lien: Disputed capital held
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
            backgroundColor: 'var(--background)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            padding: '24px 16px',
            marginBottom: '20px',
          }}>
            <svg viewBox="0 0 1140 210" role="img" aria-label="Funds Flow and Beneficiary Layering Path Diagram" style={{ width: '100%', minWidth: '920px', height: '210px' }}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#00A896" />
                </marker>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#DC2626" />
                </marker>
              </defs>

              {/* Connecting Edges with Velocity Annotations (Segmented to never cross badge boxes) */}
              {/* Complainant -> Hop 1 Gateway Mule */}
              <path d="M 185 100 L 202 100" stroke="#00A896" strokeWidth="2.5" strokeDasharray="5,4" />
              <g transform="translate(202, 76)">
                <rect width="100" height="48" rx="6" className="svg-node-card" style={{ fill: 'var(--card)', stroke: '#00A896' }} strokeWidth="1.5" />
                <text x="50" y="20" textAnchor="middle" fontSize="11" fontWeight="700" fill="#00A896">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </text>
                <text x="50" y="35" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="var(--muted-foreground)">
                  {details.channel || 'UPI'} • 1.2m
                </text>
              </g>
              <path d="M 302 100 L 320 100" stroke="#00A896" strokeWidth="2.5" markerEnd="url(#arrow)" />

              {/* Hop 1 Gateway Mule -> Hop 2 Layering Relay */}
              <path d="M 485 100 L 502 100" stroke="#00A896" strokeWidth="2.5" strokeDasharray="5,4" />
              <g transform="translate(502, 76)">
                <rect width="100" height="48" rx="6" className="svg-node-card" style={{ fill: 'var(--card)', stroke: '#00A896' }} strokeWidth="1.5" />
                <text x="50" y="20" textAnchor="middle" fontSize="11" fontWeight="700" fill="#00A896">
                  ₹{hop2Total.toLocaleString('en-IN')}
                </text>
                <text x="50" y="35" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="var(--muted-foreground)">
                  IMPS • 2.8m
                </text>
              </g>
              <path d="M 602 100 L 620 100" stroke="#00A896" strokeWidth="2.5" markerEnd="url(#arrow)" />

              {/* Hop 2 Layering Relay -> Target ATM (Active In Flight) */}
              <path d="M 795 100 L 812 100" stroke="#DC2626" strokeWidth="2.5" />
              <g transform="translate(812, 76)">
                <rect width="106" height="48" rx="6" style={{ fill: 'var(--card)' }} stroke="#EF4444" strokeWidth="1.5" />
                <rect width="106" height="48" rx="6" fill="rgba(239, 68, 68, 0.12)" />
                <text x="53" y="20" textAnchor="middle" fontSize="11" fontWeight="800" fill="#DC2626">
                  ₹{Number(b2a.amount || 0).toLocaleString('en-IN')}
                </text>
                <text x="53" y="35" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#DC2626">
                  In Flight
                </text>
              </g>
              <path d="M 918 100 L 930 100" stroke="#DC2626" strokeWidth="2.5" markerEnd="url(#arrow-red)" />

              {/* Node 1: Complainant */}
              <g transform="translate(20, 48)">
                <rect width="165" height="104" rx="6" className="svg-node-card" style={{ fill: 'var(--card)', stroke: 'var(--border)' }} strokeWidth="1.2" />
                <rect width="165" height="4" rx="2" fill="#2563EB" />
                <text x="14" y="22" fontSize="10" fontWeight="700" fill="#3B82F6">ORIGIN COMPLAINANT</text>
                <text x="14" y="44" fontSize="13" fontWeight="800" fill="var(--foreground)">{(details.victim_city || 'Pune').slice(0, 16)}</text>
                <text x="14" y="64" fontSize="10" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                  {(details.victim_account || 'SBIN0004123:***').slice(0, 18)}
                </text>
                <text x="14" y="86" fontSize="10" fontWeight="600" fill="#10B981">Verified Complainant</text>
              </g>

              {/* Node 2: Gateway Mule */}
              <g transform="translate(320, 48)">
                <rect width="165" height="104" rx="6" className="svg-node-card" style={{ fill: 'var(--card)', stroke: 'var(--border)' }} strokeWidth="1.2" />
                <rect width="165" height="4" rx="2" fill="var(--primary)" />
                <text x="14" y="22" fontSize="10" fontWeight="700" fill="var(--primary)">HOP 1: GATEWAY MULE</text>
                <text x="14" y="44" fontSize="13" fontWeight="800" fill="var(--foreground)">{(b1.mule_city || details.victim_city || 'Transit').slice(0, 14)} Mule</text>
                <text x="14" y="64" fontSize="10" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                  {(b1.mule_account || 'SBIN000:***').slice(0, 18)}
                </text>
                <text x="14" y="86" fontSize="10" fontWeight="600" fill="var(--foreground)">Structuring Split</text>
              </g>

              {/* Node 3: Layering Transit Mule */}
              <g transform="translate(620, 48)">
                <rect width="175" height="104" rx="6" className="svg-node-card" style={{ fill: 'var(--card)', stroke: device.is_cluster_flagged ? '#EF4444' : 'var(--border)' }} strokeWidth={1.2} />
                <rect width="175" height="4" rx="2" fill={device.is_cluster_flagged ? '#DC2626' : '#D97706'} />
                <text x="14" y="22" fontSize="10" fontWeight="700" fill={device.is_cluster_flagged ? '#EF4444' : '#D97706'}>
                  HOP 2: LAYERING RELAY
                </text>
                <text x="14" y="44" fontSize="12.5" fontWeight="800" fill="var(--foreground)">
                  {(b2a.mule_city || targetCity).slice(0, 15)} Mule
                </text>
                <text x="14" y="64" fontSize="10" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
                  {(b2a.mule_account || details.beneficiary_account || 'HDFC0001048:***').slice(0, 18)}
                </text>
                <text x="14" y="86" fontSize="10" fontWeight="700" fill={device.is_cluster_flagged ? '#EF4444' : '#D97706'}>
                  Sub-Split: Active + Lien
                </text>
              </g>

              {/* Node 4: Target ATM */}
              <g transform="translate(930, 48)">
                <rect width="190" height="104" rx="6" style={{ fill: details.status === 'EXPIRED' ? 'var(--secondary)' : 'rgba(239, 68, 68, 0.1)', stroke: details.status === 'EXPIRED' ? 'var(--border)' : '#EF4444' }} strokeWidth={1.5} />
                <rect width="190" height="4" rx="2" fill={details.status === 'EXPIRED' ? 'var(--muted-foreground)' : '#DC2626'} />
                <text x="14" y="22" fontSize="10" fontWeight="800" fill={details.status === 'EXPIRED' ? 'var(--muted-foreground)' : '#DC2626'}>
                  {details.status === 'EXPIRED' ? 'EXPIRED TERMINAL' : 'TARGET ATM'}
                </text>
                <text x="14" y="44" fontSize="12" fontWeight="800" fill="var(--foreground)">
                  {(targetBank || 'HDFC')} • {(targetCity || 'Pune')}
                </text>
                <text x="14" y="64" fontSize="10" fill="var(--muted-foreground)">
                  {(targetArea || 'Hinjawadi Phase 1').slice(0, 24)}
                </text>
                <text x="14" y="86" fontSize="10" fontWeight="700" fill={details.status === 'EXPIRED' ? 'var(--muted-foreground)' : '#DC2626'}>
                  {details.status === 'EXPIRED' ? '45m Window Expired' : 'Active Runway Target'}
                </text>
              </g>
            </svg>
          </div>
        )}

        {/* Interactive Tranche Cards Grid (Detailed Breakdown of Each Hierarchical Tranche) */}
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {branches.map((b) => {
            const isSelected = activeBranchId === b.branch_id;
            const cleanLabel = (b.status_label || '').replace('§', 'Sec.').replace('Â', '').trim();
            return (
              <div 
                key={b.branch_id}
                onClick={() => setActiveBranchId(b.branch_id)}
                className="astrix-card"
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--card)' : 'var(--secondary)',
                  border: isSelected ? `2px solid ${b.status_color || 'var(--primary)'}` : '1px solid var(--border)',
                  cursor: 'pointer',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: b.status_color || 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {b.hop_level === 2 && <CornerDownRight size={12} />}
                    {b.tranche_name}
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    backgroundColor: b.status === 'EXTRACTED' ? 'rgba(239, 68, 68, 0.15)' : (b.status === 'ACTIVE_THREAT' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                    color: b.status === 'EXTRACTED' ? '#EF4444' : (b.status === 'ACTIVE_THREAT' ? '#DC2626' : '#10B981')
                  }}>
                    {cleanLabel}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                    ₹{b.amount.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                    {b.channel} • {b.velocity_min}m hop
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong style={{ color: 'var(--foreground)' }}>Terminal:</strong> {b.terminal_name}</div>
                  <div><strong style={{ color: 'var(--foreground)' }}>Mule Account:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{b.mule_account}</span></div>
                  <div style={{ fontSize: '10.5px', color: b.status_color || 'var(--primary)', fontWeight: '700', marginTop: '4px' }}>
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
        <div className="card astrix-card" style={{ padding: '20px', backgroundColor: 'var(--card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '13.5px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <Smartphone size={16} style={{ color: 'var(--primary)' }} />
              Hardware Fingerprint & Mule Device Network
            </h4>
            {device.is_cluster_flagged ? (
              <span className="badge badge-critical">SHARED DEVICE</span>
            ) : (
              <span className="badge badge-verified">SINGLE DEVICE</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--muted-foreground)' }}>Device IMEI / Hardware ID:</span>
              <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--foreground)' }}>
                {device.imei || '864291048291021'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--muted-foreground)' }}>Associated Mule Accounts:</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: device.shared_mule_accounts > 1 ? '#EF4444' : 'var(--foreground)' }}>
                {device.shared_mule_accounts || 3} Accounts on Same Device
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--muted-foreground)' }}>Syndicate Linkage Level:</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: device.cluster_risk === 'HIGH' ? '#EF4444' : '#10B981' }}>
                {device.cluster_risk || 'HIGH'} Confidence Association
              </span>
            </div>
          </div>
        </div>

        {/* 3-Party Statutory Attestation Ledger Card */}
        <div className="card astrix-card" style={{ padding: '20px', backgroundColor: 'var(--card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '13.5px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
              Three-Tier Statutory Legal Attestation
            </h4>
            <span className="badge badge-verified">TAMPER-EVIDENT</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Attestation Step Indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ padding: '8px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: '10px', color: '#10B981', fontWeight: '700' }}>1. COMPLAINANT</div>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#10B981', marginTop: '2px' }}>VERIFIED (OTP)</div>
              </div>
              <div style={{ padding: '8px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: '10px', color: '#10B981', fontWeight: '700' }}>2. BANK NODAL</div>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#10B981', marginTop: '2px' }}>CORROBORATED</div>
              </div>
              <div style={{ padding: '8px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: '10px', color: '#10B981', fontWeight: '700' }}>3. POLICE CELL</div>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#10B981', marginTop: '2px' }}>RECORDED (BNSS)</div>
              </div>
            </div>

            {/* SHA-256 Hash Viewer */}
            <div style={{ padding: '8px 12px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', fontWeight: '600' }}>
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
                    color: 'var(--primary)',
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
                color: 'var(--foreground)',
                wordBreak: 'break-all',
                backgroundColor: 'var(--card)',
                padding: '6px 8px',
                borderRadius: '3px',
                border: '1px solid var(--border)',
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
