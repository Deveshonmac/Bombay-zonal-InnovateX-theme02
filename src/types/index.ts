export type AQIBand = 'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';

export interface AQIBandInfo {
  band: AQIBand;
  label: string;
  shortLabel: string;
  minAQI: number;
  maxAQI: number;
  color: string; // standard hex or tailwind class
  bgColor: string;
  textColor: string;
  borderColor: string;
  darkBgColor: string;
  darkTextColor: string;
  darkBorderColor: string;
  colorblindColor: string;
  colorblindBg: string;
  iconName: string;
  generalDescription: string;
  actionSummary: string;
}

export interface PollutantValues {
  pm25: number; // µg/m³
  pm10: number; // µg/m³
  no2: number;  // ppb or µg/m³
  so2: number;  // ppb or µg/m³
  co: number;   // ppm or mg/m³
  o3: number;   // ppb or µg/m³
}

export interface WeatherInfo {
  temperature: number; // °C
  feelsLike: number;
  humidity: number;    // %
  windSpeed: number;   // km/h
  windDirection: string;
  windDegree: number;
  pressure: number;    // hPa
  uvIndex: number;
  visibility: number;  // km
  condition: 'Clear' | 'Sunny' | 'Partly Cloudy' | 'Cloudy' | 'Hazy' | 'Foggy' | 'Smoky' | 'Rain';
  dewPoint: number;
}

export interface HourlyForecast {
  time: string; // e.g. "14:00"
  aqi: number;
  band: AQIBand;
  pm25: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}

export interface DailyForecast {
  day: string; // e.g. "Fri, Aug 14"
  shortDay: string; // "Fri"
  aqiMin: number;
  aqiMax: number;
  aqiAvg: number;
  band: AQIBand;
  pm25Avg: number;
  tempHigh: number;
  tempLow: number;
  condition: string;
  recommendation: string;
}

export interface SourceContribution {
  category: 'Vehicular' | 'Industrial' | 'Biomass & Crop Burning' | 'Road & Construction Dust' | 'Domestic & Waste' | 'Secondary Aerosols';
  percentage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  description: string;
  primaryPollutants: string[];
}

export interface CityData {
  id: string;
  name: string;
  state?: string;
  country: string;
  countryCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  aqi: number;
  band: AQIBand;
  dominantPollutant: keyof PollutantValues;
  pollutants: PollutantValues;
  weather: WeatherInfo;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  historicalTrend30Days: { date: string; aqi: number; pm25: number }[];
  sourceBreakdown: SourceContribution[];
  stationName: string;
  lastUpdated: string;
  inversionRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  rankingGlobal: number; // 1 = worst
  validationSource: string; // e.g., "IQAir Verified + CPCB Cross-check"
}

export interface UserHealthProfile {
  ageGroup: 'child' | 'adult' | 'senior';
  hasAsthmaOrCOPD: boolean;
  hasCardiovascular: boolean;
  isPregnant: boolean;
  hasChildrenInHousehold: boolean;
  isOutdoorWorker: boolean;
  isAthlete: boolean;
}

export interface SmartRecommendationResult {
  riskScore: number; // 1-100
  riskTier: 'Low' | 'Moderate' | 'Elevated' | 'High' | 'Critical';
  riskTitle: string;
  headlineSummary: string;
  precautions: {
    title: string;
    description: string;
    category: 'mask' | 'ventilation' | 'activity' | 'air-purifier' | 'medical';
    urgent: boolean;
    icon: string;
  }[];
  maskRecommendation: 'None needed' | 'Cloth / Surgical adequate' | 'N95 / FFP2 Strongly Recommended' | 'N95 / N99 Mandatory Outdoors';
  outdoorExerciseAdvice: string;
  windowVentilationAdvice: string;
  indoorPurifierAdvice: string;
}

export interface CommunityReport {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: UserRole;
  cityName: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  reportedCondition: 'Clear Air' | 'Noticeable Haze' | 'Strong Chemical Odor' | 'Heavy Smoke' | 'Stubble Burning Sighted' | 'Industrial Plume' | 'Dust Cloud';
  perceivedAQISeverity: 'Mild' | 'Moderate' | 'Severe' | 'Hazardous';
  description: string;
  upvotes: number;
  hasUpvoted?: boolean;
  isOfficialStationDiscrepancy: boolean;
  reputationScore: number; // 1-100
  status: 'active' | 'verified_by_moderator' | 'flagged';
  imageUrl?: string;
}

export type UserRole = 'guest' | 'registered' | 'contributor' | 'admin';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  savedCityIds: string[];
  healthProfile: UserHealthProfile;
  alertThreshold: number; // AQI value
  alertsEnabled: boolean;
  emailAlerts: boolean;
  pushAlerts: boolean;
  reputationPoints: number;
  quizScore: number;
  quizStreak: number;
  unlockedBadges: string[];
}

export interface CarbonFootprintEntry {
  id: string;
  date: string;
  transportKmPerDay: number;
  transportType: 'ev' | 'public_transit' | 'hybrid' | 'gasoline_car' | 'motorcycle' | 'walking_bicycle';
  electricityKwhPerMonth: number;
  cleanEnergyPercent: number;
  dietType: 'vegan' | 'vegetarian' | 'low_meat' | 'high_meat';
  flightsPerYear: number;
  totalAnnualKgCO2e: number;
  nationalComparisonPercent: number; // vs national avg
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: 'Pollutants' | 'Health Impact' | 'Meteorology' | 'Purifiers & Masking' | 'Global Climate';
}

export interface ArticleCaseStudy {
  id: string;
  title: string;
  subtitle: string;
  category: 'Case Study' | 'Health Science' | 'DIY Guide' | 'Policy & Action';
  readTime: string;
  date: string;
  author: string;
  authorTitle: string;
  coverImage: string;
  summary: string;
  content: string[];
  keyTakeaways: string[];
  tags: string[];
}

export interface PurifierProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  cadrCfm: number; // Clean Air Delivery Rate in CFM
  coverageSqFt: number;
  noiseLevelDb: number;
  filterType: 'True HEPA (H13)' | 'HyperHEPA' | 'HEPA + Activated Carbon' | 'Dual Filter';
  annualFilterCost: number;
  rating: number;
  reviewsCount: number;
  affiliateUrl: string;
  isDiyAlternative?: boolean;
  features: string[];
}

export type ActiveTab = 
  | 'dashboard'
  | 'map'
  | 'city-detail'
  | 'comparison'
  | 'simulator'
  | 'source-analysis'
  | 'awareness-hub'
  | 'carbon-calculator'
  | 'diy-purifier'
  | 'community-reports'
  | 'alerts'
  | 'provenance'
  | 'admin-console'
  | 'nodal-officer';
