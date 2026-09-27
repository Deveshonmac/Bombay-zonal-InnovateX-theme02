import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppLanguage = 'en' | 'mr' | 'hi';
export type FontSizeScale = 'normal' | 'large' | 'xl';
export type WardScope = 'all' | 'ward14' | 'ward8';

export interface PriorityWeights {
  complaintVolume: number;
  hazardSeverity: number;
  slaElapsed: number;
  aqiDelta: number;
}

export const CPCB_BASELINE_WEIGHTS: PriorityWeights = {
  complaintVolume: 40,
  hazardSeverity: 25,
  slaElapsed: 25,
  aqiDelta: 10,
};

export interface OfficerProfile {
  name: string;
  id: string;
  role: string;
  department: string;
  ward: string;
  email: string;
  loggedIn: boolean;
  loginTime: string;
}

interface SettingsContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  fontSize: FontSizeScale;
  setFontSize: (size: FontSizeScale) => void;
  user: OfficerProfile;
  logout: () => void;
  login: () => void;
  t: (key: string, defaultText?: string) => string;
  wardScope: WardScope;
  setWardScope: (ward: WardScope) => void;
  slaWarningHours: number;
  setSlaWarningHours: (h: number) => void;
  caaqmsTriggerAqi: number;
  setCaaqmsTriggerAqi: (v: number) => void;
  priorityWeights: PriorityWeights;
  setPriorityWeights: (w: PriorityWeights) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (val: boolean) => void;
  soundAlerts: boolean;
  setSoundAlerts: (val: boolean) => void;
  autoRefreshRate: number;
  setAutoRefreshRate: (val: number) => void;
  aiStrictness: 'statutory' | 'advisory' | 'emergency';
  setAiStrictness: (val: 'statutory' | 'advisory' | 'emergency') => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
}

const DEFAULT_OFFICER: OfficerProfile = {
  name: 'Smt. P. S. Jadhav',
  id: 'PMC-ENV-14',
  role: 'Senior Environmental Compliance Nodal Officer',
  department: 'PMC Environmental & Solid Waste Cell',
  ward: 'Central Command Zone (Pune HQ)',
  email: 'p.jadhav@punecorporation.org',
  loggedIn: true,
  loginTime: 'Today, 08:30 AM IST (Valid 24h cycle)',
};

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    'nav.triage': 'Hotspot Triage',
    'nav.queue': 'Priority Queue',
    'nav.impact_log': 'Impact Ledger',
    'nav.audit_logs': 'Audit & Directives',
    'nav.system_health': 'System Telemetry',
    'nav.settings': 'Settings & Workspace',
    'nav.modules': 'Triage Modules',
    'nav.jurisdiction': 'JURISDICTION',
    'nav.compliance': '24h SLA Compliance',
    'nav.sameer_feed': 'SAMEER Feed:',
    'nav.live': 'Live',
    'nav.sla_risk': 'SLA Risk (<6h):',
    'nav.citizen_tickets': 'Citizen Tickets:',
    'nav.hotspots': 'Hotspots',
    'nav.total': 'total',
    'nav.officer_title': 'Nodal Officer (Env. Cell)',
    'nav.light': 'Light',
    'nav.dark': 'Dark',
    'nav.show_sidebar': 'Show Sidebar',
    'nav.show_queue': 'Show Queue',
    'nav.logout': 'Logout',
    'settings.title': 'Municipal Command Settings & Preferences',
    'settings.subtitle': 'Configure nodal officer workstation localization, accessibility display scaling, security authentication, and automated CAAQMS protocols.',
    'settings.back': 'Return to Live Triage Map',
    'settings.lang_heading': 'Language & Regional Localization (भाषा)',
    'settings.lang_sub': 'Select institutional operational language for complaints triage and statutory directives generation.',
    'settings.lang_en': 'English',
    'settings.lang_en_desc': 'Official Technical Default',
    'settings.lang_mr': 'मराठी (Marathi)',
    'settings.lang_mr_desc': 'PMC Pune Official',
    'settings.lang_hi': 'हिन्दी (Hindi)',
    'settings.lang_hi_desc': 'CPCB SAMEER Portal',
    'settings.theme_heading': 'Display Appearance & Theme Mode (स्वरूप)',
    'settings.theme_sub': 'Choose daytime high-visibility canvas or low-glare dark mineral graphite for 24-hour command monitoring.',
    'settings.theme_dark': 'Dark Command Canvas (Recommended)',
    'settings.theme_light': 'Light Institutional Canvas',
    'settings.font_heading': 'Display Accessibility & Font Size Scaling (फॉन्ट आकार)',
    'settings.font_sub': 'Adjust text scaling across all dashboard panels, queue metrics, and statutory notices for optimal legibility.',
    'settings.font_normal': 'Standard (100%)',
    'settings.font_normal_desc': 'Default density for high-resolution desktop displays.',
    'settings.font_large': 'Medium (+12.5%)',
    'settings.font_large_desc': 'Recommended for laptop screens and extended viewing comfort.',
    'settings.font_xl': 'Large (+25%)',
    'settings.font_xl_desc': 'Maximum accessibility for wall-mounted dashboards and projectors.',
    'settings.font_preview_label': 'Live Typography Scaling Preview:',
    'settings.font_preview_sample': 'PMC Hadapsar Industrial Zone: AQI 388 (Hazardous) · SLA Breaches in 2.1h',
    'settings.auth_heading': 'Officer Identity & Session Authentication (अधिकारी सत्र)',
    'settings.auth_sub': 'Manage active municipal credentials, digital signature certificates (DSC), and terminal authorization.',
    'settings.auth_logout_btn': 'Sign Out & End Workstation Session',
    'settings.auth_login_btn': 'Re-authenticate Nodal Officer Session',
    'settings.auth_logged_out_title': 'Officer Session Terminated',
    'settings.auth_logged_out_desc': 'Workstation is locked to prevent unauthorized disposition of statutory directives.',
    'settings.sla_heading': 'Statutory SLA & Sensor Trigger Rules',
    'settings.sla_sub': 'Configure system-wide SLA enforcement thresholds and CAAQMS automatic escalation triggers.',
    'settings.weights_heading': 'Priority Formula Weight Tuning',
    'settings.weights_sub': 'Adjust the weighted scoring model used by the triage algorithm to rank pollution hotspots.',
    'settings.demo_heading': 'Onboarding Tour & Judge Demo Controls',
    'settings.demo_sub': 'Guided workflow walkthrough and synthetic data seeding for demonstration purposes.',
  },
  mr: {
    'nav.triage': 'हॉटस्पॉट ट्रायज',
    'nav.queue': 'प्राधान्य रांग',
    'nav.impact_log': 'प्रभाव नोंदवही',
    'nav.audit_logs': 'ऑडिट आणि निर्देश',
    'nav.system_health': 'प्रणाली टेलिमेट्री',
    'nav.settings': 'सेटिंग्ज आणि प्राधान्ये',
    'nav.modules': 'ट्रायज विभाग',
    'nav.jurisdiction': 'अधिकार क्षेत्र',
    'nav.compliance': '२४ तास एसएलए पूर्तता',
    'nav.sameer_feed': 'समीर फीड:',
    'nav.live': 'थेट चालू',
    'nav.sla_risk': 'धोकादायक (<६ तास):',
    'nav.citizen_tickets': 'नागरिक तक्रारी:',
    'nav.hotspots': 'हॉटस्पॉट्स',
    'nav.total': 'एकूण',
    'nav.officer_title': 'नोडल अधिकारी (पर्यावरण कक्ष)',
    'nav.light': 'लाइट',
    'nav.dark': 'डार्क',
    'nav.show_sidebar': 'साइडबार उघडा',
    'nav.show_queue': 'रांग उघडा',
    'nav.logout': 'लॉग आउट',
    'settings.title': 'महानगरपालिका कमांड सेटिंग्ज आणि प्राधान्ये',
    'settings.subtitle': 'नोडल अधिकारी वर्कस्टेशन प्रादेशिक भाषा, फॉन्ट आकार, सुरक्षा प्रमाणीकरण आणि स्वयंचलित CAAQMS नियम कॉन्फिगर करा.',
    'settings.back': 'ट्रायजकडे परत जा',
    'settings.lang_heading': 'प्रशासकीय भाषा व प्रादेशिकीकरण (Language)',
    'settings.lang_sub': 'तक्रारी निवारण आणि वैधानिक आदेश तयार करण्यासाठी प्रशासकीय भाषा निवडा.',
    'settings.lang_en': 'English',
    'settings.lang_en_desc': 'तांत्रिक व केंद्रीय दस्तऐवजीकरण',
    'settings.lang_mr': 'मराठी (Marathi)',
    'settings.lang_mr_desc': 'पुणे मनपा अधिकृत',
    'settings.lang_hi': 'हिन्दी (Hindi)',
    'settings.lang_hi_desc': 'सीपीसीबी समीर पोर्टल',
    'settings.theme_heading': 'स्क्रीन स्वरूप व थीम मोड (Appearance)',
    'settings.theme_sub': 'दिवसाच्या कामासाठी लाइट थीम किंवा २४ तास देखरेखीसाठी डोळ्यांवर ताण न येणारी डार्क थीम निवडा.',
    'settings.theme_dark': 'डार्क कमांड कॅनव्हास (शिफारस केलेले)',
    'settings.theme_light': 'लाइट संस्थात्मक कॅनव्हास',
    'settings.font_heading': 'अक्षर आकार व सुलभता (Font Size Scaling)',
    'settings.font_sub': 'डॅशबोर्डवरील मजकूर, आकडेवारी आणि कायदेशीर सूचना सहज वाचण्यासाठी फॉन्ट आकार बदला.',
    'settings.font_normal': 'प्रमाणित (१००%)',
    'settings.font_normal_desc': 'हाय-डेफिनिशन डेस्कटॉप मॉनिटरसाठी डीफॉल्ट आकार.',
    'settings.font_large': 'मध्यम (+१२.५%)',
    'settings.font_large_desc': 'लॅपटॉप स्क्रीन आणि दीर्घकाळ वाचनासाठी आरामदायक.',
    'settings.font_xl': 'मोठा (+२५%)',
    'settings.font_xl_desc': 'कमांड सेंटरमधील मोठ्या स्क्रीन व प्रोजेक्टरसाठी अत्यंत उपयुक्त.',
    'settings.font_preview_label': 'थेट मजकूर आकार पूर्वावलोकन:',
    'settings.font_preview_sample': 'पुणे मनपा हडपसर औद्योगिक क्षेत्र: AQI ३८८ (धोकादायक) · एसएलए मर्यादा २.१ तासात संपणार',
    'settings.auth_heading': 'अधिकारी ओळख व सत्र प्रमाणीकरण (Authentication)',
    'settings.auth_sub': 'सक्रिय अधिकारी क्रेडेन्शियल्स, डिजिटल स्वाक्षरी प्रमाणपत्र (DSC) आणि सत्र व्यवस्थापन.',
    'settings.auth_logout_btn': 'सत्र समाप्त करा व लॉग आउट व्हा',
    'settings.auth_login_btn': 'पुन्हा लॉगिन करा (Re-authenticate)',
    'settings.auth_logged_out_title': 'अधिकारी सत्र समाप्त झाले आहे',
    'settings.auth_logged_out_desc': 'अनधिकृत कायदेशीर आदेश रोखण्यासाठी वर्कस्टेशन सुरक्षितपणे लॉक केले आहे.',
    'settings.sla_heading': 'वैधानिक SLA व सेन्सर ट्रिगर नियम',
    'settings.sla_sub': 'एसएलए अंमलबजावणी थ्रेशोल्ड आणि CAAQMS स्वयंचलित एस्केलेशन ट्रिगर कॉन्फिगर करा.',
    'settings.weights_heading': 'प्राधान्य फॉर्म्युला वजन समायोजन',
    'settings.weights_sub': 'ट्रायज अल्गोरिदमद्वारे हॉटस्पॉट रँकिंगसाठी वापरल्या जाणाऱ्या वेटेड स्कोरिंग मॉडेलचे समायोजन करा.',
    'settings.demo_heading': 'ऑनबोर्डिंग टूर आणि डेमो नियंत्रण',
    'settings.demo_sub': 'मार्गदर्शित वर्कफ्लो वॉकथ्रू आणि डेमोसाठी सिंथेटिक डेटा सीडिंग.',
  },
  hi: {
    'nav.triage': 'हॉटस्पॉट ट्राइएज',
    'nav.queue': 'प्राथमिकता कतार',
    'nav.impact_log': 'प्रभाव बहीखाता',
    'nav.audit_logs': 'ऑडिट और निर्देश',
    'nav.system_health': 'सिस्टम टेलीमेट्री',
    'nav.settings': 'सेटिंग्स व प्राथमिकताएं',
    'nav.modules': 'ट्राइएज मॉड्यूल',
    'nav.jurisdiction': 'क्षेत्राधिकार',
    'nav.compliance': '२४ घंटे एसएलए अनुपालन',
    'nav.sameer_feed': 'समीर फीड:',
    'nav.live': 'सक्रिय',
    'nav.sla_risk': 'एसएलए जोखिम (<६ घंटे):',
    'nav.citizen_tickets': 'नागरिक शिकायतें:',
    'nav.hotspots': 'हॉटस्पॉट',
    'nav.total': 'कुल',
    'nav.officer_title': 'नोडल अधिकारी (पर्यावरण प्रकोष्ठ)',
    'nav.light': 'लाइट',
    'nav.dark': 'डार्क',
    'nav.show_sidebar': 'साइडबार खोलें',
    'nav.show_queue': 'कतार खोलें',
    'nav.logout': 'लॉग आउट',
    'settings.title': 'नगर निगम कमांड सेटिंग्स और प्राथमिकताएं',
    'settings.subtitle': 'नोडल अधिकारी वर्कस्टेशन स्थानीयकरण, फॉन्ट आकार, सुरक्षा प्रमाणीकरण और स्वचालित सीपीसीबी नियमों को कॉन्फ़िगर करें.',
    'settings.back': 'ट्राइएज पर वापस जाएं',
    'settings.lang_heading': 'भाषा और क्षेत्रीय स्थानीयकरण (Language)',
    'settings.lang_sub': 'शिकायत निवारण और वैधानिक निर्देश तैयार करने के लिए आधिकारिक भाषा चुनें.',
    'settings.lang_en': 'English',
    'settings.lang_en_desc': 'केंद्रीय व तकनीकी मानक',
    'settings.lang_mr': 'मराठी (Marathi)',
    'settings.lang_mr_desc': 'पुणे मनपा आधिकारिक',
    'settings.lang_hi': 'हिन्दी (Hindi)',
    'settings.lang_hi_desc': 'सीपीसीबी समीर पोर्टल',
    'settings.theme_heading': 'स्क्रीन प्रकटन और थीम मोड (Appearance)',
    'settings.theme_sub': 'दिन के काम के लिए लाइट थीम या २४ घंटे निगरानी के लिए डार्क मिनरल ग्रेफाइट थीम चुनें.',
    'settings.theme_dark': 'डार्क कमांड कैनवास (अनुशंसित)',
    'settings.theme_light': 'लाइट संस्थागत कैनवास',
    'settings.font_heading': 'प्रकटन सुलभता और फ़ॉन्ट आकार स्केलिंग (Font Size)',
    'settings.font_sub': 'डैशबोर्ड टेक्स्ट, कतार मेट्रिक्स और कानूनी नोटिस को आसानी से पढ़ने के लिए फ़ॉन्ट आकार समायोजित करें.',
    'settings.font_normal': 'मानक (100%)',
    'settings.font_normal_desc': 'हाई-डेफिनिशन डेस्कटॉप मॉनिटर के लिए डिफ़ॉल्ट आकार.',
    'settings.font_large': 'मध्यम (+12.5%)',
    'settings.font_large_desc': 'लैपटॉप स्क्रीन और लंबे समय तक देखने के लिए आरामदायक.',
    'settings.font_xl': 'बड़ा (+25%)',
    'settings.font_xl_desc': 'कमांड रूम की बड़ी दीवार स्क्रीन और प्रोजेक्टर के लिए उपयुक्त.',
    'settings.font_preview_label': 'लाइव फ़ॉन्ट स्केलिंग पूर्वावलोकन:',
    'settings.font_preview_sample': 'पीएमसी हडपसर औद्योगिक क्षेत्र: AQI 388 (खतरनाक) · एसएलए अवधि 2.1 घंटे में समाप्त',
    'settings.auth_heading': 'अधिकारी पहचान और सत्र प्रमाणीकरण (Authentication)',
    'settings.auth_sub': 'सक्रिय अधिकारी क्रेडेंशियल, डिजिटल हस्ताक्षर प्रमाणपत्र (डीएससी) और सत्र प्रबंधन.',
    'settings.auth_logout_btn': 'सत्र समाप्त करें और लॉग आउट करें',
    'settings.auth_login_btn': 'पुनः लॉगिन करें (Re-authenticate)',
    'settings.auth_logged_out_title': 'अधिकारी सत्र समाप्त हो गया है',
    'settings.auth_logged_out_desc': 'अनधिकृत वैधानिक आदेशों को रोकने के लिए वर्कस्टेशन को सुरक्षित रूप से लॉक कर दिया गया है.',
    'settings.sla_heading': 'वैधानिक SLA और सेंसर ट्रिगर नियम',
    'settings.sla_sub': 'एसएलए प्रवर्तन थ्रेशोल्ड और CAAQMS स्वचालित एस्केलेशन ट्रिगर कॉन्फ़िगर करें.',
    'settings.weights_heading': 'प्राथमिकता फॉर्मूला वज़न समायोजन',
    'settings.weights_sub': 'ट्राइएज एल्गोरिदम द्वारा हॉटस्पॉट रैंकिंग के लिए उपयोग किए जाने वाले वेटेड स्कोरिंग मॉडल को समायोजित करें.',
    'settings.demo_heading': 'ऑनबोर्डिंग टूर और डेमो नियंत्रण',
    'settings.demo_sub': 'निर्देशित वर्कफ़्लो वॉकथ्रू और डेमो के लिए सिंथेटिक डेटा सीडिंग.',
  },
};

const SettingsContext = createContext<SettingsContextType>({
  language: 'en', setLanguage: () => {},
  fontSize: 'normal', setFontSize: () => {},
  user: DEFAULT_OFFICER, logout: () => {}, login: () => {},
  t: (key, defaultText) => defaultText || key,
  wardScope: 'all', setWardScope: () => {},
  slaWarningHours: 6, setSlaWarningHours: () => {},
  caaqmsTriggerAqi: 350, setCaaqmsTriggerAqi: () => {},
  priorityWeights: CPCB_BASELINE_WEIGHTS, setPriorityWeights: () => {},
  notificationsEnabled: true, setNotificationsEnabled: () => {},
  soundAlerts: true, setSoundAlerts: () => {},
  autoRefreshRate: 30, setAutoRefreshRate: () => {},
  aiStrictness: 'statutory', setAiStrictness: () => {},
  highContrast: false, setHighContrast: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airsense-language') as AppLanguage | null;
      if (saved && ['en','mr','hi'].includes(saved)) return saved;
    }
    return 'en';
  });
  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') localStorage.setItem('airsense-language', lang);
  };

  const [fontSize, setFontSizeState] = useState<FontSizeScale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airsense-font-size') as FontSizeScale | null;
      if (saved && ['normal','large','xl'].includes(saved)) return saved;
    }
    return 'normal';
  });
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = fontSize === 'normal' ? '16px' : fontSize === 'large' ? '18px' : '20px';
      localStorage.setItem('airsense-font-size', fontSize);
    }
  }, [fontSize]);
  const setFontSize = (size: FontSizeScale) => setFontSizeState(size);

  const [user, setUser] = useState<OfficerProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airsense-officer-session');
      if (saved) { try { return JSON.parse(saved); } catch { /* */ } }
    }
    return DEFAULT_OFFICER;
  });
  const logout = () => setUser(prev => {
    const u = { ...prev, loggedIn: false };
    if (typeof window !== 'undefined') localStorage.setItem('airsense-officer-session', JSON.stringify(u));
    return u;
  });
  const login = () => setUser(prev => {
    const u = { ...prev, loggedIn: true, loginTime: 'Just now (CPCB SSO Verified)' };
    if (typeof window !== 'undefined') localStorage.setItem('airsense-officer-session', JSON.stringify(u));
    return u;
  });

  const [wardScope, setWardScopeState] = useState<WardScope>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airsense-ward-scope') as WardScope | null;
      if (saved && ['all','ward14','ward8'].includes(saved)) return saved;
    }
    return 'all';
  });
  const setWardScope = (ward: WardScope) => {
    setWardScopeState(ward);
    if (typeof window !== 'undefined') localStorage.setItem('airsense-ward-scope', ward);
  };

  const [slaWarningHours, setSlaWarningHoursState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airsense-sla-hours');
      if (saved) return parseInt(saved, 10);
    }
    return 6;
  });
  const setSlaWarningHours = (h: number) => {
    setSlaWarningHoursState(h);
    if (typeof window !== 'undefined') localStorage.setItem('airsense-sla-hours', String(h));
  };

  const [caaqmsTriggerAqi, setCaaqmsTriggerAqiState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airsense-caaqms-aqi');
      if (saved) return parseInt(saved, 10);
    }
    return 350;
  });
  const setCaaqmsTriggerAqi = (v: number) => {
    setCaaqmsTriggerAqiState(v);
    if (typeof window !== 'undefined') localStorage.setItem('airsense-caaqms-aqi', String(v));
  };

  const [priorityWeights, setPriorityWeightsState] = useState<PriorityWeights>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airsense-priority-weights');
      if (saved) { try { return JSON.parse(saved); } catch { /* */ } }
    }
    return CPCB_BASELINE_WEIGHTS;
  });
  const setPriorityWeights = (w: PriorityWeights) => {
    setPriorityWeightsState(w);
    if (typeof window !== 'undefined') localStorage.setItem('airsense-priority-weights', JSON.stringify(w));
  };

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoRefreshRate, setAutoRefreshRate] = useState(30);
  const [aiStrictness, setAiStrictness] = useState<'statutory' | 'advisory' | 'emergency'>('statutory');
  const [highContrast, setHighContrast] = useState(false);

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict[key]) return langDict[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return defaultText || key;
  };

  return (
    <SettingsContext.Provider value={{
      language, setLanguage,
      fontSize, setFontSize,
      user, logout, login, t,
      wardScope, setWardScope,
      slaWarningHours, setSlaWarningHours,
      caaqmsTriggerAqi, setCaaqmsTriggerAqi,
      priorityWeights, setPriorityWeights,
      notificationsEnabled, setNotificationsEnabled,
      soundAlerts, setSoundAlerts,
      autoRefreshRate, setAutoRefreshRate,
      aiStrictness, setAiStrictness,
      highContrast, setHighContrast,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
