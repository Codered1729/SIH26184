import React, { useState } from 'react';
import { 
  Trophy, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Gauge, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Info,
  ShieldAlert,
  Activity,
  Layers
} from 'lucide-react';

export default function ModelConsensus({ consensusData, championModel, caseDetails }) {
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  // Active Case Context
  const details = caseDetails || {};
  const isExpired = details.status === 'EXPIRED';
  const cid = details.complaint_id || 'CYB-MAH-2026-0819';

  // Primary LightGBM engine defaults if not populated
  const champ = championModel || {
    model_name: "LightGBM (Primary Operational Engine)",
    f1_optimal_threshold: 0.259,
    pr_auc: 0.497,
    f1_score: 0.512,
    latency_ms: 0.024,
    cashout_probability: consensusData?.primary_probability || details.cashout_probability || 0.89,
    exceeds_threshold: (consensusData?.primary_probability || details.cashout_probability || 0.89) >= 0.259,
    risk_tier: details.risk_tier || "CRITICAL",
    top_features: [
      { feature: "Impossible IP Travel Velocity", weight: 0.45, direction: "+Risk" },
      { feature: "Sudden Inflow after 4 Days Dormancy", weight: 0.30, direction: "+Risk" },
      { feature: "High Fan-In Ratio", weight: 0.15, direction: "+Risk" }
    ]
  };

  // 1. Dynamic Priority Score Engine Math (PRIORITY = Risk x Urgency x Amount x Confidence x Actionability)
  const factorRisk = Number(champ?.cashout_probability ?? details?.cashout_probability ?? 0.89);
  
  let factorUrgency = 0.88;
  if (isExpired) {
    factorUrgency = 0.20;
  } else if (details.remaining_seconds != null && details.total_window_seconds > 0) {
    factorUrgency = Math.max(0.35, Math.min(1.0, details.remaining_seconds / details.total_window_seconds));
  }

  const factorAmount = Math.min(1.0, Math.max(0.40, (details.amount || 78000) / 150000));
  const factorConfidence = Number(details.authenticity_score || 0.94);
  const factorActionability = isExpired ? 0.30 : (details.leading_atm ? 0.92 : 0.75);

  const compositeScore = parseFloat(
    (factorRisk * factorUrgency * factorAmount * factorConfidence * factorActionability).toFixed(2)
  );

  // Priority Triage Tier & Badge
  let priorityBadge = { label: "[ P1 - URGENT ]", bg: "#DC2626", border: "#B91C1C", text: "#FFFFFF" };
  if (isExpired) {
    priorityBadge = { label: "[ P3 - MONITOR ]", bg: "#334155", border: "#475569", text: "#CBD5E1" };
  } else if (compositeScore < 0.45 && (details.priority_score || 0.9) < 0.70) {
    priorityBadge = { label: "[ P2 - ELEVATED ]", bg: "#D97706", border: "#B45309", text: "#FFFFFF" };
  }

  // 2. SHAP Evidence Features (dynamically computed from model features, case reasons, or reference drivers)
  let shapFeatures = [];
  if (champ.top_features && Array.isArray(champ.top_features) && champ.top_features.length > 0) {
    shapFeatures = champ.top_features.slice(0, 3).map((item, idx) => {
      const pct = Math.round((item.weight || (0.45 - idx * 0.15)) * 100);
      return {
        percentage: pct,
        feature: item.feature,
        subtext: item.direction || "+Risk"
      };
    });
  } else if (details.top_reasons && Array.isArray(details.top_reasons) && details.top_reasons.length > 0) {
    const weights = [45, 30, 15];
    shapFeatures = details.top_reasons.slice(0, 3).map((reason, idx) => ({
      percentage: weights[idx] || 15,
      feature: reason,
      subtext: `TreeExplainer rank #${idx + 1}`
    }));
  } else {
    shapFeatures = [
      {
        percentage: 45,
        feature: "Impossible IP Travel Velocity",
        subtext: "Proxy hop (Tor/VPN) across 2 distant nodes in < 120s"
      },
      {
        percentage: 30,
        feature: "Sudden Inflow after 4 Days Dormancy",
        subtext: "Layering account inactive 96h before rapid multi-inflow"
      },
      {
        percentage: 15,
        feature: "High Fan-In Ratio",
        subtext: "14 originating micro-UPI accounts routed to single mule"
      }
    ];
  }

  const benchmarkModels = consensusData?.models || {
    "LightGBM (Primary Engine)": 0.89,
    "RandomForest (tuned)": 0.88,
    "XGBoost": 0.91,
    "CatBoost": 0.86,
    "HistGradientBoosting": 0.87,
    "GradientBoosting": 0.88,
  };

  const prob = champ.cashout_probability || 0.89;
  const probPct = Math.round(prob * 100);
  const thresholdPct = Math.round((champ.f1_optimal_threshold || 0.259) * 100);
  const exceeds = prob >= (champ.f1_optimal_threshold || 0.259);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ========================================================================= */}
      {/* 1. XAI & CASE PRIORITIZATION (PREDICTION CARD - EXACT MATCH TO REFERENCE) */}
      {/* ========================================================================= */}
      <div>
        {/* Section Header */}
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{
            fontSize: '19px',
            fontWeight: '800',
            color: '#0B1F3A',
            letterSpacing: '-0.02em',
            margin: 0,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          }}>
            Explainability (XAI) &amp; Case Prioritization
          </h2>
          <p style={{
            fontSize: '12.5px',
            color: '#64748B',
            marginTop: '3px',
            marginBottom: 0
          }}>
            Eliminating black-box anxiety by providing officers with transparent evidence and a strict triage formula.
          </p>
        </div>

        {/* Prediction Card Container */}
        <div style={{
          backgroundColor: '#0B1120',
          borderRadius: '8px',
          border: '1px solid #1E293B',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        }}>
          {/* Top Banner Tab */}
          <div style={{
            backgroundColor: '#1E293B',
            padding: '8px 18px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#E2E8F0',
              letterSpacing: '0.06em',
            }}>
              Prediction Card
            </span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              CASE ID: {cid}
            </span>
          </div>

          <div style={{ padding: '22px 26px 18px 26px' }}>
            {/* PRIORITY SCORE ENGINE */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: '#F8FAFC',
                  letterSpacing: '0.06em',
                }}>
                  PRIORITY SCORE ENGINE
                </div>
                <div style={{
                  fontSize: '12.5px',
                  color: '#94A3B8',
                  marginTop: '6px',
                  letterSpacing: '0.02em',
                }}>
                  PRIORITY = Risk x Urgency x Amount x Confidence x Actionability
                </div>
              </div>

              {/* Dynamic Priority Triage Badge */}
              <div style={{
                padding: '7px 18px',
                borderRadius: '4px',
                backgroundColor: priorityBadge.bg,
                border: `1px solid ${priorityBadge.border}`,
                color: priorityBadge.text,
                fontSize: '13px',
                fontWeight: '900',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: priorityBadge.label.includes('URGENT') ? '0 0 14px rgba(220, 38, 38, 0.4)' : 'none',
              }}>
                {priorityBadge.label}
              </div>
            </div>

            {/* Live Factor Breakdown Chips */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid #1E293B',
            }}>
              <span style={{ fontSize: '11px', color: '#94A3B8', padding: '2px 8px', borderRadius: '3px', backgroundColor: '#131D31', border: '1px solid #1E293B' }}>
                Risk: <strong style={{ color: '#F8FAFC' }}>{(factorRisk * 100).toFixed(0)}%</strong>
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', padding: '2px 8px', borderRadius: '3px', backgroundColor: '#131D31', border: '1px solid #1E293B' }}>
                Urgency: <strong style={{ color: '#F8FAFC' }}>{(factorUrgency * 100).toFixed(0)}%</strong>
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', padding: '2px 8px', borderRadius: '3px', backgroundColor: '#131D31', border: '1px solid #1E293B' }}>
                Amount: <strong style={{ color: '#F8FAFC' }}>{(factorAmount * 100).toFixed(0)}%</strong>
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', padding: '2px 8px', borderRadius: '3px', backgroundColor: '#131D31', border: '1px solid #1E293B' }}>
                Confidence: <strong style={{ color: '#F8FAFC' }}>{(factorConfidence * 100).toFixed(0)}%</strong>
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', padding: '2px 8px', borderRadius: '3px', backgroundColor: '#131D31', border: '1px solid #1E293B' }}>
                Actionability: <strong style={{ color: '#F8FAFC' }}>{(factorActionability * 100).toFixed(0)}%</strong>
              </span>
              <span style={{ fontSize: '11px', color: '#38BDF8', padding: '2px 8px', borderRadius: '3px', backgroundColor: '#0C2B47', border: '1px solid #0369A1', fontWeight: '700' }}>
                Composite Product: {compositeScore}
              </span>
            </div>

            {/* Middle Divider */}
            <div style={{
              height: '1px',
              backgroundColor: '#1E293B',
              margin: '18px 0',
            }} />

            {/* SHAP EVIDENCE (Why did this alert fire?) */}
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: '800',
                color: '#F8FAFC',
                letterSpacing: '0.06em',
                marginBottom: '16px',
              }}>
                SHAP EVIDENCE (Why did this alert fire?)
              </div>

              {/* SHAP Bars Container with Grid Ticks */}
              <div style={{ position: 'relative', paddingBottom: '24px' }}>
                {/* Vertical Grid Lines (0%, 25%, 50%, 75%, 100%) */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: '24px',
                  left: 0,
                  right: 0,
                  pointerEvents: 'none',
                }}>
                  {[0, 25, 50, 75, 100].map((tick) => (
                    <div
                      key={tick}
                      style={{
                        position: 'absolute',
                        left: `${tick}%`,
                        top: 0,
                        bottom: 0,
                        borderLeft: '1px dashed #1E293B',
                      }}
                    />
                  ))}
                </div>

                {/* 3 Horizontal Feature Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative', zIndex: 1 }}>
                  {shapFeatures.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Bar Container */}
                      <div style={{
                        width: '320px',
                        height: '14px',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}>
                        {/* Red Horizontal Beam */}
                        <div style={{
                          height: '3.5px',
                          width: `${item.percentage}%`,
                          backgroundColor: '#EF4444',
                          boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                          borderRadius: '2px',
                          transition: 'width 0.6s ease',
                          position: 'relative',
                        }}>
                          {/* Glowing circular node at bar end */}
                          <div style={{
                            position: 'absolute',
                            right: '-3px',
                            top: '-2px',
                            width: '7.5px',
                            height: '7.5px',
                            borderRadius: '50%',
                            backgroundColor: '#FFFFFF',
                            border: '1.5px solid #EF4444',
                            boxShadow: '0 0 6px #EF4444',
                          }} />
                        </div>
                      </div>

                      {/* Text Label: +45% : Feature Name */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          color: '#F8FAFC',
                          fontSize: '12.5px',
                          fontWeight: '800',
                          letterSpacing: '0.02em',
                        }}>
                          +{item.percentage}% : {item.feature}
                        </span>
                        {item.subtext && (
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
                            ({item.subtext})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Axis Scale Line with 0%, 25%, 50%, 75%, 100% */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '6px',
                  borderTop: '1px solid #334155',
                  position: 'relative',
                  width: '320px',
                }}>
                  {[0, 25, 50, 75, 100].map((tick) => (
                    <span
                      key={tick}
                      style={{
                        position: 'absolute',
                        left: `${tick}%`,
                        transform: tick === 100 ? 'translateX(-100%)' : 'translateX(-50%)',
                        fontSize: '10px',
                        color: '#64748B',
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      {tick}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Bottom Double Line Border */}
          <div style={{
            height: '4px',
            backgroundColor: '#0F172A',
            borderTop: '1px solid #1E293B',
            borderBottom: '2px solid #334155',
          }} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. OPERATIONAL ML BENCHMARK CARD (LIGHTGBM ENGINE & ENSEMBLE COMPARISON) */}
      {/* ========================================================================= */}
      <div className="card" style={{ padding: '20px 24px', backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 194, 168, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Trophy size={15} color="var(--color-teal-dark)" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-navy)', margin: 0 }}>
                Primary AI Forecaster: LightGBM (Operational Engine)
              </h3>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--color-muted)', marginTop: '2px', margin: 0 }}>
              Direct Decision Engine • Calibrated on Maharashtra Dataset • F1-Optimal Threshold: {thresholdPct}%
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '700',
              backgroundColor: '#F0FDFA',
              color: 'var(--color-teal-dark)',
              border: '1px solid #CCFBF1',
            }}>
              <Zap size={11} />
              Latency: {champ.latency_ms || '0.024'} ms (Single-Sample API)
            </span>
            <span className="badge badge-teal">
              PR-AUC: {champ.pr_auc || '0.497'}
            </span>
          </div>
        </div>

        {/* Main Champion Model Inference Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: '#F8FAFC',
          border: '1px solid var(--border-subtle)',
        }}>
          {/* Left Column: Cash-Out Probability Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
              Cash-Out Probability Assessment
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{
                fontSize: '32px',
                fontWeight: '900',
                fontFamily: 'var(--font-mono)',
                color: exceeds ? '#B91C1C' : 'var(--color-teal-dark)',
                letterSpacing: '-0.03em',
              }}>
                {probPct}%
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                color: exceeds ? '#B91C1C' : 'var(--color-teal-dark)',
              }}>
                {exceeds ? 'CRITICAL CASH-OUT RISK' : 'LOW EXTRACTION RISK'}
              </span>
            </div>

            {/* Threshold Progress Bar with Threshold Pin */}
            <div style={{ marginTop: '8px' }}>
              <div style={{
                position: 'relative',
                height: '10px',
                backgroundColor: '#E2E8F0',
                borderRadius: '5px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${probPct}%`,
                  backgroundColor: exceeds ? '#DC2626' : 'var(--color-teal)',
                  borderRadius: '5px',
                  transition: 'width 0.4s ease',
                }} />
              </div>

              {/* Threshold Marker Indicator */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10.5px',
                marginTop: '4px',
                color: 'var(--color-muted)',
              }}>
                <span>0% Safe</span>
                <span style={{ fontWeight: '700', color: 'var(--color-navy)' }}>
                  ▲ F1-Optimal Threshold: {thresholdPct}%
                </span>
                <span>100% Critical</span>
              </div>
            </div>

            <div style={{
              fontSize: '11px',
              color: 'var(--color-ink)',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <CheckCircle2 size={13} color="#16A34A" />
              <span>
                <strong>{exceeds ? `+${(probPct - thresholdPct)}% above threshold` : 'Below risk threshold'}</strong>: Trigger lawful complaint preservation notice.
              </span>
            </div>
          </div>

          {/* Right Column: Model Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
              Operational Performance Indicators
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}>
              <div style={{ padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>F1-SCORE</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0B1F3A', fontFamily: 'var(--font-mono)' }}>{champ.f1_score || '0.512'}</div>
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>PR-AUC</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0B1F3A', fontFamily: 'var(--font-mono)' }}>{champ.pr_auc || '0.497'}</div>
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>INFERENCE SPEED</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#028071', fontFamily: 'var(--font-mono)' }}>{champ.latency_ms || '0.024'} ms</div>
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>ALERT TIER</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: exceeds ? '#DC2626' : '#028071' }}>{champ.risk_tier || 'CRITICAL'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Walk-Forward Benchmark Table */}
        <div style={{ marginTop: '14px' }}>
          <button
            onClick={() => setShowBenchmarks(!showBenchmarks)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '11.5px',
              fontWeight: '700',
              color: 'var(--color-teal-dark)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{showBenchmarks ? 'Hide Walk-Forward Benchmark Comparison' : 'View Walk-Forward Benchmark Comparison (6 Ensemble Architectures)'}</span>
            {showBenchmarks ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showBenchmarks && (
            <div style={{
              marginTop: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-subtle)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: 'var(--color-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '4px 6px' }}>Model Architecture</th>
                    <th style={{ padding: '4px 6px' }}>Status</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(benchmarkModels).map(([name, score]) => (
                    <tr key={name} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '4px 6px', fontWeight: name.includes('Champion') ? '800' : '500', color: 'var(--color-navy)' }}>
                        {name}
                      </td>
                      <td style={{ padding: '4px 6px' }}>
                        {name.includes('Champion') ? (
                          <span style={{ color: '#16A34A', fontWeight: '700' }}>🏆 Selected Champion</span>
                        ) : (
                          <span style={{ color: 'var(--color-muted)' }}>Evaluated Baseline</span>
                        )}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                        {(score * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
