import React from 'react';
import { motion } from 'motion/react';
import {
  Radio,
  FileText,
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
      badge: openCount > 0 ? `${openCount} open` : undefined,
      badgeColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 font-mono'
    },
    {
      id: 'impact_log' as NavTab,
      label: t('nav.impact_log', 'Impact Ledger'),
      icon: TrendingDown,
      badge: resolvedCount > 0 ? `${resolvedCount} done` : undefined,
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 font-mono'
    },
    {
      id: 'audit_logs' as NavTab,
      label: t('nav.audit_logs', 'Directives Log'),
      icon: FileText,
      badge: undefined,
      badgeColor: ''
    },
    {
      id: 'settings' as NavTab,
      label: t('nav.settings', 'Settings'),
      icon: Settings,
      badge: language !== 'en' ? language.toUpperCase() : undefined,
      badgeColor: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/50 font-mono'
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
      <div className="h-full w-full bg-[#FFFDF9] dark:bg-[#1D1916] border-r border-[#EAE2D8] dark:border-[#2D2825] flex flex-col justify-between select-none text-[#1C120A] dark:text-[#FEF3E2] transition-colors duration-200 overflow-hidden">
        {/* Header / Brand */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-[#EAE2D8] dark:border-[#2D2825] flex items-center justify-between bg-[#FFFDF9] dark:bg-[#1D1916] transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-amber-600 dark:bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm tracking-tight text-[#1C120A] dark:text-[#FEF3E2]">AirSense</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded font-medium">
                    B2G
                  </span>
                </div>
                <p className="text-[11px] text-[#9B8472] dark:text-[#B89880] font-mono">CPCB SAMEER Triage</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden md:flex w-8 h-8 items-center justify-center text-[#9B8472] hover:text-[#1C120A] dark:text-[#B89880] dark:hover:text-[#FEF3E2] rounded-md hover:bg-[#F5EDE0] dark:hover:bg-[#252018] transition-colors cursor-pointer"
                  title="Collapse Sidebar (⌘\ or [)"
                  aria-label="Collapse navigation sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onMobileClose}
                className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[#9B8472] hover:text-[#1C120A] dark:hover:text-[#FEF3E2] rounded-md hover:bg-[#F5EDE0] dark:hover:bg-[#252018] transition-colors cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mx-3 mt-3 px-2.5 py-1.5 rounded bg-[#F5EDE0] dark:bg-[#151210] border border-[#EAE2D8] dark:border-[#2D2825] flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#9B8472] dark:text-[#B89880] font-medium">{t('nav.jurisdiction', 'JURISDICTION')}</span>
            <span className="text-amber-700 dark:text-amber-400 font-semibold">{user.ward || 'PMC Pune HQ'}</span>
          </div>

          {/* Navigation Items */}
          <nav className="p-2.5 space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-[#9B8472] dark:text-[#786050] font-semibold px-2.5 pt-2 pb-1 tracking-wider">
              {t('nav.modules', 'Modules')}
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
                      ? 'text-amber-700 dark:text-amber-300 font-semibold'
                      : 'text-[#6E5A47] dark:text-[#B89880] hover:text-[#1C120A] dark:hover:text-[#FEF3E2] hover:bg-[#F5EDE0]/70 dark:hover:bg-[#252018]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute inset-0 bg-amber-50/90 dark:bg-[#261C0A] border border-amber-200/90 dark:border-amber-600/30 rounded-md shadow-2xs pointer-events-none"
                      transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                    />
                  )}
                  <div className="flex items-center gap-2 relative z-10 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-[#9B8472] dark:text-[#786050]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 relative z-10 transition-colors ${
                        isActive ? 'bg-amber-600 text-white font-medium shadow-2xs' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* SLA Status Summary */}
          <div className="px-2.5 pt-1">
            <div className="text-[10px] font-mono uppercase text-[#9B8472] dark:text-[#786050] font-semibold px-2.5 pb-1.5 tracking-wider flex items-center justify-between">
              <span>{t('nav.compliance', '24h SLA Status')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            </div>

            <div className="bg-[#F5EDE0] dark:bg-[#151210] p-2.5 rounded border border-[#EAE2D8] dark:border-[#2D2825] space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#9B8472] dark:text-[#B89880]">{t('nav.sameer_feed', 'SAMEER Feed:')}</span>
                <span className="text-amber-700 dark:text-amber-400 font-semibold">{t('nav.live', 'Live')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#9B8472] dark:text-[#B89880]">{t('nav.sla_risk', 'SLA Risk (<6h):')}</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">{criticalCount} {t('nav.hotspots', 'Hotspots')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#9B8472] dark:text-[#B89880]">{t('nav.citizen_tickets', 'Tickets:')}</span>
                <span className="text-[#1C120A] dark:text-[#FEF3E2] font-medium">{totalComplaints} {t('nav.total', 'total')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Theme Toggle & Officer Stamp */}
        <div className="p-2.5 border-t border-[#EAE2D8] dark:border-[#2D2825] bg-[#F5EDE0]/50 dark:bg-[#151210] space-y-2 shrink-0">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-1 bg-[#EAE2D8]/70 dark:bg-[#151210] rounded-lg text-xs font-mono border border-transparent dark:border-[#2D2825]">
            <button
              type="button"
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`flex-1 py-1 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-[#1C120A] shadow-2xs font-semibold'
                  : 'text-[#9B8472] hover:text-[#6E5A47] dark:text-[#B89880] dark:hover:text-[#FEF3E2]'
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
                  ? 'bg-[#252018] text-[#FEF3E2] shadow-2xs font-semibold'
                  : 'text-[#9B8472] hover:text-[#6E5A47] dark:text-[#B89880] dark:hover:text-[#FEF3E2]'
              }`}
              title="Switch to Dark Mode"
            >
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">{t('nav.dark', 'Dark')}</span>
            </button>
          </div>

          {/* Officer Stamp */}
          <button
            type="button"
            onClick={() => handleItemClick('settings')}
            className={`w-full flex items-center justify-between p-2 rounded border shadow-2xs transition-all cursor-pointer select-none text-left group ${
              activeTab === 'settings'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400/60'
                : 'bg-[#FFFDF9] dark:bg-[#1D1916] border-[#EAE2D8] dark:border-[#2D2825] hover:border-amber-400/40'
            }`}
            title="Open Officer Settings"
          >
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
                user.loggedIn
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
              }`}>
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-[11px] font-semibold text-[#1C120A] dark:text-[#FEF3E2] truncate leading-tight group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  {user.name}
                </p>
                <p className="text-[10px] text-[#9B8472] dark:text-[#B89880] truncate font-mono">
                  {user.loggedIn ? t('nav.officer_title', 'Nodal Officer (Env. Cell)') : 'Session Locked'}
                </p>
              </div>
            </div>
            <span className={`w-2 h-2 rounded-full shrink-0 ${user.loggedIn ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
