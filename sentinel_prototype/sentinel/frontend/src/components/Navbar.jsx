import React from 'react';
import { 
  Shield, 
  Layers, 
  MapPin, 
  FileText, 
  FileClock,
  Activity, 
  Database, 
  Plus, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  alertsCount = 0, 
  auditCount = 0,
  backendOnline = true, 
  outboxStatus = {}, 
  onOpenIntake 
}) {
  const tabs = [
    { id: 'queue', label: 'Priority Triage Queue', icon: Shield, badge: alertsCount },
    { id: 'dossier', label: 'Case Dossier & Graph', icon: Layers },
    { id: 'map', label: 'Maharashtra ATM Hotspots', icon: MapPin },
    { id: 'bnss', label: 'Section 105 BNSS Orders', icon: FileText },
    { id: 'audit', label: 'Audit & Event Ledger', icon: FileClock, badge: auditCount || undefined },
  ];

  const circuitState = outboxStatus?.circuit_breaker?.state || 'CLOSED';
  const pendingCount = outboxStatus?.outbox?.pending_count || 0;

  return (
    <header style={{
      backgroundColor: 'var(--color-navy)',
      color: '#FFFFFF',
      borderBottom: '1px solid #1E3A5F',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      {/* Top Header Bar */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Brand & Authority Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Shield size={18} color="#0B1F3A" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '0.04em', color: '#FFFFFF' }}>
                SENTINEL
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '1px 5px',
                borderRadius: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#CBD5E1',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                letterSpacing: '0.03em',
              }}>
                SIH 26184
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>
              Maharashtra State Cyber Police • Inter-Bank CFCFRMS Golden Window Intervention
            </div>
          </div>
        </div>

        {/* Operational Telemetry Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Circuit Breaker Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            fontSize: '11px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}>
            <span className={`indicator-dot ${circuitState === 'CLOSED' ? 'dot-teal' : 'dot-red'}`}></span>
            <span style={{ color: '#94A3B8' }}>Gateway:</span>
            <span style={{ 
              fontWeight: '700', 
              color: circuitState === 'CLOSED' ? '#34D399' : '#F87171' 
            }}>
              {circuitState === 'CLOSED' ? 'NORMAL' : 'ISOLATED'}
            </span>
          </div>

          {/* Outbox Backlog */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            fontSize: '11px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}>
            <Database size={12} color="#94A3B8" />
            <span style={{ color: '#94A3B8' }}>Outbox:</span>
            <span style={{ 
              fontWeight: '700', 
              color: pendingCount > 0 ? '#FBBF24' : '#34D399' 
            }}>
              {pendingCount} Queued
            </span>
          </div>

          {/* Ingest Incident Button */}
          <button 
            onClick={onOpenIntake}
            className="btn btn-primary"
            style={{ 
              padding: '5px 12px', 
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            <Plus size={14} />
            <span>Register Incident / SMS</span>
          </button>
        </div>
      </div>

      {/* Navigation Screen Tabs */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        backgroundColor: '#071526',
        overflowX: 'auto',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 16px',
                fontSize: '12.5px',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                backgroundColor: isActive ? '#0B1F3A' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--color-teal)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={14} strokeWidth={isActive ? 2.4 : 1.8} color={isActive ? 'var(--color-teal)' : '#94A3B8'} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span style={{
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '700',
                  backgroundColor: isActive ? 'var(--color-teal)' : 'rgba(255, 255, 255, 0.15)',
                  color: isActive ? '#0B1F3A' : '#FFFFFF',
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
