import React from 'react';
import {
  Sliders,
  Plus,
  X,
  TrendingUp,
  Flame,
  Wind,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { getAQIBandInfo, calculateSmartRecommendations } from '../utils/aqiCalculations';
import { CityData } from '../types';

export const CityComparison: React.FC = () => {
  const {
    allCities,
    comparisonCityIds,
    addComparisonCity,
    removeComparisonCity,
    colorblindMode,
    user,
    setCurrentCity,
    setActiveTab,
  } = useApp();

  const selectedCities = comparisonCityIds
    .map((id) => allCities.find((c) => c.id === id))
    .filter((c): c is CityData => c !== undefined);

  // Colors for multi-bar comparisons
  const cityColors = ['#0284c7', '#10b981', '#f59e0b'];

  // Bar chart dataset: Pollutants side by side
  const chartData = [
    {
      pollutant: 'PM2.5',
      ...selectedCities.reduce((acc, c, idx) => ({ ...acc, [c.name]: c.pollutants.pm25 }), {}),
    },
    {
      pollutant: 'PM10',
      ...selectedCities.reduce((acc, c, idx) => ({ ...acc, [c.name]: c.pollutants.pm10 }), {}),
    },
    {
      pollutant: 'NO2',
      ...selectedCities.reduce((acc, c, idx) => ({ ...acc, [c.name]: c.pollutants.no2 }), {}),
    },
    {
      pollutant: 'SO2',
      ...selectedCities.reduce((acc, c, idx) => ({ ...acc, [c.name]: c.pollutants.so2 }), {}),
    },
    {
      pollutant: 'O3',
      ...selectedCities.reduce((acc, c, idx) => ({ ...acc, [c.name]: c.pollutants.o3 }), {}),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h1 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-100">
              Multi-City Comparative Analytics
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Side-by-side pollutant delta analysis, health risk disparity, and dominant pollution contributors.
          </p>
        </div>

        {/* Add City Selector */}
        <div className="flex items-center gap-2">
          {selectedCities.length < 3 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addComparisonCity(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="" disabled>
                + Add City to Compare (Max 3)
              </option>
              {allCities
                .filter((c) => !comparisonCityIds.includes(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.country} (AQI {c.aqi})
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Side-by-Side City Overview Cards Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-${selectedCities.length} gap-4`}>
        {selectedCities.map((city, idx) => {
          const band = getAQIBandInfo(city.aqi, colorblindMode);
          const health = calculateSmartRecommendations(city.aqi, user.healthProfile);
          const color = cityColors[idx % cityColors.length];

          return (
            <div
              key={city.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm relative flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <h2 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
                        {city.name}
                      </h2>
                      <p className="text-xs text-zinc-500">{city.state}</p>
                    </div>
                  </div>

                  {selectedCities.length > 2 && (
                    <button
                      onClick={() => removeComparisonCity(city.id)}
                      className="p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Remove from comparison"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* AQI Badge */}
                <div className="my-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400">AQI Headline</div>
                    <div className="text-2xl font-black text-zinc-900 dark:text-white">
                      {city.aqi}
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-black uppercase text-white shadow-xs"
                    style={{ backgroundColor: band.displayColor }}
                  >
                    {band.label}
                  </span>
                </div>

                {/* Metrics Table */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">PM2.5 (Fine)</span>
                    <strong className="text-zinc-900 dark:text-zinc-100">{city.pollutants.pm25} µg/m³</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">PM10 (Coarse)</span>
                    <strong className="text-zinc-900 dark:text-zinc-100">{city.pollutants.pm10} µg/m³</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Dominant Gas</span>
                    <strong className="text-zinc-900 dark:text-zinc-100 uppercase">{city.dominantPollutant}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Weather</span>
                    <strong className="text-zinc-900 dark:text-zinc-100">{city.weather.temperature}°C • {city.weather.condition}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Personalized Risk</span>
                    <span className={`px-2 py-0.2 rounded text-[11px] font-bold ${
                      health.riskTier === 'Critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      health.riskTier === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {health.riskTier} ({health.riskScore}/100)
                    </span>
                  </div>
                </div>
              </div>

              {/* Set Active Button */}
              <button
                onClick={() => {
                  setCurrentCity(city);
                  setActiveTab('dashboard');
                }}
                className="w-full py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100 transition-colors"
              >
                Inspect on Dashboard →
              </button>
            </div>
          );
        })}
      </div>

      {/* Comparative Bar Chart: Pollutants Side-by-Side */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            Pollutant Concentration Delta (µg/m³)
          </h2>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.2} />
              <XAxis dataKey="pollutant" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend />
              {selectedCities.map((city, idx) => (
                <Bar
                  key={city.id}
                  dataKey={city.name}
                  fill={cityColors[idx % cityColors.length]}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Analytical Takeaways Disparity Box */}
      {selectedCities.length >= 2 && (
        <div className="bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl p-5 border border-sky-200 dark:border-sky-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h3 className="font-bold text-sm text-sky-950 dark:text-sky-100">
              Comparative Analytical Summary & Health Insights
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-700 dark:text-zinc-300">
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-sky-100 dark:border-sky-900/60">
              <strong className="text-zinc-900 dark:text-zinc-100">Particulate Load Disparity:</strong>{' '}
              {selectedCities[0].name} ({selectedCities[0].pollutants.pm25} µg/m³) is currently{' '}
              <strong className="text-rose-600 dark:text-rose-400">
                {(selectedCities[0].pollutants.pm25 / Math.max(1, selectedCities[1].pollutants.pm25)).toFixed(1)}x
              </strong>{' '}
              the PM2.5 levels of {selectedCities[1].name} ({selectedCities[1].pollutants.pm25} µg/m³).
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-sky-100 dark:border-sky-900/60">
              <strong className="text-zinc-900 dark:text-zinc-100">Dominant Sector Contrast:</strong>{' '}
              In {selectedCities[0].name}, pollution is driven by {selectedCities[0].sourceBreakdown[0]?.category} ({selectedCities[0].sourceBreakdown[0]?.percentage}%), whereas in {selectedCities[1].name} it is governed by {selectedCities[1].sourceBreakdown[0]?.category} ({selectedCities[1].sourceBreakdown[0]?.percentage}%).
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
