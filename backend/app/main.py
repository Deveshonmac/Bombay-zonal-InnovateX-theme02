from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uuid

from .database import engine, Base, get_db
from . import models, schemas, clustering, priority, ai_recommendations

# Initialize SQLite database tables (creates airsense.db if not present)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AirSense — Nodal Officer Triage API",
    description="Backend microservice for complaint ingestion, hotspot clustering, priority ranking, and resolution tracking.",
    version="1.0.0"
)

# Enable CORS so the React frontend (running on port 3000 / 5173) can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local hackathon development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root():
    """
    Root health check endpoint.
    """
    return {
        "project": "AirSense Urban Pollution Response System",
        "service": "FastAPI Nodal Officer Backend",
        "status": "online",
        "docs_url": "/docs",
        "mode": "parallel_safe (frontend mock data is untouched)"
    }


@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """
    Database connectivity check and counts.
    """
    complaint_count = db.query(models.Complaint).count()
    cluster_count = db.query(models.Cluster).count()
    action_count = db.query(models.Action).count()

    return {
        "status": "healthy",
        "database": "SQLite (airsense.db connected)",
        "counts": {
            "complaints": complaint_count,
            "clusters": cluster_count,
            "actions": action_count
        }
    }


# ==================== COMPLAINTS API ====================

@app.get("/api/complaints", response_model=List[schemas.ComplaintOut], tags=["Complaints"])
def get_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve list of ingested complaints.
    """
    complaints = db.query(models.Complaint).offset(skip).limit(limit).all()
    return complaints


@app.post("/api/complaints", response_model=schemas.ComplaintOut, status_code=201, tags=["Complaints"])
def create_complaint(complaint_in: schemas.ComplaintCreate, db: Session = Depends(get_db)):
    """
    Ingest a single citizen pollution report.
    """
    complaint_id = complaint_in.complaint_id or f"CMP-{uuid.uuid4().hex[:8].upper()}"
    db_complaint = models.Complaint(
        complaint_id=complaint_id,
        lat=complaint_in.lat,
        lng=complaint_in.lng,
        category=complaint_in.category,
        description=complaint_in.description,
        reported_aqi=complaint_in.reported_aqi,
        timestamp=complaint_in.timestamp
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


@app.post("/api/complaints/ingest", response_model=dict, status_code=201, tags=["Complaints"])
def bulk_ingest_complaints(complaints_in: List[schemas.ComplaintCreate], db: Session = Depends(get_db)):
    """
    Day 2 Endpoint: Bulk ingest synthetic or batch complaints (e.g. 500-1000 reports).
    """
    records = []
    for c in complaints_in:
        complaint_id = c.complaint_id or f"CMP-{uuid.uuid4().hex[:8].upper()}"
        record = models.Complaint(
            complaint_id=complaint_id,
            lat=c.lat,
            lng=c.lng,
            category=c.category,
            description=c.description,
            reported_aqi=c.reported_aqi,
            timestamp=c.timestamp
        )
        records.append(record)
    
    db.add_all(records)
    db.commit()
    return {
        "status": "success",
        "ingested_count": len(records),
        "message": f"Successfully ingested {len(records)} complaints into database"
    }


# ==================== CLUSTERS API ====================

@app.post("/api/clusters/run", response_model=dict, tags=["Clusters"])
def trigger_clustering(max_distance_km: float = 1.2, min_samples: int = 3, db: Session = Depends(get_db)):
    """
    Day 3 Endpoint: Runs the DBSCAN clustering pipeline on all pending complaints.
    Collapses hundreds of duplicate citizen reports into prioritized, actionable incidents.
    """
    result = clustering.run_clustering_pipeline(db, max_distance_km=max_distance_km, min_samples=min_samples)
    return result


@app.get("/api/clusters", response_model=List[schemas.ClusterOut], tags=["Clusters"])
def get_clusters(db: Session = Depends(get_db)):
    """
    Day 3 Endpoint: Retrieve all grouped incident clusters (for officer map and list).
    """
    clusters = db.query(models.Cluster).all()
    return clusters


@app.get("/api/clusters/priority", response_model=List[schemas.ClusterPriorityOut], tags=["Clusters"])
def get_prioritized_clusters(db: Session = Depends(get_db)):
    """
    Day 4 Endpoint: Returns all incident clusters sorted in descending order of urgency.
    Includes a complete explainability breakdown (volume, category severity, AQI, aging factor, justification).
    """
    prioritized = priority.get_prioritized_clusters(db)
    return prioritized


@app.get("/api/clusters/{cluster_id}", response_model=schemas.ClusterOut, tags=["Clusters"])
def get_cluster(cluster_id: int, db: Session = Depends(get_db)):
    """
    Day 3 Endpoint: Retrieve a specific cluster with all its member complaints.
    """
    cluster = db.query(models.Cluster).filter(models.Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return cluster


@app.post("/api/clusters/{cluster_id}/recommend", response_model=dict, tags=["Clusters"])
def generate_cluster_recommendation(cluster_id: int, db: Session = Depends(get_db)):
    """
    Day 5 Endpoint: Calls Google Gemini AI to generate a ready-to-act municipal recommendation
    based on the incident cluster's location, category, severity, AQI, and citizen complaints.
    """
    cluster = db.query(models.Cluster).filter(models.Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    complaints = db.query(models.Complaint).filter(models.Complaint.cluster_id == cluster.id).all()
    priority_info = priority.compute_priority_for_cluster(cluster, complaints)

    # Generate recommendation via Gemini 3.6 Flash (or fallback)
    recommendation_text = ai_recommendations.get_recommendation_for_cluster(cluster, complaints, priority_info)

    # Save generated recommendation to database
    cluster.recommendation = recommendation_text
    cluster.status = "in_review"
    db.commit()
    db.refresh(cluster)

    return {
        "status": "success",
        "cluster_id": cluster.id,
        "cluster_name": cluster.name,
        "category": cluster.category,
        "urgency_level": priority_info["urgency_level"],
        "priority_score": priority_info["priority_score"],
        "sla_target": priority_info["sla_target"],
        "recommendation": cluster.recommendation
    }


# ==================== ACTIONS & RESOLUTION API (DAY 6) ====================

@app.post("/api/clusters/{cluster_id}/resolve", response_model=schemas.ActionOut, tags=["Actions & Impact"])
def resolve_cluster(cluster_id: int, action_in: schemas.ActionCreate, db: Session = Depends(get_db)):
    """
    Day 6 Endpoint: Nodal officer marks an incident cluster as 'Actioned / Resolved'.
    Logs the intervention taken and captures the before/after AQI snapshot to prove real-world impact.
    """
    cluster = db.query(models.Cluster).filter(models.Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    complaints = db.query(models.Complaint).filter(models.Complaint.cluster_id == cluster.id).all()

    # Determine baseline AQI before intervention
    if action_in.aqi_before is not None:
        aqi_before = float(action_in.aqi_before)
    else:
        aqi_vals = [c.reported_aqi for c in complaints if c.reported_aqi is not None]
        aqi_before = float(sum(aqi_vals) / len(aqi_vals)) if aqi_vals else 280.0

    # Determine post-intervention AQI (measured or modeled based on category intervention efficacy)
    if action_in.aqi_after is not None:
        aqi_after = float(action_in.aqi_after)
    else:
        reduction_factors = {
            "industrial": 0.65,        # 35% reduction after stack/boiler shutdown
            "construction_dust": 0.70, # 30% reduction after anti-smog misting
            "garbage_burning": 0.68,   # 32% reduction after extinguishing open dump
            "biomass_burning": 0.72,   # 28% reduction
            "vehicular": 0.78          # 22% reduction after traffic diversion
        }
        factor = reduction_factors.get(cluster.category.lower(), 0.75)
        aqi_after = round(aqi_before * factor, 1)

    # 1. Create Action record in database
    action_record = models.Action(
        cluster_id=cluster.id,
        action_taken=action_in.action_taken,
        officer_notes=action_in.officer_notes,
        aqi_before=round(aqi_before, 1),
        aqi_after=round(aqi_after, 1)
    )
    db.add(action_record)

    # 2. Update cluster status to resolved
    cluster.status = "resolved"

    # 3. Update all member complaints to resolved
    for c in complaints:
        c.status = "resolved"

    db.commit()
    db.refresh(action_record)

    aqi_delta = round(action_record.aqi_after - action_record.aqi_before, 1)
    improvement_pct = round(((action_record.aqi_before - action_record.aqi_after) / action_record.aqi_before) * 100.0, 1)

    return schemas.ActionOut(
        id=action_record.id,
        cluster_id=cluster.id,
        cluster_name=cluster.name,
        category=cluster.category,
        action_taken=action_record.action_taken,
        officer_notes=action_record.officer_notes,
        aqi_before=action_record.aqi_before,
        aqi_after=action_record.aqi_after,
        aqi_delta=aqi_delta,
        percentage_improvement=improvement_pct,
        complaints_resolved=len(complaints),
        resolved_at=action_record.resolved_at
    )


@app.get("/api/actions", response_model=List[schemas.ActionOut], tags=["Actions & Impact"])
def get_actions(db: Session = Depends(get_db)):
    """
    Day 6 Endpoint: Retrieve all logged resolution actions (Impact Log).
    """
    actions = db.query(models.Action).order_by(models.Action.resolved_at.desc()).all()
    results = []
    for a in actions:
        cluster = db.query(models.Cluster).filter(models.Cluster.id == a.cluster_id).first()
        complaint_count = db.query(models.Complaint).filter(models.Complaint.cluster_id == a.cluster_id).count()
        aqi_delta = round(a.aqi_after - a.aqi_before, 1)
        improvement = round(((a.aqi_before - a.aqi_after) / a.aqi_before) * 100.0, 1) if a.aqi_before else 0.0

        results.append(schemas.ActionOut(
            id=a.id,
            cluster_id=a.cluster_id,
            cluster_name=cluster.name if cluster else "Unknown Incident",
            category=cluster.category if cluster else "other",
            action_taken=a.action_taken,
            officer_notes=a.officer_notes,
            aqi_before=a.aqi_before,
            aqi_after=a.aqi_after,
            aqi_delta=aqi_delta,
            percentage_improvement=improvement,
            complaints_resolved=complaint_count,
            resolved_at=a.resolved_at
        ))
    return results


@app.get("/api/actions/impact-summary", response_model=schemas.ImpactSummary, tags=["Actions & Impact"])
def get_impact_summary(db: Session = Depends(get_db)):
    """
    Day 6 Endpoint: Aggregate impact metrics proving tangible air quality improvement
    across all resolved incidents for the dashboard and hackathon pitch.
    """
    action_items = get_actions(db)
    if not action_items:
        return schemas.ImpactSummary(
            total_incidents_resolved=0,
            total_complaints_resolved=0,
            average_aqi_reduction_points=0.0,
            average_percentage_improvement=0.0,
            actions=[]
        )

    total_incidents = len(action_items)
    total_complaints = sum(a.complaints_resolved for a in action_items)
    avg_aqi_drop = round(sum(abs(a.aqi_delta) for a in action_items) / total_incidents, 1)
    avg_pct = round(sum(a.percentage_improvement for a in action_items) / total_incidents, 1)

    return schemas.ImpactSummary(
        total_incidents_resolved=total_incidents,
        total_complaints_resolved=total_complaints,
        average_aqi_reduction_points=avg_aqi_drop,
        average_percentage_improvement=avg_pct,
        actions=action_items
    )
