import React from 'react';
import { motion } from 'motion/react';
import { AuditActionLog } from '../types';
import { ShieldCheck, Clock, User, ArrowRight, PanelLeftOpen } from 'lucide-react';

interface AuditLogsViewProps {
  logs: AuditActionLog[];
  onBackToTriage: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ 
  logs, 
  onBackToTriage,
  onToggleSidebar,
  isSidebarCollapsed
}) => {
  return (
    <div className="w-full h-full bg-slate-50 dark:bg-[#150F0A] text-slate-900 dark:text-[#F1F5F9] flex flex-col overflow-y-auto p-4 sm:p-6 transition-colors">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#2E2218] bg-transparent">
        <div className="flex items-center gap-3">
          {isSidebarCollapsed && onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md bg-white dark:bg-[#1E1810] text-slate-700 dark:text-emerald-400 border border-slate-200 dark:border-[#2E2218] hover:bg-slate-100 dark:hover:bg-[#261C12] transition-colors cursor-pointer"
              title="Expand Navigation (⌘\ or [)"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9]">
                Enforcement Directives &amp; Statutory Audit Log
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#949EA8] font-mono mt-0.5">
              Immutable chain-of-custody for municipal notices (Air Act 1981 §31A), water tanker deployments, and verified closures.
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBackToTriage}
          className="px-3 py-1.5 rounded-md bg-white dark:bg-[#1E1810] hover:bg-slate-100 dark:hover:bg-[#261C12] border border-slate-200 dark:border-[#2E2218] text-xs font-medium text-slate-700 dark:text-[#F1F5F9] transition-colors shadow-2xs cursor-pointer"
        >
          Return to Live Triage Map
        </motion.button>
      </div>

      {/* Log Table / Cards */}
      <div className="mt-6 space-y-3">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: Math.min(index * 0.035, 0.2), ease: 'easeOut' }}
            whileHover={{ y: -1 }}
            className="p-4 bg-white dark:bg-[#1E1810] rounded-lg border border-slate-200 dark:border-[#2E2218] space-y-2 text-xs shadow-2xs hover:border-slate-300 dark:hover:border-emerald-500/50 hover:shadow-xs transition-all"
          >
            <div className="flex items-center justify-between font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#150F0A] text-slate-700 dark:text-[#949EA8] border border-slate-200 dark:border-[#2E2218] font-bold">
                  {log.id}
                </span>
                <span className="text-slate-900 dark:text-[#F1F5F9] font-semibold">{log.cluster_title}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-[#949EA8]">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748B]" />
                <span>{log.timestamp}</span>
              </div>
            </div>

            <p className="text-slate-800 dark:text-[#F1F5F9] leading-relaxed pl-2.5 border-l-2 border-emerald-600 dark:border-emerald-500 my-2">
              {log.details}
            </p>

            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-[#2E2218] font-mono text-[11px] text-slate-500 dark:text-[#949EA8]">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748B]" />
                <span>Officer: {log.officer_name || log.officer_id}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="uppercase text-[10px] tracking-wider text-slate-400 dark:text-[#64748B]">Action Type:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase">{log.action_type.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AuditLogsView;
