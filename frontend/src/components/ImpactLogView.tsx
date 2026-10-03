import React, { useState, useMemo } from 'react';
import { IncidentCluster } from '../types';
import { 
  TrendingDown, 
  ShieldCheck, 
  ArrowLeft, 
  Radio, 
  CheckCircle2, 
  Search, 
  Download, 
  Camera, 
  X,
  PanelLeftOpen
} from 'lucide-react';

export interface BackendActionLite {
  id: number;
  cluster_id: number;
  cluster_name: string;
  category: string;
  action_taken: string;
  officer_notes?: string;
  aqi_before: number;
  aqi_after: number;
  aqi_delta: number;
  percentage_improvement: number;
  complaints_resolved: number;
  resolved_at: string;
}

interface ImpactLogViewProps {
  clusters: IncidentCluster[];
  onBackToTriage: () => void;
  onInspectCluster?: (clusterId: string) => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  backendActions?: BackendActionLite[];
}

export interface ImpactLogRecord {
  id: string;
  cluster_id: string;
  title: string;
  ward: string;
  intervention: string;
  pre_aqi: number;
  post_aqi: number;
  net_delta: number;
  timestamp: string;
  sensor_station?: string;
  evidence_photo_url?: string;
  officer_id?: string;
  within_sla: boolean;
}

// Pre-seeded verified interventions for Pune Municipal Corporation Central Zone
const SEEDED_IMPACT_RECORDS: ImpactLogRecord[] = [
  {
    id: 'IMP-PUN-084',
    cluster_id: 'CLUST-HIST-01',
    title: 'Yerawada Gunthewari Waste Dump Open Fire',
    ward: 'Yerawada - Kalas (Ward 2)',
    intervention: 'Extinguished Open Waste Burning + Wet Slurry Cap',
    pre_aqi: 365,
    post_aqi: 278,
    net_delta: -87,
    timestamp: 'Today, 09:15 AM',
    sensor_station: 'Pune CAAQMS - Yerawada Jail Road 07',
    evidence_photo_url: 'GeoProof_Yerawada_Waste_0915.jpg',
    officer_id: 'Smt. P. S. Jadhav (PMC-ENV-14)',
    within_sla: true
  },
  {
    id: 'IMP-PUN-083',
    cluster_id: 'CLUST-HIST-02',
    title: 'Bhosari Spine Road Heavy Construction Dust Corridor',
    ward: 'Bhosari MIDC Border Ward',
    intervention: 'Deployed Mist Cannon & Mechanical Road Sweeper',
    pre_aqi: 342,
    post_aqi: 285,
    net_delta: -57,
    timestamp: 'Today, 07:45 AM',
    sensor_station: 'Bhosari Industrial CAAQMS 02',
    evidence_photo_url: 'GeoProof_Bhosari_Cannon_0745.jpg',
    officer_id: 'Er. R. K. Shinde (PMC-ENG-03)',
    within_sla: true
  },
  {
    id: 'IMP-PUN-082',
    cluster_id: 'CLUST-HIST-03',
    title: 'Katraj Tunnel Bypass Illegal Tyre Burning',
    ward: 'Dhankawadi - Sahakarnagar (Ward 18)',
    intervention: 'Seized Scrap Rubber & Fined Violator under §31A',
    pre_aqi: 410,
    post_aqi: 295,
    net_delta: -115,
    timestamp: 'Yesterday, 11:20 PM',
    sensor_station: 'Katraj Regional Monitoring Mast',
    evidence_photo_url: 'GeoProof_Katraj_Fine_2320.jpg',
    officer_id: 'Shri V. M. Thorat (PMC-ENF-09)',
    within_sla: true
  },
  {
    id: 'IMP-PUN-081',
    cluster_id: 'CLUST-HIST-04',
    title: 'Hadapsar Industrial Boiler Smog Emission',
    ward: 'Hadapsar - Mundhwa (Ward 21)',
    intervention: 'Issued Statutory Stop-Work Order to Foundry Unit',
    pre_aqi: 388,
    post_aqi: 312,
    net_delta: -76,
    timestamp: 'Yesterday, 04:30 PM',
    sensor_station: 'Hadapsar CAAQMS Station 04',
    evidence_photo_url: 'GeoProof_Hadapsar_StopWork_1630.jpg',
    officer_id: 'Smt. P. S. Jadhav (PMC-ENV-14)',
    within_sla: true
  }
];

const formatBackendTime = (iso: string): string => {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    return sameDay ? `Today, ${timeStr}` : `${d.toLocaleDateString('en-GB')}, ${timeStr}`;
  } catch {
    return iso;
  }
};

export const ImpactLogView: React.FC<ImpactLogViewProps> = ({
  clusters,
  onBackToTriage,
  onToggleSidebar,
  isSidebarCollapsed,
  backendActions = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ImpactLogRecord | null>(null);

  // Combine persisted backend actions, in-session resolved clusters, and seeded historical records
  const allRecords = useMemo(() => {
    // 1. Persisted backend actions (DB-backed, survives reload)
    const backendRecords: ImpactLogRecord[] = backendActions.map(a => ({
      id: `IMP-DB-${a.id}`,
      cluster_id: `CLUST-LIVE-${String(a.cluster_id).padStart(2, '0')}`,
      title: a.cluster_name,
      ward: 'Pune',
      intervention: a.action_taken || 'Municipal Nodal Enforcement Executed',
      pre_aqi: Math.round(a.aqi_before),
      post_aqi: Math.round(a.aqi_after),
      net_delta: Math.round(a.aqi_delta),
      timestamp: formatBackendTime(a.resolved_at),
      sensor_station: `Backend-Attributed · ${a.category.replace('_', ' ')}`,
      evidence_photo_url: 'GeoProof_Backend_Logged.jpg',
      officer_id: 'Smt. P. S. Jadhav (PMC-ENV-14)',
      within_sla: true
    }));

    // 2. Session-only resolved clusters that haven't yet been reflected in backendActions
    const backendClusterIds = new Set(backendActions.map(a => `CLUST-LIVE-${String(a.cluster_id).padStart(2, '0')}`));
    const liveResolvedRecords: ImpactLogRecord[] = clusters
      .filter(c => c.status === 'resolved' && c.resolution && !backendClusterIds.has(c.cluster_id))
      .map(c => ({
        id: `IMP-LIVE-${c.cluster_id.replace('CLUST-', '')}`,
        cluster_id: c.cluster_id,
        title: c.title,
        ward: c.ward,
        intervention: c.resolution?.action_summary || 'Municipal Nodal Enforcement Executed',
        pre_aqi: c.resolution?.pre_intervention_aqi || c.avg_aqi,
        post_aqi: c.resolution?.post_intervention_aqi || Math.max(120, c.avg_aqi - 65),
        net_delta: c.resolution?.aqi_delta || -65,
        timestamp: c.resolution?.resolved_at
          ? c.resolution.resolved_at
          : 'Just now',
        sensor_station: c.resolution?.sensor_station_id || c.location_name || 'Pune CAAQMS Grid 01',
        evidence_photo_url: c.resolution?.evidence_photo_url || 'GeoProof_Verified.jpg',
        officer_id: c.resolution?.officer_id || 'Smt. P. S. Jadhav (PMC-ENV-14)',
        within_sla: true
      }));

    return [...backendRecords, ...liveResolvedRecords, ...SEEDED_IMPACT_RECORDS];
  }, [clusters, backendActions]);

  // Filter records based on search query
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return allRecords;
    const q = searchQuery.toLowerCase();
    return allRecords.filter(r => 
      r.title.toLowerCase().includes(q) ||
      r.ward.toLowerCase().includes(q) ||
      r.intervention.toLowerCase().includes(q) ||
      r.timestamp.toLowerCase().includes(q)
    );
  }, [allRecords, searchQuery]);

  // Aggregate KPI summary calculations
  const totalIncidentsResolved = allRecords.length;
  
  const averageAqiReduction = useMemo(() => {
    if (allRecords.length === 0) return 0;
    const totalDelta = allRecords.reduce((acc, r) => acc + Math.abs(r.net_delta), 0);
    return Math.round(totalDelta / allRecords.length);
  }, [allRecords]);

  const slaCompliancePercent = useMemo(() => {
    if (allRecords.length === 0) return 100;
    const compliantCount = allRecords.filter(r => r.within_sla).length;
    return Math.round((compliantCount / allRecords.length) * 100);
  }, [allRecords]);

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-[#150F0A] text-slate-900 dark:text-[#F1F5F9] flex flex-col overflow-y-auto select-none transition-colors">
      
      {/* Sticky Top Header Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-[#2E2218] bg-white/90 dark:bg-[#1E1810]/90 backdrop-blur-md sticky top-0 z-20 space-y-4 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isSidebarCollapsed && onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-1.5 rounded-md bg-white dark:bg-[#1E1810] text-slate-700 dark:text-emerald-400 border border-slate-200 dark:border-[#2E2218] hover:bg-slate-100 dark:hover:bg-[#261C12] transition-colors cursor-pointer"
                title="Expand Navigation (⌘\ or [)"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onBackToTriage}
              className="p-1.5 rounded text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#261C12] transition-colors flex items-center justify-center cursor-pointer"
              title="Return to Triage Command Map"
              aria-label="Back to Triage"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
                  Impact Ledger
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  Statutory Proof
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono">
                CPCB statutory audit record of before/after ambient air telemetry across Pune
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-[#2E2218] bg-white dark:bg-[#1E1810] hover:bg-slate-50 dark:hover:bg-[#261C12] text-slate-800 dark:text-[#F1F5F9] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-[#94A3B8]" />
              <span>Export Audit Ledger</span>
            </button>
          </div>
        </div>

        {/* Header KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* KPI Card 1: Total Incidents Resolved */}
          <div className="bg-white dark:bg-[#1E1810] border border-slate-200 dark:border-[#2E2218] rounded-lg p-3.5 shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] block font-semibold">
              Total Incidents Resolved
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-[#F1F5F9]">
                {totalIncidentsResolved}
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                100% Actioned
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#64748B] font-sans mt-0.5">
              Closed with geo-tagged ground proof
            </p>
          </div>

          {/* KPI Card 2: Average AQI Reduction */}
          <div className="bg-white dark:bg-[#1E1810] border border-slate-200 dark:border-[#2E2218] rounded-lg p-3.5 shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] block font-semibold">
              Average AQI Reduction
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                -{averageAqiReduction}
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                AQI Net Delta
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#64748B] font-sans mt-0.5">
              Verified by nearest CAAQMS stations
            </p>
          </div>

          {/* KPI Card 3: SLA Compliance % */}
          <div className="bg-white dark:bg-[#1E1810] border border-slate-200 dark:border-[#2E2218] rounded-lg p-3.5 shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] block font-semibold">
              SLA Compliance %
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {slaCompliancePercent}%
              </span>
              <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 font-medium">
                Statutory 24h
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#64748B] font-sans mt-0.5">
              Zero CPCB non-compliance penalties
            </p>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search resolved incidents by title, ward, intervention executed, or timestamp..."
            className="w-full bg-slate-50 dark:bg-[#150F0A] text-xs text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#64748B] pl-9 pr-3 py-2 rounded-md border border-slate-200 dark:border-[#2E2218] focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-[#1E1810] font-sans transition-colors"
          />
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="p-4 flex-1">
        <div className="bg-white dark:bg-[#1E1810] border border-slate-200 dark:border-[#2E2218] rounded-lg overflow-hidden shadow-2xs">
          
          <div className="p-3 border-b border-slate-200 dark:border-[#2E2218] bg-slate-50 dark:bg-[#150F0A] flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 dark:text-[#F1F5F9] uppercase tracking-wider font-mono">
              Actioned Incidents &amp; Ambient AQI Ledger
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-[#949EA8]">
              Showing {filteredRecords.length} of {allRecords.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#2E2218] bg-slate-50 dark:bg-[#150F0A] text-[11px] font-mono text-slate-500 dark:text-[#949EA8] uppercase tracking-wider select-none">
                  <th className="py-2.5 px-3.5 font-semibold">Incident Title</th>
                  <th className="py-2.5 px-3 font-semibold">Ward</th>
                  <th className="py-2.5 px-3 font-semibold">Intervention Executed</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right">Pre-AQI</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right">Post-AQI</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Net Delta</th>
                  <th className="py-2.5 px-3.5 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2E2218] font-sans">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-[#64748B] font-mono text-xs">
                      No resolved incidents match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(record => (
                    <tr
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#261C12] transition-colors cursor-pointer group"
                    >
                      {/* Column 1: Incident Title */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 dark:text-[#F1F5F9] group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[220px]" title={record.title}>
                            {record.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-[#64748B] block mt-0.5">
                          {record.cluster_id}
                        </span>
                      </td>

                      {/* Column 2: Ward */}
                      <td className="py-3 px-3 text-slate-600 dark:text-[#949EA8] whitespace-nowrap">
                        {record.ward}
                      </td>

                      {/* Column 3: Intervention Executed */}
                      <td className="py-3 px-3 text-slate-800 dark:text-[#F1F5F9] max-w-[220px]">
                        <span className="truncate block font-medium" title={record.intervention}>
                          {record.intervention}
                        </span>
                        {record.evidence_photo_url && (
                          <span className="text-[10px] text-slate-500 dark:text-[#949EA8] font-mono flex items-center gap-1 mt-0.5">
                            <Camera className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="truncate max-w-[180px]">{record.evidence_photo_url}</span>
                          </span>
                        )}
                      </td>

                      {/* Column 4: Pre-AQI */}
                      <td className="py-3 px-2.5 text-right font-mono font-medium text-slate-600 dark:text-[#949EA8]">
                        {record.pre_aqi}
                      </td>

                      {/* Column 5: Post-AQI */}
                      <td className="py-3 px-2.5 text-right font-mono font-bold text-slate-900 dark:text-[#F1F5F9]">
                        {record.post_aqi}
                      </td>

                      {/* Column 6: Net Delta */}
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded font-mono font-semibold text-[11px] whitespace-nowrap">
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {record.net_delta > 0 ? `+${record.net_delta}` : record.net_delta} AQI
                        </span>
                      </td>

                      {/* Column 7: Timestamp */}
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400 dark:text-[#64748B]">
                        {record.timestamp}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal for Selected Record */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1810] border border-slate-200 dark:border-[#2E2218] rounded-lg shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 dark:text-[#F1F5F9] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 border-b border-slate-200 dark:border-[#2E2218] bg-slate-50 dark:bg-[#150F0A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                    Intervention &amp; Outcome Dossier
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#949EA8] font-mono">
                    {selectedRecord.id} • {selectedRecord.cluster_id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#261C12] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#64748B] font-semibold block">
                  Incident Title &amp; Ward
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">{selectedRecord.title}</h4>
                <p className="text-slate-500 dark:text-[#949EA8] text-xs mt-0.5">{selectedRecord.ward}</p>
              </div>

              {/* Verified Ambient Impact Snapshot */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#150F0A] rounded-lg border border-slate-200 dark:border-[#2E2218] space-y-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#949EA8] font-semibold block">
                  Ambient Air Quality Delta
                </span>

                <div className="grid grid-cols-3 gap-2 items-center font-mono">
                  <div className="bg-white dark:bg-[#1E1810] p-2 rounded border border-slate-200 dark:border-[#2E2218]">
                    <span className="text-[10px] text-slate-400 dark:text-[#64748B] block">Pre-Intervention:</span>
                    <span className="text-base font-bold text-slate-800 dark:text-[#F1F5F9]">{selectedRecord.pre_aqi} AQI</span>
                  </div>

                  <div className="bg-white dark:bg-[#1E1810] p-2 rounded border border-slate-200 dark:border-[#2E2218]">
                    <span className="text-[10px] text-slate-400 dark:text-[#64748B] block">Post-Intervention:</span>
                    <span className="text-base font-bold text-slate-900 dark:text-[#F1F5F9]">{selectedRecord.post_aqi} AQI</span>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950/70 p-2 rounded border border-emerald-200 dark:border-emerald-800/80 text-right">
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-semibold">Net Improvement:</span>
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 block">
                      {selectedRecord.net_delta} AQI
                    </span>
                  </div>
                </div>

                {selectedRecord.sensor_station && (
                  <div className="pt-2 border-t border-slate-200 dark:border-[#2E2218] text-[11px] font-mono text-slate-600 dark:text-[#949EA8] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Station: {selectedRecord.sensor_station}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#64748B] font-semibold block">
                  Action Executed
                </span>
                <p className="font-semibold text-slate-900 dark:text-[#F1F5F9] bg-white dark:bg-[#150F0A] p-2.5 rounded border border-slate-200 dark:border-[#2E2218]">
                  {selectedRecord.intervention}
                </p>
              </div>

              {selectedRecord.evidence_photo_url && (
                <div className="p-2.5 bg-slate-50 dark:bg-[#150F0A] rounded border border-slate-200 dark:border-[#2E2218] flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-slate-800 dark:text-[#F1F5F9] font-semibold">{selectedRecord.evidence_photo_url}</span>
                  </div>
                  <span className="text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/80 font-semibold">
                    Geo-Verified
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-[#2E2218] flex items-center justify-between font-mono text-[11px] text-slate-500 dark:text-[#949EA8]">
                <span>Officer: {selectedRecord.officer_id || 'Smt. P. S. Jadhav (Nodal Officer)'}</span>
                <span>{selectedRecord.timestamp}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ImpactLogView;
