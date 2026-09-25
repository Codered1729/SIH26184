import React, { useState } from 'react';
import { 
  Zap, 
  ShieldAlert, 
  PlugZap, 
  RefreshCw, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

export default function ScenarioControllerBar({ 
  onScenarioTriggered, 
  onResetCompleted,
  activeCaseId 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loadingScenario, setLoadingScenario] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  const scenarios = [
    {
      id: 'genuine_pune_upi',
      title: '1. High-Velocity UPI Siphon',
      subtitle: 'Pune Hinjawadi • 20m Window',
      icon: Zap,
      badge: 'CRITICAL (0.91)',
      color: '#0B1F3A',
      accentColor: '#00C2A8',
      desc: 'Simulates high-velocity UPI mule diversion (₹78,000) triggering Hawkes ATM cluster excitation.',
    },
    {
      id: 'duplicate_utr_fail',
      title: '2. Sybil / Duplicate Claim',
      subtitle: 'Authenticity Gate Hard-Fail',
      icon: ShieldAlert,
      badge: 'HELD FOR REVIEW',
      color: '#581C87',
      accentColor: '#A855F7',
      desc: 'Detects duplicate UTR claim; Authenticity Gate immediately assigns 0.00 score (zero wrongful freezes).',
    },
    {
      id: 'bank_outage_resilience',
      title: '3. Nodal Gateway Outage',
      subtitle: 'CFCFRMS Drop • SQLite Outbox',
      icon: PlugZap,
      badge: 'OUTBOX QUEUED',
      color: '#9A3412',
      accentColor: '#F97316',
      desc: 'Simulates bank webhook downtime: trips CircuitBreaker to OPEN; 0 alerts lost via SQLite queue.',
    },
    {
      id: 'multihop_decay',
      title: '4. Layered Syndicate Transfer',
      subtitle: 'Thane Corridor • Bayesian Decay',
      icon: RefreshCw,
      badge: 'BAYESIAN DECAY',
      color: '#334155',
      accentColor: '#64748B',
      desc: 'Multi-hop mule chain across Thane-Mumbai corridor; Bayesian belief decays to _missed after 42m.',
    },
  ];

  const handleTrigger = async (scenario) => {
    setLoadingScenario(scenario.id);
    try {
      const res = await api.triggerScenario(scenario.id);
      if (res && res.complaint_id) {
        setLastAction({
          type: 'success',
          text: `Injected ${scenario.title} (${res.complaint_id})`,
          cid: res.complaint_id,
        });
        if (onScenarioTriggered) {
          onScenarioTriggered(res.complaint_id, scenario.id, res.alert);
        }
      }
    } catch (err) {
      console.error('Failed to trigger scenario:', err);
      setLastAction({ type: 'error', text: `Failed to trigger ${scenario.title}` });
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleReset = async () => {
    setLoadingScenario('reset');
    try {
      await api.resetSimulationState();
      setLastAction({ type: 'success', text: 'Operational baseline restored' });
      if (onResetCompleted) {
        onResetCompleted();
      }
    } catch (err) {
      console.error('Failed to reset demo state:', err);
      setLastAction({ type: 'error', text: 'Reset failed' });
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--border-subtle)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
      position: 'relative',
      zIndex: 990,
    }}>
      <div style={{
        maxWidth: '100%',
        margin: '0',
        padding: '6px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {/* Left: Presentation Bar Header & Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#F0FDFA',
            border: '1px solid #CCFBF1',
          }}>
            <Sparkles size={13} color="var(--color-teal-dark)" />
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '0.04em' }}>
              OPERATIONAL SCENARIOS & STRESS DRILLS
            </span>
          </div>

          <span style={{ fontSize: '11.5px', color: 'var(--color-muted)', fontWeight: '500' }}>
            Live Incident Telemetry Simulator
          </span>

          {lastAction && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor: lastAction.type === 'success' ? '#F0FDF4' : '#FEF2F2',
              color: lastAction.type === 'success' ? '#15803D' : '#B91C1C',
              border: `1px solid ${lastAction.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            }}>
              <CheckCircle2 size={11} />
              <span>{lastAction.text}</span>
            </div>
          )}
        </div>

        {/* Right: Reset Button & Collapse Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleReset}
            disabled={loadingScenario !== null}
            title="Reset active alerts, dispatches, cooldowns, and outbox back to pristine baseline seed"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: '700',
              backgroundColor: '#F8FAFC',
              color: 'var(--color-navy)',
              border: '1px solid var(--border-subtle)',
              cursor: loadingScenario ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={12} className={loadingScenario === 'reset' ? 'spin' : ''} />
            <span>Reset Operational Baseline</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
            title={isCollapsed ? 'Expand Scenario Bar' : 'Collapse Scenario Bar'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Scenario Buttons Strip */}
      {!isCollapsed && (
        <div style={{
          maxWidth: '100%',
          margin: '0',
          padding: '0 28px 8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '8px',
        }}>
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isLoading = loadingScenario === sc.id;

            return (
              <button
                key={sc.id}
                onClick={() => handleTrigger(sc)}
                disabled={loadingScenario !== null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  cursor: loadingScenario ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = sc.accentColor;
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: `${sc.accentColor}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={16} color={sc.accentColor} strokeWidth={2.2} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-navy)', whiteSpace: 'nowrap' }}>
                      {sc.title}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: '800',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      backgroundColor: `${sc.accentColor}15`,
                      color: sc.accentColor,
                      border: `1px solid ${sc.accentColor}40`,
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                    }}>
                      {sc.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sc.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
