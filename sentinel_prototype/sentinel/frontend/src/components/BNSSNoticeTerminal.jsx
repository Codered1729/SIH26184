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
  CheckCircle2
} from 'lucide-react';

export default function BNSSNoticeTerminal({ complaintId = "CYB-MAH-2026-0819" }) {
  const [notice, setNotice] = useState(null);
  const [outboxData, setOutboxData] = useState(null);
  const [viewMode, setViewMode] = useState('html');
  const [copied, setCopied] = useState(false);
  const [replaying, setReplaying] = useState(false);
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
    if (notice?.plain_text) {
      navigator.clipboard.writeText(notice.plain_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReplay = async () => {
    setReplaying(true);
    try {
      const res = await api.replayOutbox();
      setReplayResult(res);
      await loadTerminalData();
    } finally {
      setReplaying(false);
    }
  };

  const cb = outboxData?.circuit_breaker || { state: 'CLOSED', failure_count: 0, retry_cooldown_remaining_sec: 0 };
  const outbox = outboxData?.outbox || { pending_count: 0, delivered_count: 14 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header */}
      <div className="astrix-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--foreground)', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FileText size={18} style={{ color: 'var(--primary)' }} />
              Complaint Notice Ledger & Outbox Directives
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
              Court-admissible statutory freeze directives & zero-loss dispatch gateway.
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="astrix-pill-nav">
              <button
                onClick={() => setViewMode('html')}
                className={`astrix-pill-btn ${viewMode === 'html' ? 'active' : ''}`}
                style={{ fontSize: '11.5px', padding: '5px 12px' }}
              >
                Court Notice (Sec. 63 BSA)
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`astrix-pill-btn ${viewMode === 'text' ? 'active' : ''}`}
                style={{ fontSize: '11.5px', padding: '5px 12px' }}
              >
                Wireless Message / Telex
              </button>
            </div>

            <button onClick={handleCopyNotice} className="astrix-btn-outline" style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {copied ? <Check size={12} style={{ color: 'var(--primary)' }} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button onClick={handlePrint} className="astrix-btn-outline" style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Printer size={12} />
              <span>Print Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Notice Document on Left, Resilient Outbox on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '16px', alignItems: 'start' }}>
        {/* Notice Document Viewer */}
        <div style={{ width: '100%', minHeight: '480px' }}>
          {viewMode === 'html' ? (
            notice ? (
              <div 
                className="astrix-card"
                dangerouslySetInnerHTML={{ __html: notice.html_content }}
                style={{ width: '100%', overflow: 'hidden' }}
              />
            ) : (
              <div className="astrix-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                Loading Complaint Notice Directive...
              </div>
            )
          ) : (
            <div className="astrix-card" style={{
              padding: '18px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              color: 'var(--foreground)',
              backgroundColor: 'var(--secondary)',
            }}>
              {notice?.plain_text || 'Loading Plain-Text Telex Notice...'}
            </div>
          )}
        </div>

        {/* Resilient Outbox Telemetry & Circuit Breaker Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Circuit Breaker Status Card */}
          <div className="astrix-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>
                  CFCFRMS Gateway
                </h3>
              </div>
              <span className={`badge ${cb.state === 'CLOSED' ? 'badge-verified' : (cb.state === 'HALF_OPEN' ? 'badge-elevated' : 'badge-critical')}`}>
                {cb.state === 'CLOSED' ? 'NORMAL (CLOSED)' : (cb.state === 'HALF_OPEN' ? 'PROBING (HALF-OPEN)' : 'OUTAGE (OPEN)')}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Failure Count:</span>
                <strong style={{ color: 'var(--foreground)' }}>{cb.failure_count} / {cb.failure_threshold || 3}</strong>
              </div>

              {cb.state === 'OPEN' && (
                <div style={{
                  padding: '8px 10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#ef4444',
                }}>
                  <Clock size={13} />
                  <span>
                    <strong>Retry Cooldown:</strong> {cb.retry_cooldown_remaining_sec || 25}s remaining
                  </span>
                </div>
              )}

              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="indicator-dot dot-teal" style={{ width: '6px', height: '6px' }}></span>
                <span>Auto-queuing to SQLite buffer during gateway drop</span>
              </div>
            </div>
          </div>

          {/* Durable Outbox Queue Monitor */}
          <div className="astrix-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={16} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>
                  Durable SQLite Outbox Buffer
                </h3>
              </div>
              <span className="badge badge-teal">DURABLE QUEUE</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                textAlign: 'center',
              }}>
                <div style={{ padding: '10px 8px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700' }}>BUFFERED ALERTS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: outbox.pending_count > 0 ? '#d97706' : 'var(--foreground)', marginTop: '2px' }}>
                    {outbox.pending_count}
                  </div>
                </div>

                <div style={{ padding: '10px 8px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700' }}>TOTAL DELIVERED</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#16a34a', marginTop: '2px' }}>
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
                  <span>Replay complete: {replayResult.replayed_count} notices transmitted to nodal banks.</span>
                </div>
              )}

              {/* Manual Replay Button */}
              <button
                onClick={handleReplay}
                disabled={replaying}
                className="astrix-btn-primary"
                style={{ width: '100%', padding: '9px', fontSize: '11.5px', marginTop: '4px', justifyContent: 'center' }}
              >
                <RotateCw size={12} className={replaying ? 'spin' : ''} />
                <span>{replaying ? 'Replaying Buffer...' : 'Execute Manual Outbox Replay'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
