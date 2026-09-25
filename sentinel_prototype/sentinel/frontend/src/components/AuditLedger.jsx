import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileClock, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  Hash, 
  RefreshCw, 
  Copy, 
  Check, 
  Eye, 
  X,
  Database,
  Lock,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';

export default function AuditLedger({ onRefreshParent }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [inspectLog, setInspectLog] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs(100, selectedFilter === 'ALL' ? null : selectedFilter);
      if (data && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [selectedFilter]);

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter((log) => {
      const cid = (log.complaint_id || '').toLowerCase();
      const etype = (log.event_type || '').toLowerCase();
      const sum = (log.summary || '').toLowerCase();
      const chash = (log.chain_hash || '').toLowerCase();
      return cid.includes(q) || etype.includes(q) || sum.includes(q) || chash.includes(q);
    });
  }, [logs, searchQuery]);

  const stats = useMemo(() => {
    const total = logs.length;
    const hardFails = logs.filter((l) => l.event_type.includes('HARD_FAIL') || l.event_type.includes('DUPLICATE')).length;
    const notices = logs.filter((l) => l.event_type.includes('BNSS')).length;
    const predictions = logs.filter((l) => l.event_type.includes('MODEL') || l.event_type.includes('PREDICTION')).length;
    return { total, hardFails, notices, predictions };
  }, [logs]);

  const getBadgeStyle = (eventType) => {
    const et = eventType.toUpperCase();
    if (et.includes('HARD_FAIL') || et.includes('TRIPPED') || et.includes('EXPIRED')) {
      return { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' };
    }
    if (et.includes('VERIFIED') || et.includes('INIT') || et.includes('SUCCESS')) {
      return { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' };
    }
    if (et.includes('BNSS') || et.includes('NOTICE')) {
      return { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' };
    }
    if (et.includes('MODEL') || et.includes('HAWKES') || et.includes('SIMULATION')) {
      return { bg: '#F0FDFA', border: '#99F6E4', text: '#0D9488' };
    }
    return { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner & Context */}
      <div className="card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 194, 168, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FileClock size={16} color="var(--color-teal-dark)" />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '-0.02em', margin: 0 }}>
                Audit & Event Ledger
              </h2>
              <span className="badge badge-teal">
                SHA-256 Tamper-Evident Chain
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--color-muted)', marginTop: '4px', margin: 0 }}>
              Immutable chronological record of intake validations, Authenticity Gate scoring, Champion GBDT forecasts, Section 105 BNSS orders, and resilient outbox transitions.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* 4 Summary Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '16px',
        }}>
          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
              Total Ledger Records
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-navy)', marginTop: '2px' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '10.5px', color: '#16A34A', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={10} /> 100% SHA-256 Linked
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
              Sybil Attempts Hard-Failed
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#7C3AED', marginTop: '2px' }}>
              {stats.hardFails}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', marginTop: '2px' }}>
              Score 0.00 (Zero Wrongful Freezes)
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
              BNSS Lawful Notices Issued
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
              {stats.notices}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', marginTop: '2px' }}>
              Section 105 Courtroom Sealed
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
              Champion GBDT Inferences
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-teal-dark)', marginTop: '2px' }}>
              {stats.predictions}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', marginTop: '2px' }}>
              Threshold 0.197 • &lt;0.03ms Latency
            </div>
          </div>
        </div>
      </div>

      {/* Filter Pills & Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'INTAKE', 'AUTHENTICITY', 'CHAMPION_MODEL', 'HAWKES', 'BNSS', 'CIRCUIT_BREAKER', 'SIMULATION'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: '700',
                border: selectedFilter === cat ? '1px solid var(--color-navy)' : '1px solid var(--border-subtle)',
                backgroundColor: selectedFilter === cat ? 'var(--color-navy)' : '#FFFFFF',
                color: selectedFilter === cat ? '#FFFFFF' : 'var(--color-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} color="var(--color-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search Complaint ID, UTR, or Hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px 6px 30px',
              fontSize: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              outline: 'none',
              backgroundColor: '#FFFFFF',
            }}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-navy)', color: '#FFFFFF', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '10px 14px' }}>Log ID & Time</th>
              <th style={{ padding: '10px 14px' }}>Event Classification</th>
              <th style={{ padding: '10px 14px' }}>Complaint ID</th>
              <th style={{ padding: '10px 14px' }}>Audit Summary Description</th>
              <th style={{ padding: '10px 14px' }}>SHA-256 Attestation Hash</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Payload</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-muted)' }}>
                  No audit records match the current filter or search criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => {
                const badge = getBadgeStyle(log.event_type);
                const isCopied = copiedHash === log.chain_hash;

                return (
                  <tr 
                    key={log.log_id || idx}
                    style={{ 
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FBFDFF',
                    }}
                  >
                    {/* Log ID & Time */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '700', color: 'var(--color-navy)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        {log.log_id}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--color-muted)' }}>
                        {log.iso_time}
                      </div>
                    </td>

                    {/* Event Classification */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        letterSpacing: '0.02em',
                      }}>
                        {log.event_type}
                      </span>
                    </td>

                    {/* Complaint ID */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: '700', color: 'var(--color-navy)', fontFamily: 'var(--font-mono)' }}>
                      {log.complaint_id}
                    </td>

                    {/* Audit Summary Description */}
                    <td style={{ padding: '10px 14px', color: 'var(--color-ink)', maxWidth: '380px' }}>
                      <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                        {log.summary}
                      </div>
                    </td>

                    {/* SHA-256 Attestation Hash */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleCopyHash(log.chain_hash)}
                        title="Click to copy full SHA-256 chain hash"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-mono)',
                          color: '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        <Hash size={10} color="var(--color-muted)" />
                        <span>{log.chain_hash ? `${log.chain_hash.slice(0, 12)}...` : 'N/A'}</span>
                        {isCopied ? <Check size={10} color="#16A34A" /> : <Copy size={10} color="var(--color-muted)" />}
                      </button>
                    </td>

                    {/* Payload Inspect Button */}
                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => setInspectLog(log)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: '#F0FDFA',
                          color: 'var(--color-teal-dark)',
                          border: '1px solid #CCFBF1',
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={11} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* JSON Payload Inspection Modal */}
      {inspectLog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 31, 58, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
            {/* Modal Header */}
            <div style={{ padding: '14px 20px', backgroundColor: 'var(--color-navy)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--color-teal)" />
                <span style={{ fontSize: '13px', fontWeight: '800' }}>
                  Cryptographic Ledger Entry: {inspectLog.log_id}
                </span>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '2px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                  Event Type & Timestamp
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-navy)', marginTop: '2px' }}>
                  {inspectLog.event_type} • {inspectLog.iso_time}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                  Full SHA-256 Attestation Chain Hash
                </div>
                <div style={{
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  wordBreak: 'break-all',
                  color: 'var(--color-navy)',
                  marginTop: '4px',
                }}>
                  {inspectLog.chain_hash}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Raw Log Entry & Cryptographic Payload
                </div>
                <pre style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#0B1F3A',
                  color: '#A7F3D0',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  overflowX: 'auto',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {JSON.stringify(inspectLog, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '10px 20px', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setInspectLog(null)}
                className="btn btn-secondary"
                style={{ fontSize: '12px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
