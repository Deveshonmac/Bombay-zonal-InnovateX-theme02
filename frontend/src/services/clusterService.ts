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
