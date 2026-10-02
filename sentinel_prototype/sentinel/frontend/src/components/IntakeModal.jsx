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
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px',
    }}>
      <div className="astrix-card intake-modal-card" style={{
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '16px', paddingRight: '28px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--foreground)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Plus size={18} style={{ color: 'var(--primary)' }} />
            Register Cyber Incident / SMS Ingestion
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px', margin: 0 }}>
            Paste complainant SMS debit advice or enter incident parameters for automated triage and UTR deduplication.
          </p>
        </div>

        {/* Sample Records Strip */}
        <div style={{
          marginBottom: '16px',
          padding: '10px 12px',
          backgroundColor: 'var(--secondary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Quick Sample Templates:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleLoadDemo('genuine')}
              className="astrix-btn-outline"
              style={{ padding: '5px 9px', fontSize: '11px', flex: '1 1 auto', textAlign: 'center' }}
            >
              1. Genuine UPI (₹78k - Pune)
            </button>
            <button
              type="button"
              onClick={() => handleLoadDemo('duplicate')}
              className="astrix-btn-outline"
              style={{ padding: '5px 9px', fontSize: '11px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', flex: '1 1 auto', textAlign: 'center' }}
            >
              2. Duplicate UTR (Sybil Rejection)
            </button>
            <button
              type="button"
              onClick={() => handleLoadDemo('neft')}
              className="astrix-btn-outline"
              style={{ padding: '5px 9px', fontSize: '11px', flex: '1 1 auto', textAlign: 'center' }}
            >
              3. Multi-Hop IMPS (₹1.35L - Thane)
            </button>
          </div>
        </div>

        {/* Ingestion Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Raw Text Input */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
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
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--secondary)',
                color: 'var(--foreground)',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Form Grid */}
          <div className="intake-form-grid">
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>
                Victim District
              </label>
              <select
                value={victimCity}
                onChange={(e) => setVictimCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  outline: 'none',
                  boxSizing: 'border-box',
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
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>
                Payment Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="UPI">UPI</option>
                <option value="IMPS">IMPS</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>
                Amount (INR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Result Banner if submitted */}
          {result && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: result.decision === 'DUPLICATE_UTR' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              border: `1px solid ${result.decision === 'DUPLICATE_UTR' ? 'rgba(124, 58, 237, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              color: result.decision === 'DUPLICATE_UTR' ? '#7c3aed' : '#16a34a',
              fontSize: '11.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CheckCircle2 size={16} />
              <span>
                <strong>Triage Evaluated:</strong> {result.complaint_id} recorded as <strong>{result.decision}</strong> ({result.risk_tier} Risk).
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="intake-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="astrix-btn-outline"
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="astrix-btn-primary"
              style={{ padding: '8px 18px', fontSize: '12px' }}
            >
              {submitting ? 'Running Authenticity Gate...' : 'Process Incident & Triage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
