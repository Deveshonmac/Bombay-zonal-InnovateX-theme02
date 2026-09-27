import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle, 
  MapPin, 
  Sliders, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';

export interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  // Action to run before spotlighting to ensure element is mounted / visible in view
  beforeStep?: () => void;
}

export interface OfficerWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStep?: (stepIndex: number) => void;
}

const TOUR_STORAGE_KEY = 'airsense_tour_seen';

export const OfficerWalkthrough: React.FC<OfficerWalkthroughProps> = ({
  isOpen,
  onClose,
  onNavigateToStep,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 100, left: 100 });
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Requirement 1: Reset-on-Launch Bug Fix
  // Whenever the tour opens, explicitly reset currentStepIndex to 0 (Step 1)
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  const steps: TourStep[] = [
    {
      targetSelector: '[data-tour="hotspot-pin"]',
      title: 'Geospatial Incident Hotspots',
      description:
        '500+ raw citizen complaints are automatically deduplicated into geographic clusters. Marker size reflects complaint volume.',
      icon: <MapPin className="w-4 h-4 text-sky-500" />,
      badge: 'Step 1 of 6',
      preferredPlacement: 'right',
    },
    {
      targetSelector: '[data-tour="inspect-btn"]',
      title: 'Incident Inspection',
      description:
        "Click 'Inspect' to open the complete cluster dossier containing all merged CPCB SAMEER tickets and citizen photo evidence.",
      icon: <FileText className="w-4 h-4 text-emerald-500" />,
      badge: 'Step 2 of 6',
      preferredPlacement: 'bottom',
    },
    {
      targetSelector: '[data-tour="explainability-btn"]',
      title: 'Mathematical Score Explainability',
      description:
        'Transparency first: See exactly how complaint volume, source severity, the 24h SLA clock, and local AQI combine into the priority score.',
      icon: <Sliders className="w-4 h-4 text-amber-500" />,
      badge: 'Step 3 of 6',
      preferredPlacement: 'left',
    },
    {
      targetSelector: '[data-tour="generate-directive-btn"]',
      title: 'Statutory Directive Assistant',
      description:
        'Drafts reviewable administrative directives citing PMC departments and Air Act 1981 §31A provisions in seconds.',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
      badge: 'Step 4 of 6',
      preferredPlacement: 'left',
    },
    {
      targetSelector: '[data-tour="mark-actioned-btn"]',
      title: 'Field Action & Evidence Capture',
      description:
        'Opens the resolution modal to attach field squad verification photos and prepare documentary proof.',
      icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
      badge: 'Step 5 of 6',
      preferredPlacement: 'top',
    },
    {
      targetSelector: '[data-tour="submit-resolution-btn"]',
      title: 'Closed-Loop Outcome Verification',
      description:
        'Stops the statutory 24-hour SLA clock and permanently logs the pre- vs post-intervention AQI delta to verify environmental improvement.',
      icon: <ShieldCheck className="w-4 h-4 text-sky-500" />,
      badge: 'Step 6 of 6',
      preferredPlacement: 'top',
    },
  ];

  const currentStep = steps[currentStepIndex];

  // Helper to mark tour finished/skipped:
  // Sets isOpen = false via onClose, resets step index to 0, and writes boolean first-visit flag.
  const handleFinishOrSkip = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      localStorage.setItem('airsense_tour_completed', 'true');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    setCurrentStepIndex(0);
    onClose();
  }, [onClose]);

  // Position calculation with viewport bounding
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const selector = currentStep.targetSelector;
    let el = document.querySelector(selector) as HTMLElement | null;

    // Fallbacks if element hasn't mounted yet or is currently hidden
    if (!el) {
      if (selector === '[data-tour="hotspot-pin"]') {
        el = document.querySelector('.airsense-cluster-marker') as HTMLElement | null;
      } else if (selector === '[data-tour="inspect-btn"]') {
        el = document.querySelector('.inspect-action-btn') as HTMLElement | null;
      }
    }

    if (el) {
      const rect = el.getBoundingClientRect();
      // Ensure target is on screen; if off screen, try scrolling into view
      if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } catch {
          // safe ignore
        }
      }

      setTargetRect(rect);

      // Compute popover placement
      const popoverWidth = 360;
      const popoverHeight = 220;
      const margin = 18;

      let top = rect.bottom + margin;
      let left = rect.left + rect.width / 2 - popoverWidth / 2;

      const placement = currentStep.preferredPlacement || 'auto';

      if (placement === 'bottom') {
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - popoverWidth / 2;
      } else if (placement === 'top') {
        top = rect.top - popoverHeight - margin;
        left = rect.left + rect.width / 2 - popoverWidth / 2;
      } else if (placement === 'left') {
        top = rect.top + rect.height / 2 - popoverHeight / 2;
        left = rect.left - popoverWidth - margin;
      } else if (placement === 'right') {
        top = rect.top + rect.height / 2 - popoverHeight / 2;
        left = rect.right + margin;
      }

      // Flip if overflowing vertically
      if (top + popoverHeight > window.innerHeight - 16) {
        if (rect.top - popoverHeight - margin > 16) {
          top = rect.top - popoverHeight - margin;
        } else {
          top = Math.max(16, window.innerHeight - popoverHeight - 16);
        }
      }
      if (top < 16) {
        top = Math.min(window.innerHeight - popoverHeight - 16, Math.max(16, rect.bottom + margin));
      }

      // Flip/clamp horizontally
      if (left + popoverWidth > window.innerWidth - 16) {
        if (rect.left - popoverWidth - margin > 16) {
          left = rect.left - popoverWidth - margin;
        } else {
          left = Math.max(16, window.innerWidth - popoverWidth - 16);
        }
      }
      if (left < 16) {
        left = 16;
      }

      setPopoverPos({ top, left });
    } else {
      // Element not in DOM right now: fallback to centered card
      setTargetRect(null);
      setPopoverPos({
        top: Math.max(20, (window.innerHeight - 240) / 2),
        left: Math.max(20, (window.innerWidth - 360) / 2),
      });
    }
  }, [isOpen, currentStep]);

  // Continuously track target position with requestAnimationFrame to handle animations/resizes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loop = () => {
      if (!isMounted) return;
      updateTargetPosition();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    const handleWindowResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      updateTargetPosition();
    };

    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      isMounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [isOpen, updateTargetPosition]);

  // Handle step switching and trigger dashboard view updates
  useEffect(() => {
    if (!isOpen) return;
    if (onNavigateToStep) {
      onNavigateToStep(currentStepIndex);
    }
    // Delay slightly to give the dashboard/DOM time to render the view
    const timer = setTimeout(() => {
      updateTargetPosition();
    }, 200);
    return () => clearTimeout(timer);
  }, [isOpen, currentStepIndex, onNavigateToStep, updateTargetPosition]);

  // Global Keyboard shortcuts: Esc to skip, ArrowRight for Next, ArrowLeft for Prev
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleFinishOrSkip();
      } else if (e.key === 'ArrowRight') {
        if (currentStepIndex < steps.length - 1) {
          e.preventDefault();
          setCurrentStepIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          e.preventDefault();
          setCurrentStepIndex(prev => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, currentStepIndex, steps.length, handleFinishOrSkip]);

  const spotlightPadding = 8;
  const l = targetRect ? Math.max(0, Math.round(targetRect.left - spotlightPadding)) : 0;
  const t = targetRect ? Math.max(0, Math.round(targetRect.top - spotlightPadding)) : 0;
  const r = targetRect ? Math.min(windowSize.width, Math.round(targetRect.right + spotlightPadding)) : 0;
  const b = targetRect ? Math.min(windowSize.height, Math.round(targetRect.bottom + spotlightPadding)) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="officer-walkthrough-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed inset-0 z-50 pointer-events-auto select-none overflow-hidden"
        >
          {/* 1. Cinematic Dim Backdrop with Smooth Clip-Path Cutout Transition */}
          <div
            onClick={handleFinishOrSkip}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md transition-opacity duration-500 ease-out pointer-events-auto cursor-pointer"
            style={{
              clipPath: targetRect
                ? `polygon(
                    0% 0%, 
                    0% 100%, 
                    ${l}px 100%, 
                    ${l}px ${t}px, 
                    ${r}px ${t}px, 
                    ${r}px ${b}px, 
                    ${l}px ${b}px, 
                    ${l}px 100%, 
                    100% 100%, 
                    100% 0%
                  )`
                : undefined,
              transition: 'clip-path 500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms ease-out',
            }}
            title="Click backdrop to exit walkthrough"
          />

          {/* 2. Elevated Dynamic Spotlight Frame & Target Accent Halo */}
          {targetRect && (
            <div
              className="fixed pointer-events-none z-50 rounded-lg ring-2 ring-sky-400/90 shadow-[0_0_30px_rgba(56,189,248,0.35)] animate-pulse transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                top: `${t}px`,
                left: `${l}px`,
                width: `${Math.max(0, r - l)}px`,
                height: `${Math.max(0, b - t)}px`,
              }}
            >
              {/* Subtle halo accent pip beacon */}
              <span className="absolute -top-1 -left-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]"></span>
              </span>
            </div>
          )}

          {/* 3. Floating Tooltip Popover Card with Glassmorphism & Entry Animation */}
          <div
            ref={popoverRef}
            key={currentStepIndex}
            onClick={e => e.stopPropagation()}
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              transition: 'top 500ms cubic-bezier(0.16, 1, 0.3, 1), left 500ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="fixed z-50 w-full max-w-[360px] animate-in fade-in-0 zoom-in-95 duration-300 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 rounded-xl text-zinc-900 dark:text-zinc-100 font-sans pointer-events-auto"
          >
            {/* Top Header Row: Step Badge + Title + Close Button */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 border border-sky-200/80 dark:border-sky-800/80 px-2 py-0.5 rounded shadow-2xs">
                  {currentStep?.badge || `Step ${currentStepIndex + 1} of ${steps.length}`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleFinishOrSkip}
                aria-label="Skip / Exit Tour"
                title="Skip Tour (Esc)"
                className="w-6 h-6 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step Title & Icon */}
            <div className="flex items-center gap-2 mb-2">
              {currentStep?.icon && (
                <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 shrink-0">
                  {currentStep.icon}
                </div>
              )}
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-snug">
                {currentStep?.title}
              </h3>
            </div>

            {/* Step Description */}
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
              {currentStep?.description}
            </p>

            {/* Step Indicator Dots & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentStepIndex(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === currentStepIndex
                        ? 'w-5 bg-sky-500'
                        : 'w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400'
                    }`}
                    title={`Go to Step ${i + 1}`}
                    aria-label={`Go to Step ${i + 1}`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentStepIndex === 0}
                  onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                {currentStepIndex < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStepIndex(prev => prev + 1)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishOrSkip}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Finish Tour</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfficerWalkthrough;
