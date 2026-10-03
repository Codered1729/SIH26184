import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Plus, CheckCircle2, AlertTriangle, FileInput, GitFork, MapPin } from 'lucide-react';

export default function IntakeModal({ isOpen, onClose, onComplaintSubmitted }) {
  const [rawText, setRawText] = useState('');
  const [victimCity, setVictimCity] = useState('Pune');
  const [channel, setChannel] = useState('UPI');
  const [amount, setAmount] = useState('78000');
  const [hopDepth, setHopDepth] = useState('auto');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const districtOptions = [
    { group: 'Maharashtra Command', list: [
      { id: 'Pune', name: 'Pune (Hinjawadi / Cyber HQ)' },
      { id: 'Mumbai', name: 'Mumbai (BKC Financial Center)' },
      { id: 'Thane', name: 'Thane (West Urban Corridor)' },
      { id: 'Navi Mumbai', name: 'Navi Mumbai (Vashi Cyber Hub)' },
      { id: 'Nashik', name: 'Nashik (Old City Commercial)' },
      { id: 'Nagpur', name: 'Nagpur (Sitabuldi Metro Axis)' },
      { id: 'Chhatrapati Sambhajinagar', name: 'Chhatrapati Sambhajinagar' },
      { id: 'Kolhapur', name: 'Kolhapur (Shahupuri Hub)' },
      { id: 'Solapur', name: 'Solapur (Textile Zone)' },
      { id: 'Amravati', name: 'Amravati (Cotton City)' },
      { id: 'Nanded', name: 'Nanded (Marathwada Axis)' },
    ]},
    { group: 'Inter-State JCCT (Gujarat)', list: [
      { id: 'Ahmedabad', name: 'Ahmedabad (SG Highway Tech Hub)' },
      { id: 'Surat', name: 'Surat (Ring Road Diamond Market)' },
      { id: 'Vadodara', name: 'Vadodara (Alkapuri Commercial)' },
      { id: 'Rajkot', name: 'Rajkot (Industrial Corridor)' },
    ]}
  ];

  const handleLoadDemo = (type) => {
    if (type === 'genuine') {
      setRawText("Rs 78000.00 debited from a/c **4123 via UPI on 25-09-2026. UTR: 429104829105. Hinjawadi IT Corridor victim reporting unauthorized debit.");
      setVictimCity('Pune');
      setChannel('UPI');
      setAmount('78000');
      setHopDepth('1');
    } else if (type === 'duplicate') {
      setRawText("Rs 65000.00 debited from a/c **9999 via UPI on 25-09-2026. UTR: 429104829102. Repeated duplicate complaint.");
      setVictimCity('Mumbai');
      setChannel('UPI');
      setAmount('65000');
      setHopDepth('1');
    } else if (type === 'neft') {
      setRawText("IMPS transaction of Rs 135000.00 credited to account 1029481920. Layered transfer from Thane corridor to Ahmedabad hub.");
      setVictimCity('Thane');
      setChannel('IMPS');
      setAmount('135000');
      setHopDepth('3');
    }
  };

  const getComputedHopDepth = (amt) => {
    if (hopDepth !== 'auto') return parseInt(hopDepth, 10);
    const parsedAmt = parseFloat(amt) || 50000;
    if (parsedAmt < 50000) return 1;
    if (parsedAmt <= 100000) return 2;
    if (parsedAmt <= 200000) return 3;
    return 4;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const chosenDepth = getComputedHopDepth(amount);
    try {
      const res = await api.submitComplaint({
        raw_text: rawText,
        victim_city: victimCity,
        channel: channel,
        amount: parseFloat(amount) || 50000.0,
        hop_depth: chosenDepth,
      });
      setResult(res);
      if (onComplaintSubmitted) onComplaintSubmitted(res);
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 1400);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="animate-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px',
      }}
    >
      <div 
        className="astrix-card intake-modal-card animate-modal-content" 
        style={{
          position: 'relative',
          boxShadow: 'var(--shadow-lg)',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '580px',
        }}
      >
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
            borderRadius: 'var(--radius-sm)',
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
            Paste complainant SMS debit advice or configure incident parameters for automated multi-hop triage.
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
              1. Genuine UPI (₹78k - Pune • 1-Hop)
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
              3. Inter-State IMPS (₹1.35L • 3-Hop)
            </button>
          </div>
        </div>

        {/* Ingestion Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Raw Text Input */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
              Complainant Debit SMS / Notification Advice
            </label>
            <textarea
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. Rs 78000 debited from a/c **4123 via UPI on 25-09-2026. UTR: 429104829105. Hinjawadi IT Corridor victim reporting unauthorized debit."
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

          {/* Form Grid: District, Channel, Amount, and Hop Depth */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
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
                  cursor: 'pointer',
                }}
              >
                {districtOptions.map((grp) => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.list.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
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
                  cursor: 'pointer',
                }}
              >
                <option value="UPI">UPI (Instant Fast Exit)</option>
                <option value="IMPS">IMPS (Immediate Transfer)</option>
                <option value="NEFT">NEFT (Batch Layering)</option>
                <option value="RTGS">RTGS (High-Value Wholesale)</option>
                <option value="AEPS_KIOSK">AePS Micro-ATM / CSP Terminal</option>
                <option value="ATM_CARDLESS">Cardless ATM Pull</option>
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
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>
                Structuring Topology
              </label>
              <select
                value={hopDepth}
                onChange={(e) => setHopDepth(e.target.value)}
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
                  cursor: 'pointer',
                }}
              >
                <option value="auto">Auto-Detect by Capital (N={getComputedHopDepth(amount)})</option>
                <option value="1">1-Hop Direct Flow (Single Exit)</option>
                <option value="2">2-Hop Layering Smurfing</option>
                <option value="3">3-Hop Multi-Jurisdiction Relay</option>
                <option value="4">4-Hop Syndicate Smurfing Ring</option>
              </select>
            </div>
          </div>

          {/* Result Banner if submitted */}
          {result && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: result.decision === 'DUPLICATE_UTR' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
              border: `1px solid ${result.decision === 'DUPLICATE_UTR' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              color: result.decision === 'DUPLICATE_UTR' ? '#ef4444' : '#16a34a',
              fontSize: '11.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CheckCircle2 size={16} />
              <span>
                <strong>Triage Evaluated:</strong> {result.complaint_id} recorded as <strong>{result.decision}</strong> ({result.risk_tier} Risk • {getComputedHopDepth(amount)}-Hop Subgraph).
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="intake-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
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
