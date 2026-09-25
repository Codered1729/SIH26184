import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { api } from '../services/api';
import { 
  Navigation, 
  ShieldAlert, 
  RotateCcw, 
  Building,
  Send
} from 'lucide-react';

const MAHARASHTRA_CENTER = [19.7515, 75.7139];
const DEFAULT_ZOOM = 7;

export default function GeospatialMap({ onSelectAtm, onDispatchAlert }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [atms, setAtms] = useState([]);
  const [selectedAtm, setSelectedAtm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAtmHotspots().then((data) => {
      if (data && data.atms) {
        setAtms(data.atms);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: MAHARASHTRA_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 4,
      maxZoom: 16,
      maxBounds: [
        [6.0, 68.0],
        [37.5, 97.5],
      ],
      maxBoundsViscosity: 0.8,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | Maharashtra Cyber Command',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || atms.length === 0) return;

    const markerGroup = L.layerGroup().addTo(map);

    atms.forEach((atm, index) => {
      const isTop3 = index < 3;
      const isInCooldown = atm.is_in_cooldown;

      const intensity = atm.hawkes_intensity || 0.5;
      const circleRadius = 12000 + intensity * 16000;
      const circleColor = intensity > 0.8 ? '#DC2626' : (intensity > 0.6 ? '#D97706' : '#00A896');

      L.circle([atm.lat, atm.lon], {
        radius: circleRadius,
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.12,
        weight: 1.2,
      }).addTo(markerGroup);

      const markerHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 3px;
            background: ${isInCooldown ? '#1D4ED8' : (isTop3 ? '#DC2626' : '#0B1F3A')};
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            font-weight: 800;
            border: 1.5px solid #FFFFFF;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          ">
            ${atm.bank || 'ATM'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-atm-marker',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([atm.lat, atm.lon], { icon: customIcon }).addTo(markerGroup);

      marker.on('click', () => {
        setSelectedAtm(atm);
        if (onSelectAtm) onSelectAtm(atm);
      });
    });

    return () => {
      markerGroup.clearLayers();
    };
  }, [atms, onSelectAtm]);

  const handleSnapToMaharashtra = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(MAHARASHTRA_CENTER, DEFAULT_ZOOM, {
        duration: 0.8,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Bar */}
      <div className="card" style={{ padding: '12px 16px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Navigation size={18} color="var(--color-teal)" />
              Geospatial Surveillance & ATM Cash-Out Hotspots
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '11.5px', marginTop: '1px' }}>
              Spatiotemporal self-exciting point-process intensity across Maharashtra banking corridors.
            </p>
          </div>

          <button
            onClick={handleSnapToMaharashtra}
            className="btn btn-navy"
            style={{ padding: '5px 12px', fontSize: '11.5px' }}
          >
            <RotateCcw size={12} color="var(--color-teal)" />
            <span>Reset View (Maharashtra)</span>
          </button>
        </div>
      </div>

      {/* Main Map + Guidance Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px' }}>
        {/* Map Canvas */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', height: '580px', position: 'relative' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>

          {/* Clean Flat Map Legend */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 999,
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <div style={{ fontWeight: '700', color: 'var(--color-navy)', marginBottom: '2px' }}>
              Hawkes Intensity Key
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#DC2626' }}></span>
              <span>High Intensity (&gt; 0.80)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#D97706' }}></span>
              <span>Elevated Activity (0.60–0.80)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#00A896' }}></span>
              <span>Baseline Surveillance (&lt; 0.60)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', borderTop: '1px solid #E2E8F0', paddingTop: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#1D4ED8' }}></span>
              <span>15m Patrol Cooldown Active</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Tactical Directive */}
          <div className="card" style={{ padding: '14px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <ShieldAlert size={16} color="var(--color-teal)" />
              <h3 style={{ fontSize: '13px', color: 'var(--color-navy)' }}>
                Beat Patrol Tactical Directive
              </h3>
            </div>

            <div style={{
              padding: '10px',
              backgroundColor: '#EFF6FF',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #BFDBFE',
              color: '#1E40AF',
              fontSize: '11.5px',
              lineHeight: 1.45,
              marginBottom: '10px',
            }}>
              <strong>Interception Advisory:</strong> Spatiotemporal clustering detected in <strong>Hinjawadi Phase 1 (Pune)</strong> and <strong>BKC (Mumbai)</strong>. Alert nearest beat officers for physical terminal surveillance.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--color-muted)' }}>Primary Operational Corridor:</span>
                <strong>Mumbai — Pune Expressway</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--color-muted)' }}>Highest Intensity Kiosk:</span>
                <strong>HDFC Hinjawadi Phase 1</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--color-muted)' }}>Active Cooldown Terminals:</span>
                <strong style={{ color: '#1D4ED8' }}>1 Terminal Suppressed</strong>
              </div>
            </div>
          </div>

          {/* Selected ATM Details */}
          {selectedAtm ? (
            <div className="card" style={{ padding: '14px', backgroundColor: '#FFFFFF', border: '1.5px solid var(--color-teal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-teal">{selectedAtm.bank} ATM</span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
                  {selectedAtm.atm_id}
                </span>
              </div>

              <h4 style={{ fontSize: '13px', color: 'var(--color-navy)', marginBottom: '2px' }}>
                {selectedAtm.area}, {selectedAtm.city}
              </h4>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '10px' }}>
                GPS: {selectedAtm.lat?.toFixed(4)}, {selectedAtm.lon?.toFixed(4)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Hawkes Intensity:</span>
                  <strong style={{ color: selectedAtm.hawkes_intensity > 0.8 ? '#DC2626' : 'var(--color-navy)' }}>
                    {(selectedAtm.hawkes_intensity * 100).toFixed(0)}%
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Triage Priority:</span>
                  <strong>{(selectedAtm.composite_priority * 100).toFixed(0)}%</strong>
                </div>
                {selectedAtm.is_in_cooldown && (
                  <div style={{ padding: '4px 6px', borderRadius: '3px', backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '11px', fontWeight: '700' }}>
                    PATROL DISPATCHED — COOLDOWN ACTIVE ({Math.floor(selectedAtm.cooldown_remaining_sec / 60)}m left)
                  </div>
                )}
              </div>

              <button
                onClick={() => alert(`Patrol alert transmitted to beat officers for ${selectedAtm.atm_id}`)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '6px', fontSize: '11.5px' }}
              >
                <Send size={12} />
                <span>Alert Nearest Beat Unit</span>
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-muted)', backgroundColor: '#FFFFFF' }}>
              <Building size={22} color="var(--color-muted)" style={{ margin: '0 auto 6px', opacity: 0.5 }} />
              <div style={{ fontSize: '12px', fontWeight: '600' }}>Select an ATM Marker</div>
              <p style={{ fontSize: '11px', marginTop: '2px' }}>
                Click any ATM icon to inspect spatiotemporal intensity and issue unit alerts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
