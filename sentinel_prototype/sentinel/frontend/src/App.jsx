import React, { useState, useEffect, useRef } from 'react';
import AstrixSidebar from './components/AstrixSidebar';
import AstrixTopbar from './components/AstrixTopbar';
import ScenarioControllerBar from './components/ScenarioControllerBar';
import PriorityQueue from './components/PriorityQueue';
import CaseDetail from './components/CaseDetail';
import GeospatialMap from './components/GeospatialMap';
import BNSSNoticeTerminal from './components/BNSSNoticeTerminal';
import AuditLedger from './components/AuditLedger';
import IntakeModal from './components/IntakeModal';
import DutyOfficerLogin, { DEFAULT_OFFICER_PROFILES } from './components/DutyOfficerLogin';
import DispatchConfirmationModal from './components/DispatchConfirmationModal';
import { api, initAlertsWebSocket } from './services/api';

// Baseline complaint ID constant for resilient resets across seed modifications
export const BASELINE_COMPLAINT_ID = 'CYB-MAH-2026-0819';

export default function App() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'dossier' | 'map' | 'bnss' | 'audit'
  const [selectedComplaintId, setSelectedComplaintId] = useState(BASELINE_COMPLAINT_ID);
  const [highlightedAlertId, setHighlightedAlertId] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [outboxStatus, setOutboxStatus] = useState({});
  const [auditCount, setAuditCount] = useState(8);
  const [backendOnline, setBackendOnline] = useState(true);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dispatchConfirmation, setDispatchConfirmation] = useState(null);
  const [dispatchedCids, setDispatchedCids] = useState(() => new Set());
  const dispatchedCidsRef = useRef(new Set());

  // Active Duty Officer session state: Login page is default entry homepage
  const [currentUser, setCurrentUser] = useState(null);
  const [isSessionLocked, setIsSessionLocked] = useState(false);

  // Astrix Dashboard UI Layout & Theme State (Default to Light Mode)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('astrix_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  // Sync theme with document element and body classes
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.body.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.body.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      localStorage.setItem('astrix_theme', theme);
    } catch (e) {
      console.warn('Could not persist theme preference:', e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Load active alerts, outbox telemetry, and audit counts
  const loadData = async () => {
    try {
      const alertsData = await api.getAlerts();
      if (alertsData && alertsData.alerts) {
        setAlerts((prev) => {
          return alertsData.alerts.map((a) => {
            if (dispatchedCidsRef.current.has(a.complaint_id) || a.status === 'DISPATCHED' || (a.dispatch_cooldown_remaining > 0)) {
              return {
                ...a,
                status: 'DISPATCHED',
                dispatch_cooldown_remaining: a.dispatch_cooldown_remaining || 900,
              };
            }
            return a;
          });
        });
        if (!selectedComplaintId && alertsData.alerts.length > 0) {
          setSelectedComplaintId(alertsData.alerts[0].complaint_id);
        }
      }

      const outbox = await api.getOutboxStatus();
      if (outbox) {
        setOutboxStatus(outbox);
        setBackendOnline(true);
      }

      const auditData = await api.getAuditLogs(10);
      if (auditData && auditData.total) {
        setAuditCount(auditData.total);
      }
    } catch (err) {
      console.warn('API connection failed, falling back to local dataset:', err);
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    loadData();

    // Initialize real-time WebSocket telemetry stream with automatic fallback
    const cleanupWs = initAlertsWebSocket(
      (envelope) => {
        if (!envelope || !envelope.event_type) return;

        // Refresh state when event occurs
        loadData();

        // Increment audit badge count
        if (envelope.audit_entry) {
          setAuditCount((prev) => prev + 1);
        }

        // If a new alert or scenario was triggered, highlight it
        if (envelope.data && envelope.data.complaint_id) {
          setSelectedComplaintId(envelope.data.complaint_id);
          setHighlightedAlertId(envelope.data.complaint_id);
        }
      },
      (isOnline) => {
        setBackendOnline(isOnline);
      }
    );

    // Backup short polling every 2 seconds to guarantee real-time telemetry sync
    const interval = setInterval(loadData, 2000);

    return () => {
      cleanupWs();
      clearInterval(interval);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 650);
  };

  const handleSelectAlert = (alert) => {
    setSelectedComplaintId(alert.complaint_id);
    setActiveTab('dossier');
  };

  const handleDispatchAlert = async (alert) => {
    try {
      const cid = typeof alert === 'string'
        ? alert
        : (alert?.complaint_id || alert?.complaintId || selectedComplaintId || BASELINE_COMPLAINT_ID);

      // Add to persistent dispatched set so background short polling never reverts it
      dispatchedCidsRef.current.add(cid);
      setDispatchedCids((prev) => new Set([...prev, cid]));

      await api.dispatchAlert(cid);

      // Immediately mark as dispatched with 15-minute suppression cooldown in state
      setAlerts((prev) =>
        prev.map((a) =>
          a.complaint_id === cid
            ? { ...a, status: 'DISPATCHED', dispatch_cooldown_remaining: 900 }
            : a
        )
      );

      // Find full alert details for rich modal display
      const targetAlert = alerts.find((a) => a.complaint_id === cid) || (typeof alert === 'object' ? alert : { complaint_id: cid });
      setDispatchConfirmation({
        ...targetAlert,
        complaint_id: cid,
        cooldown_remaining: 900,
      });

      await loadData();
    } catch (err) {
      console.error('Dispatch failed:', err);
    }
  };

  const handleOpenNotice = (complaintId) => {
    setSelectedComplaintId(complaintId);
    setActiveTab('bnss');
  };

  const handleReplayOutbox = async () => {
    try {
      await api.replayOutbox();
      loadData();
    } catch (err) {
      console.error('Replay outbox failed:', err);
    }
  };

  const handleComplaintSubmitted = (newResult) => {
    // 0ms instant optimistic UI state update: put newly ingested incident directly into queue state
    if (newResult && newResult.alert) {
      setAlerts((prev) => {
        const exists = prev.some((a) => a.complaint_id === newResult.alert.complaint_id);
        if (exists) {
          return prev.map((a) => (a.complaint_id === newResult.alert.complaint_id ? { ...a, ...newResult.alert } : a));
        }
        return [newResult.alert, ...prev];
      });
    }

    loadData();
    if (newResult && newResult.complaint_id) {
      setSelectedComplaintId(newResult.complaint_id);
      setHighlightedAlertId(newResult.complaint_id);
      setActiveTab('queue');

      setTimeout(() => {
        setHighlightedAlertId((current) => (current === newResult.complaint_id ? null : current));
      }, 7000);
    }
  };

  const handleScenarioTriggered = (complaintId, scenarioId, alertData) => {
    // 0ms instant optimistic UI state update
    if (alertData && alertData.complaint_id) {
      setAlerts((prev) => {
        const exists = prev.some((a) => a.complaint_id === alertData.complaint_id);
        if (exists) {
          return prev.map((a) => (a.complaint_id === alertData.complaint_id ? { ...a, ...alertData } : a));
        }
        return [alertData, ...prev];
      });
    }

    loadData();
    setSelectedComplaintId(complaintId);
    setHighlightedAlertId(complaintId);
    setActiveTab('queue');

    // Smoothly scroll down to the targeted incident case card
    setTimeout(() => {
      const cardEl = document.getElementById(`alert-card-${complaintId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const contentEl = document.querySelector('.astrix-content') || document.querySelector('main');
        if (contentEl) {
          contentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 150);

    // Remove pulse highlight after 7 seconds
    setTimeout(() => {
      setHighlightedAlertId((current) => (current === complaintId ? null : current));
    }, 7000);
  };

  const handleResetCompleted = async () => {
    setIsRefreshing(true);
    await loadData();
    setHighlightedAlertId(null);
    setSelectedComplaintId(BASELINE_COMPLAINT_ID);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 750);
  };

  const handleLockSession = () => {
    try {
      localStorage.removeItem('sentinel_officer');
      sessionStorage.removeItem('sentinel_officer_session');
    } catch (e) {
      console.warn('Could not clear officer storage:', e);
    }
    setCurrentUser(null);
    setIsSessionLocked(true);
  };

  // If duty officer locked the terminal or is unauthenticated, present official command login
  if (isSessionLocked || !currentUser) {
    return (
      <DutyOfficerLogin
        onLoginSuccess={(officer) => {
          setCurrentUser(officer);
          setIsSessionLocked(false);
          try {
            sessionStorage.setItem('sentinel_officer_session', JSON.stringify(officer));
          } catch (e) {}
        }}
      />
    );
  }

  return (
    <div className={`astrix-root ${theme === 'dark' ? 'dark' : 'light'}`}>
      {/* Astrix Collapsible Sidebar */}
      <AstrixSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertsCount={alerts.length}
        auditCount={auditCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenIntake={() => setIsIntakeOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        backendOnline={backendOnline}
        outboxStatus={outboxStatus}
        onReplayOutbox={handleReplayOutbox}
        currentUser={currentUser}
        onLockSession={handleLockSession}
      />

      {/* Main Column: Topbar + Simulator Ribbon + Fluid Workspace */}
      <div className="astrix-main">
        {/* Astrix Topbar with Breadcrumbs, Command Search (Cmd+K), and Global Actions */}
        <AstrixTopbar
          activeTab={activeTab}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          backendOnline={backendOnline}
          outboxStatus={outboxStatus}
          onOpenIntake={() => setIsIntakeOpen(true)}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          currentUser={currentUser}
          onLockSession={handleLockSession}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onReplayOutbox={handleReplayOutbox}
        />

        {/* Global Live Scenario Simulation Controller with Astrix Segmented Controls */}
        <ScenarioControllerBar
          onScenarioTriggered={handleScenarioTriggered}
          onResetCompleted={handleResetCompleted}
          activeCaseId={selectedComplaintId}
        />

        {/* Operational Workspace with Astrix Technical Dot Matrix Background and Refresh Pulse */}
        <main className={`astrix-content pipeline-dots ${isRefreshing ? 'site-refreshing' : ''}`}>
          {/* Screen 1: Priority Queue & Real-Time Alert Feed */}
          {activeTab === 'queue' && (
            <PriorityQueue
              alerts={alerts}
              selectedComplaintId={selectedComplaintId}
              highlightedAlertId={highlightedAlertId}
              onSelectAlert={handleSelectAlert}
              onDispatchAlert={handleDispatchAlert}
              onRefresh={handleManualRefresh}
              isRefreshing={isRefreshing}
              searchQuery={searchQuery}
            />
          )}

          {/* Screen 2: Forensic Case Dossier & XAI Analysis */}
          {activeTab === 'dossier' && (
            <CaseDetail
              complaintId={selectedComplaintId}
              onBack={() => setActiveTab('queue')}
              onOpenNotice={handleOpenNotice}
              onDispatch={handleDispatchAlert}
            />
          )}

          {/* Screen 3: Spatiotemporal Hawkes ATM Interception & Cluster Map */}
          {activeTab === 'map' && (
            <GeospatialMap
              alerts={alerts}
              onSelectAlert={handleSelectAlert}
              onSelectAtm={(atm) => console.log('Selected ATM:', atm)}
              onDispatchAlert={handleDispatchAlert}
            />
          )}

          {/* Screen 4: Section 105 BNSS Statutory Notice Terminal */}
          {activeTab === 'bnss' && (
            <BNSSNoticeTerminal
              complaintId={selectedComplaintId || BASELINE_COMPLAINT_ID}
            />
          )}

          {/* Screen 5: Tamper-Evident SHA-256 Audit Ledger */}
          {activeTab === 'audit' && (
            <AuditLedger
              onRefreshParent={loadData}
            />
          )}
        </main>
      </div>

      {/* Live Incident Intake Modal */}
      <IntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onComplaintSubmitted={handleComplaintSubmitted}
      />

      {/* Law Enforcement Interceptor Dispatch Confirmation Modal */}
      {dispatchConfirmation && (
        <DispatchConfirmationModal
          dispatchInfo={dispatchConfirmation}
          onClose={() => setDispatchConfirmation(null)}
          onNavigateToMap={() => {
            setActiveTab('map');
            setDispatchConfirmation(null);
          }}
          onNavigateToNotice={(cid) => {
            handleOpenNotice(cid);
            setDispatchConfirmation(null);
          }}
        />
      )}
    </div>
  );
}
