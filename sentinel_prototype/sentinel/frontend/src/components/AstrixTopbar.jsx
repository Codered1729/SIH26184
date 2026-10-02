import React, { useRef, useEffect } from 'react';
import { 
  Search,
  Plus, 
  RotateCw, 
  Sun, 
  Moon, 
  Menu,
  X
} from 'lucide-react';
import { SidebarToggleIcon } from './AstrixIcons';

export default function AstrixTopbar({
  activeTab,
  isSidebarCollapsed = false,
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
    queue: 'Fraud Alerts Queue',
    dossier: 'Case Details',
    map: 'ATM Map & Locations',
    bnss: 'Bank Freeze Orders',
    audit: 'Audit Log',
  };

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
      {/* Left: Mobile Menu Toggle, Desktop Toggle, Desktop Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexShrink: 0 }}>
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="astrix-btn-outline mobile-menu-btn"
          style={{ padding: '6px', cursor: 'pointer' }}
          aria-label="Open Navigation"
        >
          <Menu size={16} />
        </button>

        {/* Desktop sidebar toggle button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="astrix-btn-outline desktop-only"
          style={{ 
            padding: '6px', 
            cursor: 'pointer', 
            borderRadius: 'var(--radius-sm)',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--foreground)'
          }}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label="Toggle Sidebar"
        >
          <SidebarToggleIcon width={16} height={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
            SENTINEL
          </span>
          <span style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>/</span>
          <h1 style={{
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--muted-foreground)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {tabTitles[activeTab] || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Center: Command Search Bar */}
      <div style={{ flex: 1, maxWidth: '420px', margin: '0 8px', minWidth: '120px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 10px',
          height: '36px',
        }}>
          <Search size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search by ID, city, or bank..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-sans)',
              minWidth: 0,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange && onSearchChange('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Telemetry, Primary CTA, Refresh, Theme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Live Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--card)',
          fontSize: '11px',
          fontWeight: '600',
          color: backendOnline ? 'var(--success)' : 'var(--destructive)',
        }}>
          <span style={{ position: 'relative', display: 'flex', width: '7px', height: '7px' }}>
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
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: backendOnline ? 'var(--success)' : 'var(--destructive)',
            }} />
          </span>
          <span style={{ display: 'inline', color: 'var(--foreground)' }}>
            {backendOnline ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh Feeds"
            className="astrix-btn-outline"
            style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
          >
            <RotateCw size={13} />
          </button>
        )}

        {/* Primary Action Button: New Report */}
        <button
          type="button"
          onClick={onOpenIntake}
          className="astrix-btn-primary"
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: '600',
            gap: '5px',
          }}
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>New Report</span>
        </button>

        {/* Theme Switcher Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="astrix-btn-outline"
          style={{
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            color: 'var(--foreground)'
          }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}
