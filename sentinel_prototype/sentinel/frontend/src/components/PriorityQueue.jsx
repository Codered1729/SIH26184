import React, { useState, useMemo } from 'react';
import AlertCard from './AlertCard';
import { 
  Search, 
  ArrowUpDown, 
  RotateCw,
  Inbox
} from 'lucide-react';

export default function PriorityQueue({ 
  alerts = [], 
  onSelectAlert, 
  onDispatchAlert, 
  selectedComplaintId,
  highlightedAlertId,
  onRefresh,
  searchQuery: externalSearch = ''
}) {
  const [filterTab, setFilterTab] = useState('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearch || internalSearchQuery;
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
        const area = (alert.leading_atm?.area || '').toLowerCase();
        const atmId = (alert.leading_atm?.atm_id || '').toLowerCase();
        return cid.includes(q) || utr.includes(q) || city.includes(q) || bank.includes(q) || area.includes(q) || atmId.includes(q);
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
    { id: 'all', label: 'All Alerts', count: counts.all },
    { id: 'critical', label: 'Urgent (< 25m)', count: counts.critical },
    { id: 'held', label: 'Under Review', count: counts.held },
    { id: 'dispatched', label: 'Dispatched', count: counts.dispatched },
    { id: 'expired', label: 'Expired', count: counts.expired },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stream Controls Header */}
      <section className="astrix-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
              Live Fraud Alerts
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', marginTop: '2px', margin: 0 }}>
              Incoming fraud reports prioritized by urgency to stop ATM cash withdrawals
            </p>
          </div>

          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="astrix-btn-outline"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Refresh Alert Stream"
            >
              <RotateCw size={13} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {/* Filter Segmented Pills, Search & Sort */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderTop: '1px solid var(--border)',
          paddingTop: '14px',
        }}>
          {/* Segmented Pill Tabs with clean horizontal scroll on mobile */}
          <div className="astrix-pill-nav" style={{ overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
            {tabs.map((tab) => {
              const isActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`astrix-pill-btn ${isActive ? 'active' : ''}`}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <span>{tab.label}</span>
                  <span className={`astrix-pill-badge ${isActive ? 'active' : ''}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--muted-foreground)', flexShrink: 0, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by ID, city, bank..."
                value={searchQuery}
                onChange={(e) => setInternalSearchQuery(e.target.value)}
                style={{
                  padding: '7px 10px 7px 30px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  fontSize: '12px',
                  outline: 'none',
                  width: '180px',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  fontSize: '12px',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                }}
              >
                <option value="priority">Sort: Most Urgent</option>
                <option value="amount">Sort: Amount (High to Low)</option>
                <option value="time">Sort: Time Remaining</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Stream Cards List */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedAlerts.length === 0 ? (
          <div className="astrix-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Inbox size={32} style={{ margin: '0 auto 10px', color: 'var(--muted-foreground)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 4px' }}>
              No alerts found
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
              {searchQuery ? `No results matching "${searchQuery}". Try clearing search.` : 'No alerts in this category.'}
            </p>
          </div>
        ) : (
          sortedAlerts.map((alert) => (
            <AlertCard
              key={alert.complaint_id}
              alert={alert}
              onSelect={onSelectAlert}
              onDispatch={onDispatchAlert}
              isSelected={selectedComplaintId === alert.complaint_id}
              isHighlighted={highlightedAlertId === alert.complaint_id}
            />
          ))
        )}
      </section>
    </div>
  );
}
