export type ComplaintCategory = 'construction_dust' | 'vehicular' | 'biomass_burning' | 'industrial' | string;
export type TicketStatus = 'open' | 'in_progress' | 'dispatched' | 'investigating' | 'resolved';

export interface Complaint {
  complaint_id: string;
  id?: string; // alias for complaint_id
  lat: number;
  lng: number;
  category: string;
  timestamp: string;
  description: string;
  reported_AQI: number;
  status: 'open' | 'investigating' | 'resolved' | TicketStatus;
  ward?: string;
  citizen_contact_masked?: string;
  reporter_masked?: string; // backward compat alias
  evidence_photo_url?: string;
  evidence_photo?: boolean; // backward compat alias
}

export interface PriorityWeights {
  volume: number;
  severity: number;
  sla: number;
  aqi_delta: number;
}

export interface StatutoryWeights {
  complaint_spike: number; // e.g. +40 pts
  high_pollutant_source: number; // e.g. +25 pts
  sla_urgency: number; // e.g. +25 pts
  ambient_delta: number; // e.g. +10 pts
  weight_summary?: string;
}

export interface ResolutionRecord {
  resolved_at: string;
  officer_id: string;
  action_type: 'mist_cannon_deployment' | 'anti_smog_gun' | 'site_shutdown_notice' | 'road_sweeping' | 'biomass_extinguishment' | 'traffic_diversion' | string;
  action_summary: string;
  pre_intervention_aqi: number;
  post_intervention_aqi: number;
  aqi_delta: number; // e.g. -98 (improvement)
  sensor_station_id: string; // e.g., "PMC-CAAQMS-HADAPSAR-04"
  evidence_photo_url?: string;
  pm10_delta_percent?: number;
}

export interface IncidentCluster {
  cluster_id: string;
  title: string;
  location_name: string;
  ward: string;
  lat: number;
  lng: number;
  center: [number, number]; // [lat, lng] for Leaflet convenience
  primary_category: string;
  category: ComplaintCategory; // backward compat alias
  complaint_count: number;
  complaints: Complaint[];
  local_aqi: number;
  avg_aqi: number; // backward compat alias for local_aqi
  hours_open: number;
  hours_remaining: number; // 24 - hours_open
  priority_score: number;
  score_breakdown: {
    volume_pts: number;
    severity_pts: number;
    sla_pts: number;
    aqi_pts: number;
  };
  statutory_weights: StatutoryWeights;
  status: TicketStatus;
  resolution?: ResolutionRecord;
  created_at: string;
  primary_source: string;
  admin_action_label: string; // e.g. "Deploy Mist Cannons" or "Draft Air Act §31A Directive"
  manual_override_pts?: number;
  override_reason?: string;
  ai_recommendation?: {
    action: string;
    rationale: string;
    target_agency: string;
    suggested_equipment: string[];
    statutory_rule: string;
  };
}

export interface AuditActionLog {
  id: string;
  cluster_id: string;
  cluster_title: string;
  action_type: 'DISPATCH_INSPECTION' | 'ISSUE_STATUTORY_NOTICE' | 'DEPLOY_WATER_SPRINKLERS' | 'DIVERT_TRAFFIC' | 'MARK_RESOLVED' | 'SEAL_FACILITY';
  officer_id: string;
  officer_name: string;
  timestamp: string;
  details: string;
  status_before: TicketStatus;
  status_after: TicketStatus;
}

export type NavTab = 'triage' | 'queue' | 'impact_log' | 'audit_logs' | 'system_health' | 'settings';

