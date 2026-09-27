import React from 'react';
import { motion } from 'motion/react';
import { Activity, Radio, Cpu, AlertTriangle, PanelLeftOpen } from 'lucide-react';

interface SystemHealthViewProps {
  onBackToTriage: () => void;
  clusterCount: number;
  criticalCount: number;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const SystemHealthView: React.FC<SystemHealthViewProps> = ({
  onBackToTriage,
  clusterCount,
  criticalCount,
  onToggleSidebar,
  isSidebarCollapsed
}) => {
  const caaqmsStations = [
    { name: 'Shivajinagar CAAQMS (IMD)', aqi: 342, status: 'Active', latency: '24ms', uptime: '99.9%' },
    { name: 'Hadapsar Sub-Station (MPCB)', aqi: 388, status: 'Active', latency: '31ms', uptime: '99.4%' },
    { name: 'Katraj Zoo Regional Station', aqi: 264, status: 'Active', latency: '19ms', uptime: '99.7%' },
    { name: 'Pashan - IITM Sensor Array', aqi: 215, status: 'Active', latency: '15ms', uptime: '100%' },
    { name: 'Swargate Multimodal Terminal', aqi: 318, status: 'Active', latency: '28ms', uptime: '98.9%' },
    { name: 'Lohegaon Airport Weather Station', aqi: 232, status: 'Active', latency: '22ms', uptime: '99.8%' },
  ];

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-[#0C1015] text-slate-900 dark:text-[#F1F5F9] flex flex-col overflow-y-auto p-4 sm:p-6 transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#222E3C]">
        <div className="flex items-center gap-3">
          {isSidebarCollapsed && onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md bg-white dark:bg-[#131922] text-slate-700 dark:text-emerald-400 border border-slate-200 dark:border-[#222E3C] hover:bg-slate-100 dark:hover:bg-[#1A232F] transition-colors cursor-pointer"
              title="Expand Navigation (⌘\ or [)"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9]">
                SAMEER Ingestion &amp; CAAQMS Sensor Health
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#949EA8] font-mono mt-0.5">
              Operational status of CPCB SAMEER citizen ingestion pipeline and Continuous Ambient Air Quality Monitoring Stations in Pune.
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBackToTriage}
          className="px-3 py-1.5 rounded-md bg-white dark:bg-[#131922] hover:bg-slate-100 dark:hover:bg-[#1A232F] border border-slate-200 dark:border-[#222E3C] text-xs font-medium text-slate-700 dark:text-[#F1F5F9] transition-colors shadow-2xs cursor-pointer"
        >
          Return to Live Triage Map
        </motion.button>
      </div>

      {/* Grid of Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.03 }}
          className="p-4 bg-white dark:bg-[#131922] rounded-lg border border-slate-200 dark:border-[#222E3C] space-y-1 shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#949EA8]">
            <span>SAMEER API INGESTION</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">99.85%</div>
          <p className="text-[11px] text-slate-500 dark:text-[#64748B] font-mono">Poll rate: every 15m</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.06 }}
          className="p-4 bg-white dark:bg-[#131922] rounded-lg border border-slate-200 dark:border-[#222E3C] space-y-1 shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#949EA8]">
            <span>ACTIVE HOTSPOTS</span>
            <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-[#F1F5F9]">{clusterCount} Clusters</div>
          <p className="text-[11px] text-slate-500 dark:text-[#64748B] font-mono">PMC Municipal Boundary</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.09 }}
          className="p-4 bg-white dark:bg-[#131922] rounded-lg border border-slate-200 dark:border-[#222E3C] space-y-1 shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#949EA8]">
            <span>CRITICAL SLA AT RISK</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{criticalCount} Hotspots</div>
          <p className="text-[11px] text-slate-500 dark:text-[#64748B] font-mono">&lt; 6 Hours SLA Remaining</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.12 }}
          className="p-4 bg-white dark:bg-[#131922] rounded-lg border border-slate-200 dark:border-[#222E3C] space-y-1 shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#949EA8]">
            <span>DECISION ENGINE</span>
            <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">Operational</div>
          <p className="text-[11px] text-slate-500 dark:text-[#64748B] font-mono">Gemini 2.5 Flash Triage</p>
        </motion.div>
      </div>

      {/* Sensor Station Table */}
      <div className="mt-8 bg-white dark:bg-[#131922] rounded-lg border border-slate-200 dark:border-[#222E3C] overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 dark:border-[#222E3C] flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">Pune Municipal Sensor Array (CAAQMS)</h2>
          <span className="text-xs font-mono text-slate-500 dark:text-[#949EA8]">6 of 6 Online</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-[#0C1015] border-b border-slate-200 dark:border-[#222E3C] text-slate-500 dark:text-[#949EA8]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">STATION NAME</th>
                <th className="py-2.5 px-4 font-semibold">CURRENT AQI</th>
                <th className="py-2.5 px-4 font-semibold">INGESTION STATUS</th>
                <th className="py-2.5 px-4 font-semibold">LATENCY</th>
                <th className="py-2.5 px-4 font-semibold">30D UPTIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222E3C]">
              {caaqmsStations.map(station => (
                <tr key={station.name} className="hover:bg-slate-50/60 dark:hover:bg-[#1A232F]/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-[#F1F5F9]">{station.name}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-amber-600 dark:text-amber-400">{station.aqi}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {station.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-[#949EA8]">{station.latency}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-[#949EA8]">{station.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthView;
