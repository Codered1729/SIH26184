import React, { useState, useMemo } from 'react';
import AlertCard from './AlertCard';
import { 
  ShieldAlert, 
  Search, 
  ArrowUpDown, 
  RefreshCw 
} from 'lucide-react';

export default function PriorityQueue({ 
  alerts = [], 
  onSelectAlert, 
  onDispatchAlert, 
  selectedComplaintId,
  highlightedAlertId,
  onRefresh 
}) {
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('priority');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filterTab === 'critical' && (alert.risk_tier !== 'CRITICAL' || alert.status === 'HELD_FOR_REVIEW')) {
        return false;
      }
      if (filterTab === 'held' && alert.status !== 'HELD_FOR_REVIEW') {
        return false;
      }
      if (filterTab === 'dispatched' && alert.status !== 'DISPATCHED') {
        return false;
      }
      if (filterTab === 'expired' && alert.status !== 'EXPIRED') {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cid = (alert.complaint_id || '').toLowerCase();
        const utr = (alert.utr || '').toLowerCase();
        const city = (alert.victim_city || '').toLowerCase();
        const bank = (alert.leading_atm?.bank || '').toLowerCase();
        return cid.includes(q) || utr.includes(q) || city.includes(q) || bank.includes(q);
      }

      return true;
    });
  }, [alerts, filterTab, searchQuery]);

  const sortedAlerts = useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      if (sortBy === 'amount') {
        return (b.amount || 0) - (a.amount || 0);
      }
      if (sortBy === 'time') {
        return (a.remaining_seconds || 0) - (b.remaining_seconds || 0);
      }
      return (b.priority_score || 0) - (a.priority_score || 0);
    });
  }, [filteredAlerts, sortBy]);

  const counts = useMemo(() => {
    return {
      all: alerts.length,
      critical: alerts.filter(a => a.risk_tier === 'CRITICAL' && a.status !== 'HELD_FOR_REVIEW').length,
      held: alerts.filter(a => a.status === 'HELD_FOR_REVIEW').length,
      dispatched: alerts.filter(a => a.status === 'DISPATCHED').length,
      expired: alerts.filter(a => a.status === 'EXPIRED').length,
    };
  }, [alerts]);

  const tabs = [
    { id: 'all', label: 'All Incidents', count: counts.all },
    { id: 'critical', label: 'Critical Risk (<25m Window)', count: counts.critical, color: '#B91C1C' },
    { id: 'held', label: 'Held for Inquiry (Duplicate Claims)', count: counts.held, color: '#6B21A8' },
    { id: 'dispatched', label: 'Patrol Dispatched', count: counts.dispatched, color: '#1D4ED8' },
    { id: 'expired', label: 'Window Concluded', count: counts.expired, color: '#475569' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Control Strip */}
      <div className="card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
              <ShieldAlert size={20} color="var(--color-teal)" />
              Active Incident Priority Queue
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginTop: '2px' }}>
              Automated cash-out risk ranking (Risk × Urgency × Amount × Confidence). Interception countdown calibrated to transfer channel.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: '11.5px' }}
                title="Refresh Feed"
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs & Search & Sort */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            {tabs.map((tab) => {
              const isActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11.5px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#FFFFFF' : 'var(--color-muted)',
                    backgroundColor: isActive ? 'var(--color-navy)' : '#F1F5F9',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--color-navy)' : '#E2E8F0',
                    cursor: 'pointer',
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    padding: '1px 5px',
                    borderRadius: '2px',
                    fontSize: '10.5px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : '#E2E8F0',
                    color: isActive ? '#FFFFFF' : (tab.color || 'var(--color-navy)'),
                    fontWeight: '700',
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} color="var(--color-muted)" style={{ position: 'absolute', left: '8px' }} />
              <input
                type="text"
                placeholder="Search ID, UTR, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '4px 8px 4px 26px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '11.5px',
                  outline: 'none',
                  width: '180px',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpDown size={12} color="var(--color-muted)" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '11.5px',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-navy)',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <option value="priority">Priority Score (Desc)</option>
                <option value="amount">Amount (Desc)</option>
                <option value="time">Time Remaining (Asc)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedAlerts.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted)' }}>
            <ShieldAlert size={28} color="var(--color-muted)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-navy)' }}>
              No Incidents Match Selected Filter
            </div>
            <p style={{ fontSize: '12px', marginTop: '2px' }}>
              {searchQuery ? `No active incidents matching "${searchQuery}"` : 'All incidents in this category have been processed or filtered.'}
            </p>
          </div>
        ) : (
          sortedAlerts.map((alert) => (
            <AlertCard
              key={alert.complaint_id}
              alert={alert}
              isSelected={alert.complaint_id === selectedComplaintId}
              isHighlighted={alert.complaint_id === highlightedAlertId}
              onSelect={onSelectAlert}
              onDispatch={onDispatchAlert}
            />
          ))
        )}
      </div>
    </div>
  );
}
