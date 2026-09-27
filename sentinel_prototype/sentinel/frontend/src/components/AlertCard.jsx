import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert,
  Send, 
  ChevronRight, 
  AlertTriangle,
  Building
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

  let timerColor = 'var(--color-teal-dark)';
  let timerBg = '#F0FDF4';
  let timerStage = 'INTERCEPTION WINDOW ACTIVE';

  if (secondsLeft === 0) {
    timerColor = '#64748B';
    timerBg = '#F1F5F9';
    timerStage = 'WINDOW CONCLUDED';
  } else if (pct < 20) {
    timerColor = '#B91C1C';
    timerBg = '#FEF2F2';
    timerStage = 'WINDOW CLOSING (<20%)';
  } else if (pct <= 50) {
    timerColor = '#B45309';
    timerBg = '#FFFBEB';
    timerStage = 'HIGH URGENCY';
  }

  const isDuplicate = isHeld;
  const isDispatched = alert.status === 'DISPATCHED';

  return (
    <div
      className={`card flip-item ${isHighlighted ? 'card-highlight-pulse' : ''}`}
      style={{
        padding: '12px 16px',
        backgroundColor: '#FFFFFF',
        border: isSelected ? '1.5px solid var(--color-teal)' : isHighlighted ? '2px solid var(--color-teal)' : '1px solid var(--border-medium)',
        borderLeft: isDuplicate ? '4px solid #7C3AED' : (alert.risk_tier === 'CRITICAL' ? '4px solid #DC2626' : '4px solid var(--color-teal)'),
      }}
    >
      {/* Header Row: Identifiers & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '-0.01em' }}>
            {alert.complaint_id}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            UTR: {alert.utr}
          </span>
          {isDuplicate ? (
            <span className="badge badge-held" style={{ backgroundColor: '#FAF5FF', color: '#7C3AED', border: '1px solid #D8B4FE', fontWeight: '700' }}>
              WINDOW SUSPENDED (GATE REJECTED)
            </span>
          ) : (
            <span className="badge badge-teal">
              {alert.situational_baseline || 'Standard Window'}
            </span>
          )}
          {isDuplicate ? (
            <span className="badge badge-held">
              <AlertTriangle size={11} />
              HELD: DUPLICATE UTR
            </span>
          ) : (
            <span className={`badge ${alert.risk_tier === 'CRITICAL' ? 'badge-critical' : 'badge-elevated'}`}>
              {alert.risk_tier} RISK ({(alert.cashout_probability * 100).toFixed(0)}%)
            </span>
          )}
          {isDispatched && (
            <span className="badge badge-cooldown">
              PATROL ALERTED
            </span>
          )}
        </div>

        {/* Clean Flat Countdown Indicator or Gate Halted Banner */}
        {isDuplicate ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: '#FAF5FF',
            border: '1px solid #D8B4FE',
          }}>
            <ShieldAlert size={13} color="#7C3AED" />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                INTERCEPTION HALTED:
              </span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#6B21A8' }}>
                DISPATCH BLOCKED
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: timerBg,
            border: `1px solid ${timerColor}30`,
          }}>
            <Clock size={12} color={timerColor} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: timerColor }}>
                {timerStage}:
              </span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: timerColor, fontFamily: 'var(--font-mono)' }}>
                {formatTime(secondsLeft)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dispatch Cooldown Notification Banner if Active */}
      {isDispatched && cooldownLeft > 0 && (
        <div style={{
          padding: '4px 10px',
          marginBottom: '8px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          color: '#1E40AF',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={12} color="#1E40AF" />
            <span>Patrol unit alerted. 15-minute suppression cooldown in effect.</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
            {formatTime(cooldownLeft)} remaining
          </span>
        </div>
      )}

      {/* Grid of Key Transaction & Hotspot Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '8px',
        padding: '8px 10px',
        backgroundColor: '#F8FAFC',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '8px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Complainant District
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
            <MapPin size={12} color="var(--color-teal)" />
            {alert.victim_city} ({alert.area})
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Defrauded Amount
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#B91C1C' }}>
            ₹{alert.amount?.toLocaleString('en-IN')}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Suspected Cash-Out ATM
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: isDuplicate ? '#64748B' : 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
            <Building size={12} color={isDuplicate ? '#94A3B8' : 'var(--color-navy)'} />
            {isDuplicate ? (
              <span style={{ fontStyle: 'italic', color: '#64748B' }}>Interception Suppressed</span>
            ) : (
              `${alert.leading_atm?.bank} — ${alert.leading_atm?.area}`
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Authenticity Validation
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: isDuplicate ? '#7C3AED' : '#15803D', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
            {isDuplicate ? <ShieldAlert size={12} color="#7C3AED" /> : <ShieldCheck size={12} />}
            {isDuplicate ? 'Duplicate UTR Rejected (0.00)' : `Verified (${(alert.authenticity_score * 100).toFixed(0)}%)`}
          </div>
        </div>
      </div>

      {/* Triage Basis Line */}
      <div style={{ fontSize: '11.5px', color: 'var(--color-muted)', marginBottom: '8px' }}>
        <strong style={{ color: isDuplicate ? '#7C3AED' : 'var(--color-navy)' }}>
          {isDuplicate ? 'Authenticity Protection:' : 'Triage Basis:'}
        </strong>{' '}
        {isDuplicate
          ? 'Duplicate transaction UTR detected by Authenticity Gate (Score: 0.00). Interception window deactivated and beat dispatch blocked to prevent wrongful citizen account freeze.'
          : (alert.top_reasons && alert.top_reasons.length > 0 ? alert.top_reasons[0] : 'High-risk velocity transaction pattern')}
      </div>

      {/* Card Actions Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Triage Priority Score:</span>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-navy)' }}>
            {(alert.priority_score * 100).toFixed(0)}%
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onSelect(alert)}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11.5px' }}
          >
            <span>View Case Dossier</span>
            <ChevronRight size={13} />
          </button>

          {!isDispatched && !isDuplicate && (
            <button
              onClick={() => onDispatch(alert)}
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '11.5px' }}
            >
              <Send size={12} />
              <span>Alert Beat Unit</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
