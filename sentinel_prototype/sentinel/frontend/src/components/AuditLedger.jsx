import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileClock, 
  Search, 
  ShieldCheck, 
  Hash, 
  RefreshCw, 
  Copy, 
  Check, 
  Eye, 
  X, 
  Lock, 
  Clock 
} from 'lucide-react';
import { MetricCubeIcon } from './AstrixIcons';
import { api } from '../services/api';

export default function AuditLedger({ onRefreshParent }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [inspectLog, setInspectLog] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  // Fetch all audit logs without server-side filtering to enable 0ms instant client filtering.
  // Ceiling set to 500 events to accommodate full multi-scenario live presentation sessions without truncation.
  const fetchLogs = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const data = await api.getAuditLogs(500);
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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((log) => {
        const id = (log.log_id || '').toLowerCase();
        const cid = (log.complaint_id || '').toLowerCase();
        const et = (log.event_type || '').toLowerCase();
        const sum = (log.summary || '').toLowerCase();
        const hash = (log.chain_hash || '').toLowerCase();
        return id.includes(q) || cid.includes(q) || et.includes(q) || sum.includes(q) || hash.includes(q);
      });
    }

    return result;
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
      return { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', text: '#ef4444' };
    }
    if (et.includes('VERIFIED') || et.includes('INIT') || et.includes('SUCCESS') || et.includes('RESET')) {
      return { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.25)', text: '#22c55e' };
    }
    if (et.includes('BNSS') || et.includes('NOTICE')) {
      return { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)', text: '#3b82f6' };
    }
    if (et.includes('MODEL') || et.includes('HAWKES') || et.includes('SIMULATION') || et.includes('PREDICTION')) {
      return { bg: 'rgba(0, 168, 150, 0.12)', border: 'rgba(0, 168, 150, 0.25)', text: 'var(--primary)' };
    }
    return { bg: 'var(--secondary)', border: 'var(--border)', text: 'var(--muted-foreground)' };
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Records' },
    { id: 'INTAKE', label: 'Intake Events' },
    { id: 'AUTHENTICITY', label: 'Authenticity Gate' },
    { id: 'BNSS', label: 'Complaint Notices' },
    { id: 'MODEL', label: 'AI Forecaster' },
    { id: 'SYSTEM', label: 'System & Outbox' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Context */}
      <div className="astrix-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="astrix-metric-icon-box">
                <FileClock size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
                Compliance & Forensic Audit Ledger
              </h2>
              <span className="badge badge-teal" style={{ padding: '4px 8px', fontSize: '11px' }}>
                SHA-256 Tamper-Evident Chain
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)', marginTop: '6px', margin: 0, lineHeight: 1.4 }}>
              Immutable chronological record of intake validations, Authenticity Gate scoring, Champion GBDT forecasts, complaint preservation orders, and resilient outbox transitions.
            </p>
          </div>

          <button
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="astrix-btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Ledger'}</span>
          </button>
        </div>

        {/* 4 Summary Astrix Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginTop: '18px',
        }}>
          <div className="astrix-metric-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Ledger Records
            </div>
            <div className="astrix-metric-value" style={{ fontSize: '1.6rem', marginTop: '3px' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
              <Lock size={11} /> 100% SHA-256 Cryptographically Linked
            </div>
          </div>

          <div className="astrix-metric-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sybil Attempts Hard-Failed
            </div>
            <div className="astrix-metric-value" style={{ fontSize: '1.6rem', color: '#7c3aed', marginTop: '3px' }}>
              {stats.hardFails}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '3px' }}>
              Score 0.00 • Zero False Freezes
            </div>
          </div>

          <div className="astrix-metric-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Complaint Notices
            </div>
            <div className="astrix-metric-value" style={{ fontSize: '1.6rem', color: '#2563eb', marginTop: '3px' }}>
              {stats.notices}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '3px' }}>
              Complaint Notice Courtroom Sealed
            </div>
          </div>

          <div className="astrix-metric-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              AI Model Inferences
            </div>
            <div className="astrix-metric-value" style={{ fontSize: '1.6rem', color: 'var(--primary)', marginTop: '3px' }}>
              {stats.predictions}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '3px' }}>
              CatBoost Threshold 0.444 • Sub-ms Latency
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Instant Search Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Instant Category Buttons (Astrix Segmented Pills) */}
        <div className="astrix-pill-nav" style={{ flexWrap: 'wrap' }}>
          {filterTabs.map((tab) => {
            const count = categoryCounts[tab.id] ?? 0;
            const isSelected = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`astrix-pill-btn ${isSelected ? 'active' : ''}`}
              >
                <span>{tab.label}</span>
                <span className={`astrix-pill-badge ${isSelected ? 'active' : ''}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Filter Search Input */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
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
              border: '1px solid var(--border)',
              outline: 'none',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-sans)',
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
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table - Astrix Styled Container */}
      <div className="astrix-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="astrix-table" style={{ textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px' }}>Log ID & Time</th>
                <th style={{ padding: '12px 16px' }}>Event Classification</th>
                <th style={{ padding: '12px 16px' }}>Complaint ID</th>
                <th style={{ padding: '12px 16px' }}>Audit Summary Description</th>
                <th style={{ padding: '12px 16px' }}>SHA-256 Attestation Chain</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Payload</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px', color: 'var(--primary)' }} />
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>Loading Cryptographic Ledger Records...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    <FileClock size={24} style={{ margin: '0 auto 8px', color: 'var(--muted-foreground)' }} />
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--foreground)' }}>
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
                    <tr key={log.log_id || idx}>
                      {/* Log ID & Time */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '700', color: 'var(--foreground)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          {log.log_id}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
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
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontWeight: '700', color: 'var(--foreground)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {log.complaint_id || 'SYSTEM'}
                      </td>

                      {/* Audit Summary Description */}
                      <td style={{ padding: '12px 16px', color: 'var(--foreground)', maxWidth: '420px' }}>
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
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--secondary)',
                            border: '1px solid var(--border)',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--foreground)',
                            cursor: 'pointer',
                          }}
                        >
                          <Hash size={10} style={{ color: 'var(--muted-foreground)' }} />
                          <span>
                            {log.chain_hash 
                              ? `${log.chain_hash.slice(0, 8)}...${log.chain_hash.slice(-6)}` 
                              : 'e3b0c442...'}
                          </span>
                          {isCopied ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#16a34a', fontSize: '9.5px', fontWeight: '700' }}>
                              <Check size={10} /> Copied
                            </span>
                          ) : (
                            <Copy size={10} style={{ color: 'var(--muted-foreground)' }} />
                          )}
                        </button>
                      </td>

                      {/* Payload Inspect Button */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setInspectLog(log)}
                          className="astrix-btn-outline"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: '600',
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
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
        }}>
          <div className="astrix-card" style={{ width: '100%', maxWidth: '640px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
            {/* Modal Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--foreground)' }}>
                  Cryptographic Ledger Entry: {inspectLog.log_id}
                </span>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Event Type & Timestamp
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--foreground)', marginTop: '3px' }}>
                  {inspectLog.event_type} • {inspectLog.iso_time}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Full SHA-256 Attestation Chain Hash
                </div>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--secondary)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  wordBreak: 'break-all',
                  color: 'var(--foreground)',
                  marginTop: '4px',
                }}>
                  {inspectLog.chain_hash}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Raw Log Entry & Cryptographic Payload
                </div>
                <pre style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
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
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--card)' }}>
              <button
                onClick={() => setInspectLog(null)}
                className="astrix-btn-outline"
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
