import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  Wind,
  ShieldAlert,
  Flame,
  Droplets,
  Thermometer,
  AlertTriangle,
  Info,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { getAQIBandInfo } from '../utils/aqiCalculations';
import { PollutantValues } from '../types';

export const CityDetail: React.FC = () => {
  const { currentCity, colorblindMode, setActiveTab } = useApp();
  const [forecastView, setForecastView] = useState<'hourly' | 'daily' | 'historical'>('hourly');

  const currentBandInfo = getAQIBandInfo(currentCity.aqi, colorblindMode);

  // Radar Data normalization (scaled 0 - 100 based on WHO reference limits)
  const radarData = [
    { pollutant: 'PM2.5', value: Math.min(100, (currentCity.pollutants.pm25 / 100) * 100), fullMark: 100 },
    { pollutant: 'PM10', value: Math.min(100, (currentCity.pollutants.pm10 / 200) * 100), fullMark: 100 },
    { pollutant: 'NO2', value: Math.min(100, (currentCity.pollutants.no2 / 100) * 100), fullMark: 100 },
    { pollutant: 'SO2', value: Math.min(100, (currentCity.pollutants.so2 / 50) * 100), fullMark: 100 },
    { pollutant: 'CO', value: Math.min(100, (currentCity.pollutants.co / 5) * 100), fullMark: 100 },
    { pollutant: 'O3', value: Math.min(100, (currentCity.pollutants.o3 / 100) * 100), fullMark: 100 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top City Overview Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              City Analytical Profile & Forecasts
            </span>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs text-zinc-500">{currentCity.stationName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">
            {currentCity.name}, <span className="text-zinc-500 font-medium">{currentCity.state}</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Station: <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{currentCity.stationName}</span> • Source: <span className="text-sky-600 dark:text-sky-400 font-semibold">{currentCity.validationSource}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-zinc-400 font-semibold uppercase">Current Observation</div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              {currentCity.aqi}{' '}
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded text-white" style={{ backgroundColor: currentBandInfo.displayColor }}>
                {currentBandInfo.shortLabel}
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('source-analysis')}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Pollution Sources</span>
          </button>
        </div>
      </div>

      {/* Main Forecast & Trend Center */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        
        {/* Forecast Tab Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Predictive AQI Trends & Meteorological Modeling
            </h2>
          </div>

          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setForecastView('hourly')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                forecastView === 'hourly'
                  ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>72-Hour Hourly</span>
            </button>

            <button
              onClick={() => setForecastView('daily')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                forecastView === 'daily'
                  ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>7-Day Outlook</span>
            </button>

            <button
              onClick={() => setForecastView('historical')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                forecastView === 'historical'
                  ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>30-Day History</span>
            </button>
          </div>
        </div>

        {/* View 1: 72-Hour Hourly Chart */}
        {forecastView === 'hourly' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Hourly air quality index and PM2.5 fluctuation curve.</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Peak expected: <strong className="text-rose-600 dark:text-rose-400">06:00 AM (Inversion Peak)</strong>
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentCity.hourlyForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aqiHourlyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentBandInfo.displayColor} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={currentBandInfo.displayColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.2} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} domain={[0, 'dataMax + 40']} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">Time: {label}</div>
                            <div className="text-sky-600 dark:text-sky-400 font-extrabold">AQI: {data.aqi} ({data.band})</div>
                            <div className="text-zinc-600 dark:text-zinc-300">PM2.5: {data.pm25} µg/m³</div>
                            <div className="text-zinc-500">Weather: {data.temperature}°C • {data.condition}</div>
                            <div className="text-zinc-500">Wind: {data.windSpeed} km/h</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="aqi"
                    stroke={currentBandInfo.displayColor}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#aqiHourlyGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* View 2: 7-Day Outlook Cards */}
        {forecastView === 'daily' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentCity.dailyForecast.map((day, idx) => {
                const dBand = getAQIBandInfo(day.aqiAvg, colorblindMode);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                        {day.day}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black text-white"
                        style={{ backgroundColor: dBand.displayColor }}
                      >
                        AQI {day.aqiAvg}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Range: {day.aqiMin} - {day.aqiMax}</span>
                      <span>{day.tempLow}° / {day.tempHigh}°C</span>
                    </div>

                    <div className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                      Condition: <strong>{day.condition}</strong>
                    </div>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                      "{day.recommendation}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View 3: 30-Day Historical Trend */}
        {forecastView === 'historical' && (
          <div className="space-y-4">
            <div className="text-xs text-zinc-500">
              30-day recorded historical particulate concentration showing seasonal trends.
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentCity.historicalTrend30Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.2} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">{label}</div>
                            <div className="text-rose-600 dark:text-rose-400 font-bold">AQI: {payload[0]?.value}</div>
                            <div className="text-sky-600 dark:text-sky-400">PM2.5: {payload[1]?.value} µg/m³</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="aqi" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="pm25" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* Two-Column Deep-Dive: Multi-Pollutant Radar + Dominant Pollutant Biology */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Multi-Pollutant Radar Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Multi-Pollutant Balance Radar
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Normalized ratio across primary criteria air pollutants relative to maximum toxic thresholds.
            </p>

            <div className="h-64 w-full my-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#71717a" opacity={0.2} />
                  <PolarAngleAxis dataKey="pollutant" stroke="#a1a1aa" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#71717a" opacity={0.3} />
                  <Radar
                    name="Pollutant Load"
                    dataKey="value"
                    stroke={currentBandInfo.displayColor}
                    fill={currentBandInfo.displayColor}
                    fillOpacity={0.45}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span>Primary Driver: <strong className="text-zinc-800 dark:text-zinc-200 uppercase">{currentCity.dominantPollutant}</strong></span>
            <span>Scale: Normalized %</span>
          </div>
        </div>

        {/* Dominant Pollutant Biological Pathway (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Dominant Pollutant: {currentCity.dominantPollutant.toUpperCase()} Diagnostic
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              Primary Hazard
            </span>
          </div>

          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            In <strong>{currentCity.name}</strong>, ambient {currentCity.dominantPollutant.toUpperCase()} is currently measuring{' '}
            <strong className="text-rose-600 dark:text-rose-400 font-black">{currentCity.pollutants[currentCity.dominantPollutant]} µg/m³</strong>, constituting the primary driver of the overall {currentCity.aqi} AQI reading.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Physical Characteristics</span>
              <p className="text-zinc-700 dark:text-zinc-300">
                Aerodynamic diameter &lt; 2.5 microns (1/30th diameter of human hair). Suspended stably in stagnant air for days.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Physiological Entry Route</span>
              <p className="text-zinc-700 dark:text-zinc-300">
                Bypasses upper respiratory filtration, translocates across alveolar membrane directly into pulmonary capillaries.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Acute Health Symptoms</span>
              <p className="text-zinc-700 dark:text-zinc-300">
                Dry persistent cough, conjunctival burning, bronchial constriction, reduced athletic VO2 max.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Recommended Mitigation</span>
              <p className="text-zinc-700 dark:text-zinc-300">
                Certified N95/FFP2 tight-seal respirators; True HEPA mechanical air purifiers (CADR &gt; 250 CFM).
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('simulator')}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>Simulate Personalized Health Precautions</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
