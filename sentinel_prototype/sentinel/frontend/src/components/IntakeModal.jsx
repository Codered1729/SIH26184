import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Plus, CheckCircle2, AlertTriangle, FileInput } from 'lucide-react';

export default function IntakeModal({ isOpen, onClose, onComplaintSubmitted }) {
  const [rawText, setRawText] = useState('');
  const [victimCity, setVictimCity] = useState('Pune');
  const [channel, setChannel] = useState('UPI');
  const [amount, setAmount] = useState('78000');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleLoadDemo = (type) => {
    if (type === 'genuine') {
      setRawText("Rs 78000.00 debited from a/c **4123 via UPI on 25-09-2026. UTR: 429104829105. Hinjawadi IT Corridor victim reporting unauthorized debit.");
      setVictimCity('Pune');
      setChannel('UPI');
      setAmount('78000');
    } else if (type === 'duplicate') {
      setRawText("Rs 65000.00 debited from a/c **9999 via UPI on 25-09-2026. UTR: 429104829102. Repeated duplicate complaint.");
      setVictimCity('Mumbai');
      setChannel('UPI');
      setAmount('65000');
    } else if (type === 'neft') {
      setRawText("IMPS transaction of Rs 135000.00 credited to account 1029481920. Layered transfer from Thane corridor to Ahmedabad hub.");
      setVictimCity('Thane');
      setChannel('IMPS');
      setAmount('135000');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.submitComplaint({
        raw_text: rawText,
        victim_city: victimCity,
        channel: channel,
        amount: parseFloat(amount) || 50000.0,
      });
      setResult(res);
      if (onComplaintSubmitted) onComplaintSubmitted(res);
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 1200);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(11, 31, 58, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px',
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        padding: '18px 20px',
        position: 'relative',
        border: '1px solid var(--border-medium)',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-muted)',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={18} color="var(--color-teal)" />
            Register Cyber Incident / SMS Ingestion
          </h3>
          <p style={{ fontSize: '11.5px', color: 'var(--color-muted)', marginTop: '1px' }}>
            Paste complainant SMS debit advice or enter incident parameters for automated triage and UTR deduplication.
          </p>
        </div>

        {/* Sample Records Strip */}
        <div style={{ marginBottom: '12px', padding: '8px 10px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
            Sample Incident Records:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleLoadDemo('genuine')}
              className="btn btn-secondary"
              style={{ padding: '3px 8px', fontSize: '11px' }}
            >
              1. Genuine UPI (₹78k - Pune)
            </button>
            <button
              type="button"
              onClick={() => handleLoadDemo('duplicate')}
              className="btn btn-secondary"
              style={{ padding: '3px 8px', fontSize: '11px', borderColor: '#FCA5A5', color: '#B91C1C' }}
            >
              2. Duplicate UTR (Sybil Rejection)
            </button>
            <button
              type="button"
              onClick={() => handleLoadDemo('neft')}
              className="btn btn-secondary"
              style={{ padding: '3px 8px', fontSize: '11px' }}
            >
              3. Multi-Hop IMPS (₹1.35L - Thane ➔ Ahmedabad)
            </button>
          </div>
        </div>

        {/* Ingestion Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Raw Text Input */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--color-navy)', display: 'block', marginBottom: '3px' }}>
              Complainant Debit SMS / Notification Text
            </label>
            <textarea
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. Rs 65000 debited from a/c **4123 via UPI on 25-09-2026. UTR: 429104829102"
              required
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
              }}
            />
          </div>

          {/* Form Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-muted)', display: 'block', marginBottom: '2px' }}>
                Victim District
              </label>
              <select
                value={victimCity}
                onChange={(e) => setVictimCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '11.5px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Nagpur">Nagpur</option>
                <option value="Nashik">Nashik</option>
                <option value="Thane">Thane</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-muted)', display: 'block', marginBottom: '2px' }}>
                Payment Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '11.5px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="UPI">UPI</option>
                <option value="IMPS">IMPS</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-muted)', display: 'block', marginBottom: '2px' }}>
                Amount (INR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '11.5px',
                }}
              />
            </div>
          </div>

          {/* Result Banner if submitted */}
          {result && (
            <div style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: result.decision === 'DUPLICATE_UTR' ? '#FAF5FF' : '#F0FDF4',
              border: `1px solid ${result.decision === 'DUPLICATE_UTR' ? '#D8B4FE' : '#86EFAC'}`,
              color: result.decision === 'DUPLICATE_UTR' ? '#6B21A8' : '#15803D',
              fontSize: '11.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <CheckCircle2 size={14} />
              <span>
                <strong>Triage Evaluated:</strong> {result.complaint_id} recorded as <strong>{result.decision}</strong> ({result.risk_tier} Risk).
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11.5px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '11.5px' }}
            >
              {submitting ? 'Running Authenticity Gate...' : 'Process Incident & Triage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
