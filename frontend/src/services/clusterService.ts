import type { IncidentCluster, TicketStatus } from '../types';

// Synthetic wind data per Pune hotspot zone (Sept prevailing winds)
const WIND_BY_ZONE: Record<string, { windSpeed: number; windDirection: string; windDeg: number }> = {
  hadapsar:  { windSpeed: 12, windDirection: 'NW', windDeg: 315 },
  magarpatta:{ windSpeed: 12, windDirection: 'NW', windDeg: 315 },
  shivaji:   { windSpeed: 14, windDirection: 'W',  windDeg: 270 },
  'fc road': { windSpeed: 14, windDirection: 'W',  windDeg: 270 },
  bhosari:   { windSpeed: 10, windDirection: 'NE', windDeg: 45  },
  midc:      { windSpeed: 10, windDirection: 'NE', windDeg: 45  },
  kothrud:   { windSpeed: 8,  windDirection: 'SW', windDeg: 225 },
  arai:      { windSpeed: 8,  windDirection: 'SW', windDeg: 225 },
  viman:     { windSpeed: 15, windDirection: 'SE', windDeg: 135 },
  wadgaon:   { windSpeed: 15, windDirection: 'SE', windDeg: 135 },
  hinjewadi: { windSpeed: 18, windDirection: 'NE', windDeg: 45  },
};

const SOURCE_BY_CATEGORY: Record<string, string> = {
  construction_dust: 'Active construction / excavation site with unshielded earthworks',
  vehicular:         'High-density vehicular corridor with diesel congestion',
  industrial:        'Industrial facility with unfiltered stack/boiler discharge',
  biomass_burning:   'Open biomass combustion — garden waste / agricultural residue',
  garbage_burning:   'Open municipal waste burning on unauthorized dump site',
};

const ACTION_BY_CATEGORY: Record<string, string> = {
  construction_dust: 'Dispatch Mist Cannons',
  vehicular:         'Deploy Traffic Diversion Squad',
  industrial:        'Draft Air Act §31A Directive',
  biomass_burning:   'Draft Air Act §31A Directive',
  garbage_burning:   'Deploy Flying Squad',
};

const WARD_BY_ZONE: [string, string][] = [
  ['hadapsar', 'Hadapsar'], ['magarpatta', 'Hadapsar'],
  ['shivaji',  'Shivajinagar'], ['fc road', 'Shivajinagar'],
  ['bhosari',  'Bhosari'], ['midc', 'Bhosari'],
  ['kothrud',  'Kothrud'], ['arai', 'Kothrud'],
  ['viman',    'Kharadi'], ['wadgaon', 'Kharadi'],
  ['hinjewadi','Hinjewadi'],
];

function getWind(name: string) {
  const lower = name.toLowerCase();
  for (const [key, wind] of Object.entries(WIND_BY_ZONE)) {
    if (lower.includes(key)) return wind;
  }
  return { windSpeed: 10, windDirection: 'W', windDeg: 270 };
}

function getWard(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, ward] of WARD_BY_ZONE) {
    if (lower.includes(key)) return ward;
  }
  return 'Pune';
}

interface PythonCluster {
  id: number;
  name: string;
  category: string;
  status: string;
  complaint_count: number;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  priority_score: number;
  urgency_level: string;
  sla_target: string;
  avg_aqi: number;
  hours_open: number;
  score_breakdown: {
    volume_component: number;
    severity_component: number;
    aqi_component: number;
    time_open_component: number;
  };
  justification: string;
  recommendation: string | null;
  created_at: string;
  rank: number;
}

function transformCluster(c: PythonCluster): IncidentCluster {
  const wind = getWind(c.name);
  const hoursOpen = Math.max(0, c.hours_open);
  const hoursRemaining = Math.max(0, 24 - hoursOpen);
  const locationName = c.name.split(' - ')[0] || c.name;
  const ward = getWard(c.name);

  const pyStatus = c.status;
  const status: TicketStatus =
    pyStatus === 'resolved'  ? 'resolved'    :
    pyStatus === 'in_review' ? 'in_progress' :
    pyStatus === 'actioned'  ? 'dispatched'  : 'open';

  return {
    cluster_id: `CLUST-LIVE-${String(c.id).padStart(2, '0')}`,
    title: c.name,
    location_name: locationName,
    ward,
    lat: c.center_lat,
    lng: c.center_lng,
    center: [c.center_lat, c.center_lng],
    ...wind,
    primary_category: c.category,
    category: c.category,
    complaint_count: c.complaint_count,
    complaints: [],
    local_aqi: Math.round(c.avg_aqi),
    avg_aqi: Math.round(c.avg_aqi),
    hours_open: hoursOpen,
    hours_remaining: hoursRemaining,
    priority_score: Math.round(c.priority_score),
    score_breakdown: {
      volume_pts:   Math.round(c.score_breakdown.volume_component),
      severity_pts: Math.round(c.score_breakdown.severity_component),
      sla_pts:      Math.round(c.score_breakdown.time_open_component),
      aqi_pts:      Math.round(c.score_breakdown.aqi_component),
    },
    statutory_weights: {
      complaint_spike:      Math.round(c.score_breakdown.volume_component),
      high_pollutant_source:Math.round(c.score_breakdown.severity_component),
      sla_urgency:          Math.round(c.score_breakdown.time_open_component),
      ambient_delta:        Math.round(c.score_breakdown.aqi_component),
      weight_summary: c.justification,
    },
    status,
    created_at: c.created_at,
    primary_source: SOURCE_BY_CATEGORY[c.category] || 'Unclassified pollution source',
    admin_action_label: ACTION_BY_CATEGORY[c.category] || 'Deploy Inspection Team',
  };
}

export interface LiveDataResult {
  clusters: IncidentCluster[];
  source: 'live' | 'mock';
  meta?: { total_complaints: number; total_clusters: number };
}

export async function fetchLiveClusters(): Promise<LiveDataResult> {
  try {
    const res = await fetch('/api/clusters', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: PythonCluster[] | { fallback: boolean } = await res.json();

    if (!Array.isArray(data) || (data as any).fallback) {
      throw new Error('Backend offline');
    }

    const clusters = (data as PythonCluster[])
      .sort((a, b) => b.priority_score - a.priority_score)
      .map(transformCluster);

    return {
      clusters,
      source: 'live',
      meta: {
        total_complaints: clusters.reduce((s, c) => s + c.complaint_count, 0),
        total_clusters: clusters.length,
      },
    };
  } catch {
    return { clusters: [], source: 'mock' };
  }
}

// Extract numeric backend ID from frontend cluster_id string "CLUST-LIVE-##"
export function extractBackendClusterId(clusterIdStr: string): number | null {
  const m = clusterIdStr.match(/CLUST-LIVE-(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// POST a resolution to the backend. Returns the created ActionOut record (or null on failure).
export interface BackendActionRecord {
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

export async function resolveClusterBackend(
  backendClusterId: number,
  payload: { action_taken: string; officer_notes?: string; aqi_before?: number; aqi_after?: number }
): Promise<BackendActionRecord | null> {
  try {
    const res = await fetch(`/api/clusters/${backendClusterId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[clusterService] Backend resolve failed:', err);
    return null;
  }
}

// Fetch the aggregate Impact Ledger from backend (persisted actions).
export async function fetchBackendActions(): Promise<BackendActionRecord[]> {
  try {
    const res = await fetch('/api/actions', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ------------- Synthetic data seeder (true variation, not re-dump) -------------
// Each call picks 2-4 random hotspots from an EXPANDED Pune zone library and
// generates fresh gaussian-scattered complaints. Backend re-clusters after ingest.

interface SeedZone {
  zone_name: string;
  center_lat: number;
  center_lng: number;
  category: string;
  base_aqi: number;
  spread: number;
  descriptions: string[];
}

const SEED_ZONE_LIBRARY: SeedZone[] = [
  { zone_name: 'Hadapsar / Magarpatta Metro Corridor', center_lat: 18.5089, center_lng: 73.9260, category: 'construction_dust', base_aqi: 320, spread: 0.006,
    descriptions: ['Dust plumes from metro construction', 'Concrete mixing with zero water sprinkling', 'Demolition debris left uncovered'] },
  { zone_name: 'Shivaji Nagar / FC Road Chowk', center_lat: 18.5314, center_lng: 73.8446, category: 'vehicular', base_aqi: 295, spread: 0.005,
    descriptions: ['Traffic bottleneck with diesel idling', 'Thick exhaust fumes at junction', 'Heavy PM2.5 haze under flyover'] },
  { zone_name: 'Bhosari MIDC Industrial Belt', center_lat: 18.6279, center_lng: 73.8398, category: 'industrial', base_aqi: 360, spread: 0.008,
    descriptions: ['Dark chimney smoke from foundry', 'Pungent chemical odor into residential area', 'Unfiltered boiler exhaust'] },
  { zone_name: 'Kothrud ARAI Hill Perimeter', center_lat: 18.5074, center_lng: 73.8077, category: 'biomass_burning', base_aqi: 240, spread: 0.007,
    descriptions: ['Dry leaves burning near trail', 'Smoke drifting from hillside sweepings', 'Open burning of tree prunings'] },
  { zone_name: 'Viman Nagar / Wadgaon Sheri Canal', center_lat: 18.5679, center_lng: 73.9143, category: 'garbage_burning', base_aqi: 275, spread: 0.006,
    descriptions: ['Plastic set ablaze near canal', 'Toxic black smoke evenings', 'Dumping and burning of trash'] },
  // Expanded zones that produce NEW hotspots each seeding
  { zone_name: 'Hinjewadi IT Park Phase 2', center_lat: 18.5908, center_lng: 73.7389, category: 'vehicular', base_aqi: 285, spread: 0.006,
    descriptions: ['Peak-hour cab queues emitting unburnt fuel', 'IT shuttle idling without PUC', 'Narrow lane bumper-to-bumper tailpipe plume'] },
  { zone_name: 'Katraj Dairy Chowk Junction', center_lat: 18.4475, center_lng: 73.8651, category: 'vehicular', base_aqi: 310, spread: 0.005,
    descriptions: ['Highway truck idling at tollgate approach', 'Visible soot plumes from heavy diesel vehicles'] },
  { zone_name: 'Yerawada Jail Road Dump Yard', center_lat: 18.5518, center_lng: 73.8882, category: 'garbage_burning', base_aqi: 345, spread: 0.005,
    descriptions: ['Night-time waste pile ignition', 'Burning rubber and plastic odor', 'Unmanned dump heap smouldering'] },
  { zone_name: 'Pimpri Chinchwad Chemical Zone', center_lat: 18.6298, center_lng: 73.7997, category: 'industrial', base_aqi: 335, spread: 0.007,
    descriptions: ['Solvent odor leaking from storage tank', 'Flare stack discharge after hours', 'Chemical plume drifting over colony'] },
  { zone_name: 'Baner Balewadi Highrise Site', center_lat: 18.5590, center_lng: 73.7868, category: 'construction_dust', base_aqi: 300, spread: 0.006,
    descriptions: ['Open-cut earthworks without screens', 'Dry drilling raising dust clouds', 'Dumpers exiting without tyre wash'] },
  { zone_name: 'Sinhagad Road Hillside', center_lat: 18.4621, center_lng: 73.8252, category: 'biomass_burning', base_aqi: 255, spread: 0.007,
    descriptions: ['Garden waste pyre on hill slope', 'Smoke blanket at dawn', 'Hillside grass burning after dry spell'] },
  { zone_name: 'Deccan Gymkhana Rush Corridor', center_lat: 18.5156, center_lng: 73.8419, category: 'vehicular', base_aqi: 280, spread: 0.005,
    descriptions: ['Evening PCMC bus congestion', 'Rickshaw stand plume', 'Pedestrian crossing haze'] },
];

function rngGaussian(mean: number, stdDev: number): number {
  // Box-Muller
  const u1 = Math.random() || 1e-10;
  const u2 = Math.random() || 1e-10;
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

export interface SeedResult {
  ingested: number;
  zones_used: string[];
  clustered: boolean;
}

/**
 * Generate a fresh batch of synthetic complaints across 3-5 randomly chosen zones.
 * Each call produces DIFFERENT data (random zones, random counts, random coords).
 * Pushes to backend ingest + triggers re-clustering.
 */
export async function seedRandomComplaints(targetTotal: number = 180): Promise<SeedResult> {
  // Pick 3-5 random zones
  const zoneCount = 3 + Math.floor(Math.random() * 3);
  const picked: SeedZone[] = [];
  const pool = [...SEED_ZONE_LIBRARY];
  for (let i = 0; i < zoneCount && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }

  // Distribute targetTotal across the picked zones with per-zone variability
  const complaints: any[] = [];
  const perZoneBase = Math.floor(targetTotal / picked.length);
  const nowIso = new Date().toISOString();

  for (const z of picked) {
    const count = Math.max(10, perZoneBase + Math.floor((Math.random() - 0.5) * 40));
    for (let i = 0; i < count; i++) {
      const lat = z.center_lat + rngGaussian(0, z.spread);
      const lng = z.center_lng + rngGaussian(0, z.spread);
      const aqi = Math.max(50, Math.round(z.base_aqi + (Math.random() * 55 - 25)));
      const minutesAgo = Math.floor(Math.random() * 60 * 36);
      const ts = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
      complaints.push({
        complaint_id: `CMP-SEED-${Date.now().toString(36)}-${complaints.length}`,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        category: z.category,
        description: z.descriptions[Math.floor(Math.random() * z.descriptions.length)],
        reported_aqi: aqi,
        timestamp: ts,
      });
    }
  }

  let ingested = 0;
  let clustered = false;

  try {
    const ingestRes = await fetch('/api/complaints/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaints),
      signal: AbortSignal.timeout(8000),
    });
    if (ingestRes.ok) {
      const j = await ingestRes.json();
      ingested = j.ingested_count || complaints.length;
    }
  } catch (err) {
    console.warn('[seedRandomComplaints] ingest failed:', err);
  }

  try {
    const runRes = await fetch('/api/clusters/run', {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
    });
    if (runRes.ok) clustered = true;
  } catch (err) {
    console.warn('[seedRandomComplaints] clustering failed:', err);
  }

  return {
    ingested,
    zones_used: picked.map(z => z.zone_name),
    clustered,
  };
}
