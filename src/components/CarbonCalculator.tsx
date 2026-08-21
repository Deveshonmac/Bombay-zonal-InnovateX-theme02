import React, { useState } from 'react';
import {
  Leaf,
  Car,
  Home,
  Utensils,
  Plane,
  TreeDeciduous,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
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

export const CarbonCalculator: React.FC = () => {
  // Input State
  const [commuteKm, setCommuteKm] = useState<number>(20);
  const [vehicleType, setVehicleType] = useState<'petrol' | 'diesel' | 'ev' | 'motorbike' | 'transit' | 'cycle'>('petrol');
  const [electricityKWh, setElectricityKWh] = useState<number>(250);
  const [acHours, setAcHours] = useState<number>(6);
  const [dietType, setDietType] = useState<'heavy-meat' | 'omnivore' | 'pescatarian' | 'vegetarian' | 'vegan'>('omnivore');
  const [shortFlights, setShortFlights] = useState<number>(2);
  const [longFlights, setLongFlights] = useState<number>(1);

  // Carbon Emission Factors (kg CO2e per unit per year)
  // Transport factors (kg CO2e per km * 300 commute days)
  const transportFactors = {
    petrol: 0.192,
    diesel: 0.171,
    ev: 0.053,
    motorbike: 0.103,
    transit: 0.041,
    cycle: 0.0,
  };

  const transportKg = commuteKm * 300 * transportFactors[vehicleType];

  // Energy factors
  // Grid electricity: ~0.82 kg CO2 / kWh * 12 months + AC usage penalty
  const electricityKg = electricityKWh * 12 * 0.75 + acHours * 365 * 0.45;

  // Diet factors (kg CO2e / year)
  const dietFactors = {
    'heavy-meat': 3300,
    omnivore: 2500,
    pescatarian: 1900,
    vegetarian: 1500,
    vegan: 1000,
  };
  const dietKg = dietFactors[dietType];

  // Flight factors (kg CO2e / flight)
  const flightKg = shortFlights * 350 + longFlights * 1600;

  const totalKg = transportKg + electricityKg + dietKg + flightKg;
  const totalTons = (totalKg / 1000).toFixed(2);

  // Mature tree absorbs ~22 kg CO2 / year
  const treesNeeded = Math.ceil(totalKg / 22);

  // Donut chart data
  const chartData = [
    { name: 'Commute & Transport', value: Math.round(transportKg), color: '#0284c7' },
    { name: 'Household Power & AC', value: Math.round(electricityKg), color: '#f59e0b' },
    { name: 'Dietary Intake', value: Math.round(dietKg), color: '#10b981' },
    { name: 'Aviation & Flights', value: Math.round(flightKg), color: '#8b5cf6' },
  ];

  // Benchmark comparisons
  const benchmarkData = [
    { name: 'Your Footprint', tons: parseFloat(totalTons), fill: '#0284c7' },
    { name: 'India Avg', tons: 1.9, fill: '#64748b' },
    { name: 'Global Target (Paris)', tons: 2.3, fill: '#10b981' },
    { name: 'World Avg', tons: 4.8, fill: '#64748b' },
    { name: 'US Avg', tons: 14.6, fill: '#ef4444' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-100">
              Personal Carbon & Particulate Footprint Calculator
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Measure individual greenhouse emissions, understand secondary smog generation, and unlock actionable carbon reductions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Annual Carbon Output</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {totalTons} <span className="text-xs font-normal text-zinc-500">Tons CO₂e</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calculator Inputs & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (6 Cols): Input Controls */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Transport Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm">
              <Car className="w-4 h-4" />
              <span>1. Commute & Daily Transport</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Round-Trip Daily Commute</span>
                  <span className="font-bold text-sky-600">{commuteKm} km / day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={commuteKm}
                  onChange={(e) => setCommuteKm(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-sky-600 bg-zinc-200 dark:bg-zinc-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Primary Mode of Transit:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'petrol', label: 'Petrol Car' },
                    { id: 'diesel', label: 'Diesel SUV' },
                    { id: 'ev', label: 'Electric EV' },
                    { id: 'motorbike', label: 'Motorbike' },
                    { id: 'transit', label: 'Bus / Metro' },
                    { id: 'cycle', label: 'Bicycle / Walk' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setVehicleType(item.id as any)}
                      className={`py-2 px-1 rounded-xl text-center font-bold border transition-all ${
                        vehicleType === item.id
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Household Energy Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <Home className="w-4 h-4" />
              <span>2. Home Energy & Cooling</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Monthly Electricity Consumption</span>
                  <span className="font-bold text-amber-600">{electricityKWh} kWh / mo</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={electricityKWh}
                  onChange={(e) => setElectricityKWh(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-600 bg-zinc-200 dark:bg-zinc-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Air Conditioning Operating Hours</span>
                  <span className="font-bold text-amber-600">{acHours} hrs / day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={acHours}
                  onChange={(e) => setAcHours(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-600 bg-zinc-200 dark:bg-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Diet & Aviation Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Utensils className="w-4 h-4" />
              <span>3. Diet & Aviation Flights</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Dietary Archetype:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'heavy-meat', label: 'Heavy Meat' },
                    { id: 'omnivore', label: 'Omnivore' },
                    { id: 'pescatarian', label: 'Pescatarian' },
                    { id: 'vegetarian', label: 'Vegetarian' },
                    { id: 'vegan', label: '100% Vegan' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDietType(item.id as any)}
                      className={`py-2 px-1 rounded-xl text-center font-bold border transition-all ${
                        dietType === item.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Short Flights (&lt;3 hrs) / yr
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={shortFlights}
                    onChange={(e) => setShortFlights(Math.max(0, Number(e.target.value)))}
                    className="w-full p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Long Flights (&gt;6 hrs) / yr
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={longFlights}
                    onChange={(e) => setLongFlights(Math.max(0, Number(e.target.value)))}
                    className="w-full p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (6 Cols): Visual Breakdown & Offset Solutions */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Carbon Breakdown Donut */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Annual Emission Apportionment Breakdown
            </h2>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} kg CO₂e`, 'Emission']}
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

            <div className="grid grid-cols-2 gap-2 text-xs">
              {chartData.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
                  <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <div className="font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                    {item.value} kg ({((item.value / totalKg) * 100).toFixed(0)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tree Offset Card */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex items-center gap-2">
              <TreeDeciduous className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                Ecological Absorption Equivalence
              </h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                  {treesNeeded} Mature Trees
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-0.5">
                  Growing for 1 full year to sequester your {totalTons} tons of annual carbon load.
                </p>
              </div>
            </div>
          </div>

          {/* Global Benchmark Bar Chart */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Comparison to Global Averages (Tons CO₂e/year)
            </h3>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkData} layout="vertical" margin={{ top: 5, right: 20, left: 35, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.2} />
                  <XAxis type="number" stroke="#71717a" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={10} />
                  <Tooltip
                    formatter={(val: any) => [`${val} Tons CO₂e/yr`, 'Carbon']}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="tons" radius={[0, 4, 4, 0]}>
                    {benchmarkData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
