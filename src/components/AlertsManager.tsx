import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  ShieldAlert,
  Smartphone,
  Mail,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Volume2,
  Clock,
  Flame,
  Wind,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAQIBandInfo } from '../utils/aqiCalculations';

export const AlertsManager: React.FC = () => {
  const {
    user,
    updateAlertThreshold,
    currentCity,
    allCities,
    colorblindMode,
    alertNotification,
    dismissNotification,
  } = useApp();

  const [threshold, setThreshold] = useState<number>(user.alertThreshold || 150);
  const [enabled, setEnabled] = useState<boolean>(user.alertsEnabled ?? true);
  const [pushEnabled, setPushEnabled] = useState<boolean>(user.pushAlerts ?? true);
  const [emailEnabled, setEmailEnabled] = useState<boolean>(user.emailAlerts ?? true);
  const [smsNumber, setSmsNumber] = useState<string>('+1 (555) 234-8901');
  const [webhookUrl, setWebhookUrl] = useState<string>('https://homeassistant.local/api/webhook/air_purifier_boost');
  const [testSent, setTestSent] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Selected cities for notification
  const [monitoredCityIds, setMonitoredCityIds] = useState<string[]>([currentCity.id, 'delhi', 'beijing']);

  const bandInfo = getAQIBandInfo(threshold, colorblindMode);

  const mockRecentAlerts = [
    {
      id: 'alt-1',
      city: 'Delhi, India',
      aqi: 384,
      pollutant: 'PM2.5 (335 µg/m³)',
      time: '18 minutes ago',
      level: 'Hazardous',
      message: 'Temperature inversion trapped agricultural stubble smoke. N95 respirator mandatory.',
      channel: 'Push + SMS',
    },
    {
      id: 'alt-2',
      city: 'Lahore, Pakistan',
      aqi: 412,
      pollutant: 'PM2.5 (390 µg/m³)',
      time: '1 hour ago',
      level: 'Hazardous',
      message: 'Industrial kiln emissions and thermal stagnation. Close windows and engage HEPA mode.',
      channel: 'Push',
    },
    {
      id: 'alt-3',
      city: 'New York, USA',
      aqi: 154,
      pollutant: 'Ozone (O3 76 ppb)',
      time: '6 hours ago',
      level: 'Unhealthy',
      message: 'Afternoon photochemical smog peak. Vulnerable individuals advised to move cardio indoors.',
      channel: 'Email Digest',
    },
  ];

  const handleSavePreferences = () => {
    updateAlertThreshold(threshold, enabled);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSendTestAlert = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  const toggleCityMonitor = (id: string) => {
    if (monitoredCityIds.includes(id)) {
      if (monitoredCityIds.length > 1) {
        setMonitoredCityIds(monitoredCityIds.filter((c) => c !== id));
      }
    } else {
      setMonitoredCityIds([...monitoredCityIds, id]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-rose-500 animate-pulse" />
            <h1 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-100">
              Real-Time AQI Alerts & Early Warning Notification Engine
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure precision threshold triggers, multi-channel dispatch (Push, SMS, Email, Home Assistant Webhooks), and health emergency advisories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSendTestAlert}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-2 transition-all"
            id="test-alert-btn"
          >
            <Send className="w-3.5 h-3.5 text-sky-500" />
            <span>{testSent ? 'Simulating Broadcast...' : 'Test Emergency Dispatch'}</span>
          </button>

          <button
            onClick={handleSavePreferences}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            id="save-alert-settings-btn"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Test Alert Banner Feedback */}
      {testSent && (
        <div className="p-4 rounded-2xl bg-rose-500 text-white flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm uppercase tracking-wide">
                Simulated Emergency Broadcast: High PM2.5 Alert
              </div>
              <div className="text-xs text-rose-100">
                Air quality in {currentCity.name} has crossed your threshold of AQI {threshold} (Current: {currentCity.aqi}). Sealed ventilation recommended.
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-white/20 text-xs font-bold uppercase">
            Dispatched via Webhook & Push
          </span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Alert threshold and dispatch preferences saved successfully to cloud user profile.</span>
        </div>
      )}

      {/* Main Grid: Threshold Settings & Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Threshold Slider & Trigger Conditions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Threshold Tuning Box */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h2 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  AQI Threshold Trigger Level
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Alerts:</span>
                <button
                  onClick={() => setEnabled(!enabled)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    enabled
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {enabled ? 'Active' : 'Muted'}
                </button>
              </div>
            </div>

            {/* Visual Trigger Card */}
            <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${bandInfo.bgColor} ${bandInfo.textColor} ${bandInfo.borderColor}`}>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider opacity-80">
                  Trigger Band: {bandInfo.label}
                </div>
                <div className="text-2xl font-black">
                  Trigger at AQI &gt; {threshold}
                </div>
                <div className="text-xs font-medium mt-1 max-w-md">
                  {bandInfo.actionSummary}
                </div>
              </div>
              <div className="text-3xl font-black opacity-30">
                {threshold}
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min={30}
                max={400}
                step={5}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                <span>30 (Strict / Clean)</span>
                <span>100 (Moderate)</span>
                <span>150 (Unhealthy Sensitive)</span>
                <span>200 (Severe)</span>
                <span>300+ (Hazardous)</span>
              </div>
            </div>

            {/* Health-condition specific preset quick selectors */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Recommended Medical Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Asthma / COPD', val: 75, desc: 'Trigger early at AQI 75' },
                  { label: 'Cardio / Seniors', val: 100, desc: 'Trigger at AQI 100' },
                  { label: 'Athletes & Outdoor', val: 120, desc: 'Trigger at AQI 120' },
                  { label: 'General Public', val: 150, desc: 'EPA standard 150' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setThreshold(preset.val)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      threshold === preset.val
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-900 dark:text-sky-200 font-bold shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="font-extrabold text-zinc-900 dark:text-zinc-100">{preset.label}</div>
                    <div className="text-[10px] text-zinc-500">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Monitored Geographical Regions */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h2 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Monitored Sensor Clusters & Cities ({monitoredCityIds.length})
                </h2>
              </div>
              <span className="text-[11px] text-zinc-400">Select cities to track simultaneously</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {allCities.map((city) => {
                const isSelected = monitoredCityIds.includes(city.id);
                return (
                  <button
                    key={city.id}
                    onClick={() => toggleCityMonitor(city.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-400 text-sky-900 dark:text-sky-200 font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 opacity-60'
                    }`}
                  >
                    <div className="truncate">
                      <div className="text-zinc-900 dark:text-zinc-100 font-extrabold">{city.name}</div>
                      <div className="text-[10px] text-zinc-500">{city.country} • AQI {city.aqi}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Dispatch Channels & Recent Alerts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dispatch Channels Box */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h2 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                Dispatch Channels & Integrations
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              {/* Push Notifications */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">Browser & Mobile Push</div>
                    <div className="text-[10px] text-zinc-500">Immediate critical popup alerts</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="w-4 h-4 accent-sky-600 cursor-pointer"
                />
              </div>

              {/* Email Alerts */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">Daily Morning Brief & Email Warnings</div>
                      <div className="text-[10px] text-zinc-500">7:00 AM AQI forecast & air advisories</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="w-4 h-4 accent-sky-600 cursor-pointer"
                  />
                </div>
                <input
                  type="email"
                  defaultValue={user.email}
                  className="w-full p-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                  placeholder="name@example.com"
                />
              </div>

              {/* Smart Home Webhook */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 space-y-2">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">Smart Home Automation Webhook</div>
                    <div className="text-[10px] text-zinc-500">Trigger Home Assistant / Tuya HEPA Boost</div>
                  </div>
                </div>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full p-2 text-[11px] font-mono rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Recent Triggered Alerts Log */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                <h2 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Recent Station Alerts Log
                </h2>
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-600">Live Feed</span>
            </div>

            <div className="space-y-3">
              {mockRecentAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-700/70 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                      {alt.city}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      AQI {alt.aqi} • {alt.level}
                    </span>
                  </div>

                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    {alt.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                    <span>Dominant: {alt.pollutant}</span>
                    <span>{alt.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
