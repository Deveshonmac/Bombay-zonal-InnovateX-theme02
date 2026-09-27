import React, { useState, useEffect, useRef, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Map as MapIcon,
  Layers,
  Wind,
  Users,
  Eye,
  RotateCcw,
  MapPin,
  Flame,
  CheckCircle,
  AlertTriangle,
  Info,
  Sliders,
  ChevronRight,
  Filter,
  Navigation,
  Globe,
  Compass,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAQIBand, getAQIBandInfo, AQI_BANDS_INFO } from '../utils/aqiCalculations';
import { AQIBand, CityData, CommunityReport } from '../types';

// NASA FIRMS & ISRO active crop residue fire detection hotspots (Indo-Gangetic agricultural belt)
const MOCK_FIRE_HOTSPOTS = [
  { id: 'fire-01', location: 'Sangrur, Punjab', lat: 30.2458, lng: 75.8421, confidence: 'High (VIIRS 375m)', intensity: 'Severe (38.4 MW)', type: 'Paddy Residue Burning' },
  { id: 'fire-02', location: 'Tarn Taran, Punjab', lat: 31.4522, lng: 74.9255, confidence: 'High', intensity: 'Severe (42.1 MW)', type: 'Stubble Burning' },
  { id: 'fire-03', location: 'Karnal, Haryana', lat: 29.6857, lng: 76.9905, confidence: 'Moderate', intensity: 'High (26.8 MW)', type: 'Agricultural Residue' },
  { id: 'fire-04', location: 'Fatehabad, Haryana', lat: 29.5186, lng: 75.4542, confidence: 'High', intensity: 'Severe (34.2 MW)', type: 'Post-Harvest Burning' },
  { id: 'fire-05', location: 'Bareilly, Uttar Pradesh', lat: 28.3670, lng: 79.4304, confidence: 'Moderate', intensity: 'Moderate (18.5 MW)', type: 'Biomass Burning' },
  { id: 'fire-06', location: 'Muzaffarpur, Bihar', lat: 26.1209, lng: 85.3647, confidence: 'Moderate', intensity: 'Moderate (15.2 MW)', type: 'Crop Residue' },
];

export const InteractiveMap: React.FC = () => {
  const {
    allCities,
    currentCity,
    setCurrentCity,
    selectCityById,
    colorblindMode,
    toggleColorblindMode,
    communityReports,
    addComparisonCity,
    comparisonCityIds,
    setActiveTab,
    theme,
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupStationsRef = useRef<L.LayerGroup | null>(null);
  const layerGroupHeatmapRef = useRef<L.LayerGroup | null>(null);
  const layerGroupWindRef = useRef<L.LayerGroup | null>(null);
  const layerGroupReportsRef = useRef<L.LayerGroup | null>(null);
  const layerGroupFiresRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [selectedPinCity, setSelectedPinCity] = useState<CityData | null>(currentCity);
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);

  // Layer Toggles
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showWindVectors, setShowWindVectors] = useState<boolean>(true);
  const [showCommunityOverlay, setShowCommunityOverlay] = useState<boolean>(true);
  const [showFireHotspots, setShowFireHotspots] = useState<boolean>(true);

  // Map Tile Style: 'auto' | 'dark' | 'light' | 'osm' | 'satellite'
  const [mapTileStyle, setMapTileStyle] = useState<'auto' | 'dark' | 'light' | 'osm' | 'satellite'>('auto');

  // Filter by Band
  const [selectedBandFilter, setSelectedBandFilter] = useState<AQIBand | 'all'>('all');

  const filteredCities = useMemo(() => {
    if (selectedBandFilter === 'all') return allCities;
    return allCities.filter((c) => getAQIBand(c.aqi) === selectedBandFilter);
  }, [allCities, selectedBandFilter]);

  // Determine actual tile URL based on preference and theme
  const getTileUrl = (style: 'auto' | 'dark' | 'light' | 'osm' | 'satellite', currentTheme: 'light' | 'dark') => {
    if (style === 'dark' || (style === 'auto' && currentTheme === 'dark')) {
      return {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      };
    }
    if (style === 'light' || (style === 'auto' && currentTheme === 'light')) {
      return {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      };
    }
    if (style === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri, Maxar, Earthstar Geographics, and GIS User Community',
      };
    }
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Map centered over India
      const map = L.map(mapContainerRef.current, {
        center: [21.7679, 78.8718],
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false, // Custom position
      });

      // Add Zoom Control top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Create Layer Groups
      layerGroupStationsRef.current = L.layerGroup().addTo(map);
      layerGroupHeatmapRef.current = L.layerGroup().addTo(map);
      layerGroupWindRef.current = L.layerGroup().addTo(map);
      layerGroupReportsRef.current = L.layerGroup().addTo(map);
      layerGroupFiresRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Set/Update Tile Layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const tileConfig = getTileUrl(mapTileStyle, theme);
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(map);

    // Timeout to trigger invalidateSize
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [mapTileStyle, theme]);

  // Update Layers when data or filter toggles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. STATIONS LAYER
    if (layerGroupStationsRef.current) {
      layerGroupStationsRef.current.clearLayers();

      if (showStations) {
        filteredCities.forEach((city) => {
          const bandInfo = getAQIBandInfo(city.aqi, colorblindMode);
          const isSelected = selectedPinCity?.id === city.id;
          const isSevere = city.aqi >= 200;

          const markerHtml = `
            <div class="relative group cursor-pointer transition-transform duration-200 transform hover:scale-125 ${isSelected ? 'scale-125 z-40' : 'z-20'}">
              ${isSevere ? `<div class="absolute -inset-1.5 rounded-full animate-ping opacity-60" style="background-color: ${bandInfo.displayColor};"></div>` : ''}
              <div class="relative flex items-center shadow-lg rounded-full border-2 ${isSelected ? 'border-white dark:border-zinc-900 ring-2 ring-sky-500 scale-110' : 'border-white/90 dark:border-zinc-900/90'}" style="background-color: ${bandInfo.displayColor}; color: #ffffff;">
                <div class="px-2 py-0.5 text-[11px] font-black tracking-tight flex items-center gap-1 font-mono">
                  <span>${city.aqi}</span>
                </div>
              </div>
              <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow whitespace-nowrap pointer-events-none border border-zinc-700">
                ${city.name}
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-station-pin',
            iconSize: [44, 26],
            iconAnchor: [22, 13],
          });

          const marker = L.marker([city.coordinates.lat, city.coordinates.lng], {
            icon: customIcon,
          });

          marker.on('click', () => {
            setSelectedPinCity(city);
            setSelectedReport(null);
          });

          layerGroupStationsRef.current?.addLayer(marker);
        });
      }
    }

    // 2. PM2.5 ATMOSPHERIC GRADIENT HEATMAP / DISPERSION RADIUS LAYER
    if (layerGroupHeatmapRef.current) {
      layerGroupHeatmapRef.current.clearLayers();

      if (showHeatmap) {
        filteredCities.forEach((city) => {
          const bandInfo = getAQIBandInfo(city.aqi, colorblindMode);
          const color = bandInfo.displayColor;
          
          // Calculate dynamic dispersion radius and pixel size
          const sizePx = Math.min(260, Math.max(90, Math.round(city.aqi * 0.75)));
          const halfSize = Math.round(sizePx / 2);
          const blurAmount = Math.max(12, Math.round(sizePx * 0.15));

          // Soft multi-stop radial gradient with atmospheric Gaussian diffusion
          const gradientHtml = `
            <div class="pointer-events-none select-none" style="
              width: ${sizePx}px;
              height: ${sizePx}px;
              border-radius: 50%;
              background: radial-gradient(circle, 
                ${color}99 0%, 
                ${color}70 20%, 
                ${color}40 45%, 
                ${color}18 70%, 
                ${color}05 85%, 
                transparent 100%
              );
              filter: blur(${blurAmount}px);
              opacity: ${city.aqi > 200 ? '0.85' : '0.65'};
              transform: translate(-50%, -50%);
              mix-blend-mode: multiply;
            "></div>
          `;

          const gradientIcon = L.divIcon({
            html: gradientHtml,
            className: 'atmospheric-gradient-halo',
            iconSize: [sizePx, sizePx],
            iconAnchor: [halfSize, halfSize],
          });

          const gradientMarker = L.marker([city.coordinates.lat, city.coordinates.lng], {
            icon: gradientIcon,
            interactive: false,
            zIndexOffset: -500, // keep behind station pins
          });

          layerGroupHeatmapRef.current?.addLayer(gradientMarker);
        });
      }
    }

    // 3. IMD SURFACE WIND VECTORS LAYER
    if (layerGroupWindRef.current) {
      layerGroupWindRef.current.clearLayers();

      if (showWindVectors) {
        allCities.forEach((city) => {
          const rotationDeg = city.weather.windDegree || 0;
          const windSpeed = city.weather.windSpeed;

          const windHtml = `
            <div class="pointer-events-none flex flex-col items-center opacity-80 hover:opacity-100 transition-opacity">
              <div class="w-6 h-6 rounded-full bg-cyan-950/70 border border-cyan-400/80 flex items-center justify-center text-cyan-300 shadow-md transform" style="transform: rotate(${rotationDeg}deg);">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                </svg>
              </div>
              <span class="text-[8px] font-bold text-cyan-200 bg-zinc-950/80 px-1 rounded mt-0.5 border border-cyan-900/60 font-mono">
                ${windSpeed}km/h
              </span>
            </div>
          `;

          const windIcon = L.divIcon({
            html: windHtml,
            className: 'custom-wind-pin',
            iconSize: [30, 38],
            iconAnchor: [15, 19],
          });

          // Offset slightly from station center
          const windLat = city.coordinates.lat + 0.3;
          const windLng = city.coordinates.lng + 0.3;

          const windMarker = L.marker([windLat, windLng], { icon: windIcon });
          layerGroupWindRef.current?.addLayer(windMarker);
        });
      }
    }

    // 4. CITIZEN GROUND-TRUTH REPORTS LAYER
    if (layerGroupReportsRef.current) {
      layerGroupReportsRef.current.clearLayers();

      if (showCommunityOverlay) {
        communityReports.forEach((rep) => {
          const isSelected = selectedReport?.id === rep.id;
          const reportHtml = `
            <div class="cursor-pointer group transform hover:scale-125 transition-transform ${isSelected ? 'scale-125' : ''}">
              <div class="w-7 h-7 rounded-full bg-amber-500 text-zinc-950 border-2 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center font-bold text-xs">
                ${rep.reportedCondition.includes('Smoke') || rep.reportedCondition.includes('Stubble') ? '🔥' : '⚠️'}
              </div>
              <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[8px] font-extrabold px-1 rounded shadow whitespace-nowrap">
                Report
              </div>
            </div>
          `;

          const reportIcon = L.divIcon({
            html: reportHtml,
            className: 'custom-report-pin',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const reportMarker = L.marker([rep.coordinates.lat, rep.coordinates.lng], {
            icon: reportIcon,
          });

          reportMarker.on('click', () => {
            setSelectedReport(rep);
            // find city if any
            const matchingCity = allCities.find((c) => c.name === rep.cityName);
            if (matchingCity) setSelectedPinCity(matchingCity);
          });

          layerGroupReportsRef.current?.addLayer(reportMarker);
        });
      }
    }

    // 5. NASA/ISRO FIRE HOTSPOTS LAYER
    if (layerGroupFiresRef.current) {
      layerGroupFiresRef.current.clearLayers();

      if (showFireHotspots) {
        MOCK_FIRE_HOTSPOTS.forEach((fire) => {
          const fireHtml = `
            <div class="cursor-pointer group transform hover:scale-125 transition-transform">
              <div class="relative">
                <div class="absolute -inset-1 rounded-full bg-rose-600 animate-ping opacity-75"></div>
                <div class="relative w-6 h-6 rounded-full bg-red-600 text-white border border-amber-300 shadow-md flex items-center justify-center text-[10px]">
                  🔥
                </div>
              </div>
              <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-rose-900/90 text-rose-200 text-[8px] font-bold px-1 rounded shadow whitespace-nowrap border border-rose-700">
                NASA FIRMS
              </div>
            </div>
          `;

          const fireIcon = L.divIcon({
            html: fireHtml,
            className: 'custom-fire-pin',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const fireMarker = L.marker([fire.lat, fire.lng], { icon: fireIcon });
          fireMarker.bindPopup(`
            <div class="text-xs p-1">
              <div class="font-bold text-rose-600 flex items-center gap-1">
                <span>🔥 Active Thermal Anomaly (NASA FIRMS / ISRO)</span>
              </div>
              <div class="font-semibold text-zinc-900 mt-1">${fire.location}</div>
              <div class="text-zinc-600 mt-0.5">${fire.type}</div>
              <div class="text-[11px] text-zinc-500 mt-1">Intensity: <span class="font-mono font-bold">${fire.intensity}</span></div>
              <div class="text-[10px] text-zinc-400">Sensor: ${fire.confidence}</div>
            </div>
          `);

          layerGroupFiresRef.current?.addLayer(fireMarker);
        });
      }
    }
  }, [
    filteredCities,
    allCities,
    communityReports,
    showStations,
    showHeatmap,
    showWindVectors,
    showCommunityOverlay,
    showFireHotspots,
    selectedPinCity,
    selectedReport,
    colorblindMode,
  ]);

  // Pan to city helper
  const flyToCity = (city: CityData, zoomLevel: number = 9) => {
    setSelectedPinCity(city);
    setSelectedReport(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([city.coordinates.lat, city.coordinates.lng], zoomLevel, {
        duration: 1.2,
      });
    }
  };

  // Region Presets
  const zoomToRegion = (region: 'india' | 'north' | 'west' | 'south' | 'east' | 'central') => {
    if (!mapInstanceRef.current) return;
    switch (region) {
      case 'india':
        mapInstanceRef.current.flyTo([21.7679, 78.8718], 5, { duration: 1.2 });
        break;
      case 'north':
        mapInstanceRef.current.flyTo([28.6139, 77.2090], 7, { duration: 1.2 });
        break;
      case 'west':
        mapInstanceRef.current.flyTo([20.5, 73.0], 6.5, { duration: 1.2 });
        break;
      case 'south':
        mapInstanceRef.current.flyTo([13.0, 77.5], 6.5, { duration: 1.2 });
        break;
      case 'east':
        mapInstanceRef.current.flyTo([24.5, 86.5], 6.5, { duration: 1.2 });
        break;
      case 'central':
        mapInstanceRef.current.flyTo([24.5, 79.5], 6.5, { duration: 1.2 });
        break;
    }
  };

  const selectedBandInfo = selectedPinCity
    ? getAQIBandInfo(selectedPinCity.aqi, colorblindMode)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Map Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <MapIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>National Air Quality & Particulate Map</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  India Live CPCB Feed
                </span>
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Leaflet geospatial intelligence across Indian Continuous Ambient Air Quality Monitoring Stations (CAAQMS), PM2.5 dispersion, and NASA thermal fire anomalies.
              </p>
            </div>
          </div>
        </div>

        {/* Region Quick Zoom Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Regions:
          </span>
          <button
            onClick={() => zoomToRegion('india')}
            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold transition-colors text-xs"
          >
            Pan-India
          </button>
          <button
            onClick={() => zoomToRegion('north')}
            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold transition-colors text-xs"
          >
            Delhi NCR & North
          </button>
          <button
            onClick={() => zoomToRegion('west')}
            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold transition-colors text-xs"
          >
            West (Mumbai / Guj)
          </button>
          <button
            onClick={() => zoomToRegion('south')}
            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold transition-colors text-xs"
          >
            South (BLR / HYD / CHN)
          </button>
          <button
            onClick={() => zoomToRegion('east')}
            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold transition-colors text-xs"
          >
            East (Kolkata / Patna)
          </button>
        </div>
      </div>

      {/* Control Toolbar: Layers & Map Base Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
        {/* Layer Checkboxes */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Map Layers:
          </span>
          <button
            onClick={() => setShowStations(!showStations)}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
              showStations
                ? 'bg-sky-50 border-sky-300 text-sky-800 dark:bg-sky-950/60 dark:border-sky-700 dark:text-sky-300'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-sky-500" />
            <span>CAAQMS Stations</span>
          </button>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
              showHeatmap
                ? 'bg-purple-50 border-purple-300 text-purple-800 dark:bg-purple-950/60 dark:border-purple-700 dark:text-purple-300'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span>PM2.5 Dispersion Halos</span>
          </button>

          <button
            onClick={() => setShowWindVectors(!showWindVectors)}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
              showWindVectors
                ? 'bg-teal-50 border-teal-300 text-teal-800 dark:bg-teal-950/60 dark:border-teal-700 dark:text-teal-300'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-teal-500" />
            <span>IMD Surface Wind</span>
          </button>

          <button
            onClick={() => setShowFireHotspots(!showFireHotspots)}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
              showFireHotspots
                ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-300'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Stubble Fire Anomalies</span>
          </button>

          <button
            onClick={() => setShowCommunityOverlay(!showCommunityOverlay)}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
              showCommunityOverlay
                ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span>Citizen Field Reports</span>
          </button>
        </div>

        {/* Tile Style Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 font-medium">Basemap:</span>
          <select
            value={mapTileStyle}
            onChange={(e) => setMapTileStyle(e.target.value as any)}
            className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="auto">Theme Auto ({theme})</option>
            <option value="dark">Carto Dark Matter</option>
            <option value="light">Carto Positron</option>
            <option value="satellite">Esri Satellite Imagery</option>
            <option value="osm">OpenStreetMap Standard</option>
          </select>
        </div>
      </div>

      {/* Main Map Container + Side Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Leaflet Map Stage (3 Columns) */}
        <div className="lg:col-span-3 bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative min-h-[560px] flex flex-col">
          {/* Leaflet Mount Element */}
          <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[560px] flex-1 z-10"
            id="leaflet-aqi-india-map"
          />

          {/* Map Overlay Floating Band Legend */}
          <div className="absolute bottom-3 left-3 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-sm pointer-events-auto">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                National AQI Scale (CPCB)
              </span>
              <button
                onClick={toggleColorblindMode}
                className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Eye className="w-3 h-3" />
                {colorblindMode ? 'Accessible' : 'Standard'}
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1 text-center font-mono">
              {(Object.keys(AQI_BANDS_INFO) as AQIBand[]).map((band) => {
                const info = AQI_BANDS_INFO[band];
                const color = colorblindMode ? info.colorblindColor : info.color;
                const isCurrentBand = selectedPinCity && getAQIBand(selectedPinCity.aqi) === band;
                return (
                  <button
                    key={band}
                    onClick={() =>
                      setSelectedBandFilter(selectedBandFilter === band ? 'all' : band)
                    }
                    className={`rounded p-1 transition-all ${
                      selectedBandFilter === band
                        ? 'ring-2 ring-zinc-900 dark:ring-white scale-105 shadow-md'
                        : selectedBandFilter !== 'all'
                        ? 'opacity-40'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Filter by ${info.label} (${info.minAQI}–${info.maxAQI})`}
                  >
                    <div className="text-[9px] font-black text-white leading-none">
                      {info.minAQI}
                    </div>
                    <div className="text-[8px] font-bold text-white/90 truncate leading-tight">
                      {info.shortLabel}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedBandFilter !== 'all' && (
              <button
                onClick={() => setSelectedBandFilter('all')}
                className="w-full text-center text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-1.5 hover:underline"
              >
                Reset Filter (Showing {filteredCities.length} stations)
              </button>
            )}
          </div>

          {/* Quick Active Station Info Tag on Map */}
          {selectedPinCity && (
            <div className="absolute top-3 left-3 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg pointer-events-auto flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: selectedBandInfo?.displayColor }}
              />
              <div>
                <div className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>{selectedPinCity.name}</span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    ({selectedPinCity.state})
                  </span>
                </div>
                <div className="text-[11px] font-mono font-bold" style={{ color: selectedBandInfo?.displayColor }}>
                  AQI {selectedPinCity.aqi} • {selectedBandInfo?.label}
                </div>
              </div>
              <button
                onClick={() => flyToCity(selectedPinCity, 10)}
                className="ml-2 p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors"
                title="Zoom into station"
              >
                <Navigation className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: Selected Station / Citizen Report Drawer (1 Column) */}
        <div className="space-y-4">
          {/* Station Diagnostics Card */}
          {selectedPinCity ? (
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400">
                    Station Diagnostics
                  </span>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    {selectedPinCity.name}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedPinCity.stationName}
                  </p>
                </div>
                <div
                  className="px-3 py-1.5 rounded-xl font-mono text-center text-white shadow-sm"
                  style={{ backgroundColor: selectedBandInfo?.displayColor }}
                >
                  <div className="text-xl font-black">{selectedPinCity.aqi}</div>
                  <div className="text-[9px] uppercase font-bold tracking-wider">
                    {selectedBandInfo?.shortLabel}
                  </div>
                </div>
              </div>

              {/* Status Band Description */}
              <div
                className="p-3 rounded-xl text-xs font-medium border"
                style={{
                  backgroundColor: `${selectedBandInfo?.displayColor}15`,
                  borderColor: `${selectedBandInfo?.displayColor}40`,
                  color: selectedBandInfo?.displayColor,
                }}
              >
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Health Advisory</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-[11px]">
                  {selectedBandInfo?.actionSummary}
                </p>
              </div>

              {/* Key Pollutant Bars */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-500 text-[11px] font-semibold">
                  <span>Continuous Pollutant Readouts</span>
                  <span className="font-mono">CPCB NAAQS</span>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        PM2.5 (Fine Particulates)
                      </span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedPinCity.pollutants.pm25} µg/m³
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (selectedPinCity.pollutants.pm25 / 300) * 100)}%`,
                          backgroundColor: selectedBandInfo?.displayColor,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        PM10 (Coarse Dust)
                      </span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedPinCity.pollutants.pm10} µg/m³
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (selectedPinCity.pollutants.pm10 / 500) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        NO2 (Vehicular Combustion)
                      </span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedPinCity.pollutants.no2} µg/m³
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (selectedPinCity.pollutants.no2 / 120) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather & Inversion */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl">
                  <div className="text-[10px] text-zinc-500">Surface Weather</div>
                  <div className="font-bold text-zinc-800 dark:text-zinc-200">
                    {selectedPinCity.weather.temperature}°C • {selectedPinCity.weather.condition}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Wind: {selectedPinCity.weather.windSpeed} km/h ({selectedPinCity.weather.windDirection})
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl">
                  <div className="text-[10px] text-zinc-500">Inversion Trap Risk</div>
                  <div
                    className={`font-bold ${
                      selectedPinCity.inversionRisk === 'Severe'
                        ? 'text-rose-600 dark:text-rose-400'
                        : selectedPinCity.inversionRisk === 'High'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {selectedPinCity.inversionRisk}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Humidity: {selectedPinCity.weather.humidity}%
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    selectCityById(selectedPinCity.id);
                    setActiveTab('city-detail');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  id="view-full-city-forecast-btn"
                >
                  <span>Open Full 7-Day Forecast & Source Breakdown</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      addComparisonCity(selectedPinCity.id);
                      setActiveTab('comparison');
                    }}
                    className="py-2 px-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Sliders className="w-3 h-3 text-sky-500" />
                    <span>Compare City</span>
                  </button>

                  <button
                    onClick={() => {
                      selectCityById(selectedPinCity.id);
                      setActiveTab('simulator');
                    }}
                    className="py-2 px-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Simulate Smog</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 space-y-2">
              <MapPin className="w-8 h-8 mx-auto text-zinc-400" />
              <p className="text-xs">Click any station pin on the map to inspect live CAAQMS data.</p>
            </div>
          )}

          {/* Quick List of All 18 Indian Stations */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              <span>Monitored Indian Cities ({filteredCities.length})</span>
              <span className="text-[10px] text-zinc-400 font-mono">Ranked by AQI</span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {filteredCities.map((city, idx) => {
                const bandInfo = getAQIBandInfo(city.aqi, colorblindMode);
                const isSelected = selectedPinCity?.id === city.id;
                return (
                  <button
                    key={city.id}
                    onClick={() => flyToCity(city, 8)}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-colors text-xs ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/50 border border-sky-300 dark:border-sky-800'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-400 w-4">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {city.name}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {city.state}
                        </div>
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: bandInfo.displayColor }}
                    >
                      {city.aqi}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
