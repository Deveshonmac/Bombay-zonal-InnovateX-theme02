import React, { useState } from 'react';
import {
  Wind,
  Search,
  MapPin,
  Sun,
  Moon,
  Eye,
  Bell,
  RefreshCw,
  Sliders,
  BarChart3,
  Map as MapIcon,
  HelpCircle,
  Leaf,
  ShieldCheck,
  Users,
  Info,
  ShieldAlert,
  Flame,
  X,
  Compass,
  Radio,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAQIBandInfo } from '../utils/aqiCalculations';
import { ActiveTab, UserRole } from '../types';

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    colorblindMode,
    toggleColorblindMode,
    activeTab,
    setActiveTab,
    currentCity,
    allCities,
    selectCityById,
    user,
    setUserRole,
    cacheTimeRemaining,
    refreshCityData,
    alertNotification,
    dismissNotification,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const currentBandInfo = getAQIBandInfo(currentCity.aqi, colorblindMode);

  const filteredCities = allCities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCacheTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const primaryNavItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'nodal-officer', label: 'Nodal Officer (Triage)', icon: Radio },
    { id: 'dashboard', label: 'Dashboard', icon: Wind },
    { id: 'map', label: 'AQI Map', icon: MapIcon },
    { id: 'city-detail', label: 'Forecast & Trends', icon: BarChart3 },
    { id: 'comparison', label: 'Compare Cities', icon: Sliders },
    { id: 'simulator', label: 'Health Simulator', icon: ShieldAlert },
    { id: 'awareness-hub', label: 'Action & Gear', icon: HelpCircle },
    { id: 'community-reports', label: 'Citizen Reports', icon: Users },
  ];

  const secondaryNavItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'source-analysis', label: 'Source Diagnostics', icon: Flame },
    { id: 'carbon-calculator', label: 'Carbon Calculator', icon: Leaf },
    { id: 'diy-purifier', label: 'DIY Purifier Guide', icon: ShieldCheck },
    { id: 'alerts', label: 'Alerts Manager', icon: Bell },
    { id: 'provenance', label: 'Data Provenance', icon: Info },
  ];

  if (user.role === 'admin') {
    secondaryNavItems.push({ id: 'admin-console', label: 'Admin Console', icon: ShieldAlert });
  }

  const roleLabels: Record<UserRole, { title: string; badge: string; color: string }> = {
    guest: { title: 'Guest Explorer', badge: 'Guest', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
    registered: { title: 'Alex Mercer (Free)', badge: 'Registered', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    contributor: { title: 'Dr. Priya Sharma', badge: 'Verified Contributor', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    admin: { title: 'Sarah Jenkins (Admin)', badge: 'Moderator / Admin', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      {/* Alert Notification Toast / Banner */}
      {alertNotification && (
        <div className="bg-amber-500 text-zinc-950 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1">
            <span className="shrink-0 font-bold">AIRSENSE ADVISORY:</span>
            <span className="truncate">{alertNotification}</span>
          </div>
          <button
            onClick={dismissNotification}
            className="p-1 hover:bg-amber-600 rounded transition-colors text-zinc-950"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Current Location Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
              id="airsense-logo-btn"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Wind className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                    AirSense
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    Pro
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium hidden sm:block">
                  AQI Prediction & Health Intelligence
                </p>
              </div>
            </button>

            {/* Current City Quick Pill */}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 transition-colors text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                id="header-city-quick-selector"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{currentCity.name}, {currentCity.countryCode}</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs"
                  style={{ backgroundColor: currentBandInfo.displayColor }}
                >
                  AQI {currentCity.aqi} • {currentBandInfo.shortLabel}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Search Input Bar */}
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search city or station..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-36 sm:w-56 md:w-64 pl-9 pr-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 transition-all"
                  id="city-search-input"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50 max-h-80 overflow-y-auto"
                  id="search-dropdown-menu"
                >
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                    <span>Indian CAAQMS Stations (CPCB)</span>
                    <button
                      onClick={() => setIsSearchOpen(false)}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {filteredCities.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-zinc-500 text-center">
                      No matching Indian cities found in monitoring network.
                    </div>
                  ) : (
                    filteredCities.map((city) => {
                      const band = getAQIBandInfo(city.aqi, colorblindMode);
                      return (
                        <button
                          key={city.id}
                          onClick={() => {
                            selectCityById(city.id);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                            city.id === currentCity.id ? 'bg-sky-50/70 dark:bg-sky-950/30' : ''
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {city.name}, <span className="text-zinc-500">{city.state}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {city.stationName}
                            </div>
                          </div>
                          <span
                            className="px-2 py-0.5 text-[11px] font-bold rounded-md text-white shrink-0 ml-2"
                            style={{ backgroundColor: band.displayColor }}
                          >
                            {city.aqi}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Cache TTL & Refresh Button */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-mono">{formatCacheTime(cacheTimeRemaining)}</span>
              <button
                onClick={refreshCityData}
                title="Refresh live station cache (IQAir TTL)"
                className="p-1 hover:text-sky-500 rounded transition-colors"
                id="refresh-cache-btn"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {/* Colorblind Safe Mode Toggle */}
            <button
              onClick={toggleColorblindMode}
              title={colorblindMode ? 'Switch to Standard EPA 6-Band Colors' : 'Enable Colorblind Accessible Color Scale'}
              className={`p-2 rounded-lg border transition-colors ${
                colorblindMode
                  ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              id="colorblind-mode-toggle"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              id="theme-toggle-btn"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Account Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${roleLabels[user.role].color} border-current/20`}
                id="user-role-switcher-btn"
                title="Switch User Role to test permissions (Guest, Registered, Contributor, Admin)"
              >
                <span className="w-2 h-2 rounded-full bg-current"></span>
                <span className="hidden sm:inline">{roleLabels[user.role].badge}</span>
                <span className="sm:hidden">{user.role}</span>
              </button>

              {/* Role Selection Dropdown */}
              {isRoleMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50"
                  id="role-dropdown-menu"
                >
                  <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Simulate Account Tier
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Test features by switching user role permissions.
                    </p>
                  </div>
                  {(['guest', 'registered', 'contributor', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setUserRole(r);
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-start gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                        user.role === r ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${user.role === r ? 'bg-sky-600' : 'bg-zinc-400'}`}></span>
                      </div>
                      <div>
                        <div className="text-xs font-bold capitalize text-zinc-900 dark:text-zinc-100">
                          {r} {user.role === r && '✓'}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {r === 'guest' && 'Public read-only (unlocked Dashboard, Map, Simulator, Articles)'}
                          {r === 'registered' && 'Saved cities, custom health alerts, carbon history, quizzes'}
                          {r === 'contributor' && 'All user perks + submit ground-truth field reports & upvoting'}
                          {r === 'admin' && 'Full moderation console, report verification & quota telemetry'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Clean Horizontal Navigation Bar */}
      <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-1.5 gap-2">
            <nav className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    id={`nav-tab-${item.id}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* More Tools Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  secondaryNavItems.some((s) => s.id === activeTab)
                    ? 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 border border-sky-300 dark:border-sky-800'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                }`}
                id="more-tools-dropdown-btn"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">More Tools</span>
                <span className="sm:hidden">More</span>
              </button>

              {isMoreMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  id="more-tools-menu"
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                    Additional Diagnostics & Hubs
                  </div>
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMoreMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center gap-2.5 text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-200 font-bold'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-zinc-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
