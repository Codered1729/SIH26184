import React from 'react';
import { 
  AstrixLogo, 
  HomeIcon, 
  ListIcon, 
  MapPinIcon, 
  ComplianceIcon, 
  ReportsIcon
} from './AstrixIcons';
import { 
  Plus, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Shield,
  X,
  LogOut
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
  onReplayOutbox,
  currentUser = null,
  onLockSession,
}) {
  const effectivelyCollapsed = isCollapsed && !isMobileOpen;

  const navItems = [
    { id: 'queue', label: 'Alerts Queue', icon: HomeIcon, count: alertsCount },
    { id: 'dossier', label: 'Case Details', icon: ListIcon },
    { id: 'map', label: 'ATM Map', icon: MapPinIcon },
    { id: 'bnss', label: 'Freeze Orders', icon: ComplianceIcon },
    { id: 'audit', label: 'Audit Logs', icon: ReportsIcon, count: auditCount },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            zIndex: 999,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside className={`astrix-sidebar ${effectivelyCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header - Brand logo + title, plus mobile-only close button */}
        <div style={{
          height: '56px',
          padding: effectivelyCollapsed ? '0 12px' : '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: effectivelyCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--sidebar-border)',
        }}>
          <div 
            onClick={effectivelyCollapsed ? onToggleCollapse : undefined}
            title={effectivelyCollapsed ? "Click to expand sidebar" : undefined}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              minWidth: 0,
              cursor: effectivelyCollapsed ? 'pointer' : 'default'
            }}
          >
            <AstrixLogo width={28} height={28} />
            {!effectivelyCollapsed && (
              <span style={{
                fontSize: '16px',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: 'var(--sidebar-foreground)',
                whiteSpace: 'nowrap',
              }}>
                SENTINEL
              </span>
            )}
          </div>

          {/* Close button visible only in mobile drawer view */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="astrix-btn-outline mobile-close-btn"
            style={{ padding: '6px', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Section */}
        <div style={{ flex: 1, padding: effectivelyCollapsed ? '12px 6px' : '14px 10px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
          <div>
            {!effectivelyCollapsed && (
              <p style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--sidebar-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px 6px', margin: 0 }}>
                Navigation
              </p>
            )}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                    title={effectivelyCollapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: effectivelyCollapsed ? 'center' : 'space-between',
                      width: '100%',
                      padding: effectivelyCollapsed ? '8px' : '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'var(--sidebar-accent)' : 'transparent',
                      color: isActive ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: isActive ? '700' : '500',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <IconComponent
                        width={18}
                        height={18}
                        style={{
                          color: isActive ? 'var(--primary)' : 'var(--sidebar-muted)',
                          flexShrink: 0
                        }}
                      />
                      {!effectivelyCollapsed && (
                        <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                      )}
                    </div>

                    {!effectivelyCollapsed && item.count !== undefined && (
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        backgroundColor: isActive ? 'var(--primary)' : 'var(--sidebar-accent)',
                        color: isActive ? '#FFFFFF' : 'var(--sidebar-muted)',
                      }}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Action Button */}
          {!effectivelyCollapsed && (
            <div>
              <p style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--sidebar-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px 6px', margin: 0 }}>
                Quick Action
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onOpenIntake) onOpenIntake();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="astrix-btn-primary"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  lineHeight: 1,
                }}
              >
                <Plus size={15} strokeWidth={2.5} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>Report Incident</span>
              </button>
            </div>
          )}

          {/* System Status Card */}
          {!effectivelyCollapsed && (
            <div style={{
              marginTop: 'auto',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--sidebar-accent)',
              border: '1px solid var(--sidebar-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--sidebar-muted)', textTransform: 'uppercase' }}>
                  System Status
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: backendOnline ? 'var(--success)' : 'var(--destructive)', fontWeight: '700' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: backendOnline ? 'var(--success)' : 'var(--destructive)' }} />
                  {backendOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--sidebar-muted)', margin: 0 }}>
                All services operational
              </p>
            </div>
          )}
        </div>

        {/* User Profile & Theme Toggle Footer */}
        <div style={{
          padding: effectivelyCollapsed ? '12px 8px' : '12px 14px',
          borderTop: '1px solid var(--sidebar-border)',
        }}>
          {!effectivelyCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                onClick={onLockSession}
                title="Click to lock session or switch officer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  flexShrink: 0,
                  cursor: 'pointer',
                  border: '1.5px solid var(--sidebar-border)',
                }}
              >
                {currentUser?.avatarInitials || <Shield size={16} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <span 
                  title={currentUser?.name || 'Duty Officer'}
                  style={{ 
                    fontSize: '12.5px', 
                    fontWeight: '700', 
                    color: 'var(--sidebar-foreground)', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3
                  }}
                >
                  {currentUser?.name || 'Duty Officer'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span 
                    title={currentUser?.badge || 'Maharashtra Control'}
                    style={{ fontSize: '10px', color: 'var(--sidebar-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-mono)' }}
                  >
                    {currentUser?.badge || 'Maharashtra Control'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {onLockSession && (
                      <button
                        type="button"
                        onClick={onLockSession}
                        title="Lock Terminal / Switch Duty Officer"
                        className="astrix-btn-outline"
                        style={{
                          padding: '4px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--secondary)',
                          color: 'var(--foreground)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <LogOut size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                      style={{
                        padding: '4px 6px',
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
                      {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div 
                onClick={onLockSession}
                title={`Duty Officer: ${currentUser?.name || 'Officer'} · Click to lock`}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  border: '1.5px solid var(--sidebar-border)',
                }}
              >
                {currentUser?.avatarInitials || <Shield size={15} />}
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                style={{
                  padding: '6px',
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
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
