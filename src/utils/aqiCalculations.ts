import { AQIBand, AQIBandInfo, UserHealthProfile, SmartRecommendationResult } from '../types';

export const AQI_BANDS_INFO: Record<AQIBand, AQIBandInfo> = {
  good: {
    band: 'good',
    label: 'Good',
    shortLabel: 'Good',
    minAQI: 0,
    maxAQI: 50,
    color: '#10B981', // emerald-500
    bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-500',
    darkBgColor: 'dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    darkTextColor: 'dark:text-emerald-400',
    darkBorderColor: 'dark:border-emerald-600',
    colorblindColor: '#0072B2', // accessible blue
    colorblindBg: 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
    iconName: 'Smile',
    generalDescription: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
    actionSummary: 'Ideal conditions for all outdoor activities and natural room ventilation.',
  },
  moderate: {
    band: 'moderate',
    label: 'Moderate',
    shortLabel: 'Moderate',
    minAQI: 51,
    maxAQI: 100,
    color: '#FBBF24', // amber-400
    bgColor: 'bg-amber-50 text-amber-900 border-amber-200',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-400',
    darkBgColor: 'dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    darkTextColor: 'dark:text-amber-400',
    darkBorderColor: 'dark:border-amber-500',
    colorblindColor: '#E69F00', // accessible orange
    colorblindBg: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
    iconName: 'Meh',
    generalDescription: 'Air quality is acceptable; however, some pollutants may be a moderate health concern for a very small number of unusually sensitive individuals.',
    actionSummary: 'Unusually sensitive individuals should consider limiting prolonged outdoor exertion.',
  },
  sensitive: {
    band: 'sensitive',
    label: 'Unhealthy for Sensitive Groups',
    shortLabel: 'Unhealthy (Sens.)',
    minAQI: 101,
    maxAQI: 150,
    color: '#F97316', // orange-500
    bgColor: 'bg-orange-50 text-orange-900 border-orange-200',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-500',
    darkBgColor: 'dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
    darkTextColor: 'dark:text-orange-400',
    darkBorderColor: 'dark:border-orange-500',
    colorblindColor: '#CC79A7', // accessible magenta
    colorblindBg: 'bg-pink-50 text-pink-900 dark:bg-pink-950/40 dark:text-pink-300',
    iconName: 'AlertCircle',
    generalDescription: 'Members of sensitive groups (children, seniors, asthmatics, pregnant women) may experience health effects. The general public is less likely to be affected.',
    actionSummary: 'Sensitive individuals should reduce prolonged or heavy exertion outdoors and keep windows closed during peaks.',
  },
  unhealthy: {
    band: 'unhealthy',
    label: 'Unhealthy',
    shortLabel: 'Unhealthy',
    minAQI: 151,
    maxAQI: 200,
    color: '#EF4444', // red-500
    bgColor: 'bg-red-50 text-red-900 border-red-200',
    textColor: 'text-red-700',
    borderColor: 'border-red-500',
    darkBgColor: 'dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60',
    darkTextColor: 'dark:text-red-400',
    darkBorderColor: 'dark:border-red-500',
    colorblindColor: '#D55E00', // accessible vermilion
    colorblindBg: 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
    iconName: 'Frown',
    generalDescription: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
    actionSummary: 'Wear an N95 mask outdoors, avoid outdoor exercise, run indoor HEPA purifiers, and keep windows sealed.',
  },
  'very-unhealthy': {
    band: 'very-unhealthy',
    label: 'Very Unhealthy',
    shortLabel: 'Very Unhealthy',
    minAQI: 201,
    maxAQI: 300,
    color: '#A855F7', // purple-500
    bgColor: 'bg-purple-50 text-purple-900 border-purple-200',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-500',
    darkBgColor: 'dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    darkTextColor: 'dark:text-purple-400',
    darkBorderColor: 'dark:border-purple-500',
    colorblindColor: '#56B4E9', // accessible sky-dark
    colorblindBg: 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300',
    iconName: 'AlertTriangle',
    generalDescription: 'Health alert: The risk of health effects is substantially increased for everyone in the population.',
    actionSummary: 'Stay indoors with air purification. Avoid all outdoor physical activity. Use N95/N99 if stepping outside.',
  },
  hazardous: {
    band: 'hazardous',
    label: 'Hazardous',
    shortLabel: 'Hazardous',
    minAQI: 301,
    maxAQI: 500,
    color: '#881337', // rose-900/maroon
    bgColor: 'bg-rose-100 text-rose-950 border-rose-300',
    textColor: 'text-rose-900',
    borderColor: 'border-rose-900',
    darkBgColor: 'dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700',
    darkTextColor: 'dark:text-rose-300',
    darkBorderColor: 'dark:border-rose-600',
    colorblindColor: '#000000', // high contrast black/dark
    colorblindBg: 'bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-100',
    iconName: 'ShieldAlert',
    generalDescription: 'Health warning of emergency conditions: The entire population is more likely to be seriously affected.',
    actionSummary: 'Emergency alert: Serious respiratory hazard. Quarantine indoor air with HEPA filtration. Absolute ban on outdoor exercise.',
  },
};

export function getAQIBand(aqi: number): AQIBand {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very-unhealthy';
  return 'hazardous';
}

export function getAQIBandInfo(aqi: number, colorblindMode = false): AQIBandInfo & { displayColor: string } {
  const band = getAQIBand(aqi);
  const info = AQI_BANDS_INFO[band];
  return {
    ...info,
    displayColor: colorblindMode ? info.colorblindColor : info.color,
  };
}

export function calculateSmartRecommendations(
  aqi: number,
  profile: UserHealthProfile
): SmartRecommendationResult {
  const band = getAQIBand(aqi);
  
  // Vulnerability multiplier
  let vulnerabilityWeight = 1.0;
  if (profile.hasAsthmaOrCOPD) vulnerabilityWeight += 0.45;
  if (profile.hasCardiovascular) vulnerabilityWeight += 0.35;
  if (profile.isPregnant) vulnerabilityWeight += 0.30;
  if (profile.ageGroup === 'child') vulnerabilityWeight += 0.25;
  if (profile.ageGroup === 'senior') vulnerabilityWeight += 0.30;
  if (profile.isOutdoorWorker) vulnerabilityWeight += 0.20;
  if (profile.isAthlete) vulnerabilityWeight += 0.15;

  const baseRisk = Math.min(100, Math.round((aqi / 350) * 100));
  const rawRiskScore = Math.min(100, Math.round(baseRisk * (vulnerabilityWeight / 1.0)));

  let riskTier: SmartRecommendationResult['riskTier'] = 'Low';
  let riskTitle = 'Safe & Healthy';

  if (rawRiskScore > 75 || aqi > 250) {
    riskTier = 'Critical';
    riskTitle = 'Severe Health Hazard';
  } else if (rawRiskScore > 55 || aqi > 150) {
    riskTier = 'High';
    riskTitle = 'High Vulnerability Alert';
  } else if (rawRiskScore > 35 || aqi > 100) {
    riskTier = 'Elevated';
    riskTitle = 'Moderate Health Risk';
  } else if (rawRiskScore > 20 || aqi > 50) {
    riskTier = 'Moderate';
    riskTitle = 'Low to Moderate Caution';
  }

  // Precautions generation based on WHO/EPA protocols
  const precautions: SmartRecommendationResult['precautions'] = [];

  let maskRecommendation: SmartRecommendationResult['maskRecommendation'] = 'None needed';
  let outdoorExerciseAdvice = 'Safe for normal outdoor exercise and sports.';
  let windowVentilationAdvice = 'Open windows freely to circulate fresh outdoor air.';
  let indoorPurifierAdvice = 'Indoor air quality is pristine; purifier is optional.';

  if (aqi <= 50) {
    precautions.push({
      title: 'Ideal Outdoor Ventilation',
      description: 'Open windows in early morning and evening to circulate fresh air through living spaces.',
      category: 'ventilation',
      urgent: false,
      icon: 'Wind',
    });
    precautions.push({
      title: 'Optimal for Aerobic Cardio',
      description: 'Great conditions for running, cycling, and children playground activities.',
      category: 'activity',
      urgent: false,
      icon: 'Activity',
    });
  } else if (aqi <= 100) {
    maskRecommendation = profile.hasAsthmaOrCOPD ? 'Cloth / Surgical adequate' : 'None needed';
    outdoorExerciseAdvice = profile.hasAsthmaOrCOPD || profile.ageGroup === 'child'
      ? 'Reduce high-intensity sprint training; normal walking is completely fine.'
      : 'Generally safe for outdoor sports; monitor for mild throat tickle if sensitive.';
    windowVentilationAdvice = 'Ventilate during low-traffic afternoon hours; close during evening rush hour.';
    indoorPurifierAdvice = 'Run purifier in bedrooms on low/auto mode if sensitive to pollen or PM2.5.';

    if (profile.hasAsthmaOrCOPD) {
      precautions.push({
        title: 'Carry Quick-Relief Inhaler',
        description: 'Keep bronchodilator on hand during commutes or outdoor walks.',
        category: 'medical',
        urgent: true,
        icon: 'HeartPulse',
      });
    }
  } else if (aqi <= 150) {
    maskRecommendation = profile.hasAsthmaOrCOPD || profile.isPregnant || profile.ageGroup !== 'adult'
      ? 'N95 / FFP2 Strongly Recommended'
      : 'Cloth / Surgical adequate';
    outdoorExerciseAdvice = 'Shift intense workouts indoors (gym/home treadmill). Restrict outdoor sports to under 30 mins.';
    windowVentilationAdvice = 'Keep windows closed during morning inversion (6 AM - 10 AM) and evening peak.';
    indoorPurifierAdvice = 'Run HEPA air purifier on medium speed in occupied rooms; verify CADR covers square footage.';

    precautions.push({
      title: 'Vulnerable Groups Mask Advisory',
      description: 'Children, seniors, and pregnant individuals should wear a snug N95 mask near busy traffic arteries.',
      category: 'mask',
      urgent: true,
      icon: 'Shield',
    });
    precautions.push({
      title: 'Seal Window Leaks',
      description: 'Use weatherstripping or closed blinds to limit particulate infiltration from outdoor smog.',
      category: 'ventilation',
      urgent: false,
      icon: 'Home',
    });
  } else if (aqi <= 200) {
    maskRecommendation = 'N95 / FFP2 Strongly Recommended';
    outdoorExerciseAdvice = 'Strictly avoid outdoor jogging, cycling, and sports. Substitute with indoor yoga or strength training.';
    windowVentilationAdvice = 'Keep all windows and exterior doors tightly sealed. Avoid running exhaust fans that pull outdoor air.';
    indoorPurifierAdvice = 'Run True HEPA air purifier on High/Turbo. Maintain indoor PM2.5 < 15 µg/m³.';

    precautions.push({
      title: 'N95 Respirator Required Outdoors',
      description: 'Standard surgical masks do NOT filter sub-micron PM2.5 particles. Wear certified N95/FFP2 with a tight seal.',
      category: 'mask',
      urgent: true,
      icon: 'ShieldAlert',
    });
    precautions.push({
      title: 'Cease Outdoor Athletic Activities',
      description: 'Heavy breathing during exercise increases lung particulate deposition by up to 400%.',
      category: 'activity',
      urgent: true,
      icon: 'Activity',
    });
    if (profile.hasChildrenInHousehold) {
      precautions.push({
        title: 'Keep Children Indoors',
        description: 'Children have higher respiratory rates and developing lung tissue; reschedule outdoor recess.',
        category: 'medical',
        urgent: true,
        icon: 'Baby',
      });
    }
  } else {
    // 201+ (Very Unhealthy & Hazardous)
    maskRecommendation = 'N95 / N99 Mandatory Outdoors';
    outdoorExerciseAdvice = 'Severe health risk: Complete ban on outdoor exertion. All individuals at risk of acute respiratory distress.';
    windowVentilationAdvice = 'Create a dedicated "clean room" with continuous HEPA filtration and sealed air gaps.';
    indoorPurifierAdvice = 'Continuous maximum CADR HEPA operation. If using DIY Corsi-Rosenthal box, run box fan on high.';

    precautions.push({
      title: 'Emergency Level Air Quarantine',
      description: 'Toxic particulate levels. Minimize any outdoor exposure. Essential travel requires tight-seal N99/N95.',
      category: 'mask',
      urgent: true,
      icon: 'AlertTriangle',
    });
    precautions.push({
      title: 'Active Symptom Monitoring',
      description: 'Seek medical attention for persistent coughing, wheezing, chest tightness, or dizziness.',
      category: 'medical',
      urgent: true,
      icon: 'HeartPulse',
    });
    precautions.push({
      title: 'Indoor Clean Air Zone Setup',
      description: 'Select an interior room with minimal windows. Seal perimeter and run multi-stage filtration.',
      category: 'air-purifier',
      urgent: true,
      icon: 'Wind',
    });
  }

  const headlineSummary = aqi <= 50
    ? 'Air quality is excellent. Enjoy outdoor activities with zero restrictions.'
    : aqi <= 100
    ? 'Air quality is moderate. Sensitive individuals should take mild precautions.'
    : aqi <= 150
    ? `Air quality is unhealthy for sensitive groups. ${profile.hasAsthmaOrCOPD ? 'High risk for your respiratory profile.' : 'Exercise caution during peak hours.'}`
    : aqi <= 200
    ? 'Unhealthy air quality. Heavy particulate load; protective N95 masks and indoor filtration advised.'
    : 'Hazardous air emergency. Strict indoor air quarantine and continuous HEPA filtration required.';

  return {
    riskScore: rawRiskScore,
    riskTier,
    riskTitle,
    headlineSummary,
    precautions,
    maskRecommendation,
    outdoorExerciseAdvice,
    windowVentilationAdvice,
    indoorPurifierAdvice,
  };
}
