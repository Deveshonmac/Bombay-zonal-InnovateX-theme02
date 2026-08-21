import React from 'react';
import {
  Wind,
  Shield,
  ShieldAlert,
  Activity,
  Thermometer,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Flame,
  Home,
  CheckCircle2,
  Droplets,
  Eye,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAQIBandInfo, calculateSmartRecommendations } from '../utils/aqiCalculations';
import { PollutantValues } from '../types';

export const Dashboard: React.FC = () => {
  const {
    currentCity,
    allCities,
    selectCityById,
    toggleSaveCity,
    isCitySaved,
    colorblindMode,
    user,
    setActiveTab,
  } = useApp();

  const bandInfo = getAQIBandInfo(currentCity.aqi, colorblindMode);
  const healthRecs = calculateSmartRecommendations(currentCity.aqi, user.healthProfile);
  const isSaved = isCitySaved(currentCity.id);

  // Sort cities for rankings
  const mostPolluted = [...allCities].sort((a, b) => b.aqi - a.aqi).slice(0, 5);
  const cleanestCities = [...allCities].sort((a, b) => a.aqi - b.aqi).slice(0, 5);

  const pollutantMeta: Record<
    keyof PollutantValues,
    { name: string; short: string; unit: string; whoLimit: number; impact: string }
  > = {
    pm25: {
      name: 'Fine Particles (PM2.5)',
      short: 'PM2.5',
      unit: 'µg/m³',
      whoLimit: 15,
      impact: 'Deep lung & blood entry',
    },
    pm10: {
      name: 'Coarse Dust (PM10)',
      short: 'PM10',
      unit: 'µg/m³',
      whoLimit: 45,
      impact: 'Airway & throat irritation',
    },
    no2: {
      name: 'Nitrogen Dioxide (NO2)',
      short: 'NO2',
      unit: 'µg/m³',
      whoLimit: 25,
      impact: 'Vehicle & diesel exhaust',
    },
    so2: {
      name: 'Sulfur Dioxide (SO2)',
      short: 'SO2',
      unit: 'µg/m³',
      whoLimit: 40,
      impact: 'Industrial & coal emissions',
    },
    co: {
      name: 'Carbon Monoxide (CO)',
      short: 'CO',
      unit: 'mg/m³',
      whoLimit: 4,
      impact: 'Incomplete combustion',
    },
    o3: {
      name: 'Surface Ozone (O3)',
      short: 'O3',
      unit: 'µg/m³',
      whoLimit: 100,
      impact: 'Sunlight photochemical smog',
    },
  };

  const getPollutantStatus = (key: keyof PollutantValues, value: number) => {
    const limit = pollutantMeta[key].whoLimit;
    const ratio = value / limit;
    if (ratio <= 1.0) return { label: 'Safe (WHO)', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' };
    if (ratio <= 3.0) return { label: `${ratio.toFixed(1)}x WHO`, color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' };
    return { label: `${ratio.toFixed(1)}x WHO`, color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Saved Cities Quick Switcher Bar */}
      {user.savedCityIds.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider shrink-0 flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-sky-500" /> Favorites:
          </span>
          {user.savedCityIds.map((savedId) => {
            const city = allCities.find((c) => c.id === savedId);
            if (!city) return null;
            const cBand = getAQIBandInfo(city.aqi, colorblindMode);
            const isSelected = city.id === currentCity.id;
            return (
              <button
                key={city.id}
                onClick={() => selectCityById(city.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs transition-all shrink-0 ${
                  isSelected
                    ? 'bg-sky-50 border-sky-400 text-sky-900 dark:bg-sky-950/50 dark:border-sky-700 dark:text-sky-200 font-bold shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{city.name}</span>
                <span
                  className="px-1.5 py-0.2 rounded text-[10px] font-black text-white"
                  style={{ backgroundColor: cBand.displayColor }}
                >
                  {city.aqi}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Hero Section: Station Overview + Health Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 Cols): Primary Air Quality Card */}
        <div
          className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col justify-between"
          id="dashboard-hero-card"
        >
          {/* Subtle colored glow in corner */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: bandInfo.displayColor }}
          />

          <div>
            {/* Header: Location & Station Meta */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    Live CAAQMS Station
                  </span>
                  <span className="text-xs text-zinc-400">•</span>
                  <span className="text-xs text-zinc-500">{currentCity.lastUpdated}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">
                  {currentCity.name}, <span className="text-zinc-500 dark:text-zinc-400 font-medium">{currentCity.state}</span>
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {currentCity.stationName} • <span className="text-sky-600 dark:text-sky-400 font-semibold">{currentCity.validationSource}</span>
                </p>
              </div>

              {/* Bookmark Save Action */}
              <button
                onClick={() => toggleSaveCity(currentCity.id)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isSaved
                    ? 'bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title={isSaved ? 'Remove from Saved Cities' : 'Save City to Favorites'}
                id="save-city-toggle-btn"
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" /> : <Bookmark className="w-5 h-5" />}
              </button>
            </div>

            {/* Giant AQI Number & Qualitative Category */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 my-5 p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800/70">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center text-white shadow-md font-black shrink-0"
                style={{ backgroundColor: bandInfo.displayColor }}
              >
                <span className="text-3xl sm:text-4xl leading-none font-mono">{currentCity.aqi}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-90">AQI</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs sm:text-sm font-black uppercase tracking-wide text-white"
                    style={{ backgroundColor: bandInfo.displayColor }}
                  >
                    {bandInfo.label}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    National Air Quality Index
                  </span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-2 font-medium leading-relaxed">
                  {bandInfo.actionSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar: Dominant Pollutant + National Rank + Inversion Risk */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-zinc-400 text-[10px] uppercase font-bold">Main Pollutant</span>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                {currentCity.dominantPollutant.toUpperCase()} ({currentCity.pollutants[currentCity.dominantPollutant]} µg/m³)
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-zinc-400 text-[10px] uppercase font-bold">National Rank</span>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                #{currentCity.rankingGlobal} in India
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-zinc-400 text-[10px] uppercase font-bold">Inversion Trapping</span>
              <div className={`font-bold mt-0.5 ${
                currentCity.inversionRisk === 'Severe' ? 'text-rose-600 dark:text-rose-400' :
                currentCity.inversionRisk === 'High' ? 'text-amber-600 dark:text-amber-400' :
                'text-emerald-600 dark:text-emerald-400'
              }`}>
                {currentCity.inversionRisk} Risk
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (5 Cols): Smart Health Advisory Card */}
        <div
          className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
          id="dashboard-health-advisory-card"
        >
          <div>
            {/* Header with Risk Tier */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Health Advisory
                </h2>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                healthRecs.riskTier === 'Critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                healthRecs.riskTier === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                healthRecs.riskTier === 'Elevated' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {healthRecs.riskTier} Risk
              </span>
            </div>

            {/* Health Profile Pill Indicator */}
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-lg mb-3.5 flex items-center justify-between">
              <span>
                Target: <strong className="text-zinc-800 dark:text-zinc-200 capitalize">{user.healthProfile.ageGroup}</strong>
                {user.healthProfile.hasAsthmaOrCOPD && <span className="text-rose-600 dark:text-rose-400 font-bold"> • Asthmatic</span>}
              </span>
              <button
                onClick={() => setActiveTab('simulator')}
                className="text-sky-600 dark:text-sky-400 hover:underline font-bold"
              >
                Configure
              </button>
            </div>

            {/* 3 Actionable Health Chips */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
                <Shield className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Mask Guidance</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">{healthRecs.maskRecommendation}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
                <Home className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Indoor Ventilation</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">{healthRecs.windowVentilationAdvice}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
                <Activity className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Outdoor Exercise</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">{healthRecs.outdoorExerciseAdvice}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Simulation Link */}
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab('simulator')}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              id="open-full-simulator-btn"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Smog Interventions</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Atmospheric & Meteorology Bar (7 Clean Metric Pills) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Atmospheric & Meteorological Conditions
            </h2>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Current: <strong className="text-zinc-800 dark:text-zinc-200">{currentCity.weather.condition}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-center">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Temperature</div>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">{currentCity.weather.temperature}°C</div>
            <div className="text-[10px] text-zinc-400">Feels {currentCity.weather.feelsLike}°C</div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-center">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Humidity</div>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">{currentCity.weather.humidity}%</div>
            <div className="text-[10px] text-zinc-400">Dew {currentCity.weather.dewPoint}°C</div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-center">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Wind Vector</div>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">{currentCity.weather.windSpeed} <span className="text-[10px] font-normal">km/h</span></div>
            <div className="text-[10px] text-zinc-400">{currentCity.weather.windDirection} ({currentCity.weather.windDegree}°)</div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-center">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Pressure</div>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">{currentCity.weather.pressure} <span className="text-[10px] font-normal">hPa</span></div>
            <div className="text-[10px] text-zinc-400">Barometer</div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-center">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">UV Index</div>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">{currentCity.weather.uvIndex} <span className="text-[10px] font-normal">/ 12</span></div>
            <div className="text-[10px] text-zinc-400">{currentCity.weather.uvIndex > 7 ? 'Very High' : 'Moderate'}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-center">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Visibility</div>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">{currentCity.weather.visibility} <span className="text-[10px] font-normal">km</span></div>
            <div className="text-[10px] text-zinc-400">{currentCity.weather.visibility < 3 ? 'Smog Veil' : 'Clear Sight'}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-center col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Dispersion</div>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {currentCity.weather.windSpeed < 8 ? 'Stagnant' : 'Active'}
            </div>
            <div className="text-[10px] text-zinc-400">Boundary Layer</div>
          </div>
        </div>
      </div>

      {/* 6-Card Pollutant Breakdown Matrix */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Continuous Pollutant Readouts
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Live CPCB sensor measurements compared to WHO 24-hour safe limits.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('city-detail')}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 hover:underline shrink-0"
          >
            <span>72-Hour Forecasts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {(Object.keys(pollutantMeta) as (keyof PollutantValues)[]).map((key) => {
            const meta = pollutantMeta[key];
            const value = currentCity.pollutants[key];
            const status = getPollutantStatus(key, value);
            const isDominant = currentCity.dominantPollutant === key;

            return (
              <div
                key={key}
                className={`p-4 rounded-xl border transition-all ${
                  isDominant
                    ? 'bg-sky-50/40 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800 shadow-xs'
                    : 'bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200/70 dark:border-zinc-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        {meta.name}
                      </span>
                      {isDominant && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-600 text-white uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-black text-zinc-900 dark:text-white mt-1">
                      {value}{' '}
                      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        {meta.unit}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Progress Bar vs WHO Limit */}
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-zinc-400 font-medium mb-1">
                    <span>Limit: {meta.whoLimit} {meta.unit}</span>
                    <span>{((value / meta.whoLimit) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        value > meta.whoLimit * 3
                          ? 'bg-rose-500'
                          : value > meta.whoLimit
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (value / (meta.whoLimit * 4)) * 100)}%` }}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
                  Impact: {meta.impact}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Rankings Comparison Side-by-Side Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top 5 Most Polluted */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-rose-500" />
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Live Rankings: Most Polluted Monitored Cities
            </h2>
          </div>
          <div className="space-y-1.5">
            {mostPolluted.map((city, idx) => {
              const band = getAQIBandInfo(city.aqi, colorblindMode);
              const isSelected = city.id === currentCity.id;
              return (
                <button
                  key={city.id}
                  onClick={() => selectCityById(city.id)}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 font-bold'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <span className="w-4 text-xs font-extrabold text-zinc-400">{idx + 1}.</span>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {city.name}, <span className="text-zinc-500 font-normal">{city.state}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Primary: {city.dominantPollutant.toUpperCase()} ({city.pollutants[city.dominantPollutant]} µg/m³)
                      </div>
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-black text-white"
                    style={{ backgroundColor: band.displayColor }}
                  >
                    {city.aqi} AQI
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top 5 Cleanest */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Live Rankings: Cleanest Monitored Cities
            </h2>
          </div>
          <div className="space-y-1.5">
            {cleanestCities.map((city, idx) => {
              const band = getAQIBandInfo(city.aqi, colorblindMode);
              const isSelected = city.id === currentCity.id;
              return (
                <button
                  key={city.id}
                  onClick={() => selectCityById(city.id)}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 font-bold'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <span className="w-4 text-xs font-extrabold text-zinc-400">{idx + 1}.</span>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {city.name}, <span className="text-zinc-500 font-normal">{city.state}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Coastal / Himalayan mountain airflow
                      </div>
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-black text-white"
                    style={{ backgroundColor: band.displayColor }}
                  >
                    {city.aqi} AQI
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
