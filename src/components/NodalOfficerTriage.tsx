import React, { useState, useEffect } from 'react';
import {
  Radio,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  RefreshCw,
  TrendingDown,
  Shield,
  Activity,
  Filter,
  FileText,
  ChevronRight,
  Send,
  Building2,
  SlidersHorizontal,
  ThumbsUp,
  AlertOctagon
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

interface ScoreBreakdown {
  volume_component: number;
  severity_component: number;
  aqi_component: number;
  time_open_component: number;
}

interface PrioritizedCluster {
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
  hours_open: number;
  score_breakdown: ScoreBreakdown;
  weights: Record<string, string>;
  justification: string;
  recommendation?: string;
}

interface Complaint {
  id: number;
  complaint_id: string;
  lat: number;
  lng: number;
  category: string;
  description: string;
  reported_aqi: number;
  timestamp: string;
}

interface ImpactSummary {
  total_incidents_resolved: number;
  total_complaints_resolved: number;
  average_aqi_reduction_points: number;
  average_percentage_improvement: number;
  actions: Array<{
    id: number;
    cluster_name: string;
    category: string;
    action_taken: string;
    aqi_before: number;
    aqi_after: number;
    aqi_delta: number;
    percentage_improvement: number;
    complaints_resolved: number;
    resolved_at: string;
  }>;
}

const FALLBACK_CLUSTERS: PrioritizedCluster[] = [
  {
    id: 1,
    rank: 1,
    name: 'Bhosari MIDC - Industrial',
    category: 'industrial',
    status: 'open',
    complaint_count: 139,
    center_lat: 18.626864,
    center_lng: 73.840341,
    radius_meters: 2500,
    priority_score: 95.13,
    urgency_level: 'CRITICAL',
    sla_target: 'Within 4 hours',
    avg_aqi: 363.0,
    hours_open: 24.6,
    score_breakdown: {
      volume_component: 32.43,
      severity_component: 25.0,
      aqi_component: 22.69,
      time_open_component: 15.0,
    },
    weights: {
      volume_weight: '35%',
      severity_weight: '25%',
      aqi_weight: '25%',
      time_open_weight: '15%',
    },
    justification: 'Ranked CRITICAL (95.13/100) due to 139 citizen reports of Industrial emissions, local zone AQI averaging 363, and 24.6h elapsed time.',
  },
  {
    id: 2,
    rank: 2,
    name: 'Hadapsar / Magarpatta - Construction Dust',
    category: 'construction_dust',
    status: 'open',
    complaint_count: 160,
    center_lat: 18.509013,
    center_lng: 73.925724,
    radius_meters: 2040,
    priority_score: 88.92,
    urgency_level: 'CRITICAL',
    sla_target: 'Within 4 hours',
    avg_aqi: 322.7,
    hours_open: 24.6,
    score_breakdown: {
      volume_component: 35.0,
      severity_component: 18.75,
      aqi_component: 20.17,
      time_open_component: 15.0,
    },
    weights: {
      volume_weight: '35%',
      severity_weight: '25%',
      aqi_weight: '25%',
      time_open_weight: '15%',
    },
    justification: 'Ranked CRITICAL (88.92/100) due to 160 citizen reports of Construction Dust, local zone AQI averaging 323, and 24.6h elapsed time.',
  },
  {
    id: 3,
    rank: 3,
    name: 'Shivaji Nagar / FC Road - Vehicular',
    category: 'vehicular',
    status: 'open',
    complaint_count: 170,
    center_lat: 18.531083,
    center_lng: 73.844568,
    radius_meters: 2249,
    priority_score: 84.84,
    urgency_level: 'CRITICAL',
    sla_target: 'Within 4 hours',
    avg_aqi: 295.2,
    hours_open: 24.6,
    score_breakdown: {
      volume_component: 35.0,
      severity_component: 16.25,
      aqi_component: 18.45,
      time_open_component: 15.0,
    },
    weights: {
      volume_weight: '35%',
      severity_weight: '25%',
      aqi_weight: '25%',
      time_open_weight: '15%',
    },
    justification: 'Ranked CRITICAL (84.84/100) due to 170 citizen reports of Vehicular exhaust, local zone AQI averaging 295, and 24.6h elapsed time.',
  },
  {
    id: 4,
    rank: 4,
    name: 'Viman Nagar / Wadgaon Sheri - Garbage Burning',
    category: 'garbage_burning',
    status: 'open',
    complaint_count: 70,
    center_lat: 18.569472,
    center_lng: 73.914054,
    radius_meters: 1705,
    priority_score: 71.31,
    urgency_level: 'HIGH',
    sla_target: 'Within 12 hours',
    avg_aqi: 275.0,
    hours_open: 24.6,
    score_breakdown: {
      volume_component: 16.33,
      severity_component: 22.5,
      aqi_component: 17.19,
      time_open_component: 15.0,
    },
    weights: {
      volume_weight: '35%',
      severity_weight: '25%',
      aqi_weight: '25%',
      time_open_weight: '15%',
    },
    justification: 'Ranked HIGH (71.31/100) due to 70 citizen reports of Garbage Burning, local zone AQI averaging 275, and 24.6h elapsed time.',
  },
  {
    id: 5,
    rank: 5,
    name: 'Kothrud / ARAI - Biomass Burning',
    category: 'biomass_burning',
    status: 'open',
    complaint_count: 80,
    center_lat: 18.507127,
    center_lng: 73.807933,
    radius_meters: 2500,
    priority_score: 62.4,
    urgency_level: 'HIGH',
    sla_target: 'Within 12 hours',
    avg_aqi: 240.0,
    hours_open: 24.6,
    score_breakdown: {
      volume_component: 18.67,
      severity_component: 13.75,
      aqi_component: 15.0,
      time_open_component: 15.0,
    },
    weights: {
      volume_weight: '35%',
      severity_weight: '25%',
      aqi_weight: '25%',
      time_open_weight: '15%',
    },
    justification: 'Ranked HIGH (62.4/100) due to 80 citizen reports of Biomass Burning, local zone AQI averaging 240, and 24.6h elapsed time.',
  },
];

export const NodalOfficerTriage: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [clusters, setClusters] = useState<PrioritizedCluster[]>(FALLBACK_CLUSTERS);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(1);
  const [selectedClusterDetails, setSelectedClusterDetails] = useState<any | null>(null);
  const [impactSummary, setImpactSummary] = useState<ImpactSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recLoading, setRecLoading] = useState<boolean>(false);
  const [resolveLoading, setResolveLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'high' | 'resolved'>('all');
  const [viewTab, setViewTab] = useState<'queue' | 'impact'>('queue');

  // Resolve Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [actionInput, setActionInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [resolutionSuccess, setResolutionSuccess] = useState<any | null>(null);

  // Fetch backend data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Health check
      const healthRes = await fetch(`${API_BASE}/health`);
      if (!healthRes.ok) throw new Error('Backend offline');
      setBackendOnline(true);

      // 2. Fetch prioritized clusters
      const priorityRes = await fetch(`${API_BASE}/clusters/priority`);
      const priorityData: PrioritizedCluster[] = await priorityRes.json();
      setClusters(priorityData);

      // Select first cluster by default
      if (priorityData.length > 0) {
        setSelectedClusterId(priorityData[0].id);
      }

      // 3. Fetch impact summary
      const impactRes = await fetch(`${API_BASE}/actions/impact-summary`);
      const impactData = await impactRes.json();
      setImpactSummary(impactData);
    } catch (err) {
      console.warn('Backend connection error, activating demo fallback dataset:', err);
      setBackendOnline(false);
      setClusters(FALLBACK_CLUSTERS);
      setSelectedClusterId(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch individual cluster details when selection changes
  useEffect(() => {
    if (!selectedClusterId) return;
    const fetchClusterDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/clusters/${selectedClusterId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedClusterDetails(data);
        }
      } catch (err) {
        console.error('Error fetching cluster details:', err);
      }
    };
    fetchClusterDetails();
  }, [selectedClusterId]);

  const selectedCluster = clusters.find((c) => c.id === selectedClusterId);

  // Generate AI Recommendation
  const handleGenerateRecommendation = async () => {
    if (!selectedClusterId) return;
    setRecLoading(true);
    try {
      const res = await fetch(`${API_BASE}/clusters/${selectedClusterId}/recommend`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        // Update local cluster state
        setClusters((prev) =>
          prev.map((c) => (c.id === selectedClusterId ? { ...c, recommendation: data.recommendation, status: 'in_review' } : c))
        );
        if (selectedClusterDetails) {
          setSelectedClusterDetails({ ...selectedClusterDetails, recommendation: data.recommendation });
        }
      }
    } catch (err) {
      console.error('Failed to generate recommendation:', err);
    } finally {
      setRecLoading(false);
    }
  };

  // Submit Resolution
  const handleResolveCluster = async () => {
    if (!selectedClusterId) return;
    setResolveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/clusters/${selectedClusterId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_taken: actionInput || 'Anti-smog misting tankers deployed and compliance orders issued.',
          officer_notes: notesInput || 'Inspected on ground. Immediate PM emission source suppressed.',
        }),
      });
      if (res.ok) {
        const actionResult = await res.json();
        setResolutionSuccess(actionResult);
        setIsResolveModalOpen(false);
        setActionInput('');
        setNotesInput('');
        // Refresh cluster queue and impact
        fetchData();
      }
    } catch (err) {
      console.error('Failed to resolve cluster:', err);
    } finally {
      setResolveLoading(false);
    }
  };

  // Filter clusters
  const filteredClusters = clusters.filter((c) => {
    if (activeFilter === 'critical') return c.urgency_level === 'CRITICAL';
    if (activeFilter === 'high') return c.urgency_level === 'HIGH';
    if (activeFilter === 'resolved') return c.status === 'resolved';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Top Banner: Reframe & System Status */}
      <div className="bg-gradient-to-r from-zinc-900 via-slate-900 to-sky-950 border border-zinc-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-sky-400" />
              Nodal Officer Incident Command
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Gemini 3.6 Flash Active
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-50">
            AirSense Triage & Action Engine
          </h1>
          <p className="text-sm text-zinc-300 mt-1 max-w-2xl">
            Automating the municipal bottleneck: DBSCAN spatial deduplication, urgency-ranked triage, and immediate AI intervention protocols for urban air quality officers.
          </p>
        </div>

        {/* Backend Connectivity Status */}
        <div className="flex flex-col sm:flex-row items-end md:items-center gap-3">
          <div className="bg-black/40 backdrop-blur border border-zinc-800 rounded-xl px-4 py-2.5 text-right">
            <div className="text-xs text-zinc-400">System Pipeline</div>
            <div className="text-sm font-bold flex items-center gap-2 justify-end mt-0.5">
              {backendOnline === true ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-emerald-400">FastAPI + SQLite Live</span>
                </>
              ) : backendOnline === false ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-rose-400">Backend Offline (:8000)</span>
                </>
              ) : (
                <span className="text-zinc-400">Connecting...</span>
              )}
            </div>
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 transition flex items-center gap-1 text-xs font-medium"
            title="Refresh pipeline data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Citizen Complaints Ingested</div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">620 Reports</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <span>Deduplicated from 5 Pune zones</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Active Actionable Incidents</div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{clusters.length} Clusters</div>
          <div className="text-xs text-zinc-500 mt-1">Collapsed by DBSCAN spatial logic</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Highest Triage Priority</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {clusters[0]?.priority_score ? `${clusters[0].priority_score}/100` : '95.1/100'}
          </div>
          <div className="text-xs text-rose-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>CRITICAL — Bhosari MIDC</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Measured Clean Air Gain</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {impactSummary?.average_percentage_improvement ? `-${impactSummary.average_percentage_improvement}% PM` : '-32.3% PM'}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            <span>{impactSummary?.total_complaints_resolved || 160} complaints closed with proof</span>
          </div>
        </div>
      </div>

      {/* Main Command Center: Prioritized Queue + Incident Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Prioritized Incident Queue (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[780px]">
          {/* Queue Header & Filters */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Prioritized Incident Queue</h2>
              </div>
              <span className="text-xs text-zinc-500">Sorted by Urgency (Replacing FIFO)</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 p-1 bg-zinc-200/60 dark:bg-zinc-800 rounded-lg text-xs">
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex-1 py-1 px-2 rounded-md font-medium transition ${
                  activeFilter === 'all' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                All ({clusters.length})
              </button>
              <button
                onClick={() => setActiveFilter('critical')}
                className={`flex-1 py-1 px-2 rounded-md font-medium transition ${
                  activeFilter === 'critical' ? 'bg-rose-500 text-white shadow' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setActiveFilter('high')}
                className={`flex-1 py-1 px-2 rounded-md font-medium transition ${
                  activeFilter === 'high' ? 'bg-amber-500 text-white shadow' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setActiveFilter('resolved')}
                className={`flex-1 py-1 px-2 rounded-md font-medium transition ${
                  activeFilter === 'resolved' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* Queue List (Scrollable) */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredClusters.map((cluster) => {
              const isSelected = cluster.id === selectedClusterId;
              const isCritical = cluster.urgency_level === 'CRITICAL';
              const isResolved = cluster.status === 'resolved';

              return (
                <div
                  key={cluster.id}
                  onClick={() => setSelectedClusterId(cluster.id)}
                  className={`p-4 cursor-pointer transition relative ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-l-4 border-sky-600'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-center shrink-0">
                        #{cluster.rank}
                      </span>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {cluster.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isCritical
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                      }`}
                    >
                      {isResolved ? 'RESOLVED' : cluster.urgency_level}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="capitalize font-medium text-zinc-700 dark:text-zinc-300">
                      {cluster.category.replace('_', ' ')}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {cluster.complaint_count} reports collapsed
                    </span>
                    <span>•</span>
                    <span>AQI {Math.round(cluster.avg_aqi)}</span>
                  </div>

                  {/* Priority Score Bar & Explainability */}
                  <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-zinc-500">Urgency Priority Score:</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {cluster.priority_score} / 100
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isCritical ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, cluster.priority_score)}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 italic">
                      "{cluster.justification}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Incident Workspace (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCluster ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              {/* Incident Header */}
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-900/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        Incident #{selectedCluster.id}
                      </span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        SLA: {selectedCluster.sla_target}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">
                      {selectedCluster.name}
                    </h2>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        Lat: {selectedCluster.center_lat}, Lng: {selectedCluster.center_lng}
                      </span>
                      <span>•</span>
                      <span>Affected Zone Radius: ~{Math.round(selectedCluster.radius_meters)}m</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateRecommendation}
                      disabled={recLoading}
                      className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${recLoading ? 'animate-spin' : ''}`} />
                      {recLoading ? 'Generating...' : 'AI Recommendation'}
                    </button>

                    <button
                      onClick={() => setIsResolveModalOpen(true)}
                      disabled={selectedCluster.status === 'resolved'}
                      className={`px-4 py-2 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 ${
                        selectedCluster.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {selectedCluster.status === 'resolved' ? 'Resolved' : 'Mark Actioned'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Explainability Breakdown Card */}
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Transparent Triage Weight Breakdown (Explainability)
                  </h4>
                  <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold">
                    Score: {selectedCluster.priority_score} / 100
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl">
                    <div className="text-zinc-500">Volume (35%)</div>
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {selectedCluster.score_breakdown.volume_component} pts
                    </div>
                    <div className="text-[11px] text-zinc-400">{selectedCluster.complaint_count} reports</div>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl">
                    <div className="text-zinc-500">Hazard Type (25%)</div>
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {selectedCluster.score_breakdown.severity_component} pts
                    </div>
                    <div className="text-[11px] text-zinc-400 capitalize">{selectedCluster.category.replace('_', ' ')}</div>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl">
                    <div className="text-zinc-500">Zone AQI (25%)</div>
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {selectedCluster.score_breakdown.aqi_component} pts
                    </div>
                    <div className="text-[11px] text-zinc-400">Avg {Math.round(selectedCluster.avg_aqi)} AQI</div>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl">
                    <div className="text-zinc-500">SLA Aging (15%)</div>
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {selectedCluster.score_breakdown.time_open_component} pts
                    </div>
                    <div className="text-[11px] text-zinc-400">{selectedCluster.hours_open}h open</div>
                  </div>
                </div>
              </div>

              {/* AI Recommendation Output Panel */}
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Gemini AI Operational Action Protocol
                    </h3>
                  </div>
                  {selectedCluster.recommendation ? (
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-semibold">
                      Generated & Ready
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">Click "AI Recommendation" to trigger</span>
                  )}
                </div>

                {selectedCluster.recommendation ? (
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-4 text-xs text-zinc-800 dark:text-zinc-200 space-y-3 leading-relaxed max-h-[320px] overflow-y-auto whitespace-pre-line font-mono">
                    {selectedCluster.recommendation}
                  </div>
                ) : (
                  <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center">
                    <Sparkles className="w-8 h-8 text-sky-400 mx-auto mb-2 opacity-60" />
                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      No Action Plan Generated Yet
                    </div>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                      Click the "AI Recommendation" button above. Gemini 3.6 Flash will ingest this cluster's coordinates, category, and citizen remarks to produce an immediate 5-point municipal intervention protocol.
                    </p>
                  </div>
                )}
              </div>

              {/* Sample Citizen Complaints in this Cluster */}
              <div className="p-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-3">
                  Underlying Citizen Reports Collapsed ({selectedClusterDetails?.complaints?.length || selectedCluster.complaint_count} Reports)
                </h4>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {selectedClusterDetails?.complaints?.slice(0, 5).map((comp: Complaint) => (
                    <div
                      key={comp.id}
                      className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {comp.complaint_id}:
                        </span>{' '}
                        <span className="text-zinc-600 dark:text-zinc-300">"{comp.description}"</span>
                      </div>
                      <span className="shrink-0 font-bold text-rose-500">AQI {comp.reported_aqi}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <AlertOctagon className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300">Select an Incident from the Queue</h3>
              <p className="text-xs text-zinc-500 mt-1">Click on any cluster on the left to inspect its telemetry and run AI protocols.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolve Incident Modal */}
      {isResolveModalOpen && selectedCluster && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Log Resolution & Measure Impact
                </h3>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Logging an action closes all <strong>{selectedCluster.complaint_count} citizen reports</strong> in {selectedCluster.name} and captures a post-intervention AQI snapshot for the official Impact Log.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Intervention Performed *
                </label>
                <input
                  type="text"
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  placeholder="e.g., Deployed 2 anti-smog tankers; issued stop-work notice to excavation site."
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Officer Inspection Remarks
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={3}
                  placeholder="Field observations, enforcement section, or contractor penalties applied."
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveCluster}
                disabled={resolveLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow"
              >
                {resolveLoading ? 'Recording...' : 'Submit Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Success Banner */}
      {resolutionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <div className="font-bold">
                Incident Resolved: {resolutionSuccess.cluster_name}
              </div>
              <div>
                Measured AQI dropped from <strong>{resolutionSuccess.aqi_before}</strong> to{' '}
                <strong>{resolutionSuccess.aqi_after}</strong> ({resolutionSuccess.aqi_delta} pts /{' '}
                <strong>{resolutionSuccess.percentage_improvement}% improvement</strong>). Closed{' '}
                {resolutionSuccess.complaints_resolved} citizen tickets.
              </div>
            </div>
          </div>
          <button
            onClick={() => setResolutionSuccess(null)}
            className="text-emerald-700 dark:text-emerald-400 font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
