export interface StatutoryRecommendation {
  targetAgency: string;
  directive: string;
  legalProvision: string;
  rationale: string;
  suggestedEquipment: string[];
  isFallback?: boolean;
}

export interface RecommendationParams {
  category: string;
  location: string;
  aqi: number;
  complaint_count: number;
  severity: string;
}

export function getFallbackRecommendation(params: RecommendationParams): StatutoryRecommendation {
  const cat = (params.category || '').toLowerCase();
  const ward = params.location || 'Pune Municipal Ward';
  const aqi = params.aqi || 280;
  const count = params.complaint_count || 12;

  if (cat.includes('dust') || cat.includes('construction')) {
    return {
      targetAgency: 'PMC Solid Waste & Works Dept',
      directive: `Deploy 2000L Anti-Smog Gun for wet dust suppression along ${ward} corridor`,
      legalProvision: 'Air Act 1981 Section 31A / SWM Rules 2016',
      rationale: `Severe localized PM10 particulate spike (AQI ${aqi}) with ${count} citizen reports requiring continuous boundary wetting.`,
      suggestedEquipment: ['2000L Anti-Smog Gun', 'Mobile Mist Cannon Truck', 'PMC Water Tanker (5000L)'],
      isFallback: true,
    };
  }

  if (cat.includes('biomass') || cat.includes('burning') || cat.includes('waste')) {
    return {
      targetAgency: 'PMC Flying Squad Team-B (Solid Waste Div)',
      directive: `Immediate bio-foam dousing of open combustion and issue spot penalty under PMC Cleanliness Bye-laws`,
      legalProvision: 'Air Act 1981 Section 31A / Solid Waste Management Rules 2016',
      rationale: `Direct toxic plume and volatile organic emissions detected near ${ward} with ${count} verified citizen geo-tags.`,
      suggestedEquipment: ['PMC Rapid Water Mist Tanker', 'Portable Fire Extinguisher Unit', 'Handheld VOC Sensor'],
      isFallback: true,
    };
  }

  if (cat.includes('vehicular') || cat.includes('traffic')) {
    return {
      targetAgency: 'Pune City Traffic Police (Env. Branch) & PMC Road Cell',
      directive: `Initiate non-destabilizing corridor diversion, enforce automated PUC checks, and deploy mechanized sweepers`,
      legalProvision: 'Central Motor Vehicles Act 1988 §190(2) & CPCB Graded Action Plan',
      rationale: `Heavy tailpipe PM2.5 concentration during congestion peak along ${ward}; AQI elevated to ${aqi}.`,
      suggestedEquipment: ['High-Efficiency Vacuum Sweeper', 'Automated PUC Compliance Scanner', 'Diversion Signage'],
      isFallback: true,
    };
  }

  if (cat.includes('industrial') || cat.includes('stack')) {
    return {
      targetAgency: 'MPCB Regional Office (Pune) & Joint PMC Cell',
      directive: `Conduct emergency stack emission audit, verify online CEMS telemetry, and issue provisional §31A directive`,
      legalProvision: 'Air (Prevention and Control of Pollution) Act 1981 Section 31A',
      rationale: `Sustained toxic industrial stack discharge violating permissible ambient standards with ${count} citizen reports.`,
      suggestedEquipment: ['Portable Isokinetic Flue Gas Sampler', 'Infrared Gas Leak Camera', 'Continuous PM/SOx Monitor'],
      isFallback: true,
    };
  }

  return {
    targetAgency: 'PMC Solid Waste & Works Dept',
    directive: `Deploy 2000L Anti-Smog Gun for rapid wet dust suppression along ${ward}`,
    legalProvision: 'Air Act 1981 Section 31A / SWM Rules 2016',
    rationale: `Priority incident cluster at ${ward} with ${count} complaints and elevated AQI of ${aqi}.`,
    suggestedEquipment: ['2000L Anti-Smog Gun', 'Rapid Intervention Squad Vehicle'],
    isFallback: true,
  };
}

export async function generateStatutoryRecommendation(
  params: RecommendationParams
): Promise<StatutoryRecommendation> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('/api/recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    if (data && !data.fallback && data.directive && data.targetAgency) {
      return {
        targetAgency: data.targetAgency,
        directive: data.directive,
        legalProvision: data.legalProvision || 'Air Act 1981 Section 31A',
        rationale: data.rationale || `Enforcement recommended based on AQI ${params.aqi} and ${params.complaint_count} citizen reports.`,
        suggestedEquipment: Array.isArray(data.suggestedEquipment) ? data.suggestedEquipment : ['Anti-Smog Gun', 'Mist Cannon'],
        isFallback: false,
      };
    }

    throw new Error('Incomplete response structure');
  } catch (err) {
    console.info('Using statutory municipal recommendation fallback:', err);
    return getFallbackRecommendation(params);
  }
}
