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
      <div className="card" style={{ padding: '40px', textAlign: 'center', backgroundColor: '#FFFFFF' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '4px' }}>
          Loading Case Dossier...
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: '12px' }}>
          Retrieving transaction graph, device links, and attestation ledger for {complaintId}
        </p>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="card" style={{ padding: '30px', textAlign: 'center', backgroundColor: '#FFFFFF' }}>
        <AlertTriangle size={24} color="#DC2626" style={{ margin: '0 auto 8px' }} />
        <h3 style={{ fontSize: '13px' }}>Incident Record Not Found</h3>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '10px' }}>
          Back to Priority Queue
        </button>
      </div>
    );
  }

  const details = dossier.details || {};
  const isDispatched = details.status === 'DISPATCHED';
  const isDuplicate = details.authenticity_decision === 'DUPLICATE_UTR';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner with Action Controls */}
      <div className="card" style={{ padding: '16px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={onBack}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Queue</span>
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.3rem', color: 'var(--color-navy)', fontWeight: '800', margin: 0 }}>
                  {dossier.complaint_id}
                </h2>
                <span className="badge badge-teal" style={{ padding: '4px 8px', fontSize: '11px' }}>
                  {details.situational_baseline || 'Dynamic Window'}
                </span>
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
              <div style={{ fontSize: '11.5px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                UTR: {details.utr} • Jurisdiction: {details.victim_city} ({details.area || 'Hinjawadi IT Corridor'})
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onOpenNotice(complaintId)}
              className="btn btn-navy"
              style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: '600' }}
            >
              <FileText size={14} color="var(--color-teal)" />
              <span>Issue Section 105 Notice</span>
            </button>

            {!isDispatched && !isDuplicate && (
              <button
                onClick={() => onDispatch(details)}
                className="btn btn-primary"
                style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: '600' }}
              >
                <Send size={14} />
                <span>Dispatch Police Beat</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Case Overview Metrics Strip - Spacious, High-Contrast KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '14px',
      }}>
        {/* Complainant Strip */}
        <div className="card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
            Origin Complainant
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-navy)', marginTop: '4px' }}>
            {details.victim_city} Cyber Complainant
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {details.victim_account || 'SBIN0004123:3819201948'}
          </div>
        </div>

        {/* Amount Strip */}
        <div className="card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
            Disputed Amount
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#B91C1C', marginTop: '2px' }}>
            ₹{details.amount?.toLocaleString('en-IN') || '78,000'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            Channel: <strong>{details.channel || 'UPI'}</strong> (Hop {details.hop_depth || 1})
          </div>
        </div>

        {/* Beneficiary Mule Strip */}
        <div className="card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
            Beneficiary Mule Layer
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#B45309', marginTop: '4px' }}>
            HDFC Primary Mule Node
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {details.beneficiary_account || 'HDFC0001048:50100482910'}
          </div>
        </div>

        {/* Target ATM Hotspot Strip */}
        <div className="card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
            Target Cash-Out Terminal
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-navy)', marginTop: '4px' }}>
            {details.leading_atm?.bank || 'HDFC'} — {details.leading_atm?.area || 'Hinjawadi Phase 1'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-teal-dark)', fontWeight: '700', marginTop: '2px' }}>
            Hawkes Priority Score: {((details.priority_score || 0.88) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Screen 2 Sub-Components: Flow Topology & Champion Model Card */}
      <SyndicateGraph dossier={dossier} />
      <ModelConsensus 
        consensusData={dossier.model_consensus} 
        championModel={dossier.champion_model || dossier.details?.champion_model} 
      />
    </div>
  );
}
