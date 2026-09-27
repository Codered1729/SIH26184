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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Header */}
      <div className="card" style={{ padding: '12px 16px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={18} color="var(--color-teal)" />
              Section 105 BNSS Preservation Notice & Outbox
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '11.5px', marginTop: '1px' }}>
              Court-admissible statutory freeze directive (BNSS §105) & zero-loss dispatch gateway.
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
            }}>
              <button
                onClick={() => setViewMode('html')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '2px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'html' ? 'var(--color-navy)' : 'transparent',
                  color: viewMode === 'html' ? '#FFFFFF' : 'var(--color-muted)',
                }}
              >
                Court Notice (Sec. 63 BSA)
              </button>
              <button
                onClick={() => setViewMode('text')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '2px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'text' ? 'var(--color-navy)' : 'transparent',
                  color: viewMode === 'text' ? '#FFFFFF' : 'var(--color-muted)',
                }}
              >
                Wireless Message / Telex
              </button>
            </div>

            <button onClick={handleCopyNotice} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '11.5px' }}>
              {copied ? <Check size={12} color="var(--color-teal)" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button onClick={handlePrint} className="btn btn-navy" style={{ padding: '5px 10px', fontSize: '11.5px' }}>
              <Printer size={12} />
              <span>Print Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Notice Document on Left (Full Width), Resilient Outbox on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '14px', alignItems: 'start' }}>
        {/* Notice Document Viewer - Full Widescreen Width */}
        <div style={{ width: '100%', minHeight: '480px' }}>
          {viewMode === 'html' ? (
            notice ? (
              <div 
                dangerouslySetInnerHTML={{ __html: notice.html_content }}
                style={{ width: '100%' }}
              />
            ) : (
              <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--color-muted)', backgroundColor: '#FFFFFF' }}>
                Loading Section 105 BNSS Directive...
              </div>
            )
          ) : (
            <div className="card" style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              color: 'var(--color-navy)',
            }}>
              {notice?.plain_text || 'Loading Plain-Text Telex Notice...'}
            </div>
          )}
        </div>

        {/* Resilient Outbox Telemetry & Circuit Breaker Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Circuit Breaker Status Card */}
          <div className="card" style={{ padding: '14px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} color="var(--color-navy)" />
                <h3 style={{ fontSize: '13px', color: 'var(--color-navy)' }}>
                  CFCFRMS Gateway
                </h3>
              </div>
              <span className={`badge ${cb.state === 'CLOSED' ? 'badge-verified' : (cb.state === 'HALF_OPEN' ? 'badge-elevated' : 'badge-critical')}`}>
                {cb.state === 'CLOSED' ? 'NORMAL (CLOSED)' : (cb.state === 'HALF_OPEN' ? 'PROBING (HALF-OPEN)' : 'OUTAGE (OPEN)')}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', padding: '3px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--color-muted)' }}>Failure Count:</span>
                <strong>{cb.failure_count} / {cb.failure_threshold || 3}</strong>
              </div>

              {cb.state === 'OPEN' && (
                <div style={{
                  padding: '6px 8px',
                  backgroundColor: '#FEF2F2',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#B91C1C',
                }}>
                  <Clock size={13} />
                  <span>
                    <strong>Retry Cooldown:</strong> {cb.retry_cooldown_remaining_sec || 25}s remaining
                  </span>
                </div>
              )}

              <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="indicator-dot dot-teal" style={{ width: '6px', height: '6px' }}></span>
                <span>Auto-queuing to SQLite buffer during gateway drop</span>
              </div>
            </div>
          </div>

          {/* Durable Outbox Queue Monitor */}
          <div className="card" style={{ padding: '14px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={16} color="var(--color-teal)" />
                <h3 style={{ fontSize: '13px', color: 'var(--color-navy)' }}>
                  Durable SQLite Outbox Buffer
                </h3>
              </div>
              <span className="badge badge-teal">DURABLE QUEUE</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                textAlign: 'center',
              }}>
                <div style={{ padding: '8px 6px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: '700' }}>BUFFERED ALERTS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: outbox.pending_count > 0 ? '#D97706' : 'var(--color-navy)', marginTop: '1px' }}>
                    {outbox.pending_count}
                  </div>
                </div>

                <div style={{ padding: '8px 6px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: '700' }}>TOTAL DELIVERED</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#15803D', marginTop: '1px' }}>
                    {outbox.delivered_count}
                  </div>
                </div>
              </div>

              {replayResult && (
                <div style={{
                  padding: '6px 10px',
                  backgroundColor: '#F0FDF4',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #86EFAC',
                  fontSize: '11px',
                  color: '#15803D',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}>
                  <CheckCircle2 size={13} />
                  <span>Replay complete: {replayResult.replayed_count} notices transmitted to nodal banks.</span>
                </div>
              )}

              {/* Manual Replay Button */}
              <button
                onClick={handleReplay}
                disabled={replaying}
                className="btn btn-navy"
                style={{ width: '100%', padding: '7px', fontSize: '11.5px', marginTop: '2px' }}
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
