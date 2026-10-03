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
  CheckCircle2
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
      title: '1. High-Risk UPI Fraud',
      location: 'Pune (Hinjawadi)',
      amount: '₹78,000',
      icon: Zap,
      badge: 'URGENT',
      desc: 'Simulates genuine fast UPI fraud in Pune (₹78,000); alerts nearby ATMs immediately.',
    },
    {
      id: 'duplicate_utr_fail',
      title: '2. Duplicate Report',
      location: 'Mumbai (Andheri)',
      amount: '₹65,000',
      icon: ShieldAlert,
      badge: 'BLOCKED',
      desc: 'Detects duplicate payment reference in Mumbai; blocks false freeze automatically.',
    },
    {
      id: 'bank_outage_resilience',
      title: '3. Bank Server Down',
      location: 'Mumbai (BKC)',
      amount: '₹1,40,000',
      icon: PlugZap,
      badge: 'QUEUED',
      desc: 'Simulates bank connection failure in Mumbai; safely stores alert so nothing is lost.',
    },
    {
      id: 'multihop_decay',
      title: '4. Multi-State Transfer',
      location: 'Thane ➔ Ahmedabad',
      amount: '₹1,35,000',
      icon: RefreshCw,
      badge: 'MONITORED',
      desc: 'Tracks transfer from Thane (MH) to Ahmedabad (GJ); alerts target police unit.',
    },
  ];

  const handleTrigger = async (scenario) => {
    setLoadingScenario(scenario.id);
    try {
      const res = await api.triggerScenario(scenario.id);
      if (res && res.complaint_id) {
        setLastAction({
          type: 'success',
          text: `Triggered: ${scenario.title} (${res.complaint_id})`,
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
      setLastAction({ type: 'success', text: 'All data reset to baseline' });
      if (onResetCompleted) {
        await onResetCompleted();
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
      position: 'relative',
      zIndex: 20,
    }}>
      {/* Top Controller Strip Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {/* Left: Section Title & Feedback */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--secondary)',
            border: '1px solid var(--border)',
          }}>
            <Sparkles size={12} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Demo Scenarios
            </span>
          </div>

          {lastAction && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor: lastAction.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: lastAction.type === 'success' ? '#16a34a' : '#ef4444',
              border: `1px solid ${lastAction.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
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
            title="Reset alerts and data back to starting state"
            className="astrix-btn-outline"
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11.5px',
              fontWeight: '600',
              cursor: loadingScenario ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              lineHeight: 1,
            }}
          >
            <RotateCcw size={12} className={loadingScenario === 'reset' ? 'spin' : ''} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>Reset All Data</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="astrix-btn-outline"
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--muted-foreground)'
            }}
            aria-label="Toggle demo bar"
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Scenario Buttons Strip */}
      {!isCollapsed && (
        <div style={{
          backgroundColor: 'var(--background)',
          borderTop: '1px solid var(--border)',
          padding: '8px 16px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          <div style={{
            maxWidth: '1600px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
                      <IconComp size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--foreground)' }}>
                        {sc.title}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: '700',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--muted-foreground)',
                    }}>
                      {sc.badge}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                    <span>{sc.location}</span>
                    <span style={{ fontWeight: '700', color: 'var(--foreground)' }}>{sc.amount}</span>
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
