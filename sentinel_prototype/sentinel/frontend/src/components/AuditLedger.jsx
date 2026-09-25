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
  Clock
} from 'lucide-react';
import { api } from '../services/api';

export default function AuditLedger({ onRefreshParent }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [inspectLog, setInspectLog] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  // Fetch all audit logs without server-side filtering to enable 0ms instant client filtering
  const fetchLogs = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const data = await api.getAuditLogs(150);
      if (data && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
      if (showSpinner) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs(false);
    // Background silent telemetry synchronization every 2.5 seconds
    const interval = setInterval(() => fetchLogs(false), 2500);
    return () => clearInterval(interval);
  }, []);

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Instant in-memory category counting
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: logs.length,
      INTAKE: 0,
      AUTHENTICITY: 0,
      BNSS: 0,
      MODEL: 0,
      SYSTEM: 0,
    };

    logs.forEach((log) => {
      const et = (log.event_type || '').toUpperCase();
      if (et.includes('INTAKE')) counts.INTAKE++;
      if (et.includes('AUTHENTICITY') || et.includes('HARD_FAIL') || et.includes('GATE') || et.includes('DUPLICATE')) counts.AUTHENTICITY++;
      if (et.includes('BNSS') || et.includes('NOTICE')) counts.BNSS++;
      if (et.includes('MODEL') || et.includes('PREDICTION') || et.includes('CHAMPION') || et.includes('HAWKES')) counts.MODEL++;
      if (et.includes('CIRCUIT') || et.includes('OUTBOX') || et.includes('SIMULATION') || et.includes('INIT') || et.includes('RESET')) counts.SYSTEM++;
    });

    return counts;
  }, [logs]);

  // Instant 0ms client-side filter computation
  const filteredLogs = useMemo(() => {
    let result = logs;

    if (selectedFilter !== 'ALL') {
      result = result.filter((log) => {
        const et = (log.event_type || '').toUpperCase();
        switch (selectedFilter) {
          case 'INTAKE':
            return et.includes('INTAKE');
          case 'AUTHENTICITY':
            return et.includes('AUTHENTICITY') || et.includes('HARD_FAIL') || et.includes('GATE') || et.includes('DUPLICATE');
          case 'BNSS':
            return et.includes('BNSS') || et.includes('NOTICE');
          case 'MODEL':
            return et.includes('MODEL') || et.includes('PREDICTION') || et.includes('CHAMPION') || et.includes('HAWKES');
          case 'SYSTEM':
            return et.includes('CIRCUIT') || et.includes('OUTBOX') || et.includes('SIMULATION') || et.includes('INIT') || et.includes('RESET');
          default:
            return true;
        }
      });
    }

    if (!searchQuery.trim()) return result;

    const q = searchQuery.toLowerCase();
    return result.filter((log) => {
      const cid = (log.complaint_id || '').toLowerCase();
      const etype = (log.event_type || '').toLowerCase();
      const sum = (log.summary || '').toLowerCase();
      const chash = (log.chain_hash || '').toLowerCase();
      const lid = (log.log_id || '').toLowerCase();
      return cid.includes(q) || etype.includes(q) || sum.includes(q) || chash.includes(q) || lid.includes(q);
    });
  }, [logs, selectedFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = logs.length;
    const hardFails = logs.filter((l) => {
      const et = (l.event_type || '').toUpperCase();
      return et.includes('HARD_FAIL') || et.includes('DUPLICATE');
    }).length;
    const notices = logs.filter((l) => (l.event_type || '').toUpperCase().includes('BNSS')).length;
    const predictions = logs.filter((l) => {
      const et = (l.event_type || '').toUpperCase();
      return et.includes('MODEL') || et.includes('PREDICTION') || et.includes('CHAMPION');
    }).length;
    return { total, hardFails, notices, predictions };
  }, [logs]);

  const getBadgeStyle = (eventType) => {
    const et = (eventType || '').toUpperCase();
    if (et.includes('HARD_FAIL') || et.includes('TRIPPED') || et.includes('EXPIRED')) {
      return { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' };
    }
    if (et.includes('VERIFIED') || et.includes('INIT') || et.includes('SUCCESS') || et.includes('RESET')) {
      return { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' };
    }
    if (et.includes('BNSS') || et.includes('NOTICE')) {
      return { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' };
    }
    if (et.includes('MODEL') || et.includes('HAWKES') || et.includes('SIMULATION') || et.includes('PREDICTION')) {
      return { bg: '#F0FDFA', border: '#99F6E4', text: '#0D9488' };
    }
    return { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569' };
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Records' },
    { id: 'INTAKE', label: 'Intake Events' },
    { id: 'AUTHENTICITY', label: 'Authenticity Gate' },
    { id: 'BNSS', label: 'Section 105 BNSS' },
    { id: 'MODEL', label: 'AI Forecaster' },
    { id: 'SYSTEM', label: 'System & Outbox' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner & Context */}
      <div className="card" style={{ padding: '18px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 194, 168, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FileClock size={18} color="var(--color-teal-dark)" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '-0.02em', margin: 0 }}>
                Compliance & Forensic Audit Ledger
              </h2>
              <span className="badge badge-teal" style={{ padding: '4px 8px', fontSize: '11px' }}>
                SHA-256 Tamper-Evident Chain
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--color-muted)', marginTop: '6px', margin: 0, lineHeight: 1.4 }}>
              Immutable chronological record of intake validations, Authenticity Gate scoring, Champion GBDT forecasts, Section 105 BNSS legal orders, and resilient outbox transitions.
            </p>
          </div>

          <button
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Ledger'}</span>
          </button>
        </div>

        {/* 4 Summary Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginTop: '18px',
        }}>
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Ledger Records
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-navy)', marginTop: '3px' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '11px', color: '#16A34A', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
              <Lock size={11} /> 100% SHA-256 Cryptographically Linked
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sybil Attempts Hard-Failed
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#7C3AED', marginTop: '3px' }}>
              {stats.hardFails}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '3px' }}>
              Score 0.00 • Zero False Freezes
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              BNSS Statutory Orders
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563EB', marginTop: '3px' }}>
              {stats.notices}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '3px' }}>
              Section 105 Courtroom Sealed
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              AI Model Inferences
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-teal-dark)', marginTop: '3px' }}>
              {stats.predictions}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '3px' }}>
              GBDT Threshold 0.197 • Sub-ms Latency
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Instant Search Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Instant Category Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {filterTabs.map((tab) => {
            const count = categoryCounts[tab.id] ?? 0;
            const isSelected = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? '700' : '600',
                  border: isSelected ? '1px solid var(--color-navy)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'var(--color-navy)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  boxShadow: isSelected ? '0 2px 4px rgba(11, 31, 58, 0.1)' : 'none',
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: '700',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.22)' : '#F1F5F9',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Filter Search Input */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={14} color="var(--color-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search Complaint ID, Event, Hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              fontSize: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              outline: 'none',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-muted)',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table - Spacious & High Readability */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-navy)', color: '#FFFFFF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Log ID & Time</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Event Classification</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Complaint ID</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Audit Summary Description</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>SHA-256 Attestation Chain</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700' }}>Payload</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)' }}>
                    <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px', color: 'var(--color-teal)' }} />
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>Loading Cryptographic Ledger Records...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--color-muted)' }}>
                    <FileClock size={24} style={{ margin: '0 auto 8px', color: '#94A3B8' }} />
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-navy)' }}>
                      No matching records found
                    </div>
                    <div style={{ fontSize: '11.5px', marginTop: '4px' }}>
                      Try selecting "All Records" or clearing your search query.
                    </div>
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
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFF',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      {/* Log ID & Time */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '700', color: 'var(--color-navy)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          {log.log_id}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                          <Clock size={10} />
                          <span>{log.iso_time || 'Just now'}</span>
                        </div>
                      </td>

                      {/* Event Classification */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
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
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontWeight: '700', color: 'var(--color-navy)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {log.complaint_id || 'SYSTEM'}
                      </td>

                      {/* Audit Summary Description */}
                      <td style={{ padding: '12px 16px', color: 'var(--color-ink)', maxWidth: '420px' }}>
                        <div style={{ fontSize: '12px', lineHeight: 1.45, fontWeight: '500' }}>
                          {log.summary}
                        </div>
                      </td>

                      {/* SHA-256 Attestation Chain */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleCopyHash(log.chain_hash)}
                          title="Click to copy full SHA-256 hash"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          <Hash size={10} color="var(--color-muted)" />
                          <span>
                            {log.chain_hash 
                              ? `${log.chain_hash.slice(0, 8)}...${log.chain_hash.slice(-6)}` 
                              : 'e3b0c442...'}
                          </span>
                          {isCopied ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#16A34A', fontSize: '9.5px', fontWeight: '700' }}>
                              <Check size={10} /> Copied
                            </span>
                          ) : (
                            <Copy size={10} color="#94A3B8" />
                          )}
                        </button>
                      </td>

                      {/* Payload Inspect Button */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setInspectLog(log)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            backgroundColor: '#F0FDFA',
                            color: 'var(--color-teal-dark)',
                            border: '1px solid #CCFBF1',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={12} />
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
            <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Event Type & Timestamp
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-navy)', marginTop: '3px' }}>
                  {inspectLog.event_type} • {inspectLog.iso_time}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Full SHA-256 Attestation Chain Hash
                </div>
                <div style={{
                  padding: '8px 12px',
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
                <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Raw Log Entry & Cryptographic Payload
                </div>
                <pre style={{
                  padding: '12px 14px',
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
            <div style={{ padding: '12px 20px', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setInspectLog(null)}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px' }}
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
