import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Radio, 
  Clock, 
  FileText, 
  X, 
  Navigation, 
  Building, 
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';

export default function DispatchConfirmationModal({ 
  dispatchInfo, 
  onClose, 
  onNavigateToMap,
  onNavigateToNotice
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(900);

  useEffect(() => {
    if (!dispatchInfo) return;
    setSecondsRemaining(dispatchInfo.cooldown_remaining || 900);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatchInfo]);

  if (!dispatchInfo) return null;

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const atmDisplay = dispatchInfo.atmName || dispatchInfo.leading_atm?.name || dispatchInfo.leading_atm?.bank || 'HDFC Bank ATM';
  const locationDisplay = dispatchInfo.location || dispatchInfo.area || dispatchInfo.victim_city || 'Operational Corridor';
  const squadUnit = dispatchInfo.squad || (
    dispatchInfo.victim_city === 'Mumbai' ? 'Mumbai Police QRT Unit Bravo-3 (BKC)' :
    dispatchInfo.victim_city === 'Pune' ? 'Pune City Cyber Cell & Hinjawadi Beat-4' :
    dispatchInfo.victim_city === 'Thane' ? 'Thane City Quick Response Interceptor-2' :
    'Maharashtra State Cyber QRT Strike Unit'
  );

  return (
    <div 
      className="animate-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div 
        className="animate-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Official Header Banner */}
        <div style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '14px 18px',
          borderBottom: '2px solid #22C55E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              border: '1.5px solid #22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheck size={20} color="#22C55E" />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Government of Maharashtra · Police Cyber Command
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                PATROL INTERCEPTOR DISPATCHED
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="astrix-btn-outline"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Statutory Flash Alert */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#22C55E',
              boxShadow: '0 0 10px #22C55E',
              flexShrink: 0,
              animation: 'pulse-ring 1.5s infinite',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--foreground)' }}>
                Law Enforcement Interception Active
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                Directives transmitted to field patrol unit and beneficiary bank host gateway.
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              fontFamily: 'var(--font-mono)',
            }}>
              <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700' }}>COOLDOWN</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#16a34a' }}>
                {formatTimer(secondsRemaining)}
              </span>
            </div>
          </div>

          {/* Incident Details Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            backgroundColor: 'var(--secondary)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase' }}>
                Case Docket Ref
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--foreground)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {dispatchInfo.complaint_id}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase' }}>
                Disputed Capital
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--foreground)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                ₹{dispatchInfo.amount?.toLocaleString('en-IN') || '78,000'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase' }}>
                Target ATM Facility
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--foreground)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {atmDisplay}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase' }}>
                Jurisdiction Corridor
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--foreground)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>{locationDisplay}</span>
              </div>
            </div>

            <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase' }}>
                Assigned Strike Patrol
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--foreground)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Radio size={12} style={{ color: '#22C55E' }} />
                <span>{squadUnit} (ETA ~4 mins)</span>
              </div>
            </div>
          </div>

          {/* Statutory Notice Note */}
          <div style={{
            fontSize: '11px',
            color: 'var(--muted-foreground)',
            lineHeight: 1.5,
            borderLeft: '2px solid var(--primary)',
            paddingLeft: '10px',
          }}>
            <strong>Statutory Notice Enforced:</strong> Under Section 106 & 107(5) Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, the beneficiary account has been flagged for preservation hold. Redundant dispatches suppressed for 15 minutes to preserve police bandwidth.
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: 'var(--secondary)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <button
            onClick={() => {
              onClose();
              if (onNavigateToNotice) onNavigateToNotice(dispatchInfo.complaint_id);
            }}
            className="astrix-btn-outline"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={13} />
            <span>View BNSS Notice</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                onClose();
                if (onNavigateToMap) onNavigateToMap();
              }}
              className="astrix-btn-outline"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--primary)',
                borderColor: 'var(--primary)',
              }}
            >
              <Navigation size={13} />
              <span>Track on ATM Radar</span>
            </button>

            <button
              onClick={onClose}
              className="astrix-btn-primary"
              style={{
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
