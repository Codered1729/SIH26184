import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScenarioControllerBar from './components/ScenarioControllerBar';
import PriorityQueue from './components/PriorityQueue';
import CaseDetail from './components/CaseDetail';
import GeospatialMap from './components/GeospatialMap';
import BNSSNoticeTerminal from './components/BNSSNoticeTerminal';
import AuditLedger from './components/AuditLedger';
import IntakeModal from './components/IntakeModal';
import { api, initAlertsWebSocket } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'dossier' | 'map' | 'bnss' | 'audit'
  const [selectedComplaintId, setSelectedComplaintId] = useState('CYB-MAH-2026-0819');
  const [highlightedAlertId, setHighlightedAlertId] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [outboxStatus, setOutboxStatus] = useState({});
  const [auditCount, setAuditCount] = useState(8);
  const [backendOnline, setBackendOnline] = useState(true);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);

  // Load active alerts, outbox telemetry, and audit counts
  const loadData = async () => {
    try {
      const alertsData = await api.getAlerts();
      if (alertsData && alertsData.alerts) {
        setAlerts(alertsData.alerts);
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

    // Backup short polling every 4 seconds to guarantee zero-fail resilience
    const interval = setInterval(loadData, 4000);

    return () => {
      cleanupWs();
      clearInterval(interval);
    };
  }, []);

  const handleSelectAlert = (alert) => {
    setSelectedComplaintId(alert.complaint_id);
    setActiveTab('dossier');
  };

  const handleDispatchAlert = async (alert) => {
    try {
      await api.dispatchAlert(alert.complaint_id);
      // Immediately mark as dispatched with 15-minute suppression cooldown
      setAlerts((prev) =>
        prev.map((a) =>
          a.complaint_id === alert.complaint_id
            ? { ...a, status: 'DISPATCHED', dispatch_cooldown_remaining: 900 }
            : a
        )
      );
      loadData();
    } catch (err) {
      console.error('Dispatch failed:', err);
    }
  };

  const handleOpenNotice = (complaintId) => {
    setSelectedComplaintId(complaintId);
    setActiveTab('bnss');
  };

  const handleComplaintSubmitted = (newResult) => {
    loadData();
    if (newResult && newResult.complaint_id) {
      setSelectedComplaintId(newResult.complaint_id);
      setHighlightedAlertId(newResult.complaint_id);
      setActiveTab('queue');
    }
  };

  const handleScenarioTriggered = (complaintId, scenarioId, alertData) => {
    loadData();
    setSelectedComplaintId(complaintId);
    setHighlightedAlertId(complaintId);
    setActiveTab('queue');

    // Remove pulse highlight after 7 seconds
    setTimeout(() => {
      setHighlightedAlertId((current) => (current === complaintId ? null : current));
    }, 7000);
  };

  const handleResetCompleted = () => {
    loadData();
    setHighlightedAlertId(null);
    setSelectedComplaintId('CYB-MAH-2026-0819');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      {/* Top Command Navbar with Authority Badge & Live Telemetry */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertsCount={alerts.length}
        auditCount={auditCount}
        backendOnline={backendOnline}
        outboxStatus={outboxStatus}
        onOpenIntake={() => setIsIntakeOpen(true)}
      />

      {/* Global Top Presentation Command Bar across all screens */}
      <ScenarioControllerBar
        onScenarioTriggered={handleScenarioTriggered}
        onResetCompleted={handleResetCompleted}
        activeCaseId={selectedComplaintId}
      />

      {/* Main 5-Screen Operational Command Workspace */}
      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '14px 20px' }}>
        {/* Screen 1: Priority Queue & Alert Feed */}
        {activeTab === 'queue' && (
          <PriorityQueue
            alerts={alerts}
            selectedComplaintId={selectedComplaintId}
            highlightedAlertId={highlightedAlertId}
            onSelectAlert={handleSelectAlert}
            onDispatchAlert={handleDispatchAlert}
            onRefresh={loadData}
          />
        )}

        {/* Screen 2: Forensic Case Dossier & Syndicate Graph */}
        {activeTab === 'dossier' && (
          <CaseDetail
            complaintId={selectedComplaintId}
            onBack={() => setActiveTab('queue')}
            onOpenNotice={handleOpenNotice}
            onDispatch={handleDispatchAlert}
          />
        )}

        {/* Screen 3: Pan-India Spatiotemporal Map & Maharashtra Hotspots */}
        {activeTab === 'map' && (
          <GeospatialMap
            onSelectAtm={(atm) => console.log('Selected ATM:', atm)}
            onDispatchAlert={handleDispatchAlert}
          />
        )}

        {/* Screen 4: Section 105 BNSS Lawful Notice & Outbox Terminal */}
        {activeTab === 'bnss' && (
          <BNSSNoticeTerminal
            complaintId={selectedComplaintId || "CYB-MAH-2026-0819"}
          />
        )}

        {/* Screen 5: Cryptographic Audit & Event Ledger */}
        {activeTab === 'audit' && (
          <AuditLedger
            onRefreshParent={loadData}
          />
        )}
      </main>

      {/* Live Raw Incident Intake Modal */}
      <IntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onComplaintSubmitted={handleComplaintSubmitted}
      />
    </div>
  );
}
