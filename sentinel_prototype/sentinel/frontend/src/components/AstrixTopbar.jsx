import React, { useRef, useEffect } from 'react';
import { 
  SearchIcon, 
  CmdIcon, 
  SidebarToggleIcon 
} from './AstrixIcons';
import { 
  Plus, 
  RotateCw, 
  Sun, 
  Moon, 
  Shield, 
  Activity, 
  Database,
  Menu
} from 'lucide-react';

export default function AstrixTopbar({
  activeTab,
  onToggleSidebar,
  onOpenMobileSidebar,
  searchQuery = '',
  onSearchChange,
  backendOnline = true,
  outboxStatus = {},
  onOpenIntake,
  onRefresh,
  theme = 'light',
  onToggleTheme,
  onReplayOutbox,
}) {
  const searchInputRef = useRef(null);

  const tabTitles = {
    queue: 'Priority Queue & Real-Time Triage',
    dossier: 'Forensic Case Dossier & XAI Analysis',
    map: 'Spatiotemporal Hawkes ATM Interception',
    bnss: 'Section 105 & 106 BNSS Statutory Notice Terminal',
    audit: 'Tamper-Evident SHA-256 Audit Trail',
  };

  const circuitState = outboxStatus?.circuit_breaker?.state || 'CLOSED';
  const pendingCount = outboxStatus?.outbox?.pending_count || 0;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="astrix-topbar">
      {/* Left: Mobile Menu Toggle, Desktop Toggle, & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="astrix-btn-outline"
          style={{ padding: '6px', display: 'flex', cursor: 'pointer' }}
          aria-label="Open Navigation"
        >
          <Menu size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>
            SENTINEL
          </span>
          <span style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>/</span>
          <h1 style={{
            fontSize: '14px',
            fontWeight: '700',
            color: 'var(--foreground)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {tabTitles[activeTab] || 'Cyber Command Dashboard'}
          </h1>
        </div>
      </div>

      {/* Center: Command Search Bar */}
      <div style={{ flex: 1, maxWidth: '440px', margin: '0 12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          height: '38px',
          transition: 'border-color 0.15s ease',
        }}>
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" style={{ color: 'var(--muted-foreground)' }} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search complaints, UTRs, ATMs... (Cmd+K)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange && onSearchChange('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Clear
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '2px 5px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--muted-foreground)',
              fontSize: '10px',
              fontWeight: '700',
            }}>
              <CmdIcon className="size-2.5" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Telemetry, Primary CTA, Refresh, Theme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Live Pipeline Badge with Animated Dot */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--card)',
          fontSize: '11px',
          fontWeight: '600',
          color: backendOnline ? 'var(--success)' : 'var(--destructive)',
        }}>
          <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
            <span style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: backendOnline ? 'var(--success)' : 'var(--destructive)',
              opacity: 0.75,
              animation: 'pulse-ring 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            }} />
            <span style={{
              position: 'relative',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: backendOnline ? 'var(--success)' : 'var(--destructive)',
            }} />
          </span>
          <span style={{ display: 'inline', color: 'var(--foreground)' }}>
            {backendOnline ? 'Live Pipeline' : 'Offline'}
          </span>
        </div>

        {/* Nodal Outbox Circuit Badge */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid',
          borderColor: circuitState === 'OPEN' ? 'color-mix(in srgb, var(--destructive) 40%, transparent)' : 'var(--border)',
          backgroundColor: circuitState === 'OPEN' ? 'color-mix(in srgb, var(--destructive) 10%, transparent)' : 'var(--card)',
          fontSize: '11px',
          fontWeight: '600',
          color: circuitState === 'OPEN' ? 'var(--destructive)' : 'var(--muted-foreground)',
        }}
        className="md:inline-flex"
        >
          <Database size={12} />
          <span>WAL: {circuitState}</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh Real-time Feeds"
            className="astrix-btn-outline"
            style={{ padding: '7px 9px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
          >
            <RotateCw size={14} />
          </button>
        )}

        {/* Primary Action Button: Log Incident */}
        <button
          type="button"
          onClick={onOpenIntake}
          className="btn btn-primary"
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: '600',
            gap: '6px',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span style={{ display: 'inline' }}>Log Incident</span>
        </button>

        {/* Theme Switcher Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="astrix-btn-outline"
          style={{
            padding: '7px 9px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            color: 'var(--foreground)'
          }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
