import React, { useState, useEffect } from 'react';
import SyndicateGraph from './SyndicateGraph';
import ModelConsensus from './ModelConsensus';
import { api } from '../services/api';
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  MapPin, 
  Building, 
  ShieldAlert, 
  ShieldCheck,
  AlertTriangle 
} from 'lucide-react';

export default function CaseDetail({ 
  complaintId, 
  onBack, 
  onOpenNotice, 
  onDispatch 
}) {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (complaintId) {
      setLoading(true);
      api.getAlertDossier(complaintId)
        .then((data) => setDossier(data))
        .finally(() => setLoading(false));
    }
  }, [complaintId]);

  if (loading) {
    return (
      <div className="astrix-card" style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '6px' }}>
          Loading Case Dossier...
        </div>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>
          Retrieving transaction graph, device links, and attestation ledger for {complaintId}
        </p>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="astrix-card" style={{ padding: '36px', textAlign: 'center' }}>
        <AlertTriangle size={28} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)' }}>Incident Record Not Found</h3>
        <button onClick={onBack} className="astrix-btn-outline" style={{ marginTop: '14px' }}>
          Back to Priority Queue
        </button>
      </div>
    );
  }

  const details = dossier.details || {};
  const isDispatched = details.status === 'DISPATCHED';
  const isDuplicate = details.authenticity_decision === 'DUPLICATE_UTR';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Banner with Action Controls */}
      <div className="astrix-card" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button 
              onClick={onBack}
              className="astrix-btn-outline"
              style={{ padding: '7px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Queue</span>
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--foreground)', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                  {dossier.complaint_id}
                </h2>
                {isDuplicate ? (
                  <span className="badge badge-held" style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '700' }}>
                    WINDOW SUSPENDED (GATE REJECTED)
                  </span>
                ) : (
                  <span className="badge badge-teal" style={{ padding: '4px 8px', fontSize: '11px' }}>
                    {details.situational_baseline || 'Dynamic Window'}
                  </span>
                )}
                {isDuplicate ? (
                  <span className="badge badge-held" style={{ padding: '4px 8px', fontSize: '11px' }}>
                    HELD: DUPLICATE UTR
                  </span>
                ) : (
                  <span className={`badge ${details.risk_tier === 'CRITICAL' ? 'badge-critical' : 'badge-elevated'}`} style={{ padding: '4px 8px', fontSize: '11px' }}>
                    {details.risk_tier} RISK
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                UTR: {details.utr} • Jurisdiction: {details.victim_city} ({details.area || 'Hinjawadi IT Corridor'})
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onOpenNotice(complaintId)}
              className="astrix-btn-outline"
              style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={14} style={{ color: 'var(--primary)' }} />
              <span>{isDuplicate ? 'Review Held Notice Dossier' : 'Open Complaint Ledger Notice'}</span>
            </button>

            {!isDispatched && !isDuplicate && (
              <button
                onClick={async () => {
                  if (onDispatch) await onDispatch(details);
                  setDossier((prev) =>
                    prev
                      ? {
                          ...prev,
                          details: {
                            ...prev.details,
                            status: 'DISPATCHED',
                            dispatch_cooldown_remaining: 900,
                          },
                        }
                      : prev
                  );
                }}
                className="astrix-btn-primary"
                style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={14} />
                <span>Dispatch Patrol Unit</span>
              </button>
            )}
            {isDispatched && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                color: '#16a34a',
                fontSize: '11.5px',
                fontWeight: '700',
              }}>
                <ShieldCheck size={14} />
                <span>Patrol Dispatched (Active Cooldown)</span>
              </div>
            )}
            {isDuplicate && (
              <div style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                color: '#7c3aed',
                fontSize: '11.5px',
                fontWeight: '700',
              }}>
                Automated Freeze & Dispatch Blocked
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Case Overview Metrics Strip - Astrix Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '14px',
      }}>
        {/* Complainant Strip */}
        <div className="astrix-metric-card">
          <div style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
            Origin Complainant
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--foreground)', marginTop: '2px' }}>
            {details.victim_city} Cyber Complainant
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {details.victim_account || 'SBIN0004123:3819201948'}
          </div>
        </div>

        {/* Amount Strip */}
        <div className="astrix-metric-card">
          <div style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
            Disputed Amount
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>
            ₹{details.amount?.toLocaleString('en-IN') || '78,000'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
            Channel: <strong style={{ color: 'var(--foreground)' }}>{details.channel || 'UPI'}</strong> (Hop {details.hop_depth || 1})
          </div>
        </div>

        {/* Beneficiary Mule Strip */}
        <div className="astrix-metric-card">
          <div style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
            Beneficiary Mule Layer
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#b45309', marginTop: '2px' }}>
            {details.leading_atm?.city ? `${details.leading_atm.city} Mule Node` : 'HDFC Primary Mule Node'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {details.beneficiary_account || 'HDFC0001048:50100482910'}
          </div>
        </div>

        {/* Target ATM Hotspot Strip */}
        <div className="astrix-metric-card">
          <div style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
            Target Cash-Out Terminal
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--foreground)', marginTop: '2px' }}>
            {details.leading_atm?.bank || 'HDFC'} — {details.leading_atm?.area || 'Terminal Hub'} {details.leading_atm?.city ? `(${details.leading_atm.city})` : ''}
          </div>
          <div style={{ fontSize: '11.5px', color: details.status === 'EXPIRED' ? 'var(--muted-foreground)' : 'var(--primary)', fontWeight: '700', marginTop: '2px' }}>
            {details.status === 'EXPIRED' ? 'Status: 45m Golden Window Expired' : `Hawkes Priority Score: ${((details.priority_score || 0.88) * 100).toFixed(0)}%`}
          </div>
        </div>
      </div>

      {/* Screen 2 Sub-Components: Flow Topology & Champion Model Card */}
      <SyndicateGraph dossier={dossier} />
      <ModelConsensus 
        consensusData={dossier.model_consensus} 
        championModel={dossier.champion_model || dossier.details?.champion_model} 
        details={details}
        caseDetails={details}
      />
    </div>
  );
}
