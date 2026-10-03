import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  BadgeCheck, 
  ArrowRight,
  Fingerprint,
  Cpu,
  Layers
} from 'lucide-react';

export const DEFAULT_OFFICER_PROFILES = [
  {
    id: 'deshmukh_pune',
    name: 'Inspector Rahul Deshmukh',
    badge: 'MH-CYB-PUN-4482',
    rank: 'Inspector of Police (Cyber Crime)',
    station: 'Cyber Crime Police Station, Pune Commissionerate (Shivajinagar)',
    jurisdiction: 'JCCT-Maharashtra (Pune Urban & Hinjawadi IT Corridor)',
    statutoryPower: 'Section 105 & 106 BNSS 2023 Preserving Authority',
    pin: '742910',
    avatarInitials: 'RD',
  },
  {
    id: 'kulkarni_hq',
    name: 'SP Sameer Kulkarni, IPS',
    badge: 'MH-CYB-HQ-1002',
    rank: 'Superintendent of Police',
    station: 'Maharashtra State Cyber HQ (World Trade Centre, Mumbai)',
    jurisdiction: 'Statewide Cyber Command & I4C Apex Liaison',
    statutoryPower: 'Apex Statutory Requisition Signatory (BNSS §105)',
    pin: '882014',
    avatarInitials: 'SK',
  },
  {
    id: 'sawant_thane',
    name: 'SI Priyanka Sawant',
    badge: 'MH-CYB-THA-3019',
    rank: 'Sub-Inspector (Inter-State Desk)',
    station: 'Cyber Cell Thane City (Teen Hath Naka)',
    jurisdiction: 'JCCT-Maharashtra / Gujarat Multi-Hop Corridor',
    statutoryPower: 'Inter-State Forensic Attestation Signatory',
    pin: '391052',
    avatarInitials: 'PS',
  },
];

export default function DutyOfficerLogin({ onLoginSuccess }) {
  const [selectedProfileId, setSelectedProfileId] = useState('deshmukh_pune');
  const [badgeId, setBadgeId] = useState(DEFAULT_OFFICER_PROFILES[0].badge);
  const [officerName, setOfficerName] = useState(DEFAULT_OFFICER_PROFILES[0].name);
  const [station, setStation] = useState(DEFAULT_OFFICER_PROFILES[0].station);
  const [pin, setPin] = useState(DEFAULT_OFFICER_PROFILES[0].pin);
  const [hardwareKeyChecked, setHardwareKeyChecked] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectQuickProfile = (profile) => {
    setSelectedProfileId(profile.id);
    setBadgeId(profile.badge);
    setOfficerName(profile.name);
    setStation(profile.station);
    setPin(profile.pin);
    setErrorMsg('');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!badgeId.trim() || !officerName.trim()) {
      setErrorMsg('Officer Badge ID and Name are mandatory for audit logging.');
      return;
    }
    if (pin.length < 4) {
      setErrorMsg('Officer Security PIN must be at least 4 digits.');
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg('');

    // Simulate authentic GovTech security handshake (PKI + I4C Directory Verification)
    setTimeout(() => {
      const activeProfile = DEFAULT_OFFICER_PROFILES.find((p) => p.id === selectedProfileId) || {
        id: 'custom_officer',
        name: officerName,
        badge: badgeId,
        rank: 'Cyber Crime Investigation Officer',
        station: station,
        jurisdiction: 'Maharashtra State Cyber Command',
        statutoryPower: 'BNSS 2023 Authorised Signatory',
        avatarInitials: officerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'DO',
      };

      const authenticatedOfficer = {
        ...activeProfile,
        name: officerName,
        badge: badgeId,
        station: station,
        loginTimestamp: Date.now(),
        tokenSessionId: `TOKEN-MH-${Math.floor(100000 + Math.random() * 900000)}`,
        hardwareKeyVerified: hardwareKeyChecked,
      };

      localStorage.setItem('sentinel_officer', JSON.stringify(authenticatedOfficer));
      setIsAuthenticating(false);
      if (onLoginSuccess) {
        onLoginSuccess(authenticatedOfficer);
      }
    }, 750);
  };

  return (
    <div 
      className="pipeline-dots"
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      {/* Background Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '350px',
        background: 'radial-gradient(ellipse at center, rgba(0, 168, 150, 0.12) 0%, rgba(11, 31, 58, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
      }}>
        {/* Top Official Seal Header */}
        <div style={{
          backgroundColor: '#0F172A',
          padding: '24px 24px 20px',
          borderBottom: '2px solid var(--primary)',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 194, 168, 0.15)',
            border: '2px solid var(--primary)',
            color: 'var(--primary)',
            marginBottom: '12px',
            boxShadow: '0 0 20px rgba(0, 194, 168, 0.25)',
          }}>
            <Shield size={28} />
          </div>

          <div style={{
            fontSize: '10px',
            color: '#94A3B8',
            fontWeight: '800',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Government of Maharashtra · Home Department
          </div>
          <h1 style={{
            fontSize: '18px',
            fontWeight: '800',
            color: '#F8FAFC',
            margin: '4px 0 2px',
            letterSpacing: '-0.02em',
          }}>
            STATE CYBER CRIME INVESTIGATION WING
          </h1>
          <div style={{
            fontSize: '11.5px',
            color: 'var(--primary)',
            fontWeight: '700',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
          }}>
            SENTINEL 2.0 · CENTRAL COMMAND DESK
          </div>

          <div style={{
            display: 'inline-block',
            marginTop: '10px',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#FCA5A5',
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.04em',
          }}>
            RESTRICTED ACCESS · STATUTORY DUTY LOG
          </div>
        </div>

        {/* Quick Demo Officer Profiles Switcher */}
        <div style={{
          backgroundColor: 'var(--secondary)',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Active Duty Officer (Demo Profiles)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '700' }}>
              1-Click Fast Fill
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {DEFAULT_OFFICER_PROFILES.map((prof) => {
              const isSelected = selectedProfileId === prof.id;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => handleSelectQuickProfile(prof)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--card)' : 'transparent',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--muted)',
                    color: isSelected ? '#FFFFFF' : 'var(--muted-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: '800',
                    marginBottom: '4px',
                  }}>
                    {prof.avatarInitials}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: isSelected ? 'var(--foreground)' : 'var(--muted-foreground)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                  }}>
                    {prof.name.split(' ')[1] || prof.name}
                  </span>
                  <span style={{
                    fontSize: '9.5px',
                    color: isSelected ? 'var(--primary)' : 'var(--muted-foreground)',
                    fontWeight: '600',
                  }}>
                    {prof.badge.split('-')[2] || 'CYB'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form Body */}
        <form onSubmit={handleLoginSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--destructive)',
              fontSize: '11.5px',
              fontWeight: '600',
            }}>
              <AlertCircle size={14} flexShrink={0} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Officer Name Field */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '5px' }}>
              Officer Name & Designation
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
            }}>
              <BadgeCheck size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="e.g. Inspector Rahul Deshmukh"
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
          </div>          {/* Officer Service Badge ID */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '5px' }}>
              Police Officer Badge ID
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
            }}>
              <Shield size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <input
                type="text"
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                placeholder="e.g. MH-CYB-PUN-4482"
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                }}
              />
            </div>
          </div>

          {/* Jurisdiction Station */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '5px' }}>
              Police Station Jurisdiction
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
            }}>
              <Building2 size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <select
                value={station}
                onChange={(e) => setStation(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                }}
              >
                <option value="Cyber Crime Police Station, Pune Commissionerate (Shivajinagar)">Cyber Crime Police Station, Pune Commissionerate (Shivajinagar)</option>
                <option value="Maharashtra State Cyber HQ (World Trade Centre, Mumbai)">Maharashtra State Cyber HQ (World Trade Centre, Mumbai)</option>
                <option value="Cyber Cell Thane City (Teen Hath Naka)">Cyber Cell Thane City (Teen Hath Naka)</option>
                <option value="Cyber Forensic Cell Navi Mumbai (CBD Belapur)">Cyber Forensic Cell Navi Mumbai (CBD Belapur)</option>
                <option value="Nagpur Regional Cyber Crime Cell (Civil Lines)">Nagpur Regional Cyber Crime Cell (Civil Lines)</option>
                <option value="Nashik Police Commissionerate Cyber Hub">Nashik Police Commissionerate Cyber Hub)</option>
                <option value="Chhatrapati Sambhajinagar Cyber Station">Chhatrapati Sambhajinagar Cyber Station</option>
                <option value="I4C Joint Cyber Coordination Team (JCCT) Desk">I4C Joint Cyber Coordination Team (JCCT) Desk</option>
              </select>
            </div>
          </div>

          {/* Security PIN and Token */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '5px' }}>
              Security PIN (6 Digits)
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
            }}>
              <Lock size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                maxLength={8}
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  letterSpacing: '0.25em',
                  fontWeight: '800',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <span style={{ fontSize: '10.5px', color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <CheckCircle2 size={12} />
                VERIFIED
              </span>
            </div>
          </div>

          {/* Statutory Security Checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '4px 0',
          }}>
            <input
              type="checkbox"
              checked={hardwareKeyChecked}
              onChange={(e) => setHardwareKeyChecked(e.target.checked)}
              style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
            />
            <span style={{ fontSize: '11.5px', color: 'var(--muted-foreground)' }}>
              Hardware Cryptographic Key Token Active (FIPS 140-2 Level 3)
            </span>
          </label>

          {/* Submit Login Action */}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="astrix-btn-primary"
            style={{
              padding: '12px',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
            }}
          >
            {isAuthenticating ? (
              <>
                <div style={{
                  width: '15px',
                  height: '15px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#FFFFFF',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                <span>Authenticating with Central Cyber Keyring...</span>
              </>
            ) : (
              <>
                <span>Authenticate & Access Command Center</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Footer Statutory Citation */}
        <div style={{
          backgroundColor: 'var(--secondary)',
          borderTop: '1px solid var(--border)',
          padding: '12px 24px',
          textAlign: 'center',
          fontSize: '10.5px',
          color: 'var(--muted-foreground)',
          lineHeight: 1.4,
        }}>
          Authorized access only under Section 105 & 106, Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 & Section 63 BSA 2023. All terminal sessions are digitally cryptographically logged.
        </div>
      </div>
    </div>
  );
}
