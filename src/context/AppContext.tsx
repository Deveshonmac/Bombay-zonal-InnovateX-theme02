import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CityData,
  ActiveTab,
  UserAccount,
  UserRole,
  CommunityReport,
  CarbonFootprintEntry,
  UserHealthProfile,
} from '../types';
import {
  CITIES_DATA,
  INITIAL_USER,
  MOCK_COMMUNITY_REPORTS,
  MOCK_CARBON_HISTORY,
} from '../data/mockData';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colorblindMode: boolean;
  toggleColorblindMode: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentCity: CityData;
  setCurrentCity: (city: CityData) => void;
  selectCityById: (id: string) => void;
  allCities: CityData[];
  savedCityIds: string[];
  toggleSaveCity: (cityId: string) => void;
  isCitySaved: (cityId: string) => boolean;
  user: UserAccount;
  setUserRole: (role: UserRole) => void;
  updateHealthProfile: (profile: Partial<UserHealthProfile>) => void;
  updateAlertThreshold: (threshold: number, enabled: boolean) => void;
  comparisonCityIds: string[];
  setComparisonCityIds: (ids: string[]) => void;
  addComparisonCity: (id: string) => void;
  removeComparisonCity: (id: string) => void;
  communityReports: CommunityReport[];
  addCommunityReport: (report: Omit<CommunityReport, 'id' | 'timestamp' | 'upvotes' | 'status'>) => void;
  upvoteReport: (reportId: string) => void;
  moderateReport: (reportId: string, status: CommunityReport['status']) => void;
  carbonHistory: CarbonFootprintEntry[];
  addCarbonEntry: (entry: Omit<CarbonFootprintEntry, 'id'>) => void;
  recordQuizSuccess: (points: number) => void;
  cacheTimeRemaining: number;
  refreshCityData: () => void;
  alertNotification: string | null;
  dismissNotification: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('airsense_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // fallback
    }
    return 'light';
  });
  const [colorblindMode, setColorblindMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('airsense_colorblind') === 'true';
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentCity, setCurrentCity] = useState<CityData>(CITIES_DATA[0]); // New Delhi default
  const [allCities] = useState<CityData[]>(CITIES_DATA);
  const [user, setUser] = useState<UserAccount>(INITIAL_USER);
  const [savedCityIds, setSavedCityIds] = useState<string[]>(INITIAL_USER.savedCityIds);
  const [comparisonCityIds, setComparisonCityIds] = useState<string[]>(['delhi', 'london', 'losangeles']);
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>(MOCK_COMMUNITY_REPORTS);
  const [carbonHistory, setCarbonHistory] = useState<CarbonFootprintEntry[]>(MOCK_CARBON_HISTORY);
  const [cacheTimeRemaining, setCacheTimeRemaining] = useState<number>(720); // 12 mins in seconds
  const [alertNotification, setAlertNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle Theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('airsense_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Handle Colorblind mode persistence
  useEffect(() => {
    try {
      localStorage.setItem('airsense_colorblind', String(colorblindMode));
    } catch {
      // ignore
    }
  }, [colorblindMode]);

  // Simulated cache countdown timer (10-15m TTL)
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheTimeRemaining((prev) => {
        if (prev <= 1) return 900; // Reset to 15 mins
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Alert simulation when current city crosses alert threshold
  useEffect(() => {
    if (user.alertsEnabled && currentCity.aqi >= user.alertThreshold) {
      setAlertNotification(
        `⚠️ AQI Alert for ${currentCity.name}: Current reading of ${currentCity.aqi} exceeds your safe threshold limit of ${user.alertThreshold}. Wear an N95 mask outdoors.`
      );
    }
  }, [currentCity, user.alertThreshold, user.alertsEnabled]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleColorblindMode = () => {
    setColorblindMode((prev) => !prev);
  };

  const selectCityById = (id: string) => {
    const found = allCities.find((c) => c.id === id);
    if (found) {
      setCurrentCity(found);
    }
  };

  const toggleSaveCity = (cityId: string) => {
    if (user.role === 'guest') {
      setAlertNotification('ℹ️ Saved favorites is a personalized feature. Switch to "Registered User" in the top bar to save cities!');
      return;
    }
    setSavedCityIds((prev) => {
      const next = prev.includes(cityId) ? prev.filter((id) => id !== cityId) : [...prev, cityId];
      setUser((u) => ({ ...u, savedCityIds: next }));
      return next;
    });
  };

  const isCitySaved = (cityId: string) => savedCityIds.includes(cityId);

  const setUserRole = (role: UserRole) => {
    setUser((prev) => ({
      ...prev,
      role,
      name: role === 'guest' ? 'Guest Explorer' : role === 'admin' ? 'Sarah Jenkins (Admin)' : role === 'contributor' ? 'Dr. Priya Sharma' : 'Alex Mercer',
    }));
  };

  const updateHealthProfile = (profileUpdate: Partial<UserHealthProfile>) => {
    setUser((prev) => ({
      ...prev,
      healthProfile: {
        ...prev.healthProfile,
        ...profileUpdate,
      },
    }));
  };

  const updateAlertThreshold = (threshold: number, enabled: boolean) => {
    setUser((prev) => ({
      ...prev,
      alertThreshold: threshold,
      alertsEnabled: enabled,
    }));
  };

  const addComparisonCity = (id: string) => {
    if (!comparisonCityIds.includes(id) && comparisonCityIds.length < 3) {
      setComparisonCityIds([...comparisonCityIds, id]);
    }
  };

  const removeComparisonCity = (id: string) => {
    setComparisonCityIds(comparisonCityIds.filter((cityId) => cityId !== id));
  };

  const addCommunityReport = (reportData: Omit<CommunityReport, 'id' | 'timestamp' | 'upvotes' | 'status'>) => {
    const newReport: CommunityReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      timestamp: 'Just now',
      upvotes: 1,
      hasUpvoted: true,
      status: user.role === 'admin' ? 'verified_by_moderator' : 'active',
    };
    setCommunityReports([newReport, ...communityReports]);
    setUser((prev) => ({ ...prev, reputationPoints: prev.reputationPoints + 15 }));
    setAlertNotification('✅ Ground-truth report submitted! Community reputation +15 points.');
  };

  const upvoteReport = (reportId: string) => {
    setCommunityReports((prev) =>
      prev.map((rep) => {
        if (rep.id === reportId) {
          const upvoted = !rep.hasUpvoted;
          return {
            ...rep,
            upvotes: upvoted ? rep.upvotes + 1 : rep.upvotes - 1,
            hasUpvoted: upvoted,
          };
        }
        return rep;
      })
    );
  };

  const moderateReport = (reportId: string, status: CommunityReport['status']) => {
    setCommunityReports((prev) =>
      prev.map((rep) => (rep.id === reportId ? { ...rep, status } : rep))
    );
  };

  const addCarbonEntry = (entry: Omit<CarbonFootprintEntry, 'id'>) => {
    const newEntry: CarbonFootprintEntry = {
      ...entry,
      id: `carb-${Date.now()}`,
    };
    setCarbonHistory([newEntry, ...carbonHistory]);
    setAlertNotification('🌱 Carbon footprint logged and progress timeline updated!');
  };

  const recordQuizSuccess = (points: number) => {
    setUser((prev) => ({
      ...prev,
      quizScore: prev.quizScore + points,
      quizStreak: prev.quizStreak + 1,
      unlockedBadges:
        prev.quizStreak >= 4 && !prev.unlockedBadges.includes('Atmospheric Grandmaster')
          ? [...prev.unlockedBadges, 'Atmospheric Grandmaster']
          : prev.unlockedBadges,
    }));
  };

  const refreshCityData = () => {
    setCacheTimeRemaining(900);
    setAlertNotification(`🔄 Station data for ${currentCity.name} freshly validated from multi-sensor network.`);
  };

  const dismissNotification = () => {
    setAlertNotification(null);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        colorblindMode,
        toggleColorblindMode,
        activeTab,
        setActiveTab,
        currentCity,
        setCurrentCity,
        selectCityById,
        allCities,
        savedCityIds,
        toggleSaveCity,
        isCitySaved,
        user,
        setUserRole,
        updateHealthProfile,
        updateAlertThreshold,
        comparisonCityIds,
        setComparisonCityIds,
        addComparisonCity,
        removeComparisonCity,
        communityReports,
        addCommunityReport,
        upvoteReport,
        moderateReport,
        carbonHistory,
        addCarbonEntry,
        recordQuizSuccess,
        cacheTimeRemaining,
        refreshCityData,
        alertNotification,
        dismissNotification,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
