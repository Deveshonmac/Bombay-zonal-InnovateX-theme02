"""
AirSense - Pune Synthetic Complaints Seeder (Day 2 Deliverable)
Generates ~650 realistic complaints clustered around key Pune hotspots
so that DBSCAN/clustering algorithms can group them into actionable incidents.
"""

import random
from datetime import datetime, timedelta, timezone
from app.database import SessionLocal, engine, Base
from app import models

# Ensure tables exist
Base.metadata.create_all(bind=engine)

# Realistic Pune hotspot zones
HOTSPOTS = [
    {
        "zone_name": "Hadapsar / Magarpatta Metro Corridor",
        "center_lat": 18.5089,
        "center_lng": 73.9260,
        "category": "construction_dust",
        "count": 160,
        "base_aqi": 320,
        "spread": 0.006,  # ~600m spread
        "descriptions": [
            "Massive dust plumes from unshielded metro construction on Pune-Solapur road",
            "Continuous concrete mixing with zero water sprinkling, dust coating shops",
            "Demolition debris left uncovered along the sidewalk for 3 days",
            "Heavy particulate clouds every time trucks pass the excavation site"
        ]
    },
    {
        "zone_name": "Shivaji Nagar / FC Road Chowk",
        "center_lat": 18.5314,
        "center_lng": 73.8446,
        "category": "vehicular",
        "count": 170,
        "base_aqi": 295,
        "spread": 0.005,
        "descriptions": [
            "Severe traffic bottleneck causing bumper-to-bumper diesel truck idling",
            "Thick exhaust fumes at the junction, air smells heavily of unburnt fuel",
            "Heavy PM2.5 haze accumulated under the flyover during evening rush hour",
            "Commercial tempo emissions without PUC check near bus terminus"
        ]
    },
    {
        "zone_name": "Bhosari MIDC Industrial Belt",
        "center_lat": 18.6279,
        "center_lng": 73.8398,
        "category": "industrial",
        "count": 140,
        "base_aqi": 360,
        "spread": 0.008,
        "descriptions": [
            "Dark chimney smoke discharge from casting foundry during early morning",
            "Pungent chemical and sulfur odor spreading into residential layout",
            "Unfiltered boiler exhaust noticed behind factory plot 24",
            "Continuous metal grinding dust vented directly into open air"
        ]
    },
    {
        "zone_name": "Kothrud ARAI Hill Perimeter",
        "center_lat": 18.5074,
        "center_lng": 73.8077,
        "category": "biomass_burning",
        "count": 80,
        "base_aqi": 240,
        "spread": 0.007,
        "descriptions": [
            "Large pile of dry leaves and garden waste set on fire near the trail",
            "Smoke drifting into residential apartments from hillside sweepings",
            "Daily morning open burning of tree prunings by maintenance staff",
            "Hazy white smoke from biomass burning irritating eyes of morning walkers"
        ]
    },
    {
        "zone_name": "Viman Nagar / Wadgaon Sheri Canal",
        "center_lat": 18.5679,
        "center_lng": 73.9143,
        "category": "garbage_burning",
        "count": 70,
        "base_aqi": 275,
        "spread": 0.006,
        "descriptions": [
            "Plastic and municipal waste set ablaze in open plot near canal",
            "Toxic black smoke with burning plastic smell between 8 PM and 11 PM",
            "Unattended municipal garbage heap burning beside residential society",
            "Repeated dumping and burning of domestic trash along service road"
        ]
    }
]


def seed_database():
    db = SessionLocal()
    try:
        # Check existing count
        existing_count = db.query(models.Complaint).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} complaints.")
            print("Clearing old test complaints to seed fresh realistic hotspots...")
            db.query(models.Complaint).delete()
            db.query(models.Action).delete()
            db.query(models.Cluster).delete()
            db.commit()

        total_seeded = 0
        now = datetime.now(timezone.utc)

        for zone in HOTSPOTS:
            for i in range(zone["count"]):
                # Apply Gaussian random offset around the hotspot center
                lat = zone["center_lat"] + random.gauss(0, zone["spread"])
                lng = zone["center_lng"] + random.gauss(0, zone["spread"])
                
                # Add realistic AQI fluctuation (+/- 25)
                aqi = max(50.0, round(zone["base_aqi"] + random.uniform(-25, 30), 1))
                
                # Random timestamp within last 36 hours
                minutes_ago = random.randint(5, 36 * 60)
                reported_time = now - timedelta(minutes=minutes_ago)
                
                complaint_id = f"CMP-PUN-{total_seeded + 1:04d}"
                desc = random.choice(zone["descriptions"])

                complaint = models.Complaint(
                    complaint_id=complaint_id,
                    lat=round(lat, 6),
                    lng=round(lng, 6),
                    category=zone["category"],
                    description=desc,
                    reported_aqi=aqi,
                    status="pending",
                    timestamp=reported_time
                )
                db.add(complaint)
                total_seeded += 1

        db.commit()
        print(f"[OK] Successfully seeded {total_seeded} realistic complaints across 5 Pune hotspots!")
        print("Hotspots seeded:")
        for z in HOTSPOTS:
            print(f"  - {z['zone_name']}: {z['count']} reports ({z['category']})")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
