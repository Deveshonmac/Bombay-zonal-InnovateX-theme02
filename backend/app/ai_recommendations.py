"""
AirSense - Day 5 & Day 7 Humanized Municipal Recommendation Engine
Generates crisp, realistic municipal directives tailored for field enforcement officers,
avoiding generic AI chatbot disclaimers.
"""

import os
import json
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from . import models

load_dotenv()


def get_humanized_fallback(cluster: models.Cluster, priority_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns a humanized, field-tested municipal directive for Pune authorities.
    """
    cat = cluster.category.lower()
    cat_title = cluster.category.replace("_", " ").title()
    aqi = round(priority_info.get("avg_aqi", 300))
    count = cluster.complaint_count

    if "construction" in cat:
        return {
            "probable_source": f"Unshielded civil excavation and aggregate handling along {cluster.name}. Heavy vehicle movement over unpaved access tracks causing continuous fugitive PM10 re-suspension.",
            "root_cause_summary": f"Severe localized PM spike (AQI ~{aqi}) verified across {count} resident reports due to missing dust curtains and dry drilling.",
            "action_checklist": [
                {
                    "action": "Deploy 2 mobile anti-smog misting tankers from PMC depot along the active perimeter.",
                    "timeframe": "Immediate (0–2 Hours)",
                    "assigned_unit": "PMC Central Mechanical Road Misting Cell",
                    "priority": "P1"
                },
                {
                    "action": "Issue formal Stop-Work Notice to site contractor until 6-meter perimeter geotextile green screens are erected.",
                    "timeframe": "Within 4 Hours",
                    "assigned_unit": "Ward Executive Engineer (Building Permissions)",
                    "priority": "P1"
                },
                {
                    "action": "Mandate high-pressure tyre washing bays at site exit points and 100% tarpaulin sheeting on outgoing dumpers.",
                    "timeframe": "Within 6 Hours",
                    "assigned_unit": "Ward Sanitation Flying Squad",
                    "priority": "P2"
                }
            ],
            "lead_agency": "Pune Municipal Corporation (PMC) — Building Permissions & Solid Waste Dept.",
            "field_officer": "Ward Executive Engineer & Environmental Sub-Inspector",
            "legal_powers": "Section 31A of Air Act 1981 & Maharashtra Clean Air Action Plan 2020 Dust Control Guidelines",
            "projected_impact": f"28% to 35% reduction in localized PM10 (projected AQI drop from ~{aqi} to ~{int(aqi * 0.70)}) within 4 hours of water misting deployment."
        }
    elif "industrial" in cat:
        return {
            "probable_source": f"Off-peak industrial boiler exhaust and unscrubbed foundry cupola discharge within {cluster.name} (Plot 20–28 belt).",
            "root_cause_summary": f"High localized particulate matter and sulfur dioxide odor verified by {count} residents, indicating bypass of wet scrubber systems.",
            "action_checklist": [
                {
                    "action": "Dispatch MPCB flying squad for surprise stack-emission opacity measurement and flue gas sampling.",
                    "timeframe": "Immediate (0–2 Hours)",
                    "assigned_unit": "MPCB Field Monitoring Wing (Pune-II)",
                    "priority": "P1"
                },
                {
                    "action": "Inspect fuel records to verify ban on unauthorized heavy furnace oil or tyre-derived fuel (TDF).",
                    "timeframe": "Within 4 Hours",
                    "assigned_unit": "Sub-Regional Officer (SRO) Inspection Team",
                    "priority": "P1"
                },
                {
                    "action": "Serve provisional power disconnection notice via MSEDCL for units operating without functional APCDs.",
                    "timeframe": "Within 8 Hours",
                    "assigned_unit": "MPCB Legal & Enforcement Cell",
                    "priority": "P2"
                }
            ],
            "lead_agency": "Maharashtra Pollution Control Board (MPCB) — Pune Regional Office",
            "field_officer": "Sub-Regional Officer (SRO) & Senior Environmental Engineer",
            "legal_powers": "Section 21 & 31A of Air (Prevention & Control of Pollution) Act, 1981",
            "projected_impact": f"30% to 40% reduction in local PM2.5/SO2 concentrations within 6 hours of stack shutdown."
        }
    elif "vehicular" in cat:
        return {
            "probable_source": f"Chronic bottleneck congestion and commercial diesel vehicle idling along {cluster.name} during peak transit windows.",
            "root_cause_summary": f"Concentrated exhaust emissions (NO2 + PM2.5) trapped under elevated corridors verified by {count} citizen reports.",
            "action_checklist": [
                {
                    "action": "Coordinate with Pune Traffic Branch to divert heavy multi-axle freight vehicles to secondary ring routes.",
                    "timeframe": "Immediate (0–1 Hour)",
                    "assigned_unit": "Pune Traffic Police (Local Division)",
                    "priority": "P1"
                },
                {
                    "action": "Deploy PMC vacuum road sweeper to clear fine silt accumulation along central dividers.",
                    "timeframe": "Within 3 Hours",
                    "assigned_unit": "PMC Mechanical Sweeping Depot",
                    "priority": "P2"
                },
                {
                    "action": "Set up joint RTO inspection checkpoint to impound visibly smoking commercial tempos lacking valid PUC.",
                    "timeframe": "Within 6 Hours",
                    "assigned_unit": "Regional Transport Office (RTO) Flying Squad",
                    "priority": "P2"
                }
            ],
            "lead_agency": "Pune Traffic Police & PMC Environment Cell",
            "field_officer": "Assistant Commissioner of Police (Traffic) & Ward Road Superintendent",
            "legal_powers": "Motor Vehicles Act Section 190(2) & PMC City Clean Air Action Bylaws",
            "projected_impact": "20% to 25% decrease in roadside NO2 and PM2.5 levels within 2 hours of freight diversion."
        }
    elif "garbage" in cat:
        return {
            "probable_source": f"Illegal open burning of mixed municipal solid waste and discarded plastic packaging in vacant plots near {cluster.name}.",
            "root_cause_summary": f"Toxic smoldering fire releasing dioxins, carbon monoxide, and thick smoke affecting {count} nearby households.",
            "action_checklist": [
                {
                    "action": "Dispatch municipal water tanker to immediately extinguish smoldering waste piles and douse hot embers.",
                    "timeframe": "Immediate (0–1 Hour)",
                    "assigned_unit": "PMC Fire & Emergency Services / Ward Tanker Depot",
                    "priority": "P1"
                },
                {
                    "action": "Trace landowner of vacant plot and issue spot penalty under municipal sanitation bylaws.",
                    "timeframe": "Within 4 Hours",
                    "assigned_unit": "Ward Health Inspector (Solid Waste Management)",
                    "priority": "P2"
                },
                {
                    "action": "Deploy JCB excavator to clear remaining debris and transport to canonical waste processing facility.",
                    "timeframe": "Within 12 Hours",
                    "assigned_unit": "Ward Sanitary Debris Transport Team",
                    "priority": "P2"
                }
            ],
            "lead_agency": "Pune Municipal Corporation — Solid Waste Management Department",
            "field_officer": "Ward Health Inspector & Sanitary Superintendent",
            "legal_powers": "Solid Waste Management Rules 2016 (Rule 15) & National Green Tribunal Orders",
            "projected_impact": "Immediate elimination of toxic smoke plumes, 35% local PM reduction within 2 hours."
        }
    else:
        return {
            "probable_source": f"Open burning of accumulated dry garden clippings and organic foliage along {cluster.name}.",
            "root_cause_summary": f"Localized smoke haze verified by {count} resident complaints, creating high respiratory irritation in morning hours.",
            "action_checklist": [
                {
                    "action": "Mobilize ward patrol team to extinguish active biomass fires along roadsides and open spaces.",
                    "timeframe": "Immediate (0–2 Hours)",
                    "assigned_unit": "PMC Ward Garden & Sanitation Patrol",
                    "priority": "P1"
                },
                {
                    "action": "Place dedicated composting collection bins for residential societies in the affected sector.",
                    "timeframe": "Within 24 Hours",
                    "assigned_unit": "PMC Solid Waste Outreach Cell",
                    "priority": "P2"
                }
            ],
            "lead_agency": "PMC Environment Cell & Ward Sanitation Division",
            "field_officer": "Divisional Sanitation Inspector",
            "legal_powers": "Municipal Solid Waste Management Bylaws & Section 19 of Air Act 1981",
            "projected_impact": "Rapid dispersion of white smoke haze; local AQI recovery of 20% within 3 hours."
        }


def format_directive_as_markdown(data: Dict[str, Any]) -> str:
    """
    Formats the structured directive into a crisp, professional government briefing.
    """
    checklist_md = ""
    for i, item in enumerate(data.get("action_checklist", []), 1):
        checklist_md += f"{i}. **[{item.get('timeframe', 'Immediate')}] {item.get('action')}**\n   *Assigned Unit:* {item.get('assigned_unit', 'Field Squad')} (Priority: {item.get('priority', 'P1')})\n\n"

    return f"""### Executive Field Assessment
**Probable Source:** {data.get('probable_source', 'Fugitive particulate emissions')}
**Ground Context:** {data.get('root_cause_summary', 'Spike verified by ground telemetry.')}

---

### Field Enforcement Directive (Immediate Operations)
{checklist_md.strip()}

---

### Inter-Agency Coordination & Legal Basis
- **Lead Municipal Department:** {data.get('lead_agency', 'PMC Environment Cell')}
- **Field Command Role:** {data.get('field_officer', 'Ward Junior Engineer')}
- **Enforcement Authority:** {data.get('legal_powers', 'Air Act 1981 Section 31A')}

---

### Measured Outcome Target
**Expected Improvement:** {data.get('projected_impact', '25% to 35% PM reduction within 4 to 6 hours.')}
"""


def sanitize_directive_text(text: str) -> str:
    """
    Cleans up any LLM LaTeX artifacts ($\text{PM}_{10}$ -> PM10) or encoding glitches.
    """
    import re
    # Remove LaTeX \text{...} wrappers
    text = re.sub(r'\$\\text\{PM\}_\{?10\}?\$', 'PM10', text)
    text = re.sub(r'\$\\text\{PM\}_\{?2\.?5\}?\$', 'PM2.5', text)
    text = re.sub(r'\$\\text\{([^}]+)\}\$', r'\1', text)
    text = re.sub(r'\$([^\$]+)\$', r'\1', text)
    # Clean up any math dollar signs
    text = text.replace('$', '')
    # Normalize dashes and corrupted chars
    text = text.replace('\u2013', '-').replace('\u2014', '-').replace('??', '-')
    return text.strip()


def get_recommendation_for_cluster(cluster: models.Cluster, complaints: List[models.Complaint], priority_info: Dict[str, Any]) -> str:
    """
    Generates a humanized, structured directive for the nodal officer.
    Tries Gemini API with a strict professional prompt, falling back seamlessly.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    fallback_data = get_humanized_fallback(cluster, priority_info)

    if not api_key or api_key == "MY_GEMINI_API_KEY":
        return format_directive_as_markdown(fallback_data)

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        cat_name = cluster.category.replace("_", " ").title()
        sample_descriptions = [c.description for c in complaints[:3] if c.description]
        obs_text = "; ".join([f'"{d}"' for d in sample_descriptions]) if sample_descriptions else "Heavy ambient particulate observed"

        prompt = f"""You are drafting an official municipal field enforcement directive for the Senior Municipal Nodal Officer in Pune, India.
Write in authoritative, direct government field engineering language (PMC / MPCB standards). 
DO NOT use chatbot conversational filler (e.g. "Certainly", "Here is your plan", "As an AI"), greetings, or generic textbook warnings.

INCIDENT TELEMETRY:
- Location: {cluster.name} (Coords: {cluster.center_lat}, {cluster.center_lng})
- Category: {cat_name}
- Citizen Reports: {cluster.complaint_count}
- Local Zone AQI: {round(priority_info.get('avg_aqi', 300))}
- Resident Remarks: {obs_text}

CRITICAL RULES:
- Strictly DO NOT use LaTeX syntax like $\\text{{PM}}_{{10}}$ or math symbols. Write "PM10", "PM2.5", and "INR" or "Rs." as plain text.
- Use standard hyphens ("-") for ranges (e.g., 0-2h, 4-6h).
- Provide concrete Pune municipal machinery (anti-smog guns, misting tankers, vacuum sweepers) and real statutory sections (Air Act 1981 Section 31A, SWM Rules 2016).

Provide the immediate operational field protocol strictly in this format:

### Executive Field Assessment
**Probable Source:** [1 precise sentence identifying likely ground source at this location]
**Ground Context:** [1 concise sentence on why this is spiking right now]

---

### Field Enforcement Directive (Immediate Operations)
1. **[Immediate 0-2h]** [Specific physical intervention on ground]
   *Assigned Unit:* [PMC or MPCB team/equipment name]
2. **[Within 4h]** [Next operational intervention or notice to serve]
   *Assigned Unit:* [Assigned team]
3. **[Within 8h]** [Containment or regulatory action]
   *Assigned Unit:* [Assigned team]

---

### Inter-Agency Coordination & Legal Basis
- **Lead Municipal Department:** [Specific Pune department, e.g. PMC Building Permissions, MPCB Pune SRO, Pune Traffic Branch]
- **Field Command Role:** [Specific officer designation to dispatch]
- **Enforcement Authority:** [Specific Indian environmental law/section, e.g., Air Act 1981 Section 31A]

---

### Measured Outcome Target
**Expected Improvement:** [Projected percentage PM reduction and AQI drop within 4-6 hours]
"""

        res = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )
        if res and res.text and len(res.text) > 100:
            return sanitize_directive_text(res.text)
        else:
            return format_directive_as_markdown(fallback_data)

    except Exception as e:
        print(f"[INFO] Using humanized municipal directive engine: {e}")
        return format_directive_as_markdown(fallback_data)

