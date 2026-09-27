import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Pause,
  CheckCircle2,
  MapPin,
  Flame,
  Shield,
  Clock,
  TrendingDown,
  Layers,
  ArrowRight,
  Sliders,
  Scale,
} from 'lucide-react';

export interface TourStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  tabTarget: 'queue' | 'map' | 'impact';
  clusterTargetId?: number;
  badge: string;
  icon: any;
  metricLabel: string;
  metricValue: string;
  metricComparison: string;
  description: string;
  keyInnovations: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    title: 'Citizen Influx Ingestion (620 Reports)',
    subtitle: 'From Raw Noise to Structured Telemetry',
    tabTarget: 'queue',
    clusterTargetId: 1,
    badge: 'STAGE 1 // INGESTION',
    icon: Flame,
    metricLabel: 'Incoming Reports',
    metricValue: '620 Reports',
    metricComparison: 'Unstructured Pune citizen mobile complaints',
    description:
      'Traditional municipal call centers and citizen apps receive hundreds of scattered complaints. Reviewing 620 complaints individually at 8 minutes each consumes 82.6 officer hours, causing massive SLA backlog and delayed field dispatch.',
    keyInnovations: [
      'SQLite database storing 620 multi-category Pune complaints with GPS & AQI telemetry',
      'Instant parallel ingestion API with sub-millisecond response',
      'Multi-hazard coverage: Industrial emissions, Construction dust, Biomass, Garbage burning, Vehicular exhaust',
    ],
  },
  {
    stepNumber: 2,
    title: 'DBSCAN Spatial Hotspot Clustering',
    subtitle: 'Haversine Spherical Density Reduction',
    tabTarget: 'map',
    clusterTargetId: 1,
    badge: 'STAGE 2 // CLUSTERING',
    icon: Layers,
    metricLabel: 'Data Reduction',
    metricValue: '620 → 6 Clusters',
    metricComparison: '99.0% reduction in review targets',
    description:
      'Our spatial clustering engine executes Scikit-Learn DBSCAN with Haversine spherical distance (eps = 2.5 km). It groups nearby duplicates and multi-resident reports into single physical incident footprints.',
    keyInnovations: [
      'DBSCAN algorithm detects non-linear spatial density clusters without pre-specifying cluster counts',
      'Dynamic incident centroid and radius calculation (up to 2.5 km boundary)',
      'Direct Leaflet map visualization with volume-proportional pulsing pins',
    ],
  },
  {
    stepNumber: 3,
    title: '0–100 Explainable Priority Scoring',
    subtitle: 'Replacing FIFO with Urgency-Ranked Triage',
    tabTarget: 'queue',
    clusterTargetId: 1,
    badge: 'STAGE 3 // TRIAGE',
    icon: Sliders,
    metricLabel: 'Top Priority Hotspot',
    metricValue: '95.1 / 100',
    metricComparison: 'Bhosari MIDC (Critical - 4h SLA)',
    description:
      'Government agencies historically process grievances in First-In-First-Out (FIFO) order. AirSense replaces this with a transparent 4-factor mathematical scoring model that surfaces high-risk emergencies first.',
    keyInnovations: [
      '35% Volume Weight: Scales logarithmically with resident outcry volume',
      '25% Hazard Severity: Toxic industrial & chemical fires prioritized over light dust',
      '25% Zone Ambient AQI: Integrated sensor telemetry (AQI > 350 earns top points)',
      '15% SLA Aging: Prevents open incidents from being starved over time',
    ],
  },
  {
    stepNumber: 4,
    title: 'Ground-Actionable AI Field Directives',
    subtitle: 'Gemini 3.6 Flash Municipal Action Protocols',
    tabTarget: 'queue',
    clusterTargetId: 1,
    badge: 'STAGE 4 // DIRECTIVE',
    icon: Shield,
    metricLabel: 'Legal Authority',
    metricValue: 'Air Act Sec 31A',
    metricComparison: 'Enforceable under SWM Rules 2016',
    description:
      'Generative AI is often too generic. We designed structured prompts grounding Gemini 3.6 Flash in Maharashtra Pollution Control Board (MPCB) and Pune Municipal Corporation (PMC) field standards, providing concrete sequential steps and legal backing.',
    keyInnovations: [
      'Staged SLA Timeframe Badges: Immediate 0–2h, Within 4h, Within 8h',
      'Inter-Agency Assignment: Routing specific tasks to MPCB Flying Squad, PMC Misting Cell, Traffic Police',
      '1-Click Printable Government Dispatch Order with official legal citations and verification stamp',
    ],
  },
  {
    stepNumber: 5,
    title: 'Resolution Logging & 98.2% Officer ROI',
    subtitle: 'Measurable Clean Air Gain & Accountability',
    tabTarget: 'impact',
    clusterTargetId: 2,
    badge: 'STAGE 5 // OUTCOME',
    icon: TrendingDown,
    metricLabel: 'Net Officer Time Saved',
    metricValue: '81.1 Hours',
    metricComparison: '98.2% reduction in municipal triage overhead',
    description:
      'Closing the loop: officers log physical interventions, and AirSense automatically measures before/after AQI drop, calculating citizen exposure reduction and municipal taxpayer time savings.',
    keyInnovations: [
      'Empirical AQI Delta: -30.3% average local particulate reduction measured post-intervention',
      '82.6 manual hours reduced to 1.5 hours of cluster review (98.2% time reduction)',
      'Permanent municipal audit log with before/after sensor telemetry and officer digital signatures',
    ],
  },
];

interface JudgeDemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'queue' | 'map' | 'impact') => void;
  onSelectCluster: (clusterId: number) => void;
}

export const JudgeDemoTourModal: React.FC<JudgeDemoTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectCluster,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const step = TOUR_STEPS[currentStepIndex];
  const StepIcon = step.icon;

  // Auto sync view on step change
  useEffect(() => {
    if (isOpen) {
      onNavigateTab(step.tabTarget);
      if (step.clusterTargetId) {
        onSelectCluster(step.clusterTargetId);
      }
    }
  }, [currentStepIndex, isOpen]);

  // Autoplay timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && isOpen) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= TOUR_STEPS.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-zinc-900 text-white rounded-3xl shadow-2xl border border-zinc-700/80 overflow-hidden flex flex-col my-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950/80 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
                  Judge Demo Tour
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold">
                  Step {step.stepNumber} of {TOUR_STEPS.length}
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-100">
                End-to-End Municipal Air Quality Intelligence in 60s
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
              title={isPlaying ? 'Pause Auto-Play' : 'Auto-Play 60s Tour'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Playing...' : 'Auto-Play'}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar Indicator */}
        <div className="w-full bg-zinc-800 h-1 flex">
          {TOUR_STEPS.map((s, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentStepIndex(idx)}
              className={`flex-1 h-full cursor-pointer transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                  : idx < currentStepIndex
                  ? 'bg-emerald-500'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Badge & Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/10 border border-amber-400/30 text-amber-300">
              <StepIcon className="w-3.5 h-3.5" />
              <span>{step.badge}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              {step.title}
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              {step.subtitle}
            </p>
          </div>

          {/* Key Metric Hero Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
            <div className="sm:col-span-1 border-b sm:border-b-0 sm:border-r border-zinc-800 pb-3 sm:pb-0 sm:pr-4">
              <span className="text-[11px] uppercase font-bold text-zinc-400 block mb-1">
                {step.metricLabel}
              </span>
              <div className="text-2xl font-black text-amber-400 tracking-tight">
                {step.metricValue}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                {step.metricComparison}
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-col justify-center text-xs text-zinc-300 leading-relaxed">
              {step.description}
            </div>
          </div>

          {/* Technical Innovations List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Core Technical Deliverables & Architecture
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {step.keyInnovations.map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-xs flex items-start gap-2.5 text-zinc-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950/90 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-200 flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
              Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onNavigateTab(step.tabTarget);
                if (step.clusterTargetId) onSelectCluster(step.clusterTargetId);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              Inspect Dashboard Tab
            </button>

            {currentStepIndex < TOUR_STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finish Tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
