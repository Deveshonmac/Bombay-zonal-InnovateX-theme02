import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Wind, Users, MapPin, Zap, FileDown, Mail, CheckSquare,
  Square, AlertTriangle, Navigation, Clock, Building2, ShieldCheck,
  Printer, ChevronRight, Send
} from 'lucide-react';
import { IncidentCluster } from '../types';
import { StatutoryRecommendation } from '../services/geminiService';

// ─── Wind ellipse computation ────────────────────────────────────────────────
// Returns an array of [lat, lng] polygon points representing the downwind
// affected zone. Major axis stretches downwind, minor axis is crosswind.
function computeWindEllipsePoints(
  lat: number,
  lng: number,
  windDeg: number,
  windSpeed: number,
  aqi: number
): [number, number][] {
  const KM_PER_DEG_LAT = 111.32;
  const KM_PER_DEG_LNG = 111.32 * Math.cos((lat * Math.PI) / 180);

  // Scale radius with AQI severity and wind speed
  const baseKm = 0.4 + (aqi / 400) * 2.0;
  const majorKm = baseKm * (1 + windSpeed / 25);  // downwind stretch
  const minorKm = baseKm * 0.38;                   // crosswind width

  // Convert met degrees (from-direction) → "to" direction in standard math
  // Met: 0° = wind FROM north (blows south). We want the downwind direction.
  const downwindDeg = (windDeg + 180) % 360;
  const downwindRad = (downwindDeg * Math.PI) / 180;

  const points: [number, number][] = [];
  const STEPS = 48;

  for (let i = 0; i <= STEPS; i++) {
    const theta = (i / STEPS) * 2 * Math.PI;

    // Parametric ellipse: shift center slightly downwind so the source is near
    // the upwind edge, not the center — more physically realistic.
    const upwindShiftKm = majorKm * 0.25;
    const ex = majorKm * Math.cos(theta); // along major axis (downwind)
    const ey = minorKm * Math.sin(theta); // along minor axis (crosswind)

    // Rotate by downwind bearing
    const cosB = Math.cos(downwindRad);
    const sinB = Math.sin(downwindRad);
    const dxKm = ex * sinB - ey * cosB + upwindShiftKm * sinB;
    const dyKm = ex * cosB + ey * sinB + upwindShiftKm * cosB;

    points.push([
      lat + dyKm / KM_PER_DEG_LAT,
      lng + dxKm / KM_PER_DEG_LNG,
    ]);
  }

  return points;
}

// Rough population density estimate based on AQI and complaint count
function estimateAffectedPopulation(aqi: number, complaintCount: number, windSpeed: number): number {
  const baseArea = 0.4 + (aqi / 400) * 2.0;
  const majorKm = baseArea * (1 + windSpeed / 25);
  const minorKm = baseArea * 0.38;
  const areaKm2 = Math.PI * majorKm * minorKm;
  // Pune urban density ~8,000–15,000 per km²; mixed zone estimate ~6,000
  return Math.round(areaKm2 * 6200 / 1000) * 1000;
}

// ─── Action checklist items by category ─────────────────────────────────────
function getActionChecklist(category: string): string[] {
  switch (category) {
    case 'biomass_burning':
      return [
        'Deploy foam tender for active fire suppression',
        'Evacuate 200m radius residential buffer',
        'Issue stop-work notice to site operator',
        'Station VOC sensor within 100m for real-time monitoring',
        'Document pre-/post-AQI with CAAQMS station',
        'File First Information Report if repeat offender',
      ];
    case 'construction_dust':
      return [
        'Deploy anti-smog gun / mist cannon at site boundary',
        'Verify tarpaulin cover on all sand stockpiles',
        'Enforce mandatory tyre-wash at construction exit',
        'Issue stop-work order until wet suppression active',
        'Record PM10 reading before and after misting',
        'Notify site contractor of SWM Rule 2016 penalty',
      ];
    case 'vehicular':
      return [
        'Initiate corridor diversion via Traffic Branch',
        'Deploy RTO mobile emission testing van',
        'Enforce engine-off rule at idling depot bays',
        'Coordinate signal-cycle adjustment at chowk',
        'Deploy mechanised road sweeper on affected stretch',
        'Log PUC violation count for CMVR prosecution',
      ];
    case 'industrial':
      return [
        'Conduct emergency stack emission audit',
        'Verify CEMS (online sensor) telemetry compliance',
        'Inspect wet scrubber / filter operational status',
        'Issue provisional §31A closure directive',
        'Collect flue gas samples with isokinetic sampler',
        'Coordinate MPCB Regional Office joint inspection',
      ];
    default:
      return [
        'Deploy rapid response squad to incident site',
        'Collect ambient air samples for lab analysis',
        'Issue statutory notice to responsible party',
        'Record before/after AQI with CAAQMS station',
      ];
  }
}

// ─── Agency routing by category ─────────────────────────────────────────────
function getAgencyRouting(category: string): { primary: string; secondary: string; escalation: string } {
  switch (category) {
    case 'biomass_burning':
      return {
        primary: 'PMC Flying Squad Team-B (Solid Waste)',
        secondary: 'Pune Fire Brigade Control Room',
        escalation: 'MPCB Regional Environmental Cell',
      };
    case 'construction_dust':
      return {
        primary: 'PMC Solid Waste & Works Dept',
        secondary: 'MahaMetro Environmental Cell',
        escalation: 'CPCB Regional Office (Pune)',
      };
    case 'vehicular':
      return {
        primary: 'Pune City Traffic Police (Env. Branch)',
        secondary: 'MSRTC Regional Transport Office',
        escalation: 'RTO Motor Vehicle Inspector',
      };
    case 'industrial':
      return {
        primary: 'MPCB Regional Office (Pune)',
        secondary: 'PMC Environment & Heritage Cell',
        escalation: 'District Collector (Emergency Powers)',
      };
    default:
      return {
        primary: 'PMC Nodal Environmental Officer',
        secondary: 'MPCB Sub-Regional Office',
        escalation: 'State PCB Emergency Response',
      };
  }
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface InterventionIntelligenceModalProps {
  cluster: IncidentCluster;
  recommendation: StatutoryRecommendation;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const InterventionIntelligenceModal: React.FC<InterventionIntelligenceModalProps> = ({
  cluster,
  recommendation,
  onClose,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const windSpeed = cluster.windSpeed ?? 10;
  const windDeg = cluster.windDeg ?? 180;
  const windDir = cluster.windDirection ?? 'S';
  const aqi = cluster.avg_aqi ?? cluster.local_aqi ?? 280;
  const affectedPop = estimateAffectedPopulation(aqi, cluster.complaint_count, windSpeed);
  const checklist = getActionChecklist(cluster.category);
  const agencies = getAgencyRouting(cluster.category);

  // Init checklist
  useEffect(() => {
    setCheckedItems(new Array(checklist.length).fill(false));
  }, [checklist.length]);

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Build Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;

    let map: any = null;

    const init = async () => {
      const L = await import('leaflet');

      // Clean up previous instance
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      map = L.map(mapRef.current!, {
        center: [cluster.lat, cluster.lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });

      leafletMapRef.current = map;

      // Warm tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      // Wind-adjusted ellipse polygon
      const ellipsePoints = computeWindEllipsePoints(
        cluster.lat, cluster.lng, windDeg, windSpeed, aqi
      );
      L.polygon(ellipsePoints, {
        color: '#D97706',
        fillColor: '#FCD34D',
        fillOpacity: 0.22,
        weight: 2,
        dashArray: '6 4',
      }).addTo(map).bindPopup(
        `<div style="font-family:DM Sans,sans-serif;font-size:12px;padding:6px">
          <strong>Wind-Adjusted Affected Zone</strong><br/>
          Direction: ${windDir} at ${windSpeed} km/h<br/>
          Est. affected area: ~${(Math.PI * (0.4 + aqi/400*2.0) * (1 + windSpeed/25) * (0.4 + aqi/400*2.0) * 0.38).toFixed(1)} km²
        </div>`
      );

      // Wind direction arrow marker
      const windArrowIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;
          background:rgba(217,119,6,0.15);
          border:2px solid #D97706;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:18px;
          transform:rotate(${windDeg}deg);
        ">↑</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([cluster.lat, cluster.lng], { icon: windArrowIcon })
        .addTo(map)
        .bindPopup(`Wind: ${windDir} ${windSpeed} km/h`);

      // Source cluster marker
      const sourceIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:22px;height:22px;
          background:#E11D48;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(225,29,72,0.5);
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([cluster.lat, cluster.lng], { icon: sourceIcon })
        .addTo(map)
        .bindPopup(`<strong>${cluster.title}</strong><br/>AQI: ${aqi}`)
        .openPopup();

      // Individual complaint markers
      cluster.complaints.forEach(c => {
        const dotIcon = L.divIcon({
          className: '',
          html: `<div style="width:10px;height:10px;background:#F59E0B;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
        L.marker([c.lat, c.lng], { icon: dotIcon })
          .addTo(map)
          .bindPopup(`<div style="font-size:11px;padding:4px">${c.description.slice(0, 80)}…<br/><em>AQI ${c.reported_AQI}</em></div>`);
      });

      // Fit to ellipse
      map.fitBounds(L.polygon(ellipsePoints).getBounds(), { padding: [30, 30] });
    };

    init();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [cluster, windDeg, windSpeed, aqi]);

  const toggleCheck = (i: number) => {
    setCheckedItems(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const checkedCount = checkedItems.filter(Boolean).length;

  // PDF / Print
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  };

  // Mailto forward
  const handleMailto = () => {
    const subject = encodeURIComponent(
      `VayuMan Enforcement Directive — ${cluster.title} [Priority Score: ${cluster.priority_score}]`
    );
    const body = encodeURIComponent(
      `VAYUMAN INTERVENTION DIRECTIVE\n` +
      `Generated: ${new Date().toLocaleString('en-IN')}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `INCIDENT: ${cluster.title}\n` +
      `Ward: ${cluster.ward}\n` +
      `AQI: ${aqi} | Complaints: ${cluster.complaint_count} | Priority: ${cluster.priority_score}/100\n` +
      `SLA Remaining: ${cluster.hours_remaining.toFixed(1)}h\n\n` +
      `DIRECTIVE:\n${recommendation.directive}\n\n` +
      `TARGET AGENCY: ${recommendation.targetAgency}\n` +
      `LEGAL PROVISION: ${recommendation.legalProvision}\n\n` +
      `OPERATIONAL ASSESSMENT:\n${recommendation.rationale}\n\n` +
      `SUGGESTED EQUIPMENT: ${recommendation.suggestedEquipment?.join(', ')}\n\n` +
      `WIND CONDITIONS: ${windDir} at ${windSpeed} km/h\n` +
      `ESTIMATED AFFECTED POPULATION: ~${affectedPop.toLocaleString('en-IN')}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Sent via VayuMan B2G Triage Platform — PMC Pune`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const urgencyColor =
    cluster.hours_remaining < 3 ? 'text-rose-600' :
    cluster.hours_remaining < 6 ? 'text-orange-600' :
    'text-amber-600';

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .intervention-print-root { display: block !important; position: static !important; }
          .no-print { display: none !important; }
          .print-section { page-break-inside: avoid; }
        }
        @media screen {
          .intervention-print-root { display: flex; }
        }
      `}</style>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 no-print"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="intervention-print-root w-full max-w-[1200px] h-[92vh] bg-[#FFFDF9] dark:bg-[#1D1916] rounded-2xl shadow-2xl border border-[#EAE2D8] dark:border-[#2D2825] flex flex-col overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#EAE2D8] dark:border-[#2D2825] bg-[#FEF9F2] dark:bg-[#151210] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/50 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1C120A] dark:text-[#FEF3E2] leading-tight">
                    Intervention Intelligence Plan
                  </h2>
                  <p className="text-[11px] text-[#9B8472] dark:text-[#B89880] font-mono">
                    {cluster.cluster_id} · {cluster.ward}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* SLA countdown */}
                <div className={`flex items-center gap-1.5 text-xs font-mono font-semibold ${urgencyColor} bg-[#FEF9F2] dark:bg-[#151210] px-2.5 py-1 rounded-lg border border-[#EAE2D8] dark:border-[#2D2825]`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{cluster.hours_remaining.toFixed(1)}h SLA</span>
                </div>

                {/* Print */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#EAE2D8] dark:border-[#2D2825] text-[#6E5A47] dark:text-[#B89880] hover:bg-[#F5EDE0] dark:hover:bg-[#252018] transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>

                {/* Forward */}
                <button
                  type="button"
                  onClick={handleMailto}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Forward</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9B8472] dark:text-[#B89880] hover:bg-[#F5EDE0] dark:hover:bg-[#252018] hover:text-[#1C120A] dark:hover:text-[#FEF3E2] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Incident title strip */}
            <div className="px-5 py-2.5 bg-white dark:bg-[#1D1916] border-b border-[#EAE2D8] dark:border-[#2D2825] shrink-0 print-section">
              <h3 className="text-sm font-bold text-[#1C120A] dark:text-[#FEF3E2] leading-snug">{cluster.title}</h3>
              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[#9B8472] dark:text-[#B89880] font-mono">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cluster.location_name}</span>
                <span>·</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">AQI {aqi}</span>
                <span>·</span>
                <span>{cluster.complaint_count} citizen complaints</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{windDir} {windSpeed} km/h</span>
              </div>
            </div>

            {/* ── 3-pane body ── */}
            <div className="flex-1 flex overflow-hidden min-h-0">

              {/* LEFT: Map */}
              <div className="w-[42%] flex flex-col border-r border-[#EAE2D8] dark:border-[#2D2825] shrink-0">
                <div className="px-3 py-2 border-b border-[#EAE2D8] dark:border-[#2D2825] flex items-center justify-between shrink-0">
                  <span className="text-[11px] font-semibold text-[#6E5A47] dark:text-[#B89880] font-mono uppercase tracking-wide">Wind-Adjusted Affected Zone</span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400">
                    <Navigation className="w-3 h-3" />
                    {windDir} · {windSpeed} km/h
                  </span>
                </div>
                <div ref={mapRef} className="flex-1 min-h-0" />
                {/* Map legend */}
                <div className="px-3 py-1.5 border-t border-[#EAE2D8] dark:border-[#2D2825] flex items-center gap-4 text-[10px] font-mono text-[#9B8472] dark:text-[#B89880] shrink-0">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white inline-block shrink-0" />
                    Source cluster
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-white inline-block shrink-0" />
                    Complaints
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-2 rounded border-2 border-amber-500 border-dashed inline-block shrink-0" style={{ background: 'rgba(252,211,77,0.25)' }} />
                    Wind zone
                  </span>
                </div>
              </div>

              {/* CENTER: Directive */}
              <div className="flex-1 flex flex-col overflow-y-auto border-r border-[#EAE2D8] dark:border-[#2D2825]">
                <div className="px-4 py-2 border-b border-[#EAE2D8] dark:border-[#2D2825] shrink-0">
                  <span className="text-[11px] font-semibold text-[#6E5A47] dark:text-[#B89880] font-mono uppercase tracking-wide">AI Enforcement Directive</span>
                </div>

                <div className="p-4 space-y-3 flex-1 overflow-y-auto print-section">
                  {/* Target agency */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#9B8472] dark:text-[#786050] uppercase tracking-wider block">
                      Target Agency
                    </label>
                    <div className="flex items-center gap-2 p-2.5 bg-[#F5EDE0] dark:bg-[#151210] rounded-lg border border-[#EAE2D8] dark:border-[#2D2825]">
                      <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-sm font-semibold text-[#1C120A] dark:text-[#FEF3E2]">{recommendation.targetAgency}</span>
                    </div>
                  </div>

                  {/* Directive */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#9B8472] dark:text-[#786050] uppercase tracking-wider block">
                      Recommended Action
                    </label>
                    <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-sm text-[#1C120A] dark:text-[#FEF3E2] leading-relaxed">
                      {recommendation.directive}
                    </div>
                  </div>

                  {/* Legal provision */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#9B8472] dark:text-[#786050] uppercase tracking-wider block">
                      Legal Authority
                    </label>
                    <div className="flex items-center gap-2 p-2 bg-[#F5EDE0] dark:bg-[#151210] border border-[#EAE2D8] dark:border-[#2D2825] rounded-lg font-mono text-[11px] text-amber-800 dark:text-amber-300">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold">{recommendation.legalProvision}</span>
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-semibold text-[#9B8472] dark:text-[#786050] uppercase tracking-wider block">
                      Operational Assessment
                    </label>
                    <p className="text-xs text-[#6E5A47] dark:text-[#B89880] leading-relaxed p-2.5 bg-[#F5EDE0]/50 dark:bg-[#151210]/50 rounded-lg border border-[#EAE2D8] dark:border-[#2D2825]">
                      {recommendation.rationale}
                    </p>
                  </div>

                  {/* Equipment */}
                  {recommendation.suggestedEquipment && recommendation.suggestedEquipment.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-semibold text-[#9B8472] dark:text-[#786050] uppercase tracking-wider block">
                        Rapid Deployment Equipment
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendation.suggestedEquipment.map((eq, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 text-[11px] font-medium text-amber-800 dark:text-amber-300 font-mono"
                          >
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Agency routing */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-mono font-semibold text-[#9B8472] dark:text-[#786050] uppercase tracking-wider block">
                      Agency Escalation Chain
                    </label>
                    <div className="space-y-1">
                      {[
                        { label: 'Primary', value: agencies.primary, color: 'text-[#1C120A] dark:text-[#FEF3E2]' },
                        { label: 'Secondary', value: agencies.secondary, color: 'text-[#6E5A47] dark:text-[#B89880]' },
                        { label: 'Escalation', value: agencies.escalation, color: 'text-rose-600 dark:text-rose-400' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center gap-2 text-xs p-1.5 rounded bg-[#F5EDE0]/60 dark:bg-[#151210]/60">
                          <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="text-[10px] font-mono text-[#9B8472] dark:text-[#786050] w-16 shrink-0">{label}:</span>
                          <span className={`font-medium ${color} text-[11px]`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dispatch button */}
                <div className="p-3 border-t border-[#EAE2D8] dark:border-[#2D2825] shrink-0 no-print">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Dispatch & Close Intervention Plan
                  </button>
                </div>
              </div>

              {/* RIGHT: Stats + Checklist */}
              <div className="w-[25%] flex flex-col overflow-y-auto shrink-0 min-w-[220px]">
                <div className="px-3 py-2 border-b border-[#EAE2D8] dark:border-[#2D2825] shrink-0">
                  <span className="text-[11px] font-semibold text-[#6E5A47] dark:text-[#B89880] font-mono uppercase tracking-wide">Response Checklist</span>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {/* Impact stats */}
                  <div className="grid grid-cols-2 gap-2 print-section">
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg space-y-0.5">
                      <div className="text-[10px] font-mono text-rose-700 dark:text-rose-400 font-semibold">EST. AFFECTED</div>
                      <div className="text-base font-bold text-rose-800 dark:text-rose-300 font-mono">
                        {affectedPop >= 1000 ? `~${(affectedPop / 1000).toFixed(0)}k` : affectedPop}
                      </div>
                      <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80">residents</div>
                    </div>
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg space-y-0.5">
                      <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold">PRIORITY</div>
                      <div className="text-base font-bold text-amber-800 dark:text-amber-300 font-mono">{cluster.priority_score}</div>
                      <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">/100 score</div>
                    </div>
                    <div className="p-2.5 bg-[#F5EDE0] dark:bg-[#151210] border border-[#EAE2D8] dark:border-[#2D2825] rounded-lg space-y-0.5 col-span-2">
                      <div className="text-[10px] font-mono text-[#9B8472] dark:text-[#786050] font-semibold">WIND DISPERSION</div>
                      <div className="flex items-center gap-2 text-sm font-bold text-[#1C120A] dark:text-[#FEF3E2] font-mono">
                        <Navigation className="w-3.5 h-3.5 text-amber-500" style={{ transform: `rotate(${windDeg}deg)` }} />
                        {windDir} at {windSpeed} km/h
                      </div>
                      <div className="text-[10px] text-[#9B8472] dark:text-[#786050]">Plume drifts {windDir === 'N' ? 'south' : windDir === 'S' ? 'north' : windDir === 'E' ? 'west' : windDir === 'W' ? 'east' : 'downwind'}</div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-1.5 print-section">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold text-[#9B8472] dark:text-[#786050] uppercase tracking-wide">
                        Field Action Steps
                      </span>
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                        {checkedCount}/{checklist.length}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-[#EAE2D8] dark:bg-[#2D2825] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${checklist.length > 0 ? (checkedCount / checklist.length) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="space-y-1 no-print">
                      {checklist.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleCheck(i)}
                          className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-[#F5EDE0] dark:hover:bg-[#252018] transition-colors text-left cursor-pointer group"
                        >
                          {checkedItems[i] ? (
                            <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-[#9B8472] dark:text-[#786050] shrink-0 mt-0.5 group-hover:text-amber-500 transition-colors" />
                          )}
                          <span className={`text-[11px] leading-snug ${checkedItems[i] ? 'line-through text-[#9B8472] dark:text-[#786050]' : 'text-[#1C120A] dark:text-[#FEF3E2]'}`}>
                            {item}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Print-only checklist */}
                    <div className="hidden print:block space-y-1">
                      {checklist.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px]">
                          <span>☐</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Urgency note */}
                  {cluster.hours_remaining < 6 && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg flex items-start gap-2 print-section">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-snug">
                        <strong>SLA Critical:</strong> {cluster.hours_remaining.toFixed(1)}h remaining. Immediate dispatch required to avoid 24h statutory breach.
                      </p>
                    </div>
                  )}

                  {/* Population note */}
                  <div className="p-2.5 bg-[#F5EDE0] dark:bg-[#151210] border border-[#EAE2D8] dark:border-[#2D2825] rounded-lg flex items-start gap-2">
                    <Users className="w-3.5 h-3.5 text-[#9B8472] dark:text-[#B89880] shrink-0 mt-0.5" />
                    <p className="text-[10px] text-[#6E5A47] dark:text-[#B89880] leading-snug">
                      Population estimate based on Pune urban density (~6,200/km²) and computed wind-zone area. Actual exposure depends on building shielding and ventilation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default InterventionIntelligenceModal;
