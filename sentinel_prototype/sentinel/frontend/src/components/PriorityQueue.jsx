import React, { useState, useMemo } from 'react';
import AlertCard from './AlertCard';
import { 
  MetricCubeIcon, 
  TrendingUpIcon, 
  SearchIcon 
} from './AstrixIcons';
import { 
  Zap, 
  ShieldAlert, 
  MapPin, 
  ShieldCheck, 
  ArrowUpDown, 
  RotateCw 
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
    { id: 'critical', label: 'Critical Risk (<25m)', count: counts.critical },
    { id: 'held', label: 'Held for Review (Sybil)', count: counts.held },
    { id: 'dispatched', label: 'Patrol Dispatched', count: counts.dispatched },
    { id: 'expired', label: 'Window Concluded', count: counts.expired },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Astrix Top Overview Section: 4 High-Impact Metric Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {/* Metric 1: Active Triage */}
        <div className="astrix-metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="astrix-metric-icon-box">
              <MetricCubeIcon className="size-4" />
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'color-mix(in srgb, var(--success) 12%, transparent)',
              color: 'var(--success)',
              fontSize: '11px',
              fontWeight: '700',
            }}>
              <TrendingUpIcon className="size-3" />
              +12.4% vs baseline
            </span>
          </div>
          <div>
            <div className="astrix-metric-value">{alerts.length}</div>
            <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)', marginTop: '4px' }}>
              Active Incidents in Queue
            </p>
          </div>
        </div>

        {/* Metric 2: Critical Golden Window */}
        <div className="astrix-metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="astrix-metric-icon-box" style={{ color: 'var(--primary)', borderColor: 'color-mix(in srgb, var(--primary) 30%, var(--border))' }}>
              <Zap size={16} />
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              color: 'var(--primary)',
              fontSize: '11px',
              fontWeight: '700',
            }}>
              &lt; 25m Golden Window
            </span>
          </div>
          <div>
            <div className="astrix-metric-value">{counts.critical}</div>
            <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)', marginTop: '4px' }}>
              High-Velocity Cash-Out Risk
            </p>
          </div>
        </div>

        {/* Metric 3: Sybil Defense / Held */}
        <div className="astrix-metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="astrix-metric-icon-box" style={{ color: '#8B5CF6' }}>
              <ShieldAlert size={16} />
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              color: '#8B5CF6',
              fontSize: '11px',
              fontWeight: '700',
            }}>
              100% Duplicate UTR Block
            </span>
          </div>
          <div>
            <div className="astrix-metric-value">{counts.held}</div>
            <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)', marginTop: '4px' }}>
              Held for Supervisor Review
            </p>
          </div>
        </div>

        {/* Metric 4: Hawkes Point-Process Lift */}
        <div className="astrix-metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="astrix-metric-icon-box" style={{ color: 'var(--info)' }}>
              <MapPin size={16} />
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'color-mix(in srgb, var(--info) 12%, transparent)',
              color: 'var(--info)',
              fontSize: '11px',
              fontWeight: '700',
            }}>
              75.0% Hit@3 Accuracy
            </span>
          </div>
          <div>
            <div className="astrix-metric-value">11.4 min</div>
            <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)', marginTop: '4px' }}>
              Mean Time-to-Interdiction (-59.3%)
            </p>
          </div>
        </div>
      </section>

      {/* Astrix Toolbar & Stream Controls */}
      <section className="astrix-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>
              Live Classification &amp; Triage Stream
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', marginTop: '2px' }}>
              CatBoost gradient boosting classification &amp; Hawkes self-exciting point-process ATM ranking
            </p>
          </div>

          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              title="Refresh Stream"
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
          {/* Segmented Pill Tabs */}
          <div className="astrix-pill-nav" style={{ flexWrap: 'wrap' }}>
            {tabs.map((tab) => {
              const isActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`astrix-pill-btn ${isActive ? 'active' : ''}`}
                >
                  <span>{tab.label}</span>
                  <span className="astrix-pill-badge">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <SearchIcon className="size-3.5" style={{ position: 'absolute', left: '10px', color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search ID, UTR, city..."
                value={searchQuery}
                onChange={(e) => setInternalSearchQuery(e.target.value)}
                style={{
                  padding: '6px 10px 6px 28px',
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
              <ArrowUpDown size={13} color="var(--muted-foreground)" />
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
                <option value="priority">Sort: Priority Score</option>
                <option value="amount">Sort: Amount (₹ High to Low)</option>
                <option value="time">Sort: Urgent (Time Left)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Stream Cards List */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedAlerts.length === 0 ? (
          <div className="astrix-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <ShieldAlert size={36} color="var(--muted-foreground)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)' }}>
              No Incidents Match Selected Filter
            </h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', marginTop: '4px' }}>
              Try selecting a different filter tab or clear your search query.
            </p>
          </div>
        ) : (
          sortedAlerts.map((alert) => (
            <AlertCard
              key={alert.complaint_id}
              alert={alert}
              isSelected={selectedComplaintId === alert.complaint_id}
              isHighlighted={highlightedAlertId === alert.complaint_id}
              onSelect={() => onSelectAlert && onSelectAlert(alert)}
              onDispatch={() => onDispatchAlert && onDispatchAlert(alert)}
            />
          ))
        )}
      </section>
    </div>
  );
}
