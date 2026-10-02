import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert,
  Send, 
  ChevronRight, 
  AlertTriangle,
  Building,
  Zap,
  TrendingUp
} from 'lucide-react';

export default function AlertCard({ alert, onSelect, onDispatch, isSelected = false, isHighlighted = false }) {
  const isHeld = alert.authenticity_decision === 'DUPLICATE_UTR' || 
                 alert.status === 'HELD_FOR_REVIEW' || 
                 alert.authenticity_score === 0.0;

  const [secondsLeft, setSecondsLeft] = useState(isHeld ? 0 : (alert.remaining_seconds ?? 600));
  const [cooldownLeft, setCooldownLeft] = useState(alert.dispatch_cooldown_remaining ?? 0);

  useEffect(() => {
    if (isHeld) {
      setSecondsLeft(0);
      return;
    }
    setSecondsLeft(alert.remaining_seconds ?? 600);
    setCooldownLeft(alert.dispatch_cooldown_remaining ?? 0);
  }, [alert.remaining_seconds, alert.dispatch_cooldown_remaining, isHeld]);

  useEffect(() => {
    if (isHeld) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
      setCooldownLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isHeld]);

  const totalSec = alert.total_window_seconds || 1800;
  const pct = totalSec > 0 ? (secondsLeft / totalSec) * 100 : 0;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  let timerColor = 'var(--success)';
  let timerBg = 'color-mix(in srgb, var(--success) 12%, transparent)';
  let timerStage = 'GOLDEN WINDOW ACTIVE';

  if (secondsLeft === 0) {
    timerColor = 'var(--muted-foreground)';
    timerBg = 'var(--secondary)';
    timerStage = 'WINDOW CONCLUDED';
  } else if (pct < 20) {
    timerColor = 'var(--destructive)';
    timerBg = 'color-mix(in srgb, var(--destructive) 12%, transparent)';
    timerStage = 'WINDOW EXPIRING (<20%)';
  } else if (pct <= 50) {
    timerColor = 'var(--warning)';
    timerBg = 'color-mix(in srgb, var(--warning) 12%, transparent)';
    timerStage = 'HIGH URGENCY';
  }

  const isDuplicate = isHeld;
  const isDispatched = alert.status === 'DISPATCHED';

  return (
    <article
      className={`card ${isHighlighted ? 'card-highlight-pulse' : ''}`}
      style={{
        padding: '16px 20px',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-lg)',
        border: isSelected 
          ? '1.5px solid var(--primary)' 
          : isHighlighted 
          ? '2px solid var(--primary)' 
          : '1px solid var(--border)',
        boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-xs)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.18s ease',
      }}
    >
      {/* Top Header: Identifiers, Badges & Timer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            {alert.complaint_id}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
            UTR: {alert.utr}
          </span>
          {isDuplicate ? (
            <span className="badge badge-held">
              <AlertTriangle size={11} />
              HELD: DUPLICATE UTR
            </span>
          ) : (
            <span className={`badge ${alert.risk_tier === 'CRITICAL' ? 'badge-critical' : 'badge-elevated'}`}>
              <Zap size={11} />
              {alert.risk_tier} RISK ({(alert.cashout_probability * 100).toFixed(0)}%)
            </span>
          )}
          {isDispatched && (
            <span className="badge badge-cooldown">
              <ShieldCheck size={11} />
              PATROL DISPATCHED
            </span>
          )}
        </div>

        {/* Dynamic Countdown Timer Pill */}
        {isDuplicate ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}>
            <ShieldAlert size={12} color="#8B5CF6" />
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#8B5CF6', textTransform: 'uppercase' }}>
              DISPATCH BLOCKED (SYBIL)
            </span>
          </div>
        ) : (alert.status === 'EXPIRED' || secondsLeft === 0) ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--secondary)',
            border: '1px solid var(--border)',
          }}>
            <Clock size={12} color="var(--muted-foreground)" />
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-foreground)' }}>
              WINDOW CONCLUDED (BAYESIAN DECAYED)
            </span>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: timerBg,
            border: `1px solid color-mix(in srgb, ${timerColor} 40%, transparent)`,
          }}>
            <Clock size={12} color={timerColor} />
            <span style={{ fontSize: '10.5px', fontWeight: '700', color: timerColor }}>
              {timerStage}:
            </span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: timerColor, fontFamily: 'var(--font-mono)' }}>
              {formatTime(secondsLeft)}
            </span>
          </div>
        )}
      </div>

      {/* Suppression Cooldown Indicator */}
      {isDispatched && (
        <div style={{
          padding: '6px 12px',
          marginBottom: '12px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'color-mix(in srgb, var(--info) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--info) 30%, transparent)',
          color: 'var(--info)',
          fontSize: '11.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={13} />
            <span>Patrol unit mobilized. 15-minute suppression cooldown in effect.</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
            {cooldownLeft > 0 ? `${formatTime(cooldownLeft)} suppression remaining` : 'PATROL EN ROUTE'}
          </span>
        </div>
      )}

      {/* Grid of Key Transaction & Hotspot Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '10px',
        padding: '12px 14px',
        backgroundColor: 'var(--secondary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '12px',
        border: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Complainant District
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <MapPin size={13} color="var(--primary)" />
            {alert.victim_city} ({alert.area})
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Disputed Loss (₹)
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--foreground)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            ₹{alert.amount?.toLocaleString('en-IN')}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            CatBoost ML Risk
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: alert.risk_tier === 'CRITICAL' ? 'var(--destructive)' : 'var(--warning)', marginTop: '2px' }}>
            {alert.risk_tier} (Score: {alert.priority_score})
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Predicted Cash-Out ATM
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Building size={13} color="var(--primary)" />
            {alert.leading_atm?.name || 'Evaluating Cluster...'}
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
            Channel: <strong style={{ color: 'var(--foreground)' }}>{alert.channel || 'UPI'}</strong> · Hop Depth: <strong style={{ color: 'var(--foreground)' }}>{alert.mule_fan_out || 1}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={onSelect}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', gap: '4px' }}
          >
            <span>Inspect Dossier</span>
            <ChevronRight size={13} />
          </button>

          {!isDuplicate && (
            <button
              type="button"
              onClick={onDispatch}
              disabled={isDispatched || cooldownLeft > 0}
              className="btn btn-primary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                gap: '5px',
                opacity: isDispatched || cooldownLeft > 0 ? 0.65 : 1,
                cursor: isDispatched || cooldownLeft > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={12} />
              <span>{isDispatched ? 'Patrol Alerted' : 'Dispatch Patrol Unit'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
