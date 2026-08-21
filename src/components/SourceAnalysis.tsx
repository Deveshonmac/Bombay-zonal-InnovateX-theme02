import React, { useState } from 'react';
import {
  Flame,
  Truck,
  Factory,
  Wheat,
  Wind,
  Trash2,
  TrendingUp,
  Sparkles,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { getAQIBandInfo } from '../utils/aqiCalculations';
import { SourceContribution } from '../types';

export const SourceAnalysis: React.FC = () => {
  const { currentCity, colorblindMode, setActiveTab } = useApp();

  const [vehicularReduction, setVehicularReduction] = useState<number>(0);
  const [biomassReduction, setBiomassReduction] = useState<number>(0);
  const [industrialReduction, setIndustrialReduction] = useState<number>(0);

  const currentBand = getAQIBandInfo(currentCity.aqi, colorblindMode);

  // Sector colors
  const sectorColors = ['#f59e0b', '#ef4444', '#0284c7', '#8b5cf6', '#10b981', '#64748b'];

  const pieData = currentCity.sourceBreakdown.map((s, idx) => ({
    name: s.category,
    value: s.percentage,
    color: sectorColors[idx % sectorColors.length],
    description: s.description,
    primaryPollutants: s.primaryPollutants,
  }));

  // Calculate simulated AQI based on reduction policy sliders
  const vehicularWeight = (currentCity.sourceBreakdown.find((s) => s.category === 'Vehicular')?.percentage || 25) / 100;
  const biomassWeight = (currentCity.sourceBreakdown.find((s) => s.category === 'Biomass & Crop Burning')?.percentage || 0) / 100;
  const industrialWeight = (currentCity.sourceBreakdown.find((s) => s.category === 'Industrial')?.percentage || 20) / 100;

  const totalReductionFraction =
    (vehicularReduction / 100) * vehicularWeight +
    (biomassReduction / 100) * biomassWeight +
    (industrialReduction / 100) * industrialWeight;

  const simulatedInterventionAQI = Math.max(15, Math.round(currentCity.aqi * (1 - totalReductionFraction)));
  const simulatedBand = getAQIBandInfo(simulatedInterventionAQI, colorblindMode);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h1 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-100">
              Pollution Source & Contribution Diagnostics
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Apportionment analysis for {currentCity.name}, breaking down industrial, vehicular, biomass, and atmospheric secondary aerosols.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Current Station AQI:</span>
          <span
            className="px-3 py-1 rounded-xl text-white text-xs font-black shadow-xs"
            style={{ backgroundColor: currentBand.displayColor }}
          >
            {currentCity.aqi} AQI • {currentBand.shortLabel}
          </span>
        </div>
      </div>

      {/* Main Charts & Apportionment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Sector Apportionment Donut */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Sector Apportionment Ratio (%)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Derived from regional chemical transport modeling and aerosol mass spectrometry.
            </p>

            <div className="h-64 w-full my-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value}% Contribution`, 'Share']}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">{item.name}</span>
                </div>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (7 Cols): Sector Details & AI Diagnostic Narrative */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI Diagnostic Narrative Card */}
          <div className="bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl p-5 border border-sky-200 dark:border-sky-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h3 className="font-bold text-sm text-sky-950 dark:text-sky-100">
                Atmospheric Diagnostic Briefing for {currentCity.name}
              </h3>
            </div>

            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Surface winds in {currentCity.name} are currently blowing from the{' '}
              <strong>{currentCity.weather.windDirection} at {currentCity.weather.windSpeed} km/h</strong>. Under{' '}
              <strong>{currentCity.inversionRisk} inversion trapping</strong>, particulates emitted from{' '}
              <strong>{currentCity.sourceBreakdown[0]?.category} ({currentCity.sourceBreakdown[0]?.percentage}%)</strong> cannot escape the 150-meter planetary boundary layer.
            </p>

            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-sky-100 dark:border-sky-900/60 text-xs space-y-1">
              <div className="font-bold text-zinc-900 dark:text-zinc-100">Primary Chemical Fingerprint:</div>
              <p className="text-zinc-600 dark:text-zinc-400">
                High ratio of {currentCity.sourceBreakdown[0]?.primaryPollutants.join(', ')} confirms dominant contribution from combustion origins rather than pure geological dust.
              </p>
            </div>
          </div>

          {/* Sector Breakdown Detail Cards */}
          <div className="space-y-3">
            {currentCity.sourceBreakdown.map((source, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sectorColors[idx % sectorColors.length] }}
                    />
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      {source.category}
                    </h4>
                  </div>
                  <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                    {source.percentage}% Total Share
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {source.description}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1">
                  <span>Target Pollutants:</span>
                  {source.primaryPollutants.map((p, pIdx) => (
                    <span
                      key={pIdx}
                      className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px] text-zinc-700 dark:text-zinc-300"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Policy Intervention Simulator */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Policy & Clean Air Action Simulator
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Simulate the direct impact of urban vehicle electrification, stubble enforcement, and industrial scrubbers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Vehicular Slider */}
          <div className="space-y-2 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <div className="flex justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <span>EV & Transit Transition</span>
              <span className="text-sky-600 dark:text-sky-400">{vehicularReduction}% Cut</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={vehicularReduction}
              onChange={(e) => setVehicularReduction(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-sky-600 bg-zinc-200 dark:bg-zinc-700"
            />
            <p className="text-[10px] text-zinc-400">
              Simulates zero-emission commercial deliveries & CNG/EV buses.
            </p>
          </div>

          {/* Stubble / Biomass Slider */}
          <div className="space-y-2 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <div className="flex justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <span>Crop Stubble Mulching</span>
              <span className="text-amber-600 dark:text-amber-400">{biomassReduction}% Cut</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={biomassReduction}
              onChange={(e) => setBiomassReduction(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-600 bg-zinc-200 dark:bg-zinc-700"
            />
            <p className="text-[10px] text-zinc-400">
              Subsidized Happy Seeder in-situ residue management machines.
            </p>
          </div>

          {/* Industrial Slider */}
          <div className="space-y-2 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <div className="flex justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <span>Industrial Scrubbers & Kiln Upgrades</span>
              <span className="text-purple-600 dark:text-purple-400">{industrialReduction}% Cut</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={industrialReduction}
              onChange={(e) => setIndustrialReduction(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-purple-600 bg-zinc-200 dark:bg-zinc-700"
            />
            <p className="text-[10px] text-zinc-400">
              Zig-zag technology & continuous emission monitoring (CEMS).
            </p>
          </div>
        </div>

        {/* Projected Outcome Banner */}
        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
              Projected Policy Clean Air Outcome:
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              If targeted interventions are achieved, ambient AQI drops from <strong>{currentCity.aqi}</strong> to{' '}
              <strong className="text-base font-black">{simulatedInterventionAQI} AQI</strong> ({simulatedBand.label}).
            </p>
          </div>

          <div
            className="px-4 py-2 rounded-xl text-white font-extrabold text-sm shadow-xs shrink-0"
            style={{ backgroundColor: simulatedBand.displayColor }}
          >
            New AQI: {simulatedInterventionAQI}
          </div>
        </div>

      </div>

    </div>
  );
};
