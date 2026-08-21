import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Radio,
  Sliders,
  RefreshCw,
  Trash2,
  Eye,
  Users,
  Database,
  Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminConsole: React.FC = () => {
  const {
    communityReports,
    moderateReport,
    allCities,
    currentCity,
    refreshCityData,
    user,
    setUserRole,
  } = useApp();

  const [simulatedSpikeCityId, setSimulatedSpikeCityId] = useState<string>(currentCity.id);
  const [spikeIntensity, setSpikeIntensity] = useState<number>(150);
  const [spikeApplied, setSpikeApplied] = useState<boolean>(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'verified_by_moderator' | 'rejected'>('all');

  const filteredReports = communityReports.filter((r) => {
    if (selectedStatusFilter === 'all') return true;
    return r.status === selectedStatusFilter;
  });

  const handleApplySensorSpike = () => {
    setSpikeApplied(true);
    setTimeout(() => setSpikeApplied(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h1 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-100">
              AirSense Administrator & Network Moderator Console
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Citizen report verification queue, sensor anomaly injection simulator, and global station network telemetry controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-xs font-black uppercase">
            Active Role: {user.role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Grid: Anomaly Injection & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Anomaly Simulator */}
        <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h2 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                Simulate Ground Sensor Anomaly / Wildfire Spike
              </h2>
            </div>
            <span className="text-[10px] font-bold text-zinc-400">Stress Test Dispatch Engine</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Target Sensor Cluster:
              </label>
              <select
                value={simulatedSpikeCityId}
                onChange={(e) => setSimulatedSpikeCityId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium"
              >
                {allCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.country}) — Current AQI {c.aqi}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Simulated PM2.5 Influx (+{spikeIntensity} µg/m³):
              </label>
              <input
                type="range"
                min={50}
                max={350}
                step={25}
                value={spikeIntensity}
                onChange={(e) => setSpikeIntensity(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-rose-600 mt-2"
              />
            </div>
          </div>

          {spikeApplied && (
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Simulated wildfire particulate influx injected (+{spikeIntensity} µg/m³). Dispatch webhooks and early warning push fired!</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleApplySensorSpike}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Broadcast Sensor Spike Test</span>
            </button>
          </div>
        </div>

        {/* Network Health Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                Network Health Matrix
              </h3>
            </div>
            <div className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="flex justify-between">
                <span>Active City Nodes:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{allCities.length} Global Hubs</strong>
              </div>
              <div className="flex justify-between">
                <span>Ingestion Latency:</span>
                <strong className="text-emerald-600 font-bold">142 ms (Healthy)</strong>
              </div>
              <div className="flex justify-between">
                <span>Citizen Reports Pending:</span>
                <strong className="text-amber-500 font-bold">
                  {communityReports.filter((r) => r.status === 'active').length} to review
                </strong>
              </div>
            </div>
          </div>

          <button
            onClick={refreshCityData}
            className="w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Flush Global Cache</span>
          </button>
        </div>

      </div>

      {/* Citizen Science Moderation Queue */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h2 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              Citizen Science Field Reports Moderation Queue
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Filter Status:</span>
            {(['all', 'active', 'verified_by_moderator', 'rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-colors ${
                  selectedStatusFilter === st
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Moderation Items Table / Cards */}
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                    {report.cityName}
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-zinc-500 font-medium">By {report.userName} ({report.userRole})</span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-zinc-400">{report.timestamp}</span>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    report.status === 'verified_by_moderator'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : report.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {report.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="font-bold text-zinc-800 dark:text-zinc-200">
                  {report.reportedCondition} — Severity: <span className="text-rose-600">{report.perceivedAQISeverity}</span>
                </div>

                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                  "{report.description}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => moderateReport(report.id, 'verified_by_moderator')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify & Publish</span>
                </button>

                <button
                  onClick={() => moderateReport(report.id, 'rejected')}
                  className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
