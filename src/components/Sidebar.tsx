import React from 'react';
import { motion } from 'motion/react';
import { 
  Radio, 
  ListOrdered, 
  FileText, 
  Activity, 
  TrendingDown, 
  Shield, 
  UserCheck, 
  X, 
  Sun, 
  Moon, 
  PanelLeftClose,
  Settings
} from 'lucide-react';
import { NavTab } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  criticalCount: number;
  openCount: number;
  totalComplaints: number;
  resolvedCount?: number;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
  onStartTour?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  criticalCount,
  openCount,
  totalComplaints,
  resolvedCount = 0,
  isMobileOpen = false,
  onMobileClose,
  onToggleCollapse,
  onStartTour
}) => {
  const { theme, toggleTheme } = useTheme();
  const { t, user, language } = useSettings();

  const navItems = [
    {
      id: 'triage' as NavTab,
      label: t('nav.triage', 'Hotspot Triage'),
      icon: Radio,
      badge: openCount > 0 ? `${openCount}` : undefined,
      badgeColor: 'bg-slate-100 dark:bg-[#1A232F] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#222E3C] font-mono'
    },
    {
      id: 'queue' as NavTab,
      label: t('nav.queue', 'Priority Queue'),
      icon: ListOrdered,
      badge: criticalCount > 0 ? `${criticalCount} Urg` : undefined,
      badgeColor: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-mono font-medium'
    },
    {
      id: 'impact_log' as NavTab,
      label: t('nav.impact_log', 'Impact Ledger'),
      icon: TrendingDown,
      badge: resolvedCount > 0 ? `${resolvedCount} Actioned` : undefined,
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 font-mono font-medium'
    },
    {
      id: 'audit_logs' as NavTab,
      label: t('nav.audit_logs', 'Audit & Directives'),
      icon: FileText,
      badge: undefined,
      badgeColor: ''
    },
    {
      id: 'system_health' as NavTab,
      label: t('nav.system_health', 'System Telemetry'),
      icon: Activity,
      badge: t('nav.live', 'Live'),
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 font-mono font-medium'
    },
    {
      id: 'settings' as NavTab,
      label: t('nav.settings', 'Settings & Workspace'),
      icon: Settings,
      badge: language !== 'en' ? language.toUpperCase() : undefined,
      badgeColor: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/60 font-mono font-medium'
    }
  ];

  const handleItemClick = (id: NavTab) => {
    onTabChange(id);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Content Container */}
      <div className="h-full w-full bg-white dark:bg-[#131922] border-r border-slate-200 dark:border-[#222E3C] flex flex-col justify-between select-none text-slate-800 dark:text-[#F1F5F9] transition-colors duration-200 overflow-hidden">
        {/* Header / Brand */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-slate-200 dark:border-[#222E3C] flex items-center justify-between bg-white dark:bg-[#131922] transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-emerald-600 dark:bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-[#F1F5F9]">AirSense</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded font-medium">
                    B2G
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono">CPCB SAMEER Triage</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Desktop Collapse Button */}
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden md:flex w-8 h-8 items-center justify-center text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-[#F1F5F9] rounded-md hover:bg-slate-100 dark:hover:bg-[#1A232F] transition-colors cursor-pointer"
                  title="Collapse Sidebar (⌘\ or [)"
                  aria-label="Collapse navigation sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={onMobileClose}
                className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-[#1A232F] transition-colors cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mx-3 mt-3 px-2.5 py-1.5 rounded bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-[#222E3C] flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500 dark:text-[#94A3B8] font-medium">{t('nav.jurisdiction', 'JURISDICTION')}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{user.ward || 'PMC Pune HQ'}</span>
          </div>

          {/* Navigation Items */}
          <nav className="p-2.5 space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-slate-400 dark:text-[#64748B] font-semibold px-2.5 pt-2 pb-1 tracking-wider">
              {t('nav.modules', 'Triage Modules')}
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full min-h-[40px] flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer touch-manipulation relative select-none ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-100/70 dark:hover:bg-[#1A232F]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute inset-0 bg-emerald-50/90 dark:bg-[#1A2726] border border-emerald-200/90 dark:border-[#10B981]/40 rounded-md shadow-2xs pointer-events-none"
                      transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                    />
                  )}
                  <div className="flex items-center gap-2 relative z-10 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-[#64748B]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 relative z-10 transition-colors ${
                        isActive ? 'bg-emerald-600 text-white font-medium shadow-2xs' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Statutory Telemetry Summary */}
          <div className="px-2.5 pt-1">
            <div className="text-[10px] font-mono uppercase text-slate-400 dark:text-[#64748B] font-semibold px-2.5 pb-1.5 tracking-wider flex items-center justify-between">
              <span>{t('nav.compliance', '24h SLA Compliance')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0C1015] p-2.5 rounded border border-slate-200 dark:border-[#222E3C] space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-[#949EA8]">{t('nav.sameer_feed', 'SAMEER Feed:')}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{t('nav.live', 'Live')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-[#949EA8]">{t('nav.sla_risk', 'SLA Risk (<6h):')}</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">{criticalCount} {t('nav.hotspots', 'Hotspots')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-[#949EA8]">{t('nav.citizen_tickets', 'Citizen Tickets:')}</span>
                <span className="text-slate-800 dark:text-[#F1F5F9] font-medium">{totalComplaints} {t('nav.total', 'total')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area: Dark Mode Switcher & Officer Stamp */}
        <div className="p-2.5 border-t border-slate-200 dark:border-[#222E3C] bg-slate-50/70 dark:bg-[#0F141B] space-y-2 shrink-0">
          {/* Theme Mode Toggle (Light / Dark) */}
          <div className="flex items-center justify-between p-1 bg-slate-200/70 dark:bg-[#0C1015] rounded-lg text-xs font-mono border border-transparent dark:border-[#222E3C]">
            <button
              type="button"
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`flex-1 py-1 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-[#949EA8] dark:hover:text-[#F1F5F9]'
              }`}
              title="Switch to Light Mode"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">{t('nav.light', 'Light')}</span>
            </button>
            <button
              type="button"
              onClick={() => theme === 'light' && toggleTheme()}
              className={`flex-1 py-1 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#1E293B] text-[#F1F5F9] shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-[#949EA8] dark:hover:text-[#F1F5F9]'
              }`}
              title="Switch to Dark Mode"
            >
              <Moon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">{t('nav.dark', 'Dark')}</span>
            </button>
          </div>

          {/* Officer Stamp: Click to view Settings & Session */}
          <button
            type="button"
            onClick={() => handleItemClick('settings')}
            className={`w-full flex items-center justify-between p-2 rounded border shadow-2xs transition-all cursor-pointer select-none text-left group ${
              activeTab === 'settings'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/70'
                : 'bg-white dark:bg-[#131922] border-slate-200 dark:border-[#222E3C] hover:border-emerald-500/40'
            }`}
            title="Open Officer Settings & Session Management"
          >
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
                user.loggedIn 
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300'
              }`}>
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-[11px] font-semibold text-slate-900 dark:text-[#F1F5F9] truncate leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-[#949EA8] truncate font-mono">
                  {user.loggedIn ? t('nav.officer_title', 'Nodal Officer (Env. Cell)') : 'Session Locked'}
                </p>
              </div>
            </div>
            <span className={`w-2 h-2 rounded-full shrink-0 ${user.loggedIn ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
