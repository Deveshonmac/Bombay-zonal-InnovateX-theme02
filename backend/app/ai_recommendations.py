"""
AirSense - Day 5 Automated AI Recommendation Engine
Generates actionable, legally grounded intervention recommendations
for nodal officers using Google Gemini API (gemini-3.6-flash).
"""

import os
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from . import models

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


def generate_recommendation_prompt(cluster: models.Cluster, complaints: List[models.Complaint], priority_info: Dict[str, Any]) -> str:
    """
    R1 Prompt Template: Binds structured cluster metrics into a specialized prompt.
    """
    sample_descriptions = [c.description for c in complaints[:4] if c.description]
    descriptions_text = "\n".join([f"- \"{d}\"" for d in sample_descriptions]) if sample_descriptions else "- High localized particulate concentration reported."

    cat_name = cluster.category.replace("_", " ").title()

    prompt = f"""You are the Chief Environmental Operations Advisor to the Municipal Nodal Officer for Air Quality in Pune, India.
A localized pollution incident cluster has been detected by the AirSense Urban Pollution Response System.

--- INCIDENT TELEMETRY ---
- Incident Name: {cluster.name}
- Coordinates: Latitude {cluster.center_lat}, Longitude {cluster.center_lng} (Approx. {cluster.radius_meters}m radius)
- Category: {cat_name}
- Priority Score: {priority_info.get('priority_score', cluster.priority_score)} / 100 ({priority_info.get('urgency_level', 'HIGH')} Urgency)
- Required SLA: {priority_info.get('sla_target', 'Within 12 hours')}
- Current Local Zone AQI: {priority_info.get('avg_aqi', 280)}
- Citizen Complaints Collapsed: {cluster.complaint_count} reports
- Resident Observations:
{descriptions_text}

--- YOUR TASK ---
Provide a crisp, actionable, operational response plan specifically tailored to Pune municipal administration (PMC, PCMC, MPCB).
Format your output with these exact Markdown headers:

### 1. Primary Diagnosis & Probable Source
Identify the likely specific source causing this spike based on the location and reports.

### 2. Immediate Enforcement & Interventions (0–4 Hours)
List 3-4 specific physical interventions to deploy immediately on the ground (e.g., anti-smog guns, road misting, work stoppage order, diesel generator checks).

### 3. Lead Nodal Agency & Routing
Specify the primary responsible department (e.g., MPCB Regional Office Pune, PMC Solid Waste Management, Traffic Police) and the field officer role to dispatch.

### 4. Regulatory Authority & Legal Powers
Cite the specific Indian environmental rule or section applicable (e.g., Air Act 1981 Section 31A, Municipal Solid Waste Management Rules 2016, GRAP provisions).

### 5. Expected AQI Impact
State the projected percentage reduction in local PM/AQI within 6–12 hours once the intervention is executed.

Keep the advice direct, authoritative, and operational. Avoid vague generic disclaimers.
"""
    return prompt


def generate_fallback_recommendation(cluster: models.Cluster, priority_info: Dict[str, Any]) -> str:
    """
    High-fidelity offline fallback dataset (Day 10 requirement) in case of API failure.
    """
    cat = cluster.category.lower()
    cat_title = cluster.category.replace("_", " ").title()
    aqi = priority_info.get("avg_aqi", 280)
    count = cluster.complaint_count

    if "construction" in cat:
        return f"""### 1. Primary Diagnosis & Probable Source
Unshielded civil excavation and construction debris along {cluster.name}. Active PM10/PM2.5 generation due to heavy vehicle movement over dry unpaved surfaces.

### 2. Immediate Enforcement & Interventions (0–4 Hours)
- Dispatch 2 mobile anti-smog water misting tankers from PMC central depot to suppress surface particulate.
- Issue immediate Stop-Work Notice to the site supervisor until 100% green mesh shielding and tyre-washing bays are operational.
- Mandate tarp covering on all outgoing dumpers and raw aggregate piles.

### 3. Lead Nodal Agency & Routing
- **Lead Agency:** Pune Municipal Corporation (PMC) — Building Permissions & Solid Waste Dept.
- **Assigned Officer:** Ward Executive Engineer & Environmental Sub-Inspector.

### 4. Regulatory Authority & Legal Powers
- Section 31A of the Air (Prevention and Control of Pollution) Act, 1981.
- Maharashtra Clean Air Action Plan 2020 Construction Dust Guidelines.

### 5. Expected AQI Impact
Expected local PM10 reduction of **25% to 35%** (AQI dropping from ~{aqi} to ~{int(aqi * 0.72)}) within 4 hours of water misting deployment."""

    elif "industrial" in cat:
        return f"""### 1. Primary Diagnosis & Probable Source
Unauthorized nocturnal or early-morning boiler emissions and unscrubbed foundry exhaust in {cluster.name}. High particulate matter and sulfur compounds detected.

### 2. Immediate Enforcement & Interventions (0–4 Hours)
- Deploy MPCB flying squad for surprise stack-emission opacity testing on identified industrial units.
- Inspect fuel logs to verify ban on petcoke or illegal furnace oil usage.
- Issue provisional closure notice to non-compliant boiler units pending scrubber calibration.

### 3. Lead Nodal Agency & Routing
- **Lead Agency:** Maharashtra Pollution Control Board (MPCB) — Pune Regional Office.
- **Assigned Officer:** Sub-Regional Officer (SRO) — Field Inspection Wing.

### 4. Regulatory Authority & Legal Powers
- Section 21 & 31A of the Air Act, 1981 (Consent to Operate compliance).
- Environment (Protection) Act, 1986.

### 5. Expected AQI Impact
Expected localized VOC/PM reduction of **30% to 40%** once offending stack emissions are halted."""

    else:
        return f"""### 1. Primary Diagnosis & Probable Source
Localized {cat_title} event concentrated around {cluster.name}, generating elevated particulate matter verified by {count} citizen reports.

### 2. Immediate Enforcement & Interventions (0–4 Hours)
- Dispatch municipal field marshals to physically secure and neutralize the emission source.
- Deploy mechanical road sweepers and water sprinkling units along major arterial roads.
- Issue spot penalty to violators under municipal environmental bylaws.

### 3. Lead Nodal Agency & Routing
- **Lead Agency:** PMC Ward Office / Local Environmental Cell.
- **Assigned Officer:** Health & Sanitation Inspector.

### 4. Regulatory Authority & Legal Powers
- Solid Waste Management Rules 2016 & Air (Prevention and Control of Pollution) Act, 1981.

### 5. Expected AQI Impact
Projected AQI recovery of **15% to 25%** within 6 hours of source suppression."""


def get_recommendation_for_cluster(cluster: models.Cluster, complaints: List[models.Complaint], priority_info: Dict[str, Any]) -> str:
    """
    Calls Google Gemini 3.6 Flash using the google-genai SDK to generate
    a tailored municipal action plan. Falls back seamlessly if API key is missing.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "MY_GEMINI_API_KEY":
        return generate_fallback_recommendation(cluster, priority_info)

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = generate_recommendation_prompt(cluster, complaints, priority_info)
        
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )
        if response and response.text:
            return response.text.strip()
        else:
            return generate_fallback_recommendation(cluster, priority_info)

    except Exception as e:
        print(f"[WARN] Gemini API call failed: {e}. Using deterministic fallback recommendation.")
        return generate_fallback_recommendation(cluster, priority_info)
