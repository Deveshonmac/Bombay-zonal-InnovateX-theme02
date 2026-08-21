import React, { useState } from 'react';
import {
  Sliders,
  ShieldAlert,
  Shield,
  Heart,
  Baby,
  Activity,
  Wind,
  Home,
  AlertTriangle,
  HeartPulse,
  Sparkles,
  Flame,
  CloudRain,
  Sun,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAQIBandInfo, calculateSmartRecommendations } from '../utils/aqiCalculations';
import { UserHealthProfile } from '../types';

export const Simulator: React.FC = () => {
  const { currentCity, colorblindMode, user, updateHealthProfile } = useApp();

  const [simulatedAQI, setSimulatedAQI] = useState<number>(currentCity.aqi);
  const [profile, setProfile] = useState<UserHealthProfile>(user.healthProfile);

  const bandInfo = getAQIBandInfo(simulatedAQI, colorblindMode);
  const healthRecs = calculateSmartRecommendations(simulatedAQI, profile);

  const scenarios = [
    {
      name: 'Clean Ocean Breeze',
      aqi: 22,
      icon: Sun,
      desc: 'Typical pristine Nordic or Pacific coastal air flow with optimal dispersion.',
    },
    {
      name: 'Post-Rain Air Cleansing',
      aqi: 48,
      icon: CloudRain,
      desc: 'Ambient PM2.5 temporarily washed out by convective thunderstorms.',
    },
    {
      name: 'Summertime Ozone Spike',
      aqi: 125,
      icon: Flame,
      desc: 'Hot stagnant afternoon where UV rays react with NOx to form ground-level ozone.',
    },
    {
      name: 'Winter Temperature Inversion',
      aqi: 285,
      icon: Wind,
      desc: 'Cold surface air trapped under warm lid, locking in vehicular and diesel soot.',
    },
    {
      name: 'Crop Stubble Fire Emergency',
      aqi: 360,
      icon: AlertTriangle,
      desc: 'Intense seasonal agricultural biomass burning blown directly into urban centers.',
    },
  ];

  const handleProfileChange = (key: keyof UserHealthProfile, value: any) => {
    const updated = { ...profile, [key]: value };
    setProfile(updated);
    updateHealthProfile({ [key]: value });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h1 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-100">
              AQI Scenario & Smart Health Recommendation Simulator
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Test physiological impact across simulated pollution levels and customize your personalized vulnerability profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimulatedAQI(currentCity.aqi)}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors"
          >
            Reset to Current City ({currentCity.aqi})
          </button>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): AQI Controls & Profile Customizer */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AQI Interactive Slider Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Adjust Air Quality Index (AQI)
              </span>
              <span
                className="px-3 py-1 rounded-xl text-white text-base font-black shadow-xs"
                style={{ backgroundColor: bandInfo.displayColor }}
              >
                {simulatedAQI} AQI • {bandInfo.shortLabel}
              </span>
            </div>

            {/* Slider Control */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="500"
                step="1"
                value={simulatedAQI}
                onChange={(e) => setSimulatedAQI(Number(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-sky-600 bg-zinc-200 dark:bg-zinc-700"
                id="simulated-aqi-slider"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-bold uppercase">
                <span>0 (Pristine)</span>
                <span>100 (Mod)</span>
                <span>200 (Unhealthy)</span>
                <span>300 (Very Unh)</span>
                <span>500 (Hazardous)</span>
              </div>
            </div>

            {/* Predefined Scenarios Quick Buttons */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Quick Scenario Presets:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {scenarios.map((scen, idx) => {
                  const Icon = scen.icon;
                  const isSelected = simulatedAQI === scen.aqi;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSimulatedAQI(scen.aqi)}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-sky-600' : 'text-zinc-500'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {scen.name}
                          </span>
                          <span className="text-[10px] font-black text-sky-600 dark:text-sky-400">
                            AQI {scen.aqi}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                          {scen.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User Health Profile Customizer Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Personal Health & Vulnerability Profile
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Smart algorithms calibrate respiratory risk based on published EPA & WHO vulnerable subpopulation guidelines.
            </p>

            {/* Age Group Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Age Demographic:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['child', 'adult', 'senior'] as UserHealthProfile['ageGroup'][]).map((age) => (
                  <button
                    key={age}
                    onClick={() => handleProfileChange('ageGroup', age)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                      profile.ageGroup === age
                        ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {age === 'child' ? 'Child (<12)' : age === 'adult' ? 'Adult (18-64)' : 'Senior (65+)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Health Toggles */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Health & Activity Factors:
              </label>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 cursor-pointer">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
                    <HeartPulse className="w-4 h-4 text-rose-500" />
                    <span>Asthma / COPD / Respiratory Condition</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.hasAsthmaOrCOPD}
                    onChange={(e) => handleProfileChange('hasAsthmaOrCOPD', e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 accent-sky-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 cursor-pointer">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Cardiovascular / Heart Disease</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.hasCardiovascular}
                    onChange={(e) => handleProfileChange('hasCardiovascular', e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 accent-sky-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 cursor-pointer">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
                    <Baby className="w-4 h-4 text-amber-500" />
                    <span>Pregnant or Children in Household</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.isPregnant || profile.hasChildrenInHousehold}
                    onChange={(e) => {
                      handleProfileChange('isPregnant', e.target.checked);
                      handleProfileChange('hasChildrenInHousehold', e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-sky-600 accent-sky-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 cursor-pointer">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>High Outdoor Exertion (Athlete / Worker)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.isAthlete || profile.isOutdoorWorker}
                    onChange={(e) => {
                      handleProfileChange('isAthlete', e.target.checked);
                      handleProfileChange('isOutdoorWorker', e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-sky-600 accent-sky-600"
                  />
                </label>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column (7 Cols): Dynamic Recommendations Output Engine */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Risk Tier Output Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  Calculated Risk Tier
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                  {healthRecs.riskTitle}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">Vulnerability Score</div>
                  <div className="text-xl font-black text-zinc-900 dark:text-white">{healthRecs.riskScore}/100</div>
                </div>
                <div
                  className="px-3.5 py-1.5 rounded-xl text-white text-xs font-black uppercase shadow-xs"
                  style={{ backgroundColor: bandInfo.displayColor }}
                >
                  {healthRecs.riskTier}
                </div>
              </div>
            </div>

            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60">
              {healthRecs.headlineSummary}
            </p>

            {/* Actionable Core Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Mask Pillar */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase">
                    Mask Requirement
                  </span>
                </div>
                <div className="font-extrabold text-sm text-sky-700 dark:text-sky-300">
                  {healthRecs.maskRecommendation}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {simulatedAQI > 150
                    ? 'Sub-micron PM2.5 easily bypasses surgical masks. Electrostatic meltblown N95 respirator required for tight seal.'
                    : 'Low particulate burden; standard breathing safe outdoors.'}
                </p>
              </div>

              {/* Window Ventilation Pillar */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase">
                    Window & Room Sealing
                  </span>
                </div>
                <div className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">
                  {healthRecs.windowVentilationAdvice}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Natural air exchange rate should be restricted during high outdoor particulate density.
                </p>
              </div>

              {/* Exercise Pillar */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase">
                    Outdoor Workout Advisory
                  </span>
                </div>
                <div className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">
                  {healthRecs.outdoorExerciseAdvice}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Minute ventilation volume increases 5-fold during running, increasing lung particle deposit.
                </p>
              </div>

              {/* HEPA Purifier Pillar */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase">
                    Indoor Purifier Mode
                  </span>
                </div>
                <div className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">
                  {healthRecs.indoorPurifierAdvice}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Ensure air changes per hour (ACH &gt; 4) to maintain pristine indoor clean-air sanctuary.
                </p>
              </div>

            </div>

            {/* Actionable Precautions Checklist */}
            <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Actionable Precautions Checklist
              </h3>
              <div className="space-y-2">
                {healthRecs.precautions.map((prec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex items-start gap-3"
                  >
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${prec.urgent ? 'text-rose-500' : 'text-sky-500'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {prec.title}
                        </span>
                        {prec.urgent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                        {prec.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
