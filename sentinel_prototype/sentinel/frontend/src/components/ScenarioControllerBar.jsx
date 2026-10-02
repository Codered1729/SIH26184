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
  Clock,
  Play
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
      title: '1. High-Velocity UPI',
      location: 'Pune Hinjawadi',
      amount: '₹78,000',
      window: '20m Golden Window',
      icon: Zap,
      badge: 'CRITICAL (0.91)',
      desc: 'Simulates high-velocity UPI mule cash-out in Pune Hinjawadi (₹78,000); triggers Hawkes ATM cluster excitation.',
    },
    {
      id: 'duplicate_utr_fail',
      title: '2. Duplicate UTR Sybil',
      location: 'Mumbai Andheri',
      amount: '₹65,000',
      window: 'Window Suspended',
      icon: ShieldAlert,
      badge: 'HELD FOR REVIEW',
      desc: 'Detects duplicate UTR claim in Mumbai; Authenticity Gate immediately assigns 0.00 score (zero wrongful freezes).',
    },
    {
      id: 'bank_outage_resilience',
      title: '3. Nodal Gateway Outage',
      location: 'Mumbai BKC',
      amount: '₹1,40,000',
      window: 'SQLite WAL Queue',
      icon: PlugZap,
      badge: 'OUTBOX QUEUED',
      desc: 'Simulates bank webhook downtime in BKC: trips CircuitBreaker to OPEN; 0 alerts lost via SQLite queue.',
    },
    {
      id: 'multihop_decay',
      title: '4. Interstate Corridor',
      location: 'Thane ➔ Ahmedabad',
      amount: '₹1,35,000',
      window: '45m Bayesian Window',
      icon: RefreshCw,
      badge: 'BAYESIAN DECAY',
      desc: 'Layered interstate mule transfer from Thane (MH) to Ahmedabad (GJ); Bayesian belief decays to _missed after 45m window.',
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
      setLastAction({ type: 'success', text: 'Operational baseline restored in <500ms' });
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
      backgroundColor: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xs)',
      position: 'relative',
      zIndex: 25,
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '6px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {/* Left: Presentation Bar Header & Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--secondary)',
            border: '1px solid var(--border)',
          }}>
            <Sparkles size={12} color="var(--primary)" />
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--foreground)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Live Event Simulation
            </span>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'none' }} className="md:inline">
            Interactive Presentation Harness
          </span>

          {lastAction && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor: lastAction.type === 'success' ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'color-mix(in srgb, var(--destructive) 12%, transparent)',
              color: lastAction.type === 'success' ? 'var(--success)' : 'var(--destructive)',
              border: `1px solid ${lastAction.type === 'success' ? 'color-mix(in srgb, var(--success) 35%, transparent)' : 'color-mix(in srgb, var(--destructive) 35%, transparent)'}`,
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
            className="btn btn-secondary"
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: '600',
              cursor: loadingScenario ? 'not-allowed' : 'pointer',
              gap: '6px',
            }}
          >
            <RotateCcw size={12} className={loadingScenario === 'reset' ? 'spin' : ''} />
            <span>↺ Reset Demo State (&lt;500ms)</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="astrix-btn-outline"
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              cursor: 'pointer',
              color: 'var(--muted-foreground)'
            }}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Scenario Buttons Strip (Astrix Pill Bar) */}
      {!isCollapsed && (
        <div style={{
          backgroundColor: 'var(--background)',
          borderTop: '1px solid var(--border)',
          padding: '8px 28px',
        }}>
          <div style={{
            maxWidth: '1600px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '8px',
          }}>
            {scenarios.map((sc) => {
              const IconComp = sc.icon;
              const isLoading = loadingScenario === sc.id;

              return (
                <button
                  key={sc.id}
                  onClick={() => handleTrigger(sc)}
                  disabled={loadingScenario !== null}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    textAlign: 'left',
                    cursor: loadingScenario ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconComp size={13} color="var(--primary)" />
                      <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--foreground)' }}>
                        {sc.title}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--muted-foreground)',
                    }}>
                      {sc.badge}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '10.5px', color: 'var(--muted-foreground)' }}>
                    <span>{sc.location}</span>
                    <span style={{ fontWeight: '600', color: 'var(--foreground)' }}>{sc.amount}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
