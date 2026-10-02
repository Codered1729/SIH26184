import React from 'react';
import { 
  AstrixLogo, 
  HomeIcon, 
  ClassificationIcon, 
  MapPinIcon, 
  ComplianceIcon, 
  ReportsIcon, 
  SidebarToggleIcon 
} from './AstrixIcons';
import { 
  Plus, 
  Sun, 
  Moon, 
  RotateCw, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Database
} from 'lucide-react';

export default function AstrixSidebar({
  activeTab,
  setActiveTab,
  alertsCount = 0,
  auditCount = 0,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  onOpenIntake,
  theme = 'light',
  onToggleTheme,
  backendOnline = true,
  outboxStatus = {},
  onReplayOutbox
}) {
  const navItems = [
    { id: 'queue', label: 'Priority Queue', icon: HomeIcon, count: alertsCount },
    { id: 'dossier', label: 'Case Dossier', icon: ClassificationIcon },
    { id: 'map', label: 'ATM Hotspots', icon: MapPinIcon },
    { id: 'bnss', label: 'BNSS Notices', icon: ComplianceIcon },
    { id: 'audit', label: 'Audit Ledger', icon: ReportsIcon, count: auditCount },
  ];

  const circuitState = outboxStatus?.circuit_breaker?.state || 'CLOSED';
  const pendingCount = outboxStatus?.outbox?.pending_count || 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 35,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside className={`astrix-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand & Collapse Header */}
        <div style={{
          height: '64px',
          padding: isCollapsed ? '0 12px' : '0 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--sidebar-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <AstrixLogo className="size-8 shrink-0" />
            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--sidebar-foreground)' }}>
                  SENTINEL
                </span>
                <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--sidebar-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Cyber Forensics AI
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="astrix-btn-outline"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--sidebar-muted)',
              display: isCollapsed ? 'none' : 'flex',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            <SidebarToggleIcon className="size-4.5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div style={{ flex: 1, padding: isCollapsed ? '16px 8px' : '16px 12px', display: 'flex', flexDirection: 'column', gap: '22px', overflowY: 'auto' }}>
          <div>
            {!isCollapsed && (
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--sidebar-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 8px' }}>
                Operational Command
              </p>
            )}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'space-between',
                      width: '100%',
                      padding: isCollapsed ? '10px' : '9px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--primary)' : 'transparent',
                      backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                      color: isActive ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)',
                      fontWeight: isActive ? '600' : '500',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <IconComponent className="size-4.5 shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && item.count !== undefined && item.count > 0 && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isActive ? 'var(--card)' : 'var(--secondary)',
                        color: isActive ? 'var(--primary)' : 'var(--foreground)',
                      }}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Action: Log Incident */}
          <div>
            {!isCollapsed && (
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--sidebar-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 8px' }}>
                Quick Triage
              </p>
            )}
            <button
              type="button"
              onClick={onOpenIntake}
              title={isCollapsed ? "Log New Complaint" : undefined}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: isCollapsed ? '10px' : '9px 12px',
                borderRadius: 'var(--radius-md)',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              {!isCollapsed && <span>Ingest Raw Complaint</span>}
            </button>
          </div>

          {/* System Telemetry Status (Astrix Pipeline Pill) */}
          {!isCollapsed && (
            <div style={{
              marginTop: 'auto',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)' }}>
                  State Gateway
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: '700',
                  color: circuitState === 'OPEN' ? 'var(--destructive)' : 'var(--success)'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: circuitState === 'OPEN' ? 'var(--destructive)' : 'var(--success)'
                  }} />
                  {circuitState === 'OPEN' ? 'OUTAGE (DLQ)' : 'ONLINE'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={13} className="text-muted-foreground" />
                <span>SQLite WAL: {pendingCount} queued</span>
              </div>
              {circuitState === 'OPEN' && onReplayOutbox && (
                <button
                  onClick={onReplayOutbox}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '11px', padding: '4px 8px' }}
                >
                  <RotateCw size={12} />
                  Replay Backlog
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Profile & Theme Toggle Footer */}
        <div style={{
          padding: isCollapsed ? '12px 8px' : '14px 16px',
          borderTop: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: '8px',
        }}>
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700',
                flexShrink: 0,
              }}>
                MH
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--sidebar-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Insp. MH-8842
                </span>
                <span style={{ fontSize: '10px', color: 'var(--sidebar-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Maharashtra Cyber
                </span>
              </div>
            </div>
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '700',
            }}>
              MH
            </div>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              padding: '7px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--secondary)',
              color: 'var(--foreground)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </aside>
    </>
  );
}
