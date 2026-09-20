import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Layers, Shield, Sparkles } from 'lucide-react';

export interface HotspotClusterItem {
  id: number;
  rank: number;
  name: string;
  category: string;
  status: string;
  complaint_count: number;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  priority_score: number;
  urgency_level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  sla_target: string;
  avg_aqi: number;
  justification?: string;
}

interface NodalHotspotMapProps {
  clusters: HotspotClusterItem[];
  selectedClusterId: number | null;
  onSelectCluster: (id: number) => void;
  height?: string;
}

export const NodalHotspotMap: React.FC<NodalHotspotMapProps> = ({
  clusters,
  selectedClusterId,
  onSelectCluster,
  height = '520px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Pune metropolitan area
    const map = L.map(mapContainerRef.current, {
      center: [18.5304, 73.8667],
      zoom: 12,
      zoomControl: false,
    });

    // Clean, high-contrast CartoDB Voyager tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 18,
    }).addTo(map);

    // Zoom controls at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Layer group for dynamic clusters
    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Geometries when clusters or selection change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (clusters.length === 0) return;

    const bounds = L.latLngBounds([]);

    clusters.forEach((cluster) => {
      const isSelected = cluster.id === selectedClusterId;
      const isCritical = cluster.urgency_level === 'CRITICAL';
      const isResolved = cluster.status === 'resolved';

      const markerColor = isResolved ? '#10b981' : isCritical ? '#ef4444' : '#f59e0b';
      const latLng = L.latLng(cluster.center_lat, cluster.center_lng);
      bounds.extend(latLng);

      // 1. Outer Spatial Radius Circle (DBSCAN 2.5km boundary)
      const radiusCircle = L.circle(latLng, {
        radius: cluster.radius_meters || 2200,
        color: markerColor,
        weight: isSelected ? 2.5 : 1.2,
        dashArray: isSelected ? undefined : '5, 5',
        fillColor: markerColor,
        fillOpacity: isSelected ? 0.18 : 0.07,
      });

      radiusCircle.on('click', () => {
        onSelectCluster(cluster.id);
      });

      radiusCircle.addTo(layerGroup);

      // 2. Custom HTML Marker
      const customIcon = L.divIcon({
        className: 'airsense-hotspot-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            ${
              isCritical && !isResolved
                ? `<div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background-color: ${markerColor}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="
              width: ${isSelected ? '36px' : '30px'};
              height: ${isSelected ? '36px' : '30px'};
              border-radius: 50%;
              background-color: ${markerColor};
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: system-ui, -apple-system, sans-serif;
              font-weight: 800;
              font-size: ${isSelected ? '13px' : '11px'};
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
              border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
              cursor: pointer;
              transition: transform 0.2s ease;
            ">
              #${cluster.rank}
            </div>
            <div style="
              position: absolute;
              bottom: -16px;
              white-space: nowrap;
              background: rgba(15, 23, 42, 0.88);
              color: #ffffff;
              padding: 1.5px 6px;
              border-radius: 6px;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 9.5px;
              font-weight: 700;
              letter-spacing: 0.02em;
              box-shadow: 0 2px 6px rgba(0,0,0,0.25);
              pointer-events: none;
            ">
              ${cluster.complaint_count} rpts
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker(latLng, { icon: customIcon });

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px 2px; min-width: 210px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; background: ${markerColor}20; color: ${markerColor}; padding: 2px 6px; border-radius: 4px;">
              ${cluster.urgency_level} (${cluster.priority_score}/100)
            </span>
            <span style="font-size: 11px; font-weight: 800; color: #ef4444;">
              AQI ${Math.round(cluster.avg_aqi)}
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px; line-height: 1.25;">
            ${cluster.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            ${cluster.complaint_count} citizen complaints grouped (radius: ~${Math.round(cluster.radius_meters)}m)
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #475569; background: #f8fafc; padding: 5px 8px; border-radius: 6px; margin-bottom: 6px;">
            <span>Target SLA:</span>
            <strong style="color: #0f172a;">${cluster.sla_target}</strong>
          </div>
          <div style="font-size: 10px; color: #0284c7; font-weight: 700; text-align: center; padding-top: 2px;">
            Click pin to open field directive
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { offset: [0, -10] });

      marker.on('click', () => {
        onSelectCluster(cluster.id);
      });

      marker.addTo(layerGroup);
    });

    // If an incident is selected, smoothly pan/zoom to it
    if (selectedClusterId) {
      const selected = clusters.find((c) => c.id === selectedClusterId);
      if (selected) {
        map.flyTo([selected.center_lat, selected.center_lng], 13, { duration: 1.0 });
      }
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [clusters, selectedClusterId, onSelectCluster]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current || clusters.length === 0) return;
    const bounds = L.latLngBounds(clusters.map((c) => [c.center_lat, c.center_lng]));
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md">
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />

      {/* Floating Control: Recenter Button */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <button
          onClick={handleRecenter}
          className="px-3 py-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition"
        >
          <Navigation className="w-3.5 h-3.5 text-sky-500" />
          Recenter Pune Extents
        </button>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-xl text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 shadow-md">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <span>DBSCAN Hotspot Rings Active (2.5 km)</span>
        </div>
      </div>

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-700/90 rounded-xl p-3 shadow-lg text-[11px] space-y-1.5">
        <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-sky-500" />
          <span>Incident Severity Classification</span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
            <span className="text-zinc-600 dark:text-zinc-400 font-semibold">Critical (P1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
            <span className="text-zinc-600 dark:text-zinc-400 font-semibold">High (P2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span className="text-zinc-600 dark:text-zinc-400 font-semibold">Resolved</span>
          </div>
        </div>
      </div>
    </div>
  );
};
