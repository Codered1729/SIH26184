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
  Zap
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
  let timerStage = 'TIME REMAINING';

  if (secondsLeft === 0) {
    timerColor = 'var(--muted-foreground)';
    timerBg = 'var(--secondary)';
    timerStage = 'EXPIRED';
  } else if (pct < 20) {
    timerColor = 'var(--destructive)';
    timerBg = 'color-mix(in srgb, var(--destructive) 12%, transparent)';
    timerStage = 'EXPIRING SOON';
  } else if (pct <= 50) {
    timerColor = 'var(--warning)';
    timerBg = 'color-mix(in srgb, var(--warning) 12%, transparent)';
    timerStage = 'URGENT';
  }

  const isDuplicate = isHeld;
  const isDispatched = alert.status === 'DISPATCHED';

  return (
    <article
      className={`card ${isHighlighted ? 'card-highlight-pulse' : ''}`}
      style={{
        padding: '14px 18px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            {alert.complaint_id}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
            UTR: {alert.utr}
          </span>
          {isDuplicate ? (
            <span className="badge badge-held">
              <AlertTriangle size={11} />
              DUPLICATE (HELD)
            </span>
          ) : (
            <span className={`badge ${alert.risk_tier === 'CRITICAL' ? 'badge-critical' : 'badge-elevated'}`}>
              <Zap size={10} />
              {alert.risk_tier} RISK
            </span>
          )}
        </div>

        {/* Dynamic Countdown Timer Pill */}
        {isDuplicate ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
          }}>
            <ShieldAlert size={12} color="#7c3aed" />
            <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#7c3aed' }}>
              BLOCKED (DUPLICATE)
            </span>
          </div>
        ) : (alert.status === 'EXPIRED' || secondsLeft === 0) ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--secondary)',
            border: '1px solid var(--border)',
          }}>
            <Clock size={12} color="var(--muted-foreground)" />
            <span style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--muted-foreground)' }}>
              WINDOW EXPIRED
            </span>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: timerBg,
            border: `1px solid color-mix(in srgb, ${timerColor} 40%, transparent)`,
          }}>
            <Clock size={12} color={timerColor} />
            <span style={{ fontSize: '10.5px', fontWeight: '700', color: timerColor }}>
              {timerStage}:
            </span>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: timerColor, fontFamily: 'var(--font-mono)' }}>
              {formatTime(secondsLeft)}
            </span>
          </div>
        )}
      </div>

      {/* Suppression Cooldown Indicator */}
      {isDispatched && (
        <div style={{
          padding: '6px 10px',
          marginBottom: '10px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          color: '#16a34a',
          fontSize: '11.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={13} />
            <span>Police unit dispatched. Alert on hold.</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '11px' }}>
            {cooldownLeft > 0 ? `${formatTime(cooldownLeft)} remaining` : 'UNIT ON SCENE'}
          </span>
        </div>
      )}

      {/* Grid of Key Transaction & Hotspot Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '8px',
        padding: '10px 12px',
        backgroundColor: 'var(--secondary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '10px',
        border: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Victim City
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <MapPin size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {alert.victim_city} ({alert.area})
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Amount Lost
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--foreground)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            ₹{alert.amount?.toLocaleString('en-IN')}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Fraud Risk
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: alert.risk_tier === 'CRITICAL' ? 'var(--destructive)' : 'var(--warning)', marginTop: '2px' }}>
            {alert.risk_tier} ({Math.round((alert.priority_score || 0.85) * 100)}%)
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Target ATM
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Building size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {alert.leading_atm?.name || 'Locating ATM...'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
            Channel: <strong style={{ color: 'var(--foreground)' }}>{alert.channel || 'UPI'}</strong> · Transfers: <strong style={{ color: 'var(--foreground)' }}>{alert.mule_fan_out || 1}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onSelect(alert)}
            className="astrix-btn-outline"
            style={{
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>View Details</span>
            <ChevronRight size={13} />
          </button>

          {!isDispatched && !isDuplicate && (
            <button
              onClick={() => onDispatch(alert)}
              className="astrix-btn-primary"
              style={{
                padding: '5px 12px',
                fontSize: '11.5px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Send size={12} />
              <span>Dispatch Police</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
