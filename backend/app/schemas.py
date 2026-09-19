from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ==================== COMPLAINT SCHEMAS ====================

class ComplaintBase(BaseModel):
    lat: float = Field(..., description="Latitude of the reported incident", example=18.5204)
    lng: float = Field(..., description="Longitude of the reported incident", example=73.8567)
    category: str = Field(..., description="Pollution type (e.g. construction_dust, vehicular, biomass_burning)", example="construction_dust")
    description: Optional[str] = Field(None, description="Citizen remarks or description", example="Heavy dust clouds from demolition work")
    reported_aqi: Optional[float] = Field(None, description="Reported or nearby station AQI", example=240.0)


class ComplaintCreate(ComplaintBase):
    complaint_id: Optional[str] = Field(None, description="Unique complaint code. If omitted, one is auto-generated.")
    timestamp: Optional[datetime] = None


class ComplaintOut(ComplaintBase):
    id: int
    complaint_id: str
    status: str
    timestamp: datetime
    cluster_id: Optional[int] = None

    class Config:
        from_attributes = True


# ==================== CLUSTER SCHEMAS ====================

class ClusterBase(BaseModel):
    name: str
    category: str
    center_lat: float
    center_lng: float
    radius_meters: float = 500.0
    complaint_count: int = 1
    priority_score: float = 0.0
    status: str = "open"


class ClusterOut(ClusterBase):
    id: int
    recommendation: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    complaints: List[ComplaintOut] = []

    class Config:
        from_attributes = True


class ScoreBreakdown(BaseModel):
    volume_component: float
    severity_component: float
    aqi_component: float
    time_open_component: float


class ClusterPriorityOut(ClusterBase):
    id: int
    rank: int
    urgency_level: str
    sla_target: str
    avg_aqi: float
    hours_open: float
    score_breakdown: ScoreBreakdown
    weights: dict
    justification: str
    recommendation: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== ACTION / RESOLUTION SCHEMAS ====================

class ActionCreate(BaseModel):
    action_taken: str = Field(..., description="Intervention performed", example="Sprinklers deployed and fine issued")
    officer_notes: Optional[str] = Field(None, description="Detailed observations by nodal officer")
    aqi_before: Optional[float] = Field(None, description="AQI snapshot before intervention. If omitted, uses cluster average AQI.")
    aqi_after: Optional[float] = Field(None, description="AQI measured after intervention. If omitted, modeled post-intervention AQI is calculated.")


class ActionOut(BaseModel):
    id: int
    cluster_id: int
    cluster_name: Optional[str] = None
    category: Optional[str] = None
    action_taken: str
    officer_notes: Optional[str] = None
    aqi_before: float
    aqi_after: float
    aqi_delta: float
    percentage_improvement: float
    complaints_resolved: int
    resolved_at: datetime

    class Config:
        from_attributes = True


class ImpactSummary(BaseModel):
    total_incidents_resolved: int
    total_complaints_resolved: int
    average_aqi_reduction_points: float
    average_percentage_improvement: float
    actions: List[ActionOut]
