import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, Languages, Moon, Sun, Type, LogOut, UserCheck, Check,
  Lock, KeyRound, PanelLeftOpen, AlertTriangle, RotateCcw,
  ShieldAlert, Sliders, Compass, Play, Database, MapPin, Clock, Wind,
} from 'lucide-react';
import { useSettings, AppLanguage, FontSizeScale, WardScope, PriorityWeights, CPCB_BASELINE_WEIGHTS } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

interface SettingsViewProps {
  onBackToTriage: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onStartTour?: () => void;
}

const WARD_OPTIONS: { value: WardScope; label: string; sub: string }[] = [
  { value: 'all',    label: 'All Wards (Central HQ)',    sub: 'Pune Municipal HQ — full 15-ward triage scope' },
  { value: 'ward14', label: 'Ward 14: Hadapsar-Mundhwa', sub: 'Industrial corridor — high complaint density' },
  { value: 'ward8',  label: 'Ward 8: Shivajinagar',      sub: 'Urban core — commercial & residential mix' },
];

const WEIGHT_META: { key: keyof PriorityWeights; label: string; sub: string; color: string; colorDark: string }[] = [
  { key: 'complaintVolume', label: 'Citizen Complaint Volume',   sub: 'Total 311 / SAMEER portal tickets',    color: '#2563eb', colorDark: '#60a5fa' },
  { key: 'hazardSeverity',  label: 'Source Hazard Severity',    sub: 'Industrial category & pollutant type', color: '#d97706', colorDark: '#fbbf24' },
  { key: 'slaElapsed',      label: 'Statutory SLA Elapsed',     sub: 'Fraction of 24h mandate consumed',     color: '#dc2626', colorDark: '#f87171' },
  { key: 'aqiDelta',        label: 'Ambient AQI Delta',         sub: 'Change vs baseline CAAQMS reading',    color: '#059669', colorDark: '#34d399' },
];

/* Custom slider sub-component */
const WeightSlider: React.FC<{
  label: string;
  sub: string;
  value: number;
  color: string;
  colorDark: string;
  isDark: boolean;
  textPri: string;
  textSec: string;
  onChange: (v: number) => void;
}> = ({ label, sub, value, color, colorDark, isDark, textPri, textSec, onChange }) => {
  const activeColor = isDark ? colorDark : color;
  const pct = value; // 0-100
  const trackBg = isDark
    ? `linear-gradient(to right, ${activeColor} ${pct}%, #1E2D3D ${pct}%)`
    : `linear-gradient(to right, ${activeColor} ${pct}%, #E2E8F0 ${pct}%)`;
  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <span className={`text-xs font-semibold tracking-tight ${textPri}`}>{label}</span>
          <span className={`ml-2 text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</span>
        </div>
        <span
          className="text-[11px] font-bold font-mono px-2 py-0.5 rounded ml-3 shrink-0"
          style={{ color: activeColor }}
        >
          {value}%
        </span>
      </div>
      {/* Slider wrapper */}
      <div className="relative pt-1 pb-3">
        <input
          type="range"
          min={0} max={100} step={5}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="weight-slider w-full"
          style={{
            color: activeColor,                  /* drives thumb border via currentColor in CSS */
            background: trackBg,                 /* colored fill */
            ['--slider-color' as string]: activeColor,
          }}
        />
        {/* Tick marks at 0, 25, 50, 75, 100 */}
        <div className="flex justify-between px-[10px] mt-1">
          {[0, 25, 50, 75, 100].map(tick => (
            <div key={tick} className="flex flex-col items-center gap-0.5">
              <div
                className="w-px h-1.5 rounded-full"
                style={{ background: tick <= value ? activeColor : (isDark ? '#2D4258' : '#CBD5E1') }}
              />
              <span
                className="text-[9px] font-mono"
                style={{ color: tick <= value ? activeColor : (isDark ? '#475569' : '#94A3B8') }}
              >
                {tick}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* Helper components */
const RadioDot: React.FC<{ active: boolean }> = ({ active }) => (
  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${active ? 'border-emerald-500 bg-emerald-500' : 'border-slate-400'}`}>
    {active && <Check className="w-2.5 h-2.5 text-white" />}
  </div>
);

interface SHProps { icon: React.ReactNode; iconBg: string; title: string; sub: string; divider: string; }
const SectionHeader: React.FC<SHProps> = ({ icon, iconBg, title, sub, divider }) => (
  <div className={`flex items-center gap-2.5 pb-3 border-b ${divider}`}>
    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
    <div><h2 className="text-sm font-bold">{title}</h2><p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{sub}</p></div>
  </div>
);

interface SHInlineProps { icon: React.ReactNode; iconBg: string; title: string; sub: string; }
const SectionHeaderInline: React.FC<SHInlineProps> = ({ icon, iconBg, title, sub }) => (
  <div className="flex items-center gap-2.5">
    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
    <div><h2 className="text-sm font-bold">{title}</h2><p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{sub}</p></div>
  </div>
);

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  onBackToTriage, 
  onToggleSidebar, 
  isSidebarCollapsed = false,
  onStartTour 
}) => {
  const { language, setLanguage, fontSize, setFontSize, user, logout, login, t, wardScope, setWardScope, slaWarningHours, setSlaWarningHours, caaqmsTriggerAqi, setCaaqmsTriggerAqi, priorityWeights, setPriorityWeights } = useSettings();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [localAqi, setLocalAqi] = useState(String(caaqmsTriggerAqi));

  const canvas    = isDark ? 'bg-[#090D16]'  : 'bg-[#FAFAFA]';
  const card      = isDark ? 'bg-[#111827] border border-slate-800' : 'bg-white border border-zinc-200';
  const divider   = isDark ? 'border-slate-800' : 'border-zinc-200';
  const textPri   = isDark ? 'text-slate-100'   : 'text-[#0F172A]';
  const textSec   = isDark ? 'text-slate-400'   : 'text-slate-500';
  const textMono  = isDark ? 'text-slate-500 font-mono' : 'text-slate-400 font-mono';
  const inputBg   = isDark ? 'bg-[#0B1120] border-slate-700 text-slate-200' : 'bg-white border-zinc-300 text-slate-800';
  const sectionHd = `${card} rounded-xl p-4 sm:p-5 shadow-sm transition-colors`;

  const toast = (msg: string) => { setSaveToast(msg); setTimeout(() => setSaveToast(null), 2800); };
  const totalWeight = Object.values(priorityWeights).reduce((a, b) => a + b, 0);
  const setWeight = (key: keyof PriorityWeights, val: number) => setPriorityWeights({ ...priorityWeights, [key]: val });

  return (
    <div className={`w-full h-full ${canvas} ${textPri} flex flex-col overflow-y-auto p-4 sm:p-6 transition-colors`}>

      <AnimatePresence>
        {saveToast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-emerald-700 text-white shadow-xl text-xs font-mono border border-emerald-500/40">
            <Check className="w-4 h-4 text-emerald-200" /><span>{saveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-4 border-b ${divider}`}>
        <div className="flex items-center gap-3">
          {isSidebarCollapsed && onToggleSidebar && (
            <button type="button" onClick={onToggleSidebar} className={`p-1.5 rounded-md ${card} ${textPri} transition-colors cursor-pointer`} title="Expand Navigation">
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white shrink-0"><Settings className="w-3.5 h-3.5" /></div>
              <h1 className={`text-base sm:text-lg font-bold ${textPri}`}>{t('settings.title','Municipal Command Settings')}</h1>
            </div>
            <p className={`text-[11px] ${textMono} mt-0.5`}>{t('settings.subtitle','Configure nodal officer workstation localization, accessibility display scaling, security authentication, and automated CAAQMS protocols.')}</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onBackToTriage}
          className={`px-3 py-1.5 rounded-md ${card} text-xs font-medium ${textPri} transition-colors shadow-sm cursor-pointer flex items-center gap-1.5`}>
          <RotateCcw className="w-3.5 h-3.5 text-emerald-500" /><span>{t('settings.back','Return to Live Triage Map')}</span>
        </motion.button>
      </div>

      <div className="max-w-5xl w-full mx-auto py-6 space-y-6">

        {/* 1. Language */}
        <section className={sectionHd}>
          <SectionHeader icon={<Languages className="w-4 h-4" />} iconBg={isDark ? 'bg-sky-950/70 border-sky-800/80 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'}
            title={t('settings.lang_heading','Language & Regional Localization')} sub={t('settings.lang_sub','Select institutional operational language for complaints triage and statutory directives generation.')} divider={divider} />
          <div className="grid grid-cols-3 gap-2.5 pt-4">
            {(['en','mr','hi'] as AppLanguage[]).map(lang => {
              const active = language === lang;
              const nameMap: Record<AppLanguage,string> = { en: t('settings.lang_en','English'), mr: t('settings.lang_mr','मराठी (Marathi)'), hi: t('settings.lang_hi','हिन्दी (Hindi)') };
              const descMap: Record<AppLanguage,string> = { en: t('settings.lang_en_desc','Official Technical Default'), mr: t('settings.lang_mr_desc','PMC Pune Official'), hi: t('settings.lang_hi_desc','CPCB SAMEER Portal') };
              const badgeMap: Record<AppLanguage,string> = { en: active ? 'Active' : 'EN', mr: active ? 'सक्रिय' : 'MR', hi: active ? 'सक्रिय' : 'HI' };
              return (
                <motion.div key={lang} whileHover={{ y: -1 }} onClick={() => { setLanguage(lang); toast(lang === 'en' ? 'Language: English' : lang === 'mr' ? 'भाषा: मराठी' : 'भाषा: हिन्दी'); }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1.5 ${active ? 'border-emerald-500 ring-1 ring-emerald-500/20 '+(isDark?'bg-emerald-950/40':'bg-emerald-50/60') : (isDark?'bg-[#0B1120] border-slate-800 hover:border-slate-600':'bg-zinc-50 border-zinc-200 hover:border-zinc-400')}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${textPri}`}>{nameMap[lang]}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${active ? 'bg-emerald-600 text-white' : (isDark?'bg-slate-800 text-slate-400':'bg-zinc-200 text-slate-600')}`}>{badgeMap[lang]}</span>
                  </div>
                  <p className={`text-[10px] ${textSec}`}>{descMap[lang]}</p>
                  {active && <Check className="w-3 h-3 text-emerald-500 self-end" />}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 2. Theme */}
        <section className={sectionHd}>
          <SectionHeader icon={<Sun className="w-4 h-4" />} iconBg={isDark ? 'bg-amber-950/70 border-amber-800/80 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'}
            title={t('settings.theme_heading','Display Appearance & Theme Mode')} sub={t('settings.theme_sub','Choose daytime high-visibility canvas or low-glare dark mineral graphite for 24-hour command monitoring.')} divider={divider} />
          <div className="grid grid-cols-2 gap-3 pt-4">
            <motion.div whileHover={{ y: -1 }} onClick={() => { setTheme('dark'); toast('Theme: Dark Command Canvas'); }}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${theme==='dark'?'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/20':(isDark?'bg-[#0B1120] border-slate-800 hover:border-slate-600':'bg-zinc-50 border-zinc-200 hover:border-zinc-400')}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#150F0A] border border-[#2E2218] flex items-center justify-center text-emerald-400"><Moon className="w-3.5 h-3.5" /></div>
                  <span className={`text-xs font-bold ${theme==='dark'?'text-slate-100':textPri}`}>{t('settings.theme_dark','Dark Command Canvas')}</span>
                </div>
                <RadioDot active={theme==='dark'} />
              </div>
              <div className="p-2 rounded bg-[#150F0A] border border-[#2E2218] flex items-center justify-between text-[10px] font-mono">
                <span className="text-emerald-400">● 24h Night-Shift Ops</span><span className="text-slate-500">Zero Eye Strain</span>
              </div>
            </motion.div>
            <motion.div whileHover={{ y: -1 }} onClick={() => { setTheme('light'); toast('Theme: Light Institutional Canvas'); }}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${theme==='light'?'bg-white border-emerald-500 ring-1 ring-emerald-500/20':(isDark?'bg-[#0B1120] border-slate-800 hover:border-slate-600':'bg-zinc-50 border-zinc-200 hover:border-zinc-400')}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600"><Sun className="w-3.5 h-3.5" /></div>
                  <span className={`text-xs font-bold ${theme==='light'?'text-slate-900':textPri}`}>{t('settings.theme_light','Light Institutional Canvas')}</span>
                </div>
                <RadioDot active={theme==='light'} />
              </div>
              <div className="p-2 rounded bg-slate-100 border border-zinc-200 flex items-center justify-between text-[10px] font-mono text-slate-700">
                <span className="text-amber-600">● Daylight / Projector Mode</span><span className="text-slate-400">Max Sun Contrast</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Font Size */}
        <section className={sectionHd}>
          <SectionHeader icon={<Type className="w-4 h-4" />} iconBg={isDark ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}
            title={t('settings.font_heading','Display Accessibility & Font Size Scaling')} sub={t('settings.font_sub','Adjust text scaling across all dashboard panels, queue metrics, and statutory notices for optimal legibility.')} divider={divider} />
          <div className="grid grid-cols-3 gap-2.5 pt-4">
            {([
              { key:'normal' as FontSizeScale, label:t('settings.font_normal','Standard (100%)'),  px:'16px', tag:'Standard Density' },
              { key:'large'  as FontSizeScale, label:t('settings.font_large','Medium (+12.5%)'),   px:'18px', tag:'Comfort Scale'    },
              { key:'xl'     as FontSizeScale, label:t('settings.font_xl','Large (+25%)'),         px:'20px', tag:'Max Accessibility'},
            ]).map(({ key, label, px, tag }) => {
              const active = fontSize === key;
              return (
                <motion.div key={key} whileHover={{ y: -1 }} onClick={() => { setFontSize(key); toast(`Font scale: ${px}`); }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between gap-2 ${active ? 'border-emerald-500 ring-1 ring-emerald-500/20 '+(isDark?'bg-emerald-950/40':'bg-emerald-50/60') : (isDark?'bg-[#0B1120] border-slate-800 hover:border-slate-600':'bg-zinc-50 border-zinc-200 hover:border-zinc-400')}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${textPri}`}>{label}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isDark?'bg-slate-800 text-slate-400':'bg-zinc-200 text-slate-600'}`}>{px}</span>
                  </div>
                  <div className={`text-[10px] font-mono ${active?'text-emerald-500':textSec} flex items-center justify-between`}>
                    <span>{tag}</span>{active && <Check className="w-3 h-3" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className={`mt-4 p-3 rounded-lg ${isDark?'bg-[#0B1120] border border-slate-800':'bg-zinc-100 border border-zinc-200'}`}>
            <div className={`text-[10px] ${textMono} mb-1.5 uppercase tracking-wider flex items-center justify-between`}>
              <span>{t('settings.font_preview_label','Live Typography Scaling Preview:')}</span>
              <span className="text-emerald-500">Scale Active</span>
            </div>
            <div className={`p-2.5 rounded ${card} shadow-sm space-y-1`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className={`font-bold ${textPri} text-xs`}>{t('settings.font_preview_sample','PMC Hadapsar Industrial Zone: AQI 388 (Hazardous) · SLA Breaches in 2.1h')}</span>
              </div>
              <p className={`text-[11px] ${textSec} font-mono`}>Statutory Directive: Deploy 2000L Anti-Smog Gun under Air Act 1981 §31A.</p>
            </div>
          </div>
        </section>

        {/* 4. Officer Identity */}
        <section className={sectionHd}>
          <SectionHeader icon={<KeyRound className="w-4 h-4" />} iconBg={isDark ? 'bg-rose-950/70 border-rose-800/80 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'}
            title={t('settings.auth_heading','Officer Identity & Session Authentication')} sub={t('settings.auth_sub','Manage active municipal credentials, digital signature certificates (DSC), and terminal authorization.')} divider={divider} />
          <div className="pt-4">
            {user.loggedIn ? (
              <div className={`${isDark?'bg-[#0B1120] border-slate-800':'bg-zinc-50 border-zinc-200'} border rounded-lg p-4 space-y-3`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold font-mono text-sm ${isDark?'bg-emerald-950 border border-emerald-700/60 text-emerald-300':'bg-emerald-100 border border-emerald-300 text-emerald-800'}`}>PSJ</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${textPri}`}>Smt. P. S. Jadhav (PMC-ENV-14)</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${isDark?'bg-emerald-950 border border-emerald-800 text-emerald-300':'bg-emerald-100 border border-emerald-300 text-emerald-800'}`}>DSC Active</span>
                    </div>
                    <p className={`text-xs mt-0.5 ${textSec}`}>PMC Environmental &amp; Solid Waste Cell</p>
                    <p className={`text-[10px] mt-0.5 ${textMono}`}>Session: {user.loginTime}</p>
                  </div>
                </div>
                <div>
                  <label className={`text-[11px] font-semibold ${textSec} flex items-center gap-1.5 mb-1.5`}>
                    <MapPin className="w-3 h-3 text-emerald-500" />Active Ward Scope / Jurisdiction
                  </label>
                  <select value={wardScope} onChange={e => { setWardScope(e.target.value as WardScope); toast(`Ward scope: ${e.target.value}`); }}
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${inputBg}`}>
                    {WARD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label} — {o.sub}</option>)}
                  </select>
                  <p className={`text-[10px] ${textMono} mt-1`}>Updating ward scope filters the triage map and priority queue globally.</p>
                </div>
                <div className="flex justify-end pt-1">
                  <button type="button" onClick={() => setShowLogoutModal(true)}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
                    <LogOut className="w-3.5 h-3.5" /><span>{t('settings.auth_logout_btn','Sign Out & End Workstation Session')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`rounded-lg border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark?'bg-rose-950/40 border-rose-900/60':'bg-rose-50 border-rose-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark?'bg-rose-900/60 text-rose-300':'bg-rose-100 text-rose-700'}`}><Lock className="w-5 h-5" /></div>
                  <div>
                    <h3 className={`text-xs font-bold ${isDark?'text-rose-200':'text-rose-900'}`}>{t('settings.auth_logged_out_title','Officer Session Terminated')}</h3>
                    <p className={`text-[11px] ${isDark?'text-rose-300/80':'text-rose-700'}`}>{t('settings.auth_logged_out_desc','Workstation is locked.')}</p>
                  </div>
                </div>
                <button type="button" onClick={login}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <UserCheck className="w-3.5 h-3.5" /><span>{t('settings.auth_login_btn','Re-authenticate Nodal Officer Session')}</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 5. SLA & Sensor Rules */}
        <section className={sectionHd}>
          <SectionHeader icon={<ShieldAlert className="w-4 h-4" />} iconBg={isDark ? 'bg-amber-950/70 border-amber-800/80 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'}
            title={t('settings.sla_heading','Statutory SLA & Sensor Trigger Rules')} sub={t('settings.sla_sub','Configure system-wide SLA enforcement thresholds and CAAQMS automatic escalation triggers.')} divider={divider} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className={`p-3.5 rounded-lg border ${isDark?'bg-[#0B1120] border-slate-800':'bg-zinc-50 border-zinc-200'}`}>
              <label className={`flex items-center gap-1.5 text-[11px] font-semibold ${textSec} mb-2`}><Clock className="w-3.5 h-3.5 text-amber-500" />Critical SLA Warning Clock</label>
              <select value={slaWarningHours} onChange={e => { setSlaWarningHours(Number(e.target.value)); toast(`SLA warning: ${e.target.value}h`); }}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer ${inputBg}`}>
                <option value={4}>4 Hours — High-urgency industrial zones</option>
                <option value={6}>6 Hours (Default) — CPCB standard mandate</option>
                <option value={8}>8 Hours — Low-density residential areas</option>
              </select>
              <p className={`text-[10px] ${textMono} mt-1.5`}>Hotspots within this window get escalated badge &amp; queue promotion.</p>
            </div>
            <div className={`p-3.5 rounded-lg border ${isDark?'bg-[#0B1120] border-slate-800':'bg-zinc-50 border-zinc-200'}`}>
              <label className={`flex items-center gap-1.5 text-[11px] font-semibold ${textSec} mb-2`}><Wind className="w-3.5 h-3.5 text-rose-500" />CAAQMS Severe Pollution Trigger (AQI)</label>
              <div className="flex items-center gap-2">
                <input type="number" min={100} max={500} step={10} value={localAqi}
                  onChange={e => setLocalAqi(e.target.value)}
                  onBlur={() => { const v = Math.min(500,Math.max(100,parseInt(localAqi,10)||350)); setCaaqmsTriggerAqi(v); setLocalAqi(String(v)); toast(`CAAQMS trigger: AQI ${v}`); }}
                  className={`flex-1 px-3 py-2 rounded-lg border text-xs font-mono font-medium ${inputBg}`} />
                <span className={`text-[10px] px-2 py-1 rounded font-mono font-semibold ${caaqmsTriggerAqi>=400?'bg-rose-600 text-white':caaqmsTriggerAqi>=300?'bg-amber-600 text-white':'bg-emerald-600 text-white'}`}>
                  {caaqmsTriggerAqi>=400?'HAZARDOUS':caaqmsTriggerAqi>=300?'VERY POOR':'POOR'}
                </span>
              </div>
              <p className={`text-[10px] ${textMono} mt-1.5`}>Auto-promotes to P0 and triggers field squad dispatch above this threshold.</p>
            </div>
          </div>
        </section>

        {/* 6. Priority Weights */}
        <section className={sectionHd}>
          <div className={`flex items-center justify-between pb-3 border-b ${divider}`}>
            <SectionHeaderInline icon={<Sliders className="w-4 h-4" />} iconBg={isDark ? 'bg-blue-950/70 border-blue-800/80 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}
              title={t('settings.weights_heading','Priority Formula Weight Tuning')} sub={t('settings.weights_sub','Adjust the weighted scoring model used by the triage algorithm to rank pollution hotspots.')} />
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold shrink-0 ml-3 ${totalWeight===100?(isDark?'bg-emerald-950 border border-emerald-800 text-emerald-300':'bg-emerald-100 border border-emerald-300 text-emerald-800'):'bg-rose-600 text-white'}`}>
              Σ = {totalWeight}%
            </span>
          </div>
          <div className="pt-4 space-y-5">
            {WEIGHT_META.map(({ key, label, sub, color, colorDark }) => (
              <WeightSlider
                key={key}
                label={label}
                sub={sub}
                value={priorityWeights[key]}
                color={color}
                colorDark={colorDark}
                isDark={isDark}
                textPri={textPri}
                textSec={textSec}
                onChange={v => setWeight(key, v)}
              />
            ))}
            {totalWeight !== 100 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <span className="text-[10px] text-rose-500 font-mono font-medium">⚠ Weights must sum to 100% for valid scoring. Current total: {totalWeight}%</span>
              </div>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setPriorityWeights(CPCB_BASELINE_WEIGHTS); toast('Restored CPCB Baseline Weights'); }}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${isDark?'border-slate-700 text-slate-300 hover:bg-slate-800':'border-zinc-300 text-slate-700 hover:bg-zinc-100'}`}>
              <RotateCcw className="w-3 h-3 text-blue-500" />Restore CPCB Baseline Weights
            </motion.button>
          </div>
        </section>

        {/* 7. Demo Controls */}
        <section className={sectionHd}>
          <SectionHeader icon={<Compass className="w-4 h-4" />} iconBg={isDark ? 'bg-purple-950/70 border-purple-800/80 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'}
            title={t('settings.demo_heading','Onboarding Tour & Judge Demo Controls')} sub={t('settings.demo_sub','Guided workflow walkthrough and synthetic data seeding for demonstration purposes.')} divider={divider} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
            <div className={`p-4 rounded-lg border ${isDark?'bg-[#0B1120] border-slate-800':'bg-zinc-50 border-zinc-200'}`}>
              <div className={`text-[11px] font-semibold ${textSec} mb-1`}>Workflow Walkthrough</div>
              <p className={`text-[11px] ${textSec} mb-3 leading-relaxed`}>Step-by-step interactive tour of the AirSense B2G triage pipeline — from SAMEER sensor ingestion through CPCB statutory directive generation.</p>
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.97 }} 
                onClick={() => {
                  if (onStartTour) {
                    onStartTour();
                  } else {
                    toast('Guided workflow tour starting…');
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                <Play className="w-3.5 h-3.5" />Start Guided Workflow Tour
              </motion.button>
            </div>
            <div className={`p-4 rounded-lg border ${isDark?'bg-[#0B1120] border-slate-800':'bg-zinc-50 border-zinc-200'}`}>
              <div className={`text-[11px] font-semibold ${textSec} mb-1`}>Synthetic Demo Data</div>
              <p className={`text-[11px] ${textSec} mb-3 leading-relaxed`}>Reload the initial 500-complaint seed dataset with authentic Pune hotspot clusters across Hadapsar, Shivajinagar, and Kothrud corridors.</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => toast('Synthetic seed data reloaded — 500 complaints')}
                className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors border ${isDark?'border-slate-700 text-slate-300 hover:bg-slate-800':'border-zinc-300 text-slate-700 hover:bg-zinc-100'}`}>
                <Database className="w-3.5 h-3.5 text-emerald-500" />Reset Synthetic Seed Data (500 Complaints)
              </motion.button>
            </div>
          </div>
        </section>

      </div>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              className={`${card} rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark?'bg-rose-950/80 text-rose-400':'bg-rose-100 text-rose-600'}`}><AlertTriangle className="w-5 h-5" /></div>
                <div>
                  <h3 className={`text-sm font-bold ${textPri}`}>Confirm Nodal Workstation Logout</h3>
                  <p className={`text-xs ${textSec}`}>Are you sure you want to end your active command session?</p>
                </div>
              </div>
              <div className={`p-3 rounded ${isDark?'bg-[#0B1120] border border-slate-800':'bg-zinc-50 border border-zinc-200'} text-xs space-y-1 font-mono`}>
                <div className="flex justify-between"><span className={textSec}>Active Officer:</span><span className={`font-semibold ${textPri}`}>{user.name}</span></div>
                <div className="flex justify-between"><span className={textSec}>Terminal ID:</span><span className="text-emerald-500 font-semibold">{user.id}</span></div>
                <div className="flex justify-between"><span className={textSec}>Unresolved Hotspots:</span><span className="text-rose-500 font-bold">Active in Queue</span></div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowLogoutModal(false)}
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${isDark?'border-slate-700 text-slate-300 hover:bg-slate-800':'border-zinc-300 text-slate-700 hover:bg-zinc-100'}`}>Cancel</button>
                <button type="button" onClick={() => { logout(); setShowLogoutModal(false); }}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer">Confirm Sign Out</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsView;
