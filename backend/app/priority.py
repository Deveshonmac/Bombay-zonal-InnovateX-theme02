"""
AirSense - Day 4 Priority Scoring Engine
Calculates transparent, explainable urgency scores for incident clusters,
replacing municipal FIFO queues with data-driven triage.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List
import numpy as np
from sqlalchemy.orm import Session
from . import models

# Category Severity Weights (0.0 to 1.0)
# Reflects public health hazard and toxicity of pollutants involved
CATEGORY_SEVERITY_WEIGHTS = {
    "industrial": 1.00,        # Toxic chemicals, foundry/boiler exhaust, VOCs
    "garbage_burning": 0.90,   # Toxic dioxins, burning plastics, heavy PM
    "construction_dust": 0.75, # Unshielded PM10, silica dust, road work
    "vehicular": 0.65,         # Heavy diesel exhaust, NO2, traffic idling
    "biomass_burning": 0.55,   # Garden clippings, leaf burning, agricultural
    "other": 0.50
}

# Maximum point allocations (Total = 100 points)
MAX_VOLUME_POINTS = 35.0    # 35% weight: public impact / number of citizens reporting
MAX_SEVERITY_POINTS = 25.0  # 25% weight: hazard type
MAX_AQI_POINTS = 25.0       # 25% weight: atmospheric pollution severity
MAX_TIME_POINTS = 15.0      # 15% weight: SLA risk / aging prevention


def compute_priority_for_cluster(cluster: models.Cluster, complaints: List[models.Complaint]) -> Dict[str, Any]:
    """
    Computes a transparent priority score (0-100) and an explainable breakdown
    for an individual incident cluster.
    """
    # 1. Volume Score (0 - 35 pts)
    # 150+ complaints gives full 35 points
    count = cluster.complaint_count
    volume_score = min(MAX_VOLUME_POINTS, (count / 150.0) * MAX_VOLUME_POINTS)

    # 2. Category Severity Score (0 - 25 pts)
    severity_multiplier = CATEGORY_SEVERITY_WEIGHTS.get(cluster.category.lower(), 0.50)
    severity_score = MAX_SEVERITY_POINTS * severity_multiplier

    # 3. AQI Severity Score (0 - 25 pts)
    # Average AQI of member complaints, maxed at AQI 400 (Severe+)
    aqi_values = [c.reported_aqi for c in complaints if c.reported_aqi is not None]
    avg_aqi = float(np.mean(aqi_values)) if aqi_values else 200.0
    aqi_score = min(MAX_AQI_POINTS, (avg_aqi / 400.0) * MAX_AQI_POINTS)

    # 4. Time Open / Aging Score (0 - 15 pts)
    # Age in hours (from cluster creation or oldest complaint)
    now = datetime.now(timezone.utc)
    if cluster.created_at:
        created_time = cluster.created_at.replace(tzinfo=timezone.utc) if cluster.created_at.tzinfo is None else cluster.created_at
        hours_open = (now - created_time).total_seconds() / 3600.0
    else:
        hours_open = 1.0
    
    # 24 hours open gives full 15 aging points to prevent ticket starvation
    time_score = min(MAX_TIME_POINTS, (hours_open / 24.0) * MAX_TIME_POINTS)

    # Total Score (0 - 100)
    total_score = round(volume_score + severity_score + aqi_score + time_score, 2)

    # Determine Urgency Level
    if total_score >= 75.0:
        urgency_level = "CRITICAL"
        sla_target = "Within 4 hours"
    elif total_score >= 55.0:
        urgency_level = "HIGH"
        sla_target = "Within 12 hours"
    elif total_score >= 35.0:
        urgency_level = "MODERATE"
        sla_target = "Within 24 hours"
    else:
        urgency_level = "LOW"
        sla_target = "Within 48 hours"

    # Human-readable justification for the nodal officer (Explainability)
    cat_title = cluster.category.replace("_", " ").title()
    justification = (
        f"Ranked {urgency_level} ({total_score}/100) due to {count} citizen reports of {cat_title}, "
        f"local zone AQI averaging {round(avg_aqi)}, and {round(hours_open, 1)}h elapsed time."
    )

    return {
        "priority_score": total_score,
        "urgency_level": urgency_level,
        "sla_target": sla_target,
        "avg_aqi": round(avg_aqi, 1),
        "hours_open": round(hours_open, 1),
        "breakdown": {
            "volume_component": round(volume_score, 2),
            "severity_component": round(severity_score, 2),
            "aqi_component": round(aqi_score, 2),
            "time_open_component": round(time_score, 2)
        },
        "weights": {
            "volume_weight": "35%",
            "severity_weight": "25%",
            "aqi_weight": "25%",
            "time_open_weight": "15%"
        },
        "justification": justification
    }


def get_prioritized_clusters(db: Session) -> List[Dict[str, Any]]:
    """
    Evaluates all clusters in the database, updates their stored priority_score,
    and returns them sorted in descending order of urgency.
    """
    clusters = db.query(models.Cluster).all()
    prioritized_list = []

    for cluster in clusters:
        complaints = db.query(models.Complaint).filter(models.Complaint.cluster_id == cluster.id).all()
        eval_result = compute_priority_for_cluster(cluster, complaints)
        
        # Persist the recalculated priority score into the database
        cluster.priority_score = eval_result["priority_score"]

        prioritized_list.append({
            "id": cluster.id,
            "name": cluster.name,
            "category": cluster.category,
            "status": cluster.status,
            "complaint_count": cluster.complaint_count,
            "center_lat": cluster.center_lat,
            "center_lng": cluster.center_lng,
            "radius_meters": cluster.radius_meters,
            "priority_score": eval_result["priority_score"],
            "urgency_level": eval_result["urgency_level"],
            "sla_target": eval_result["sla_target"],
            "avg_aqi": eval_result["avg_aqi"],
            "hours_open": eval_result["hours_open"],
            "score_breakdown": eval_result["breakdown"],
            "weights": eval_result["weights"],
            "justification": eval_result["justification"],
            "recommendation": cluster.recommendation,
            "created_at": cluster.created_at,
            "updated_at": cluster.updated_at
        })

    db.commit()

    # Sort descending by priority_score
    prioritized_list.sort(key=lambda x: x["priority_score"], reverse=True)

    # Assign 1-indexed rank
    for index, item in enumerate(prioritized_list):
        item["rank"] = index + 1

    return prioritized_list
