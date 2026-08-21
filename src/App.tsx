/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { InteractiveMap } from './components/InteractiveMap';
import { CityDetail } from './components/CityDetail';
import { CityComparison } from './components/CityComparison';
import { Simulator } from './components/Simulator';
import { SourceAnalysis } from './components/SourceAnalysis';
import { CarbonCalculator } from './components/CarbonCalculator';
import { CommunityFeed } from './components/CommunityFeed';
import { AwarenessHub } from './components/AwarenessHub';
import { AlertsManager } from './components/AlertsManager';
import { DataProvenance } from './components/DataProvenance';
import { AdminConsole } from './components/AdminConsole';
import { Wind, Shield, Heart, Globe, Sparkles } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Header />

      <main className="flex-1">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'map' && <InteractiveMap />}
        {activeTab === 'city-detail' && <CityDetail />}
        {activeTab === 'comparison' && <CityComparison />}
        {activeTab === 'simulator' && <Simulator />}
        {activeTab === 'source-analysis' && <SourceAnalysis />}
        {(activeTab === 'carbon-calculator' || activeTab === ('carbon-calc' as any)) && <CarbonCalculator />}
        {(activeTab === 'awareness-hub' || activeTab === ('awareness' as any)) && <AwarenessHub initialSubTab="articles" />}
        {activeTab === 'diy-purifier' && <AwarenessHub initialSubTab="diy" />}
        {(activeTab === 'community-reports' || activeTab === ('community' as any)) && <CommunityFeed />}
        {activeTab === 'alerts' && <AlertsManager />}
        {activeTab === 'provenance' && <DataProvenance />}
        {activeTab === 'admin-console' && <AdminConsole />}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 py-8 px-4 sm:px-6 lg:px-8 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <Wind className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm">
              AirSense
            </span>
            <span>— Global AQI Prediction, Source Apportionment & Health Analysis Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('awareness-hub')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              EPA AQI Guidelines
            </button>
            <button
              onClick={() => setActiveTab('carbon-calculator')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Carbon Calculator
            </button>
            <button
              onClick={() => setActiveTab('community-reports')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Citizen Science Network
            </button>
            <button
              onClick={() => setActiveTab('provenance')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Data Methodology
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
