import numpy as np
from sklearn.cluster import DBSCAN
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from . import models

# Earth radius in kilometers for Haversine distance
EARTH_RADIUS_KM = 6371.0

# Known Pune reference landmarks to give human-readable names to clusters
PUNE_LANDMARKS = [
    {"name": "Hadapsar / Magarpatta", "lat": 18.5089, "lng": 73.9260},
    {"name": "Shivaji Nagar / FC Road", "lat": 18.5314, "lng": 73.8446},
    {"name": "Bhosari MIDC", "lat": 18.6279, "lng": 73.8398},
    {"name": "Kothrud / ARAI", "lat": 18.5074, "lng": 73.8077},
    {"name": "Viman Nagar / Wadgaon Sheri", "lat": 18.5679, "lng": 73.9143},
    {"name": "Hinjewadi IT Park", "lat": 18.5987, "lng": 73.7386},
]


def find_nearest_landmark(lat: float, lng: float) -> str:
    """
    Finds the closest known Pune neighborhood/landmark for friendly naming.
    """
    best_name = "Pune Urban"
    best_dist = float("inf")
    for lm in PUNE_LANDMARKS:
        d = (lm["lat"] - lat) ** 2 + (lm["lng"] - lng) ** 2
        if d < best_dist:
            best_dist = d
            best_name = lm["name"]
    return best_name


def haversine_distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculates distance in meters between two lat/lng points.
    """
    r_lat1, r_lng1, r_lat2, r_lng2 = map(np.radians, [lat1, lng1, lat2, lng2])
    dlat = r_lat2 - r_lat1
    dlng = r_lng2 - r_lng1
    a = np.sin(dlat / 2.0) ** 2 + np.cos(r_lat1) * np.cos(r_lat2) * np.sin(dlng / 2.0) ** 2
    c = 2 * np.arcsin(np.sqrt(a))
    return float(EARTH_RADIUS_KM * c * 1000.0)


def run_clustering_pipeline(db: Session, max_distance_km: float = 1.2, min_samples: int = 3) -> Dict[str, Any]:
    """
    Day 3 Core Intelligence Pipeline:
    Uses DBSCAN with Haversine metric to group complaints into clusters by location and category.
    Collapses hundreds of duplicate citizen reports into prioritized, actionable incidents.
    """
    complaints = db.query(models.Complaint).all()
    if not complaints:
        return {"status": "empty", "message": "No complaints available to cluster."}

    # Group complaints by category (e.g. construction dust doesn't mix with vehicular)
    by_category: Dict[str, List[models.Complaint]] = {}
    for c in complaints:
        by_category.setdefault(c.category, []).append(c)

    # Clear old cluster associations to generate a fresh clustering run
    db.query(models.Action).delete()
    db.query(models.Cluster).delete()
    for c in complaints:
        c.cluster_id = None
        c.status = "pending"
    db.commit()

    total_clusters_created = 0
    cluster_records = []

    # Maximum distance for DBSCAN in radians (Haversine formula)
    eps_radians = max_distance_km / EARTH_RADIUS_KM

    for category, cat_complaints in by_category.items():
        if len(cat_complaints) < min_samples:
            # If fewer than min_samples in category, group them into a single local cluster
            coords = np.array([[c.lat, c.lng] for c in cat_complaints])
            center_lat = float(np.mean(coords[:, 0]))
            center_lng = float(np.mean(coords[:, 1]))
            landmark = find_nearest_landmark(center_lat, center_lng)
            
            cluster = models.Cluster(
                name=f"{landmark} - {category.replace('_', ' ').title()}",
                category=category,
                center_lat=round(center_lat, 6),
                center_lng=round(center_lng, 6),
                radius_meters=500.0,
                complaint_count=len(cat_complaints),
                priority_score=round(len(cat_complaints) * 1.5, 2),
                status="open"
            )
            db.add(cluster)
            db.flush()
            for c in cat_complaints:
                c.cluster_id = cluster.id
                c.status = "clustered"
            total_clusters_created += 1
            cluster_records.append(cluster)
            continue

        # Extract lat/lng in radians for DBSCAN
        coords_rad = np.radians([[c.lat, c.lng] for c in cat_complaints])
        
        # Run DBSCAN
        dbscan = DBSCAN(eps=eps_radians, min_samples=min_samples, metric="haversine")
        labels = dbscan.fit_predict(coords_rad)

        unique_labels = set(labels)
        for label in unique_labels:
            if label == -1:
                # Outlier / noise complaints: still group isolated outliers into a single minor cluster
                member_indices = [i for i, lbl in enumerate(labels) if lbl == -1]
            else:
                member_indices = [i for i, lbl in enumerate(labels) if lbl == label]

            if not member_indices:
                continue

            members = [cat_complaints[i] for i in member_indices]
            coords = np.array([[m.lat, m.lng] for m in members])
            center_lat = float(np.mean(coords[:, 0]))
            center_lng = float(np.mean(coords[:, 1]))
            
            # Calculate maximum radius in meters from center
            distances = [haversine_distance_meters(center_lat, center_lng, m.lat, m.lng) for m in members]
            max_radius = max(distances) if distances else 400.0
            radius_meters = max(400.0, min(max_radius, 2500.0))  # keep realistic bounds

            landmark = find_nearest_landmark(center_lat, center_lng)
            category_title = category.replace("_", " ").title()
            cluster_name = f"{landmark} - {category_title}"
            
            # Calculate average AQI of reports in this cluster
            aqis = [m.reported_aqi for m in members if m.reported_aqi is not None]
            avg_aqi = float(np.mean(aqis)) if aqis else 200.0

            # Preliminary priority score (will be expanded on Day 4)
            # Volume + severity weighting
            priority = round((len(members) * 0.4) + (avg_aqi * 0.15), 2)

            cluster = models.Cluster(
                name=cluster_name,
                category=category,
                center_lat=round(center_lat, 6),
                center_lng=round(center_lng, 6),
                radius_meters=round(radius_meters, 1),
                complaint_count=len(members),
                priority_score=priority,
                status="open"
            )
            db.add(cluster)
            db.flush()

            # Associate all member complaints with this cluster
            for m in members:
                m.cluster_id = cluster.id
                m.status = "clustered"

            total_clusters_created += 1
            cluster_records.append(cluster)

    db.commit()

    return {
        "status": "success",
        "total_complaints_processed": len(complaints),
        "total_clusters_formed": total_clusters_created,
        "clusters": [
            {
                "id": c.id,
                "name": c.name,
                "category": c.category,
                "complaint_count": c.complaint_count,
                "center": [c.center_lat, c.center_lng],
                "radius_meters": c.radius_meters,
                "priority_score": c.priority_score
            }
            for c in cluster_records
        ]
    }
