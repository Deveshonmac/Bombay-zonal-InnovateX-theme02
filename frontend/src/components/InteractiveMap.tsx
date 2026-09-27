import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { IncidentCluster } from '../types';
import { useTheme } from '../context/ThemeContext';
import { PanelLeftOpen, PanelRightOpen, Layers } from 'lucide-react';

export interface InteractiveMapProps {
  clusters: IncidentCluster[];
  selectedClusterId: string | null;
  onSelectCluster: (id: string) => void;
  onInspectCluster?: (id: string) => void;
  isQueueCollapsed?: boolean;
  isLeftSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onToggleQueue?: () => void;
  criticalCount?: number;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  clusters,
  selectedClusterId,
  onSelectCluster,
  onInspectCluster,
  isQueueCollapsed,
  isLeftSidebarCollapsed = false,
  onToggleSidebar,
  onToggleQueue,
  criticalCount
}) => {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const circlesRef = useRef<{ [key: string]: L.Circle }>({});
  const onInspectClusterRef = useRef(onInspectCluster);
  const onSelectClusterRef = useRef(onSelectCluster);

  // Map tile style preference: 'gis' (Esri Dark/Light Gray) | 'osm' (OpenStreetMap standard)
  const [mapStyle, setMapStyle] = useState<'gis' | 'osm'>('gis');
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  useEffect(() => {
    onInspectClusterRef.current = onInspectCluster;
  }, [onInspectCluster]);

  useEffect(() => {
    onSelectClusterRef.current = onSelectCluster;
  }, [onSelectCluster]);

  // Category formatter
  const formatCategory = (category: string) => {
    switch (category) {
      case 'construction_dust':
        return 'Construction Dust';
      case 'biomass_burning':
        return 'Biomass Burning';
      case 'vehicular':
        return 'Vehicular Emissions';
      case 'industrial':
        return 'Industrial Stack';
      default:
        return category;
    }
  };

  // 1. Map Initialization
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    if (mapInstanceRef.current) return;

    if ((container as any)._leaflet_id) {
      try {
        delete (container as any)._leaflet_id;
      } catch (e) {
        (container as any)._leaflet_id = undefined;
      }
    }

    try {
      // Center default on Pune Municipal Corporation [18.5204, 73.8567], zoom level 12.5
      const map = L.map(container, {
        center: [18.5204, 73.8567],
        zoom: 12.5,
        minZoom: 10,
        maxZoom: 16,
        zoomControl: false,
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.error('Leaflet initialization error caught safely:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Map cleanup error:', e);
        }
        mapInstanceRef.current = null;
      }
      if (container && (container as any)._leaflet_id) {
        try {
          delete (container as any)._leaflet_id;
        } catch (e) {
          (container as any)._leaflet_id = undefined;
        }
      }
    };
  }, []);

  // 2. Dynamic, Keyless Tile Layers (Esri Dark/Light Gray + OpenStreetMap)
  // ZERO API KEY REQUIRED - 100% Watermark-Free & Institutional Grade
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers before applying new theme/style
    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (labelsTileLayerRef.current) {
      map.removeLayer(labelsTileLayerRef.current);
      labelsTileLayerRef.current = null;
    }

    if (mapStyle === 'osm') {
      // OpenStreetMap Standard Tiles (No API key, free, open-source)
      baseTileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 18,
      }).addTo(map);
    } else {
      // Esri ArcGIS Canvas (Official Defense & Environmental GIS Base - ZERO API KEY, NO WATERMARKS)
      const isDark = theme === 'dark';
      const baseService = isDark ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base';
      const refService = isDark ? 'World_Dark_Gray_Reference' : 'World_Light_Gray_Reference';

      baseTileLayerRef.current = L.tileLayer(
        `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${baseService}/MapServer/tile/{z}/{y}/{x}`,
        {
          attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 16,
        }
      ).addTo(map);

      // Add crisp city and street label overlay on top
      labelsTileLayerRef.current = L.tileLayer(
        `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${refService}/MapServer/tile/{z}/{y}/{x}`,
        {
          maxZoom: 16,
          zIndex: 5,
        }
      ).addTo(map);
    }
  }, [theme, mapStyle]);

  // Responsive Resizing: Listen for ResizeObserver and window events
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    let rafId: number | null = null;
    let timer: any = null;

    const scheduleInvalidate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const map = mapInstanceRef.current;
        if (map) {
          try {
            map.invalidateSize(false);
          } catch (e) {
            // safe ignore during transitions
          }
        }
      });
    };

    const safeInvalidate = () => {
      scheduleInvalidate();
      clearTimeout(timer);
      timer = setTimeout(() => {
        scheduleInvalidate();
      }, 100);
    };

    const resizeObserver = new ResizeObserver(() => {
      scheduleInvalidate();
    });
    resizeObserver.observe(mapContainerRef.current);

    window.addEventListener('resize', safeInvalidate);
    window.addEventListener('leaflet-invalidate-size', scheduleInvalidate);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', safeInvalidate);
      window.removeEventListener('leaflet-invalidate-size', scheduleInvalidate);
    };
  }, []);

  // Invalidate map size smoothly when queue or left sidebar is collapsed or expanded
  useEffect(() => {
    const timer = setTimeout(() => {
      const map = mapInstanceRef.current;
      if (map) {
        try {
          map.invalidateSize(false);
        } catch (e) {
          // safe ignore
        }
      }
    }, 280);
    return () => {
      clearTimeout(timer);
    };
  }, [isQueueCollapsed, isLeftSidebarCollapsed]);

  // 3. Dynamic Incident Cluster Markers & Cluster Hover Card
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up old markers and circles
    Object.values(markersRef.current).forEach(m => m.remove());
    Object.values(circlesRef.current).forEach(c => c.remove());
    markersRef.current = {};
    circlesRef.current = {};

    clusters.forEach(cluster => {
      const isSelected = cluster.cluster_id === selectedClusterId;
      const isResolved = cluster.status === 'resolved';
      const isCritical = !isResolved && (cluster.hours_remaining < 6 || cluster.avg_aqi > 300);

      // Color-coded borders:
      let borderColor = theme === 'dark' ? '#38BDF8' : '#2563EB'; // Standard active
      if (isResolved) {
        borderColor = '#10B981'; // Celadon Jade
      } else if (isCritical) {
        borderColor = '#F43F5E'; // Crimson Coral
      }

      // Marker diameter based on complaint count:
      const minCount = 10;
      const maxCount = 45;
      const minSize = 32;
      const maxSize = 54;
      const clampedCount = Math.max(minCount, Math.min(maxCount, cluster.complaint_count));
      const markerDiameter = Math.round(minSize + ((clampedCount - minCount) / (maxCount - minCount)) * (maxSize - minSize));

      const centerCoord: [number, number] = cluster.center || [cluster.lat || 18.5204, cluster.lng || 73.8567];

      // Geographic radius circle
      const circleRadius = Math.min(1400, Math.max(600, cluster.complaint_count * 20));
      const circle = L.circle(centerCoord, {
        radius: circleRadius,
        color: borderColor,
        weight: isSelected ? 2.5 : 1.2,
        opacity: isSelected ? (theme === 'dark' ? 0.9 : 0.75) : (theme === 'dark' ? 0.45 : 0.3),
        fillColor: borderColor,
        fillOpacity: isSelected ? (theme === 'dark' ? 0.18 : 0.1) : (theme === 'dark' ? 0.08 : 0.04),
      }).addTo(map);

      circlesRef.current[cluster.cluster_id] = circle;

      // Custom HTML/CSS DivIcon with Dark Command Palette:
      const selectedRingClass = isSelected 
        ? (theme === 'dark' ? 'ring-3 ring-emerald-400 ring-offset-2 ring-offset-[#0C1015]' : 'ring-3 ring-blue-600 ring-offset-2') 
        : '';
      const fontSizeClass = markerDiameter >= 42 ? 'text-xs' : 'text-[11px]';
      const markerBg = theme === 'dark' ? '#131922' : '#FFFFFF';
      const markerTextColor = isResolved 
        ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700')
        : isCritical 
        ? (theme === 'dark' ? 'text-rose-400' : 'text-rose-700')
        : (theme === 'dark' ? 'text-sky-300' : 'text-blue-900');

      const customHtml = `
        <div data-tour="hotspot-pin" class="relative flex items-center justify-center cursor-pointer transition-transform duration-150 ${isSelected ? 'scale-105 z-50' : 'hover:scale-105'}">
          <div 
            class="rounded-full flex items-center justify-center shadow-lg select-none ${selectedRingClass}"
            style="width: ${markerDiameter}px; height: ${markerDiameter}px; border: 2.5px solid ${borderColor}; background-color: ${markerBg};"
          >
            <span class="font-mono font-bold ${markerTextColor} leading-none ${fontSizeClass}">
              ${isResolved ? '✓' : cluster.complaint_count}
            </span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'airsense-cluster-marker',
        html: customHtml,
        iconSize: [markerDiameter, markerDiameter],
        iconAnchor: [markerDiameter / 2, markerDiameter / 2],
      });

      const marker = L.marker(centerCoord, { icon }).addTo(map);

      // Popup with inspection details
      const slaBadgeHtml = isResolved
        ? theme === 'dark'
          ? '<span class="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">RESOLVED</span>'
          : '<span class="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">RESOLVED</span>'
        : isCritical
        ? theme === 'dark'
          ? `<span class="text-[10px] font-mono font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">⏱ ${cluster.hours_remaining.toFixed(1)}h SLA</span>`
          : `<span class="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">⏱ ${cluster.hours_remaining.toFixed(1)}h SLA</span>`
        : theme === 'dark'
        ? `<span class="text-[10px] font-mono font-medium text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">⏱ ${cluster.hours_remaining.toFixed(1)}h SLA</span>`
        : `<span class="text-[10px] font-mono font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">⏱ ${cluster.hours_remaining.toFixed(1)}h SLA</span>`;

      const popupContainer = document.createElement('div');
      popupContainer.className = 'airsense-popup-container';

      L.DomEvent.disableClickPropagation(popupContainer);
      L.DomEvent.disableScrollPropagation(popupContainer);

      const cardBg = theme === 'dark' ? 'bg-[#131922] border-[#222E3C] text-[#F1F5F9]' : 'bg-white border-slate-200 text-slate-900';
      const textTitleColor = theme === 'dark' ? 'text-[#F1F5F9]' : 'text-slate-900';
      const textMutedColor = theme === 'dark' ? 'text-[#94A3B8]' : 'text-slate-500';
      const textAqi = theme === 'dark' ? 'text-amber-400' : 'text-amber-800';
      const borderDivider = theme === 'dark' ? 'border-[#222E3C] text-[#94A3B8]' : 'border-slate-100 text-slate-700';

      popupContainer.innerHTML = `
        <div class="${cardBg} rounded-lg border shadow-xl p-3 min-w-[250px] font-sans select-none">
          <div class="flex items-start justify-between gap-2 mb-1">
            <h4 class="font-bold text-xs ${textTitleColor} leading-snug">${cluster.title}</h4>
            <div class="shrink-0">${slaBadgeHtml}</div>
          </div>
          <p class="text-[11px] ${textMutedColor} mb-2">
            ${formatCategory(cluster.category)} • ${cluster.ward}
          </p>
          <div class="flex items-center justify-between text-[11px] font-mono ${borderDivider} pt-2 border-t">
            <span>${cluster.complaint_count} reports • <strong class="${textAqi}">AQI ${cluster.avg_aqi}</strong></span>
            <button
              type="button"
              data-tour="inspect-btn"
              data-inspect-cluster="${cluster.cluster_id}"
              class="inspect-action-btn bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded shadow-xs transition-colors touch-manipulation"
              aria-label="Inspect ${cluster.title} dossier"
            >
              <span>Inspect</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>
      `;

      const handleInspect = () => {
        if (onInspectClusterRef.current) {
          onInspectClusterRef.current(cluster.cluster_id);
        } else if (onSelectClusterRef.current) {
          onSelectClusterRef.current(cluster.cluster_id);
        }
      };

      const inspectBtn = popupContainer.querySelector('.inspect-action-btn');
      if (inspectBtn) {
        inspectBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          handleInspect();
        });
      }

      marker.bindPopup(popupContainer, {
        closeButton: false,
        offset: [0, -Math.round(markerDiameter / 2 + 2)],
        className: 'airsense-executive-popup'
      });

      let hoverTimeout: any = null;
      let isHoveringPopup = false;

      marker.on('mouseover', () => {
        clearTimeout(hoverTimeout);
        marker.openPopup();
      });

      marker.on('mouseout', () => {
        hoverTimeout = setTimeout(() => {
          if (cluster.cluster_id !== selectedClusterId && !isHoveringPopup) {
            marker.closePopup();
          }
        }, 250);
      });

      popupContainer.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        isHoveringPopup = true;
      });

      popupContainer.addEventListener('mouseleave', () => {
        isHoveringPopup = false;
        if (cluster.cluster_id !== selectedClusterId) {
          marker.closePopup();
        }
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e as any);
        handleInspect();
        marker.openPopup();
        map.flyTo(cluster.center, 14, { duration: 0.8 });
      });

      markersRef.current[cluster.cluster_id] = marker;
    });
  }, [clusters, selectedClusterId, theme]);

  // Center on selected cluster when selected from external pane
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedClusterId) return;

    const cluster = clusters.find(c => c.cluster_id === selectedClusterId);
    if (cluster) {
      const coord: [number, number] = cluster.center || [cluster.lat, cluster.lng];
      map.flyTo(coord, 14, {
        animate: true,
        duration: 0.8
      });
      const marker = markersRef.current[selectedClusterId];
      if (marker && !marker.isPopupOpen()) {
        marker.openPopup();
      }
    }
  }, [selectedClusterId, clusters]);

  // Keyboard shortcut: Esc to close any open popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mapInstanceRef.current) {
        mapInstanceRef.current.closePopup();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compact Reset View Handler
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([18.5204, 73.8567], 12.5, { duration: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-120px)] md:h-full overflow-hidden select-none bg-slate-100 dark:bg-[#0C1015] transition-colors">
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 4. Floating Header Overlay with Sidebar Reopen Affordance */}
      <div className={`absolute top-2 left-2 md:top-3.5 ${isLeftSidebarCollapsed ? 'md:left-4' : 'md:left-4'} z-10 flex items-center gap-2 max-w-[calc(100%-16px)] transition-all duration-200`}>
        {/* If Left Sidebar is Collapsed, show an explicit Expand Sidebar Button right in the map overlay */}
        {isLeftSidebarCollapsed && (
          <button
            type="button"
            onClick={() => {
              if (onToggleSidebar) {
                onToggleSidebar();
              } else {
                window.dispatchEvent(new CustomEvent('toggle-left-sidebar'));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131922] text-[#F1F5F9] hover:bg-[#1A232F] border border-[#222E3C] hover:border-emerald-500/60 shadow-lg rounded-md text-xs font-semibold cursor-pointer select-none transition-all group"
            title="Expand Navigation Sidebar (⌘\ or [)"
          >
            <PanelLeftOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Show Sidebar</span>
            <kbd className="hidden lg:inline text-[9px] text-[#94A3B8] font-mono bg-[#0C1015] px-1 py-0.5 rounded border border-[#222E3C]">
              ⌘\
            </kbd>
          </button>
        )}

        <div className="bg-white/95 dark:bg-[#131922]/95 backdrop-blur-md border border-slate-200 dark:border-[#222E3C] shadow-md rounded-md px-3 py-1.5 flex items-center text-xs transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse"></span>
            <span className="font-semibold text-slate-900 dark:text-[#F1F5F9] text-[11px] truncate font-mono">
              PMC Central Command • {clusters.length} Hotspots
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetView}
            className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 font-mono font-medium border-l border-slate-200 dark:border-[#222E3C] pl-2.5 ml-2.5 transition-colors cursor-pointer flex items-center shrink-0"
            title="Reset map view to Pune Municipal Corporation central view"
          >
            Reset Camera
          </button>
        </div>
      </div>

      {/* Map Top-Right Controls: Expand Queue Affordance + Layer Style Switcher */}
      <div className="absolute top-2 right-2 md:top-3.5 md:right-4 z-10 flex items-center gap-2">
        {/* If Queue (Right Sidebar) is Collapsed, show an explicit Expand Queue Button matching the left one! */}
        {isQueueCollapsed && (
          <button
            type="button"
            onClick={() => {
              if (onToggleQueue) {
                onToggleQueue();
              } else {
                window.dispatchEvent(new CustomEvent('toggle-queue'));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131922] text-[#F1F5F9] hover:bg-[#1A232F] border border-[#222E3C] hover:border-emerald-500/60 shadow-lg rounded-md text-xs font-semibold cursor-pointer select-none transition-all group backdrop-blur-md"
            title="Expand Priority Queue (⌘B or ])"
          >
            <PanelRightOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Show Queue</span>
            {criticalCount !== undefined && (
              <span className="px-1.5 py-0.2 bg-rose-950/80 text-rose-300 rounded text-[10px] font-mono font-bold border border-rose-800/80">
                {criticalCount > 0 ? `${criticalCount} Urg` : `${clusters.length}`}
              </span>
            )}
            <kbd className="hidden lg:inline text-[9px] text-[#94A3B8] font-mono bg-[#0C1015] px-1 py-0.5 rounded border border-[#222E3C]">
              ⌘B
            </kbd>
          </button>
        )}

        <div className="relative flex flex-col items-end">
          <button
            type="button"
            onClick={() => setShowStyleMenu(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 dark:bg-[#131922]/95 backdrop-blur-md border border-slate-200 dark:border-[#222E3C] shadow-md rounded-md text-xs font-mono text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] cursor-pointer transition-colors"
            title="Switch Map Tile Layer (No API Key Required)"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium hidden sm:inline">
              {mapStyle === 'gis' ? (theme === 'dark' ? 'Dark GIS Canvas' : 'Light GIS Canvas') : 'OpenStreetMap'}
            </span>
          </button>

        {showStyleMenu && (
          <div className="mt-1.5 bg-white dark:bg-[#131922] border border-slate-200 dark:border-[#222E3C] rounded-md shadow-xl p-1.5 min-w-[170px] flex flex-col gap-1 text-xs font-mono z-30 animate-in fade-in slide-in-from-top-1">
            <button
              type="button"
              onClick={() => {
                setMapStyle('gis');
                setShowStyleMenu(false);
              }}
              className={`px-2 py-1.5 rounded text-left flex items-center justify-between cursor-pointer transition-colors ${
                mapStyle === 'gis' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold' 
                  : 'text-slate-700 dark:text-[#949EA8] hover:bg-slate-50 dark:hover:bg-[#1A232F]'
              }`}
            >
              <span>{theme === 'dark' ? 'Dark GIS Canvas' : 'Light GIS Canvas'}</span>
              {mapStyle === 'gis' && <span className="text-[10px]">●</span>}
            </button>
            <button
              type="button"
              onClick={() => {
                setMapStyle('osm');
                setShowStyleMenu(false);
              }}
              className={`px-2 py-1.5 rounded text-left flex items-center justify-between cursor-pointer transition-colors ${
                mapStyle === 'osm' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold' 
                  : 'text-slate-700 dark:text-[#949EA8] hover:bg-slate-50 dark:hover:bg-[#1A232F]'
              }`}
            >
              <span>OpenStreetMap</span>
              {mapStyle === 'osm' && <span className="text-[10px]">●</span>}
            </button>
            <div className="pt-1 border-t border-slate-100 dark:border-[#222E3C] text-[9px] text-slate-400 dark:text-[#64748B] px-1">
              ✓ 100% Free &amp; Keyless
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-16 right-3 md:bottom-4 md:right-4 z-10 flex flex-col bg-white dark:bg-[#131922] border border-slate-200 dark:border-[#222E3C] rounded-md shadow-md overflow-hidden divide-y divide-slate-100 dark:divide-[#222E3C] transition-colors">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          aria-label="Zoom in"
          className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center text-slate-800 dark:text-[#F1F5F9] hover:bg-slate-50 dark:hover:bg-[#1A232F] font-bold text-sm select-none transition-colors cursor-pointer touch-manipulation"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          aria-label="Zoom out"
          className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center text-slate-800 dark:text-[#F1F5F9] hover:bg-slate-50 dark:hover:bg-[#1A232F] font-bold text-sm select-none transition-colors cursor-pointer touch-manipulation"
        >
          &minus;
        </button>
      </div>

      {/* Bottom Legend with True Semantic Colors */}
      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-10 hidden sm:flex bg-white/95 dark:bg-[#131922]/95 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#222E3C] shadow-md text-[10px] font-mono text-slate-700 dark:text-[#949EA8] items-center gap-3 transition-colors">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-500 bg-white dark:bg-[#131922] inline-block"></span>
          <span className="font-semibold text-rose-700 dark:text-rose-400">Critical (&lt;6h SLA)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-sky-500 bg-white dark:bg-[#131922] inline-block"></span>
          <span className="font-semibold text-blue-800 dark:text-sky-400">Elevated</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white dark:bg-[#131922] inline-block"></span>
          <span className="font-semibold text-emerald-800 dark:text-emerald-400">Resolved</span>
        </div>
        <span className="text-slate-300 dark:text-[#222E3C]">|</span>
        <span className="text-slate-500 dark:text-[#64748B]">Size = Volume</span>
      </div>
    </div>
  );
};

export default InteractiveMap;
