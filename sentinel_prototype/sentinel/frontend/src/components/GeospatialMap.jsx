import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { api } from '../services/api';
import { 
  Navigation, 
  ShieldAlert, 
  RotateCcw, 
  Building,
  Send,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  Radio,
  MapPin,
  CheckCircle2,
  Clock,
  Crosshair,
  Compass
} from 'lucide-react';

const MAHARASHTRA_CENTER = [19.7515, 75.7139];
const DEFAULT_ZOOM = 7;

// Open & Free Tile Providers with 0 API Key Required
const TILE_PROVIDERS = {
  osm: {
    id: 'osm',
    name: 'OpenStreetMap (Street)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Maharashtra Cyber Command',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
  esri_gray: {
    id: 'esri_gray',
    name: 'Tactical Gray Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ | Maharashtra Cyber Command',
    maxZoom: 16,
    subdomains: [],
  },
  hot: {
    id: 'hot',
    name: 'Humanitarian OSM',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Humanitarian OSM',
    maxZoom: 19,
    subdomains: ['a', 'b'],
  },
};

export default function GeospatialMap({ alerts = [], onSelectAlert, onSelectAtm, onDispatchAlert }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const clusterLayerGroupRef = useRef(null);
  const markerLayerGroupRef = useRef(null);

  // Data state
  const [clusters, setClusters] = useState([]);
  const [atms, setAtms] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statewideRisk, setStatewideRisk] = useState(0.73);
  const [loading, setLoading] = useState(true);

  // Tile & Cartography Provider (Default to OpenStreetMap - 0 API Key)
  const [tileProvider, setTileProvider] = useState('osm');

  // Selection & Filter state
  const [selectedJcct, setSelectedJcct] = useState('ALL'); // 'ALL' | 'JCCT-Maharashtra' | 'JCCT-Gujarat'
  const [selectedClusterId, setSelectedClusterId] = useState('ALL');
  const [selectedAtm, setSelectedAtm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'THREAT' | 'PATROL' | 'CRITICAL'
  const [showClusterZones, setShowClusterZones] = useState(true);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // JCCT Switching Handler
  const handleJcctChange = useCallback((team) => {
    setSelectedJcct(team);
    setSelectedClusterId('ALL');
    const map = mapInstanceRef.current;
    if (!map) return;
    if (team === 'JCCT-Maharashtra') {
      map.flyTo([19.25, 74.0], 7, { duration: 1.0 });
    } else if (team === 'JCCT-Gujarat') {
      map.flyTo([22.40, 72.7], 7, { duration: 1.0 });
    } else {
      map.flyTo([20.85, 73.5], 6, { duration: 1.0 });
    }
  }, []);

  // Cluster Selection & Camera Flying Handler
  const handleSelectCluster = useCallback((clusterId) => {
    setSelectedClusterId(clusterId);
    const map = mapInstanceRef.current;
    if (!map) return;
    if (clusterId === 'ALL') {
      if (selectedJcct === 'JCCT-Maharashtra') {
        map.flyTo([19.25, 74.0], 7, { duration: 0.8 });
      } else if (selectedJcct === 'JCCT-Gujarat') {
        map.flyTo([22.40, 72.7], 7, { duration: 0.8 });
      } else {
        map.flyTo([20.85, 73.5], 6, { duration: 0.8 });
      }
    } else {
      const c = clusters.find((item) => item.cluster_id === clusterId);
      if (c && c.bounds) {
        map.flyToBounds(c.bounds, { padding: [50, 50], duration: 0.8 });
      } else if (c && c.center) {
        map.flyTo([c.center[0], c.center[1]], 11, { duration: 0.8 });
      }
    }
  }, [clusters, selectedJcct]);

  // Helper to extract bank name from alert
  const getBankFromAlert = useCallback((a) => {
    if (a.target_bank) return a.target_bank.toUpperCase();
    if (a.leading_atm?.bank) return a.leading_atm.bank.toUpperCase();
    const ben = (a.beneficiary_account || '').toUpperCase();
    if (ben.startsWith('SBIN') || ben.includes('SBI')) return 'SBI';
    if (ben.startsWith('HDFC')) return 'HDFC';
    if (ben.startsWith('ICIC')) return 'ICICI';
    if (ben.startsWith('UTIB') || ben.includes('AXIS')) return 'AXIS';
    if (ben.startsWith('BARB') || ben.includes('BOB')) return 'BOB';
    return '';
  }, []);

  // Set of bank names currently under active fraud alert
  const alertedBankNames = useMemo(() => {
    const set = new Set();
    (alerts || []).forEach((a) => {
      const b = getBankFromAlert(a);
      if (b) set.add(b);
    });
    return set;
  }, [alerts, getBankFromAlert]);

  // Load Leaflet Clusters & ATMs from API
  const loadLeafletData = useCallback(async () => {
    try {
      const data = await api.getLeafletClusters();
      if (data && data.clusters) {
        setClusters(data.clusters);
        setSummary(data.summary);
        if (data.statewide_vulnerability_index) {
          setStatewideRisk(data.statewide_vulnerability_index);
        }

        // Flatten all ATMs from clusters
        const allAtms = [];
        data.clusters.forEach((c) => {
          (c.atms || []).forEach((atm) => {
            allAtms.push({
              ...atm,
              cluster_name: c.name,
              cluster_id: c.cluster_id,
              state: c.state || atm.state || 'Maharashtra',
              jcct_team: c.jcct_team || atm.jcct_team || 'JCCT-Maharashtra',
            });
          });
        });
        setAtms(allAtms);
      }
    } catch (err) {
      console.error('Error fetching Leaflet clusters:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeafletData();
  }, [loadLeafletData]);

  // Cooldown local tick-down timer (every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setAtms((prev) =>
        prev.map((atm) => {
          if (atm.is_in_cooldown && atm.cooldown_remaining_sec > 0) {
            const nextSec = atm.cooldown_remaining_sec - 1;
            return {
              ...atm,
              cooldown_remaining_sec: nextSec,
              is_in_cooldown: nextSec > 0,
              status: nextSec > 0 ? 'PATROL_DEPLOYED' : 'NORMAL_SURVEILLANCE',
              status_label: nextSec > 0 ? `Patrol Dispatched (${Math.floor(nextSec / 60)}m left)` : 'Surveillance Baseline Nominal',
            };
          }
          return atm;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtered Clusters based on JCCT selection
  const displayedClusters = useMemo(() => {
    if (selectedJcct === 'ALL') return clusters;
    return clusters.filter((c) => (c.jcct_team || 'JCCT-Maharashtra') === selectedJcct);
  }, [clusters, selectedJcct]);

  // Filtered ATMs based on JCCT Team, Cluster and Status filter
  const displayedAtms = useMemo(() => {
    return atms.filter((atm) => {
      // JCCT filter
      if (selectedJcct !== 'ALL' && (atm.jcct_team || 'JCCT-Maharashtra') !== selectedJcct) {
        return false;
      }
      // Cluster filter
      if (selectedClusterId !== 'ALL' && atm.cluster_id !== selectedClusterId) {
        return false;
      }
      // Status filter
      if (statusFilter === 'THREAT' && atm.status !== 'ACTIVE_THREAT') return false;
      if (statusFilter === 'PATROL' && atm.status !== 'PATROL_DEPLOYED') return false;
      if (statusFilter === 'CRITICAL' && (atm.vulnerability_score || atm.hawkes_intensity || 0) < 0.80) return false;
      return true;
    });
  }, [atms, selectedJcct, selectedClusterId, statusFilter]);

  // Currently selected cluster object
  const selectedCluster = useMemo(() => {
    if (selectedClusterId === 'ALL') return null;
    return clusters.find((c) => c.cluster_id === selectedClusterId) || null;
  }, [clusters, selectedClusterId]);

  // All alerts linked to the currently selected ATM
  const matchingAlerts = useMemo(() => {
    if (!selectedAtm) return [];
    const bank = (selectedAtm.bank || '').toUpperCase();
    const atmId = selectedAtm.atm_id;
    return (alerts || []).filter((a) => {
      const aBank = getBankFromAlert(a);
      const bankMatches = (aBank && aBank === bank);
      const atmMatches = a.leading_atm?.atm_id === atmId || a.target_atm === atmId;
      return bankMatches || atmMatches;
    });
  }, [selectedAtm, alerts, getBankFromAlert]);

  // Initialize Leaflet Map
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

    clusterLayerGroupRef.current = L.layerGroup().addTo(map);
    markerLayerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Manage Leaflet Tile Layer (OpenStreetMap / Tactical Gray with 0 API Key Required)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const provider = TILE_PROVIDERS[tileProvider] || TILE_PROVIDERS.osm;
    const options = {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
    };
    if (provider.subdomains && provider.subdomains.length > 0) {
      options.subdomains = provider.subdomains;
    }

    const layer = L.tileLayer(provider.url, options).addTo(map);
    tileLayerRef.current = layer;

    if (layer.bringToBack) {
      layer.bringToBack();
    }
  }, [tileProvider]);

  // Dispatch Patrol Action Handler
  const handleDispatchPatrol = useCallback(async (atmId) => {
    try {
      const res = await api.updateAtmStatus(atmId, 'DISPATCH_PATROL');
      setActionFeedback({ type: 'success', message: res.message || `Patrol squad deployed to ATM ${atmId}` });
      setTimeout(() => setActionFeedback(null), 4500);

      // Update in-memory state
      setAtms((prev) =>
        prev.map((a) => {
          if (a.atm_id === atmId) {
            return {
              ...a,
              status: 'PATROL_DEPLOYED',
              status_label: 'Patrol Dispatched (15m cooldown)',
              is_in_cooldown: true,
              cooldown_remaining_sec: 900,
            };
          }
          return a;
        })
      );

      // If selected ATM matches, update it too
      setSelectedAtm((prev) => {
        if (prev && prev.atm_id === atmId) {
          return {
            ...prev,
            status: 'PATROL_DEPLOYED',
            status_label: 'Patrol Dispatched (15m cooldown)',
            is_in_cooldown: true,
            cooldown_remaining_sec: 900,
          };
        }
        return prev;
      });

      // Notify parent if alert dispatch handler provided
      if (onDispatchAlert) {
        const atmObj = atms.find((a) => a.atm_id === atmId) || selectedAtm;
        const linkedAlert = matchingAlerts[0] 
          || alerts.find((a) => a.leading_atm?.atm_id === atmId) 
          || alerts[0] 
          || {
            complaint_id: 'CYB-MAH-2026-0819',
            leading_atm: { atm_id: atmId, name: atmObj?.name, city: atmObj?.city, bank: atmObj?.bank },
            victim_city: atmObj?.city || 'Pune',
            area: atmObj?.area || 'Hinjawadi Phase 1',
            atmName: atmObj?.name || `${atmObj?.bank || 'HDFC'} - ${atmObj?.area || 'ATM'}`,
            amount: 78000
          };
        onDispatchAlert(linkedAlert);
      }
    } catch (err) {
      console.error('Failed to dispatch patrol:', err);
      setActionFeedback({ type: 'error', message: 'Failed to transmit patrol dispatch order.' });
      setTimeout(() => setActionFeedback(null), 4000);
    }
  }, [matchingAlerts, alerts, onDispatchAlert]);

  // Clear / Mark Secure Action Handler
  const handleClearStatus = useCallback(async (atmId) => {
    try {
      const res = await api.updateAtmStatus(atmId, 'CLEAR_STATUS');
      setActionFeedback({ type: 'info', message: res.message || `ATM ${atmId} marked secure.` });
      setTimeout(() => setActionFeedback(null), 4000);

      setAtms((prev) =>
        prev.map((a) => {
          if (a.atm_id === atmId) {
            return {
              ...a,
              status: 'NORMAL_SURVEILLANCE',
              status_label: 'Surveillance Baseline Nominal',
              is_in_cooldown: false,
              cooldown_remaining_sec: 0,
            };
          }
          return a;
        })
      );

      setSelectedAtm((prev) => {
        if (prev && prev.atm_id === atmId) {
          return {
            ...prev,
            status: 'NORMAL_SURVEILLANCE',
            status_label: 'Surveillance Baseline Nominal',
            is_in_cooldown: false,
            cooldown_remaining_sec: 0,
          };
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to clear status:', err);
    }
  }, []);

  // Render Leaflet Cluster Zones & Centroid Badges
  useEffect(() => {
    if (!clusterLayerGroupRef.current) return;
    const clusterGroup = clusterLayerGroupRef.current;
    clusterGroup.clearLayers();

    if (!showClusterZones) return;

    displayedClusters.forEach((c) => {
      const isSelected = selectedClusterId === c.cluster_id;
      const isCritical = c.vulnerability_tier === 'CRITICAL';
      const isElevated = c.vulnerability_tier === 'ELEVATED';
      const hasThreat = c.status === 'ACTIVE_THREAT';

      const zoneColor = isCritical ? '#DC2626' : (isElevated ? '#D97706' : '#00A896');

      // Cluster Zone Buffer Circle
      const clusterCircle = L.circle([c.center[0], c.center[1]], {
        radius: c.radius_meters || 12000,
        color: zoneColor,
        fillColor: zoneColor,
        fillOpacity: isSelected ? 0.22 : 0.08,
        weight: isSelected ? 2.5 : 1.2,
        dashArray: isSelected ? undefined : '5, 5',
      }).addTo(clusterGroup);

      clusterCircle.on('click', () => {
        setSelectedClusterId(c.cluster_id);
        if (mapInstanceRef.current && c.bounds) {
          mapInstanceRef.current.flyToBounds(c.bounds, { padding: [50, 50], duration: 0.8 });
        }
      });

      // Cluster Floating Centroid Badge
      const statusIconHtml = hasThreat ? '🚨' : (c.status === 'PATROL_DEPLOYED' ? '🛡️' : '📍');
      const badgeHtml = `
        <div style="
          background: var(--card, #171A21);
          color: var(--foreground, #F8FAFC);
          border: 1.5px solid ${zoneColor};
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          border-radius: 6px;
          padding: 4px 9px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-sans);
          cursor: pointer;
          white-space: nowrap;
          line-height: 1.2;
        ">
          <span style="font-size: 13px; line-height: 1; flex-shrink: 0; display: inline-flex; align-items: center;">${statusIconHtml}</span>
          <div style="display: flex; flex-direction: column; gap: 1px;">
            <span style="font-size: 10.5px; font-weight: 800; color: var(--foreground, #F8FAFC); line-height: 1.2;">${c.name}</span>
            <span style="font-size: 9.5px; font-weight: 700; color: ${zoneColor}; line-height: 1.2;">
              ${(c.vulnerability_score * 100).toFixed(0)}% Vulnerability • ${c.total_atms} ATMs
            </span>
          </div>
        </div>
      `;

      const clusterIcon = L.divIcon({
        className: 'custom-cluster-badge',
        html: badgeHtml,
        iconSize: [160, 36],
        iconAnchor: [80, 18],
      });

      const clusterMarker = L.marker([c.center[0], c.center[1]], { icon: clusterIcon }).addTo(clusterGroup);
      clusterMarker.on('click', () => {
        setSelectedClusterId(c.cluster_id);
        if (mapInstanceRef.current && c.bounds) {
          mapInstanceRef.current.flyToBounds(c.bounds, { padding: [50, 50], duration: 0.8 });
        }
      });
    });
  }, [displayedClusters, selectedClusterId, showClusterZones]);

  // Render Leaflet ATM Markers & Rich Popups
  useEffect(() => {
    if (!markerLayerGroupRef.current) return;
    const markerGroup = markerLayerGroupRef.current;
    markerGroup.clearLayers();

    displayedAtms.forEach((atm) => {
      const isSelected = selectedAtm?.atm_id === atm.atm_id;
      const isDispatched = atm.status === 'PATROL_DEPLOYED' || atm.is_in_cooldown;
      const isThreat = atm.status === 'ACTIVE_THREAT';
      const isSuspicious = atm.status === 'SUSPICIOUS_VELOCITY';
      const vulnScore = atm.vulnerability_score || atm.hawkes_intensity || 0.5;

      const markerColor = isDispatched ? '#1D4ED8' : (isThreat ? '#DC2626' : (isSuspicious ? '#D97706' : '#0B1F3A'));
      const statusRingColor = isThreat ? '#DC2626' : (isDispatched ? '#1D4ED8' : '#00A896');

      // Individual ATM radiation / vulnerability circle
      const circleRadius = 2500 + vulnScore * 5000;
      L.circle([atm.lat, atm.lon], {
        radius: circleRadius,
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: isSelected ? 0.28 : (isThreat ? 0.20 : 0.09),
        weight: isSelected ? 2.5 : 1.0,
      }).addTo(markerGroup);

      // Marker Icon
      const markerHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            width: ${isSelected ? '28px' : '24px'};
            height: ${isSelected ? '28px' : '24px'};
            border-radius: 4px;
            background: ${markerColor};
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '10px' : '9px'};
            font-weight: 800;
            border: ${isSelected ? '2.5px solid #00C2A8' : '1.5px solid #FFFFFF'};
            cursor: pointer;
            box-shadow: ${isSelected ? '0 0 12px rgba(0, 194, 168, 0.9)' : '0 2px 4px rgba(0,0,0,0.3)'};
            transition: all 0.2s ease;
          ">
            ${atm.bank || 'ATM'}
          </div>

          <!-- Vulnerability Score Badge Pill -->
          <div style="
            position: absolute;
            top: -7px;
            right: -10px;
            background: ${isThreat ? '#DC2626' : (vulnScore > 0.75 ? '#D97706' : '#00A896')};
            color: #FFFFFF;
            font-size: 8px;
            font-weight: 800;
            padding: 1px 4px;
            border-radius: 3px;
            border: 1px solid #FFFFFF;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          ">
            ${(vulnScore * 100).toFixed(0)}%
          </div>

          <!-- Pulse ping animation if active threat -->
          ${isThreat && !isDispatched ? `
            <span style="
              position: absolute;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 2px solid #DC2626;
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              opacity: 0.7;
              pointer-events: none;
            "></span>
          ` : ''}

          <!-- Patrol shield indicator if dispatched -->
          ${isDispatched ? `
            <span style="
              position: absolute;
              bottom: -5px;
              left: -5px;
              background: #1D4ED8;
              color: #FFFFFF;
              font-size: 8px;
              padding: 1px 3px;
              border-radius: 2px;
              border: 1px solid #FFFFFF;
            ">🛡️</span>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-atm-marker',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([atm.lat, atm.lon], { icon: customIcon }).addTo(markerGroup);

      // Leaflet Rich Popup
      const popupContent = `
        <div style="padding: 14px 16px; font-family: var(--font-sans); min-width: 240px; background: var(--card, #171A21); color: var(--foreground, #F8FAFC); border-radius: var(--radius-md, 8px);">
          <!-- Popup Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border, rgba(255,255,255,0.1)); padding-bottom: 6px; margin-bottom: 8px;">
            <span style="font-weight: 800; color: var(--foreground, #F8FAFC); font-size: 12.5px; letter-spacing: -0.01em;">${atm.bank} ATM</span>
            <span style="font-family: var(--font-mono); font-size: 10px; color: var(--muted-foreground, #94A3B8);">${atm.atm_id}</span>
          </div>

          <!-- Location -->
          <div style="font-size: 12px; font-weight: 700; color: var(--foreground, #F8FAFC); margin-bottom: 2px;">
            ${atm.area}, ${atm.city}
          </div>
          <div style="font-size: 10.5px; color: var(--muted-foreground, #94A3B8); margin-bottom: 8px;">
            Corridor: ${atm.cluster_name || atm.city}
          </div>

          <!-- Vulnerability Gauge Box -->
          <div style="background: var(--secondary, #222632); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 6px; padding: 7px 9px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; margin-bottom: 5px;">
              <span style="color: var(--muted-foreground, #94A3B8);">Vulnerability Level:</span>
              <strong style="color: ${isThreat ? '#EF4444' : (vulnScore > 0.75 ? '#F59E0B' : '#00C2A8')}; font-size: 11px;">
                ${(vulnScore * 100).toFixed(0)}% (${atm.vulnerability_tier || 'MONITORED'})
              </strong>
            </div>
            <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
              <div style="width: ${vulnScore * 100}%; height: 100%; background: ${isThreat ? '#EF4444' : (vulnScore > 0.75 ? '#F59E0B' : '#00C2A8')}; border-radius: 3px;"></div>
            </div>
          </div>

          <!-- Status Indicator -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 10px;">
            <span style="color: var(--muted-foreground, #94A3B8);">Operational Status:</span>
            <span style="
              font-weight: 700;
              font-size: 9.5px;
              padding: 2px 7px;
              border-radius: 4px;
              background: ${isDispatched ? 'rgba(37,99,235,0.15)' : (isThreat ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)')};
              color: ${isDispatched ? '#60A5FA' : (isThreat ? '#F87171' : '#34D399')};
              border: 1px solid ${isDispatched ? 'rgba(37,99,235,0.35)' : (isThreat ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)')};
            ">
              ${atm.status_label || atm.status}
            </span>
          </div>

          <!-- Dispatch Quick Action Button -->
          ${isDispatched ? `
            <div style="font-size: 11px; color: #60A5FA; font-weight: 700; text-align: center; padding: 6px 8px; background: rgba(37,99,235,0.12); border-radius: 6px; border: 1px solid rgba(37,99,235,0.3); display: flex; align-items: center; justify-content: center; gap: 5px;">
              <span>🛡️</span>
              <span>Patrol Unit Dispatched (${Math.floor((atm.cooldown_remaining_sec || 900) / 60)}m suppression)</span>
            </div>
          ` : `
            <button id="dispatch-leaflet-btn-${atm.atm_id}" style="
              width: 100%;
              padding: 7px 10px;
              font-size: 11.5px;
              font-weight: 700;
              background: var(--primary, #00C2A8);
              color: var(--primary-foreground, #071526);
              border: none;
              border-radius: 6px;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              line-height: 1;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            ">
              <span style="font-size: 12px; line-height: 1;">🚨</span>
              <span style="display: inline-flex; align-items: center; line-height: 1;">Dispatch Patrol Unit</span>
            </button>
          `}
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`dispatch-leaflet-btn-${atm.atm_id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            handleDispatchPatrol(atm.atm_id);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        setSelectedAtm(atm);
        setShowAllAlerts(false);
        if (onSelectAtm) onSelectAtm(atm);
        marker.openPopup();
      });

      if (isSelected) {
        setTimeout(() => {
          try {
            marker.openPopup();
          } catch (e) {}
        }, 60);
      }
    });
  }, [displayedAtms, selectedAtm?.atm_id, handleDispatchPatrol, onSelectAtm]);

  // Snap back to Maharashtra Center
  const handleSnapToMaharashtra = () => {
    setSelectedClusterId('ALL');
    setSelectedAtm(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(MAHARASHTRA_CENTER, DEFAULT_ZOOM, {
        duration: 0.8,
      });
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div style={{
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: actionFeedback.type === 'success' ? '#F0FDF4' : '#EFF6FF',
          border: `1px solid ${actionFeedback.type === 'success' ? '#86EFAC' : '#BFDBFE'}`,
          color: actionFeedback.type === 'success' ? '#15803D' : '#1D4ED8',
          fontSize: '12px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={16} />
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Top Bar with Cluster Selector & Vulnerability Filter */}
      <div className="card astrix-card" style={{ padding: '12px 16px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Navigation size={18} style={{ color: 'var(--primary)' }} />
              ATM Surveillance Map & Live Cash-Out Hotspots
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '11.5px', marginTop: '1px' }}>
              Live map showing vulnerable ATMs and predicted cash-out hotspots across Maharashtra and Gujarat.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* JCCT Regional Coordination Selector */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--secondary)',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}>
              <button
                onClick={() => handleJcctChange('ALL')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedJcct === 'ALL' ? 'var(--primary)' : 'transparent',
                  color: selectedJcct === 'ALL' ? '#FFFFFF' : 'var(--muted-foreground)',
                }}
              >
                🌐 Interstate Corridor ({clusters.length})
              </button>
              <button
                onClick={() => handleJcctChange('JCCT-Maharashtra')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedJcct === 'JCCT-Maharashtra' ? 'var(--primary)' : 'transparent',
                  color: selectedJcct === 'JCCT-Maharashtra' ? '#071526' : 'var(--muted-foreground)',
                }}
              >
                🛡️ JCCT Maharashtra
              </button>
              <button
                onClick={() => handleJcctChange('JCCT-Gujarat')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedJcct === 'JCCT-Gujarat' ? '#D97706' : 'transparent',
                  color: selectedJcct === 'JCCT-Gujarat' ? '#FFFFFF' : 'var(--muted-foreground)',
                }}
              >
                ⚡ JCCT Gujarat
              </button>
            </div>

            {/* Cluster Location Selection Dropdown (Drop Box) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <label 
                htmlFor="cluster-location-select"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--foreground)',
                  whiteSpace: 'nowrap',
                }}
              >
                <MapPin size={12} style={{ color: 'var(--primary)' }} />
                <span>Cluster:</span>
              </label>
              <select
                id="cluster-location-select"
                value={selectedClusterId}
                onChange={(e) => handleSelectCluster(e.target.value)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11.5px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  maxWidth: '260px',
                }}
                title="Select geographical cash-out hotspot cluster to center camera"
              >
                <option value="ALL">📍 All Clusters ({displayedClusters.length} Hotspots)</option>
                {displayedClusters.map((c) => {
                  const stateCode = (c.state === 'Gujarat' || c.jcct_team === 'JCCT-Gujarat') ? 'GJ' : 'MH';
                  const tierIcon = c.vulnerability_tier === 'CRITICAL' ? '🔴' : (c.vulnerability_tier === 'ELEVATED' ? '🟠' : '🟢');
                  return (
                    <option key={c.cluster_id} value={c.cluster_id}>
                      {tierIcon} {c.name || c.city} ({c.city}, {stateCode})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Filter Toggle */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '11.5px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--secondary)',
                color: 'var(--foreground)',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Statuses ({atms.length} ATMs)</option>
              <option value="THREAT">🚨 Active Threats Only</option>
              <option value="PATROL">🛡️ Patrol Deployed (Cooldown)</option>
              <option value="CRITICAL">🔴 Critical Vulnerability (&gt;80%)</option>
            </select>

            {/* Tile Provider Style (0 API Key) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <select
                value={tileProvider}
                onChange={(e) => setTileProvider(e.target.value)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
                title="Map Cartography Provider (No API Key Required)"
              >
                <option value="osm">🗺️ OpenStreetMap (Standard)</option>
                <option value="esri_gray">🛡️ Tactical Gray Canvas</option>
                <option value="hot">🌐 Humanitarian OSM</option>
              </select>
            </div>

            {/* Toggle Cluster Zones */}
            <button
              onClick={() => setShowClusterZones(!showClusterZones)}
              className="astrix-btn-outline"
              style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Layers size={12} style={{ color: 'var(--primary)' }} />
              <span>{showClusterZones ? 'Hide Zones' : 'Show Zones'}</span>
            </button>

            {/* Snap to Maharashtra */}
            <button
              onClick={handleSnapToMaharashtra}
              className="astrix-btn-primary"
              style={{ 
                padding: '6px 12px', 
                fontSize: '11.5px', 
                fontWeight: '600',
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '6px',
                lineHeight: 1,
              }}
            >
              <RotateCcw size={12} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>Reset View</span>
            </button>
          </div>
        </div>

        {/* Telemetry Summary Ticker */}
        <div style={{
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          alignItems: 'center',
        }}>
          <div>
            Statewide Vulnerability Index:{' '}
            <strong style={{ color: statewideRisk > 0.70 ? '#EF4444' : 'var(--foreground)' }}>
              {(statewideRisk * 100).toFixed(0)}%
            </strong>
          </div>
          <div>
            Regional Clusters: <strong style={{ color: 'var(--foreground)' }}>{clusters.length} Active Corridors</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#DC2626' }}></span>
            <span>Critical Clusters: <strong style={{ color: 'var(--foreground)' }}>{summary?.critical_clusters || 2}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#1D4ED8' }}></span>
            <span>Patrols Dispatched: <strong style={{ color: 'var(--foreground)' }}>{atms.filter((a) => a.is_in_cooldown).length}</strong></span>
          </div>
          <div style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: '700' }}>
            Showing {displayedAtms.length} of {atms.length} Surveillance Terminals
          </div>
        </div>
      </div>

      {/* Main Map + Guidance Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '12px' }}>
        {/* Map Canvas */}
        <div className="card astrix-card" style={{ padding: '0', overflow: 'hidden', height: '600px', position: 'relative', border: '1px solid var(--border)' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>

          {/* Leaflet Map Legend */}
          <div 
            className="leaflet-legend-box"
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              backgroundColor: 'var(--card)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              zIndex: 999,
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              color: 'var(--foreground)'
            }}
          >
            <div style={{ fontWeight: '800', color: 'var(--foreground)', marginBottom: '2px', fontSize: '11.5px', letterSpacing: '-0.01em' }}>
              Leaflet Vulnerability & Status Key
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.2 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#DC2626', flexShrink: 0 }}></span>
              <span style={{ color: 'var(--foreground)' }}>Critical Vulnerability (&gt; 80%) / Active Threat</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.2 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#D97706', flexShrink: 0 }}></span>
              <span style={{ color: 'var(--foreground)' }}>Elevated Activity (60–80%) / Suspicious Velocity</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.2 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#00A896', flexShrink: 0 }}></span>
              <span style={{ color: 'var(--foreground)' }}>Baseline Surveillance (&lt; 60%) / Nominal</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.2 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#1D4ED8', flexShrink: 0 }}></span>
              <span style={{ color: 'var(--foreground)' }}>Patrol Dispatched (15m Suppression Cooldown)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '5px', marginTop: '2px', lineHeight: 1.2 }}>
              <span style={{ width: '10px', height: '0px', borderTop: '2px dashed #DC2626', display: 'inline-block', flexShrink: 0 }}></span>
              <span style={{ color: 'var(--muted-foreground)' }}>Regional Cluster Surveillance Zone</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Tactical Directive */}
          <div className="card astrix-card" style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ShieldAlert size={16} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '13px', color: 'var(--foreground)', margin: 0 }}>
                Patrol Unit Tactical Directive
              </h3>
            </div>

            <div style={{
              padding: '8px 10px',
              backgroundColor: 'var(--secondary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              fontSize: '11.5px',
              lineHeight: 1.4,
              marginBottom: '8px',
            }}>
              <strong>Interception Advisory:</strong> Spatiotemporal clustering concentrated in <strong>Pune IT Corridor</strong> (Hinjawadi Phase 1) and <strong>Mumbai MMR</strong> (BKC).
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Top Hotspot:</span>
                <strong style={{ color: 'var(--foreground)' }}>HDFC Hinjawadi Phase 1</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Primary Corridor:</span>
                <strong style={{ color: 'var(--foreground)' }}>Mumbai — Pune Expressway</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Active Suppression:</span>
                <strong style={{ color: 'var(--foreground)' }}>{atms.filter((a) => a.is_in_cooldown).length} Terminals Suppressed</strong>
              </div>
            </div>
          </div>

          {/* Selected Cluster Details (if cluster selected and no single ATM selected) */}
          {selectedCluster && !selectedAtm && (
            <div className="card astrix-card" style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="badge badge-teal">
                  {selectedCluster.city} Cluster
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
                  {selectedCluster.cluster_id}
                </span>
              </div>

              <h4 style={{ fontSize: '13px', color: 'var(--foreground)', marginBottom: '3px' }}>
                {selectedCluster.name}
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                {selectedCluster.corridor_desc}
              </p>

              {/* Cluster Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Cluster Vulnerability:</span>
                  <strong style={{ color: selectedCluster.vulnerability_tier === 'CRITICAL' ? '#EF4444' : 'var(--foreground)' }}>
                    {(selectedCluster.vulnerability_score * 100).toFixed(0)}% ({selectedCluster.vulnerability_tier})
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Peak ATM Intensity:</span>
                  <strong style={{ color: 'var(--foreground)' }}>{(selectedCluster.max_vulnerability_score * 100).toFixed(0)}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Status:</span>
                  <span className="badge" style={{
                    fontSize: '9.5px',
                    backgroundColor: selectedCluster.status === 'ACTIVE_THREAT' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                    color: selectedCluster.status === 'ACTIVE_THREAT' ? '#ef4444' : '#16a34a',
                    border: `1px solid ${selectedCluster.status === 'ACTIVE_THREAT' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
                  }}>
                    {selectedCluster.status_label}
                  </span>
                </div>
              </div>

              {/* Member ATMs list */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '6px' }}>
                  Cluster ATMs ({selectedCluster.atms?.length || 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                  {(selectedCluster.atms || []).map((a) => (
                    <div
                      key={a.atm_id}
                      onClick={() => {
                        const target = atms.find((item) => item.atm_id === a.atm_id) || a;
                        setSelectedAtm(target);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setView([a.lat, a.lon], 13);
                        }
                      }}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: 'var(--secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        color: 'var(--foreground)',
                      }}
                    >
                      <div>
                        <strong>{a.bank}</strong> — {a.area}
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        color: a.status === 'ACTIVE_THREAT' ? '#EF4444' : (a.is_in_cooldown ? '#1D4ED8' : 'var(--primary)'),
                      }}>
                        {(a.vulnerability_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Selected ATM Details & Actions */}
          {selectedAtm ? (
            <div className="card astrix-card" style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1.5px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="badge badge-teal">{selectedAtm.bank} ATM</span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>
                  {selectedAtm.atm_id}
                </span>
              </div>

              <h4 style={{ fontSize: '13px', color: 'var(--foreground)', marginBottom: '1px' }}>
                {selectedAtm.area}, {selectedAtm.city}
              </h4>
              <div style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                GPS: {selectedAtm.lat?.toFixed(4)}, {selectedAtm.lon?.toFixed(4)}
              </div>

              {/* Vulnerability & Status Telemetry */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Vulnerability Score:</span>
                  <strong style={{ color: selectedAtm.vulnerability_score > 0.8 ? '#EF4444' : 'var(--foreground)' }}>
                    {((selectedAtm.vulnerability_score || selectedAtm.hawkes_intensity || 0) * 100).toFixed(0)}% ({selectedAtm.vulnerability_tier || 'MONITORED'})
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Operational Status:</span>
                  <span className="badge" style={{
                    fontSize: '9.5px',
                    backgroundColor: selectedAtm.is_in_cooldown ? 'rgba(59, 130, 246, 0.12)' : (selectedAtm.status === 'ACTIVE_THREAT' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)'),
                    color: selectedAtm.is_in_cooldown ? '#3b82f6' : (selectedAtm.status === 'ACTIVE_THREAT' ? '#ef4444' : '#16a34a'),
                    border: `1px solid ${selectedAtm.is_in_cooldown ? 'rgba(59, 130, 246, 0.25)' : (selectedAtm.status === 'ACTIVE_THREAT' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)')}`,
                  }}>
                    {selectedAtm.status_label || selectedAtm.status}
                  </span>
                </div>

                {selectedAtm.is_in_cooldown && (
                  <div style={{
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: '#3b82f6',
                    fontSize: '10.5px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}>
                    <Clock size={12} />
                    <span>PATROL DISPATCHED ({Math.floor(selectedAtm.cooldown_remaining_sec / 60)}m cooldown remaining)</span>
                  </div>
                )}
              </div>

              {/* Linked Bank Alerts */}
              <div style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border)',
                marginBottom: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={13} style={{ color: matchingAlerts.length > 0 ? '#EF4444' : 'var(--primary)' }} />
                    Alerts on {selectedAtm.bank}
                  </span>
                  <span className={`badge ${matchingAlerts.length > 0 ? 'badge-critical' : 'badge-verified'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                    {matchingAlerts.length > 0 ? `${matchingAlerts.length} Active` : '0 Active'}
                  </span>
                </div>

                {matchingAlerts.length > 0 ? (
                  <div style={{
                    backgroundColor: 'var(--secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    marginBottom: '8px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#EF4444' }}>LATEST INCIDENT</span>
                      <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>{matchingAlerts[0].complaint_id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--foreground)' }}>
                        ₹{(matchingAlerts[0].amount || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="badge" style={{ fontSize: '9.5px', padding: '1px 5px', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}>
                        {matchingAlerts[0].status || 'PENDING'}
                      </span>
                    </div>
                    {onSelectAlert && (
                      <button
                        onClick={() => onSelectAlert(matchingAlerts[0])}
                        className="astrix-btn-outline"
                        style={{ width: '100%', padding: '4px 8px', fontSize: '10.5px', justifyContent: 'center', gap: '4px' }}
                      >
                        <span>Open Case Dossier</span>
                        <ExternalLink size={11} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', padding: '6px 8px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                    No active fraud complaints for {selectedAtm.bank}. General surveillance active.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleDispatchPatrol(selectedAtm.atm_id)}
                  disabled={selectedAtm.is_in_cooldown}
                  className="astrix-btn-primary"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '11.5px',
                    opacity: selectedAtm.is_in_cooldown ? 0.6 : 1,
                    cursor: selectedAtm.is_in_cooldown ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    lineHeight: 1,
                  }}
                >
                  <Send size={12} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} />
                  <span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>{selectedAtm.is_in_cooldown ? 'Patrol En Route' : 'Alert Patrol Unit'}</span>
                </button>

                {selectedAtm.is_in_cooldown && (
                  <button
                    onClick={() => handleClearStatus(selectedAtm.atm_id)}
                    className="astrix-btn-outline"
                    style={{ padding: '7px 10px', fontSize: '11px' }}
                    title="Clear cooldown and reset status"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          ) : (
            !selectedCluster && (
              <div className="card astrix-card" style={{ padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <Building size={22} style={{ margin: '0 auto 6px', color: 'var(--muted-foreground)', opacity: 0.5 }} />
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)' }}>Select a Cluster or ATM Marker</div>
                <p style={{ fontSize: '11px', marginTop: '2px' }}>
                  Click any regional cluster badge or ATM marker to inspect vulnerability scores, examine operational statuses, and alert patrol units.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
