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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Banner */}
      <div className="card" style={{ padding: '12px 16px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={onBack}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '11.5px' }}
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', fontWeight: '800' }}>
                  {dossier.complaint_id}
                </h2>
                <span className="badge badge-teal">
                  {details.situational_baseline || 'Standard Window'}
                </span>
                {isDuplicate ? (
                  <span className="badge badge-held">HELD: DUPLICATE UTR</span>
                ) : (
                  <span className={`badge ${details.risk_tier === 'CRITICAL' ? 'badge-critical' : 'badge-elevated'}`}>
                    {details.risk_tier} RISK
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
                UTR: {details.utr} • Jurisdiction: {details.victim_city} ({details.area})
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => onOpenNotice(complaintId)}
              className="btn btn-navy"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <FileText size={13} color="var(--color-teal)" />
              <span>Issue Sec. 105 BNSS Order</span>
            </button>

            {!isDispatched && !isDuplicate && (
              <button
                onClick={() => onDispatch(details)}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <Send size={13} />
                <span>Alert Beat Patrol</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Case Overview Metrics Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
      }}>
        {/* Complainant Strip */}
        <div className="card" style={{ padding: '10px 14px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
            Complainant Account
          </div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-navy)', marginTop: '2px' }}>
            {details.victim_city} Cyber Complainant
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
            {details.victim_account || 'SBIN0004123:3819201948'}
          </div>
        </div>

        {/* Amount Strip */}
        <div className="card" style={{ padding: '10px 14px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
            Defrauded Amount
          </div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#B91C1C', marginTop: '1px' }}>
            ₹{details.amount?.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            Channel: <strong>{details.channel || 'UPI'}</strong> (Hop {details.hop_depth || 1})
          </div>
        </div>

        {/* Beneficiary Mule Strip */}
        <div className="card" style={{ padding: '10px 14px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
            Beneficiary Mule Node
          </div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#B45309', marginTop: '2px' }}>
            HDFC Primary Mule Node
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
            {details.beneficiary_account || 'HDFC0001048:50100482910'}
          </div>
        </div>

        {/* Target ATM Hotspot Strip */}
        <div className="card" style={{ padding: '10px 14px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
            Predicted Cash-Out ATM
          </div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-navy)', marginTop: '2px' }}>
            {details.leading_atm?.bank} — {details.leading_atm?.area}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-teal-dark)', fontWeight: '700' }}>
            Priority Score: {(details.priority_score * 100).toFixed(0)}%
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
