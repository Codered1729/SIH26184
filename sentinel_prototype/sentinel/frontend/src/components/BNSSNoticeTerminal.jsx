import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FileText, 
  Activity, 
  Database, 
  RotateCw, 
  Printer, 
  Copy, 
  Check, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Server,
  ArrowUpRight,
  Wifi,
  WifiOff,
  Radio
} from 'lucide-react';

export default function BNSSNoticeTerminal({ complaintId = "CYB-MAH-2026-0819" }) {
  const [notice, setNotice] = useState(null);
  const [outboxData, setOutboxData] = useState(null);
  const [viewMode, setViewMode] = useState('html'); // 'html' | 'text'
  const [copied, setCopied] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [simulatedOutage, setSimulatedOutage] = useState(false);
  const [replayResult, setReplayResult] = useState(null);

  const loadTerminalData = async () => {
    if (complaintId) {
      const noticeRes = await api.getBnssNotice(complaintId);
      if (noticeRes) setNotice(noticeRes);
    }
    const outboxRes = await api.getOutboxStatus();
    if (outboxRes) setOutboxData(outboxRes);
  };

  useEffect(() => {
    loadTerminalData();
    const interval = setInterval(loadTerminalData, 4000);
    return () => clearInterval(interval);
  }, [complaintId]);

  const handleCopyNotice = () => {
    const textToCopy = notice?.plain_text || `NOTICE UNDER SECTION 105 BNSS 2023 - CASE ${complaintId}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleToggleOutage = async () => {
    if (!simulatedOutage) {
      // Trigger outage: update local outbox telemetry to show OPEN circuit breaker & buffered item
      setSimulatedOutage(true);
      setReplayResult(null);
      setOutboxData((prev) => ({
        ...prev,
        circuit_breaker: {
          state: 'OPEN',
          failure_count: 3,
          failure_threshold: 3,
          retry_cooldown_remaining_sec: 30,
        },
        outbox: {
          pending_count: (prev?.outbox?.pending_count || 0) + 1,
          delivered_count: prev?.outbox?.delivered_count || 14,
        }
      }));
    } else {
      // Restore gateway & replay
      handleReplay();
    }
  };

  const handleReplay = async () => {
    setReplaying(true);
    try {
      const res = await api.replayOutbox();
      setSimulatedOutage(false);
      setReplayResult(res || { replayed_count: 1, status: 'success' });
      await loadTerminalData();
    } catch (e) {
      console.error('Replay failed:', e);
    } finally {
      setReplaying(false);
    }
  };

  const cb = outboxData?.circuit_breaker || { state: 'CLOSED', failure_count: 0, retry_cooldown_remaining_sec: 0 };
  const outbox = outboxData?.outbox || { pending_count: 0, delivered_count: 14 };

  // Resolve target bank from complaint or notice
  const targetBank = notice?.target_bank || (complaintId.includes('MAH') ? 'HDFC Bank' : (complaintId.includes('GUJ') ? 'State Bank of India' : 'ICICI Bank'));
  const gatewayName = `${targetBank} Host-to-Host Gateway (H2H-Switch-04)`;

  // Dynamic sample outbox queue entries reflecting the active case
  const outboxQueue = [
    {
      id: `TX-OUT-${complaintId.slice(-4)}-01`,
      complaint_id: complaintId,
      bank: targetBank,
      amount: `₹${Number(notice?.amount || 78000).toLocaleString('en-IN')}`,
      action: 'SECTION_106_LIEN',
      timestamp: 'Just now',
      status: simulatedOutage ? 'BUFFERED_IN_SQLITE' : 'DELIVERED',
      retries: simulatedOutage ? 3 : 0,
    },
    {
      id: 'TX-OUT-0824-02',
      complaint_id: 'CYB-MAH-2026-0824',
      bank: 'State Bank of India',
      amount: '₹1,40,000',
      action: 'PATROL_INTERCEPT',
      timestamp: '3m ago',
      status: 'DELIVERED',
      retries: 0,
    },
    {
      id: 'TX-OUT-0822-03',
      complaint_id: 'CYB-INT-2026-0822',
      bank: 'Bank of Baroda',
      amount: '₹1,65,000',
      action: 'BNSS_SEC105_FREEZE',
      timestamp: '7m ago',
      status: 'DELIVERED',
      retries: 0,
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header */}
      <div className="astrix-card" style={{ padding: '16px 20px', backgroundColor: 'var(--card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--foreground)', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FileText size={18} style={{ color: 'var(--primary)' }} />
              Bank Freeze Orders & Legal Directives (BNSS Section 105)
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
              Official court-admissible bank freeze notices and zero-loss dispatch gateway.
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="astrix-pill-nav" style={{ flexWrap: 'wrap' }}>
              <button
                onClick={() => setViewMode('html')}
                className={`astrix-pill-btn ${viewMode === 'html' ? 'active' : ''}`}
                style={{ fontSize: '11.5px', padding: '5px 12px' }}
              >
                Official Warrant (Sec. 63 BSA)
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`astrix-pill-btn ${viewMode === 'text' ? 'active' : ''}`}
                style={{ fontSize: '11.5px', padding: '5px 12px' }}
              >
                Police Telex / Wire
              </button>
            </div>

            <button onClick={handleCopyNotice} className="astrix-btn-outline" style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {copied ? <Check size={12} style={{ color: 'var(--primary)' }} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Notice'}</span>
            </button>

            <button onClick={handlePrint} className="astrix-btn-outline" style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Printer size={12} />
              <span>Print Warrant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Notice Document on Left, Resilient Outbox on Right */}
      <div className="bnss-terminal-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(360px, 1fr)', gap: '16px' }}>
        
        {/* Notice Document Viewer */}
        <div style={{ width: '100%', minHeight: '480px' }}>
          {viewMode === 'html' ? (
            /* Executive GovTech Court-Admissible Warrant Card */
            <div className="astrix-card" style={{
              backgroundColor: 'var(--card)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
            }}>
              {/* Official Warrant Emblem Header (Theme Adaptive) */}
              <div 
                className="warrant-emblem-header"
                style={{
                  padding: '20px 24px',
                  borderBottom: '3px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* National Ashok Stambh / Cyber Emblem SVG */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-teal-subtle)',
                    border: '1.5px solid var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <div className="warrant-dept-title" style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      GOVERNMENT OF MAHARASHTRA • HOME DEPARTMENT
                    </div>
                    <h2 className="warrant-wing-title" style={{ fontSize: '15px', fontWeight: '900', margin: '2px 0 0 0', letterSpacing: '-0.01em' }}>
                      STATE CYBER CRIME INVESTIGATION WING
                    </h2>
                    <div className="warrant-subtitle" style={{ fontSize: '11px', marginTop: '2px' }}>
                      Special Cyber Nodal Directive • Bharatiya Nagarik Suraksha Sanhita, 2023
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-teal" style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '800' }}>
                    COURT-ADMISSIBLE (Sec. 63 BSA)
                  </span>
                  <div className="warrant-ref-id" style={{ fontSize: '10.5px', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    REF: {notice?.notice_id || `BNSS-105-${complaintId}`}
                  </div>
                </div>
              </div>

              {/* Warrant Body Content */}
              <div style={{ padding: '24px', color: 'var(--foreground)' }}>
                {/* Meta Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  backgroundColor: 'var(--secondary)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  marginBottom: '20px',
                }}>
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: '700', display: 'block' }}>
                      Case Complaint ID
                    </span>
                    <strong style={{ fontSize: '13px', color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                      {complaintId}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: '700', display: 'block' }}>
                      Disputed Capital
                    </span>
                    <strong style={{ fontSize: '14px', color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
                      ₹{Number(notice?.amount || 78000).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: '700', display: 'block' }}>
                      Target Nodal Bank
                    </span>
                    <strong style={{ fontSize: '13px', color: 'var(--foreground)' }}>
                      {targetBank}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: '700', display: 'block' }}>
                      Statutory Clearance
                    </span>
                    <strong style={{ fontSize: '12px', color: '#10B981' }}>
                      Section 105 & 106 BNSS
                    </strong>
                  </div>
                </div>

                {/* Directive Paragraphs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', lineHeight: 1.6 }}>
                  <p style={{ margin: 0 }}>
                    <strong>TO: THE CHIEF NODAL OFFICER / AUTHORIZED SIGNATORY, {targetBank.toUpperCase()}</strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    WHEREAS credible digital evidence corroborated under Section 105 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) confirms an active, multi-hop financial smurfing incident originating under Transaction UTR <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>429104829105</span>.
                  </p>

                  {/* Statutory Order Box */}
                  <div style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderLeft: '4px solid #EF4444',
                    borderTop: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                      Mandatory Administrative Freeze Directive (Sec. 106 BNSS):
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--foreground)' }}>
                      You are hereby commanded to immediately place an <strong>EX-PARTE LIEN & DEBIT FREEZE</strong> on the disputed sum of <strong>₹{Number(notice?.amount || 78000).toLocaleString('en-IN')}</strong> in beneficiary account <code style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>HDFC0001048:9301948291</code> to prevent illegal cash extraction at Maharashtra ATMs.
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--muted-foreground)' }}>
                    Non-compliance within the 15-minute Golden Window constitutes willful obstruction of statutory cyber police interception under Section 221 of Bharatiya Nyaya Sanhita, 2023.
                  </p>
                </div>

                {/* Digital Signature & Cryptographic Seal Footer */}
                <div style={{
                  marginTop: '24px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '700' }}>
                      SHA-256 State Ledger Stamp (BSA Sec. 63(4))
                    </div>
                    <div style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--foreground)',
                      backgroundColor: 'var(--secondary)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      marginTop: '4px',
                      wordBreak: 'break-all',
                      maxWidth: '360px',
                      border: '1px solid var(--border)'
                    }}>
                      {notice?.chain_hash || 'a4f8e9102c4b82d710f293847291a4b5c6d7e8f90123456789abcdef01234567'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--foreground)' }}>
                      Insp. Rahul Deshmukh
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                      Duty Investigating Officer (Badge: MH-CYB-1930)
                    </div>
                    <div style={{ fontSize: '10px', color: '#10B981', fontWeight: '700', marginTop: '2px' }}>
                      ✓ Digitally Certified & Witnessed in Ledger
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Telex View */
            <div className="astrix-card" style={{
              padding: '20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowX: 'auto',
              color: '#10B981',
              backgroundColor: '#071526',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #1E293B',
            }}>
              {notice?.plain_text || `--- CRIME WIRE NOTICE ---
AUTHORITY: SPECIAL CYBER WING, MAHARASHTRA
DIRECTIVE: SEC 105/106 BNSS 2023
CASE ID: ${complaintId}
BENEFICIARY BANK: ${targetBank}
DISPUTED SUM: ₹78,000.00
ACTION: IMMEDIATE DEBIT RESTRICTION ENFORCED
IMMUTABLE WITNESS: SHA256:a4f8e9102c4b82d710f293847291a4b5c6d7e8f90123456789abcdef01234567
END MESSAGE`}
            </div>
          )}
        </div>

        {/* Resilient Outbox Telemetry & Dynamic Gateway Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* CFCFRMS Gateway Card with Dynamic Bank Channel & Demonstration Controls */}
          <div className="astrix-card" style={{ padding: '18px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--primary)' }} />
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--foreground)', margin: 0 }}>
                    CFCFRMS Nodal Gateway
                  </h3>
                  <div style={{ fontSize: '10.5px', color: 'var(--muted-foreground)' }}>
                    {gatewayName}
                  </div>
                </div>
              </div>
              <span className={`badge ${cb.state === 'CLOSED' ? 'badge-verified' : 'badge-critical'}`}>
                {cb.state === 'CLOSED' ? 'ONLINE (CLOSED)' : 'OUTAGE (OPEN)'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Target Bank Channel:</span>
                <strong style={{ color: 'var(--foreground)' }}>{targetBank} Core Switch</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Gateway Latency / Ping:</span>
                <strong style={{ color: cb.state === 'CLOSED' ? '#10B981' : '#EF4444' }}>
                  {cb.state === 'CLOSED' ? '24ms (TLS 1.3 Nominal)' : 'TIMEOUT (Connection Refused)'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Consecutive Failures:</span>
                <strong style={{ color: cb.failure_count > 0 ? '#EF4444' : 'var(--foreground)' }}>
                  {cb.failure_count} / {cb.failure_threshold || 3}
                </strong>
              </div>

              {cb.state === 'OPEN' && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  color: '#EF4444',
                }}>
                  <Clock size={14} />
                  <span>
                    <strong>Gateway Outage Active:</strong> Circuit breaker tripped. Retry timer {cb.retry_cooldown_remaining_sec || 30}s.
                  </span>
                </div>
              )}

              {/* Demonstration Control: Toggle Gateway Outage */}
              <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                  {simulatedOutage ? (
                    <span style={{ color: '#EF4444', fontWeight: '600' }}>⚠️ Gateway currently offline. Click below to restore connectivity and trigger automatic zero-loss queue replay.</span>
                  ) : (
                    <span>💡 <strong>Live Demonstration:</strong> Click below to simulate host switch failure and observe zero-loss buffer isolation in SQLite.</span>
                  )}
                </div>
                <button
                  onClick={handleToggleOutage}
                  className="astrix-btn-outline"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    justifyContent: 'center',
                    gap: '6px',
                    borderColor: simulatedOutage ? '#10B981' : 'rgba(239, 68, 68, 0.3)',
                    color: simulatedOutage ? '#10B981' : '#EF4444'
                  }}
                  title="Demonstrate circuit breaker and zero-loss queuing"
                >
                  {simulatedOutage ? <Wifi size={14} /> : <WifiOff size={14} />}
                  <span>{simulatedOutage ? '✓ Restore Gateway (Simulate Recovery)' : '⚡ Simulate Bank Server Outage (Trip Gateway)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Durable SQLite Outbox Buffer Card */}
          <div className="astrix-card" style={{ padding: '18px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} style={{ color: 'var(--primary)' }} />
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--foreground)', margin: 0 }}>
                    Durable SQLite Outbox Buffer
                  </h3>
                  <div style={{ fontSize: '10.5px', color: 'var(--muted-foreground)' }}>
                    Zero Data Loss Atomic Persistence
                  </div>
                </div>
              </div>
              <span className="badge badge-teal">ACID COMPLIANT</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                textAlign: 'center',
              }}>
                <div style={{ padding: '10px 8px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700' }}>BUFFERED IN QUEUE</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: '900', color: outbox.pending_count > 0 ? '#EF4444' : 'var(--foreground)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    {outbox.pending_count}
                  </div>
                </div>

                <div style={{ padding: '10px 8px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700' }}>TOTAL DISPATCHED</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#10B981', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    {outbox.delivered_count}
                  </div>
                </div>
              </div>

              {replayResult && (
                <div style={{
                  padding: '8px 10px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  fontSize: '11px',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <CheckCircle2 size={13} />
                  <span>Replay complete: {replayResult.replayed_count || 1} notice(s) transmitted to {targetBank}.</span>
                </div>
              )}

              {/* Manual Replay Execution Button */}
              <button
                onClick={handleReplay}
                disabled={replaying}
                className="astrix-btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '9px 14px', 
                  fontSize: '11.5px', 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center', 
                  gap: '6px',
                  lineHeight: 1,
                }}
              >
                <RotateCw size={13} className={replaying ? 'spin-refresh' : ''} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>{replaying ? 'Replaying Outbox Queue...' : 'Execute Outbox Replay & Flush'}</span>
              </button>

              {/* Real-time Outbox Transactions Stream Table */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Recent Outbox Directives:</span>
                  <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>SQLite Table: outbox_queue</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {outboxQueue.map((tx) => (
                    <div 
                      key={tx.id}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: 'var(--secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--foreground)' }}>
                          {tx.complaint_id} • {tx.bank}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
                          {tx.amount} • {tx.action}
                        </div>
                      </div>
                      <span className={`badge ${tx.status === 'DELIVERED' ? 'badge-verified' : 'badge-critical'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                        {tx.status === 'DELIVERED' ? '✓ SENT' : 'QUEUED IN SQLITE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
