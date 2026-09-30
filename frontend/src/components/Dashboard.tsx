import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Menu, 
  Radio, 
  ListOrdered, 
  PanelRightOpen, 
  PanelLeftOpen,
  Sun,
  Moon
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { InteractiveMap } from './InteractiveMap';
import { PriorityQueue } from './PriorityQueue';
import { ClusterDetail } from './ClusterDetail';
import { AdminActionModal } from './AdminActionModal';
import { AuditLogsView } from './AuditLogsView';
import { SystemHealthView } from './SystemHealthView';
import { ImpactLogView } from './ImpactLogView';
import { ResolveIncidentModal } from './ResolveIncidentModal';
import { SettingsView } from './SettingsView';
import { OfficerWalkthrough } from './OfficerWalkthrough';
import { InterventionIntelligenceModal } from './InterventionIntelligenceModal';
import { ErrorBoundary } from './ErrorBoundary';
import { StatutoryRecommendation } from '../services/geminiService';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { 
  IncidentCluster, 
  ComplaintCategory, 
  TicketStatus, 
  AuditActionLog, 
  NavTab,
  ResolutionRecord
} from '../types';
import { INITIAL_CLUSTERS, INITIAL_AUDIT_LOGS } from '../data/mockData';
import { fetchLiveClusters } from '../services/clusterService';

export const Dashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t, user } = useSettings();
  const [clusters, setClusters] = useState<IncidentCluster[]>(INITIAL_CLUSTERS);
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock');
  const [auditLogs, setAuditLogs] = useState<AuditActionLog[]>(INITIAL_AUDIT_LOGS);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  
  // Navigation tab state: 'triage' | 'queue' | 'impact_log' | 'audit_logs' | 'system_health'
  const [currentTab, setCurrentTab] = useState<NavTab>('triage');

  // Category and search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | ComplaintCategory>('all');

  // Active admin modal target
  const [adminModalCluster, setAdminModalCluster] = useState<IncidentCluster | null>(null);
  const [adminModalPrefill, setAdminModalPrefill] = useState<{
    targetAgency?: string;
    directive?: string;
    legalProvision?: string;
    rationale?: string;
  } | undefined>(undefined);

  // Active resolution modal target
  const [resolveModalCluster, setResolveModalCluster] = useState<IncidentCluster | null>(null);

  // Intervention Intelligence Modal state
  const [interventionModalCluster, setInterventionModalCluster] = useState<IncidentCluster | null>(null);
  const [interventionModalRec, setInterventionModalRec] = useState<StatutoryRecommendation | null>(null);

  // Guided Officer Tour state
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Tour step orchestrator: automatically switches dashboard tabs, panes, and modals
  const handleTourStepChange = (stepIndex: number) => {
    // Ensure we pick an active cluster with tickets for rich demonstration
    const activeCluster = clusters.find(c => c.cluster_id === 'CLUST-PUN-02') || clusters[0];
    if (activeCluster && selectedClusterId !== activeCluster.cluster_id) {
      setSelectedClusterId(activeCluster.cluster_id);
    }

    if (stepIndex === 0) {
      // Step 1: Target [data-tour="hotspot-pin"] on InteractiveMap
      setCurrentTab('triage');
      setMobileTriageView('map');
      setRightPaneView('queue');
      setResolveModalCluster(null);
      setAdminModalCluster(null);
      setIsQueueCollapsed(false);
    } else if (stepIndex === 1) {
      // Step 2: Target [data-tour="inspect-btn"] inside hotspot popup
      setCurrentTab('triage');
      setMobileTriageView('map');
      setRightPaneView('queue');
      setResolveModalCluster(null);
      setAdminModalCluster(null);
      setIsQueueCollapsed(false);
      // Ensure the popup for the selected cluster is open
      setTimeout(() => {
        window.dispatchEvent(new Event('leaflet-invalidate-size'));
      }, 100);
    } else if (stepIndex === 2) {
      // Step 3: Target [data-tour="explainability-btn"] on top priority queue card
      setCurrentTab('triage');
      setRightPaneView('queue');
      setIsQueueCollapsed(false);
      setMobileTriageView('queue');
      setResolveModalCluster(null);
      setAdminModalCluster(null);
    } else if (stepIndex === 3) {
      // Step 4: Target [data-tour="generate-directive-btn"] in ClusterDetail.tsx
      setCurrentTab('triage');
      setRightPaneView('detail');
      setIsQueueCollapsed(false);
      setResolveModalCluster(null);
      setAdminModalCluster(null);
    } else if (stepIndex === 4) {
      // Step 5: Target [data-tour="mark-actioned-btn"]
      setCurrentTab('triage');
      setRightPaneView('detail');
      setIsQueueCollapsed(false);
      setResolveModalCluster(null);
      setAdminModalCluster(null);
    } else if (stepIndex === 5) {
      // Step 6: Target [data-tour="submit-resolution-btn"] inside ResolveIncidentModal.tsx
      setCurrentTab('triage');
      if (activeCluster) {
        setResolveModalCluster(activeCluster);
      }
    }
  };

  // Launch guided walkthrough: switches activeView to 'map' / 'triage' and triggers Step 1 immediately
  const handleStartTour = useCallback(() => {
    setCurrentTab('triage');
    setMobileTriageView('map');
    setRightPaneView('queue');
    setIsQueueCollapsed(false);
    setResolveModalCluster(null);
    setAdminModalCluster(null);

    const activeCluster = clusters.find(c => c.cluster_id === 'CLUST-PUN-02') || clusters[0];
    if (activeCluster) {
      setSelectedClusterId(activeCluster.cluster_id);
    }

    // Explicitly reset step orchestrator to Step 1 (index 0)
    handleTourStepChange(0);

    setTimeout(() => {
      window.dispatchEvent(new Event('leaflet-invalidate-size'));
      window.dispatchEvent(new Event('resize'));
    }, 60);

    setIsTourOpen(true);
  }, [clusters]);

  // Right pane view mode: 'queue' (default) or 'detail'
  const [rightPaneView, setRightPaneView] = useState<'queue' | 'detail'>('queue');

  // Collapsible Right Pane state (desktop)
  const [isQueueCollapsed, setIsQueueCollapsed] = useState(false);

  // Resizable Right Sidebar state (clamped between 300px and 650px, default 420px)
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [isDragging, setIsDragging] = useState(false);
  const triageContainerRef = useRef<HTMLDivElement>(null);

  // 1. Resizable & Fully Collapsible Left Sidebar state
  // Clamped between 180px and 380px, default 250px. When dragged < 130px, snaps to complete collapse.
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(250);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isLeftDragging, setIsLeftDragging] = useState(false);
  const previousLeftWidth = useRef(250);

  // Desktop media check to prevent style overriding on mobile
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  // Try to load live DBSCAN clusters from Python backend; fall back to mock data silently
  useEffect(() => {
    fetchLiveClusters().then(result => {
      if (result.source === 'live' && result.clusters.length > 0) {
        setClusters(result.clusters);
        setDataSource('live');
        setSelectedClusterId(result.clusters[0]?.cluster_id ?? null);
      }
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Left Sidebar Drag Handler: smooth resizing with requestAnimationFrame + snap to complete collapse (< 130px)
  useEffect(() => {
    if (!isLeftDragging) return;

    let rafId: number | null = null;
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const rawWidth = e.clientX;
        if (rawWidth < 130) {
          setIsLeftSidebarCollapsed(true);
        } else {
          setIsLeftSidebarCollapsed(false);
          const clamped = Math.min(380, Math.max(180, rawWidth));
          setLeftSidebarWidth(clamped);
          previousLeftWidth.current = clamped;
        }
      });
    };

    const handleMouseUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      setIsLeftDragging(false);
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      window.dispatchEvent(new Event('leaflet-invalidate-size'));
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isLeftDragging]);

  const handleLeftDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLeftDragging(true);
  };

  // Right Sidebar Drag Handler: smooth resizing with requestAnimationFrame + snap to complete collapse (< 220px)
  useEffect(() => {
    if (!isDragging) return;

    let rafId: number | null = null;
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!triageContainerRef.current) return;
        const rect = triageContainerRef.current.getBoundingClientRect();
        const rawWidth = rect.right - e.clientX;
        
        if (rawWidth < 220) {
          setIsQueueCollapsed(true);
        } else {
          setIsQueueCollapsed(false);
          const clamped = Math.min(650, Math.max(300, rawWidth));
          setSidebarWidth(clamped);
        }
      });
    };

    const handleMouseUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      setIsDragging(false);
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      window.dispatchEvent(new Event('leaflet-invalidate-size'));
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Mobile navigation drawer state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Mobile triage view toggle: 'map' (default) or 'queue'
  const [mobileTriageView, setMobileTriageView] = useState<'map' | 'queue'>('map');

  // Aggregate metrics
  const criticalCount = useMemo(() => {
    return clusters.filter(c => c.hours_remaining < 6 && c.status !== 'resolved').length;
  }, [clusters]);

  const openCount = useMemo(() => {
    return clusters.filter(c => c.status !== 'resolved').length;
  }, [clusters]);

  const totalComplaints = useMemo(() => {
    return clusters.reduce((acc, c) => acc + c.complaint_count, 0);
  }, [clusters]);

  const resolvedCount = useMemo(() => {
    return clusters.filter(c => c.status === 'resolved' || c.resolution).length;
  }, [clusters]);

  // Selected cluster object
  const selectedCluster = useMemo(() => {
    return clusters.find(c => c.cluster_id === selectedClusterId) || null;
  }, [clusters, selectedClusterId]);

  // Global Keyboard Shortcuts & Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.tagName === 'SELECT';

      // Toggle Left sidebar with [ or Cmd+\ or Ctrl+\
      if (((e.metaKey || e.ctrlKey) && e.key === '\\') || (!isInput && e.key === '[')) {
        e.preventDefault();
        setIsLeftSidebarCollapsed(prev => !prev);
        window.dispatchEvent(new Event('leaflet-invalidate-size'));
        return;
      }

      // Toggle Right sidebar with Cmd+B, Ctrl+B, or ]
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') || (!isInput && e.key === ']')) {
        e.preventDefault();
        setIsQueueCollapsed(prev => !prev);
        window.dispatchEvent(new Event('leaflet-invalidate-size'));
        return;
      }

      // Toggle theme with 'd' when not typing
      if (!isInput && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleTheme();
        return;
      }

      if (e.key === 'Escape') {
        if (interventionModalCluster) {
          setInterventionModalCluster(null);
          setInterventionModalRec(null);
        } else if (resolveModalCluster) {
          setResolveModalCluster(null);
        } else if (adminModalCluster) {
          setAdminModalCluster(null);
          setAdminModalPrefill(undefined);
        } else if (rightPaneView === 'detail') {
          setRightPaneView('queue');
        } else if (currentTab !== 'triage') {
          setCurrentTab('triage');
        }
      }
    };

    const handleCustomToggle = () => {
      setIsLeftSidebarCollapsed(prev => !prev);
      window.dispatchEvent(new Event('leaflet-invalidate-size'));
    };

    const handleToggleRight = () => {
      setIsQueueCollapsed(prev => !prev);
      window.dispatchEvent(new Event('leaflet-invalidate-size'));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggle-left-sidebar', handleCustomToggle);
    window.addEventListener('toggle-queue', handleToggleRight);
    window.addEventListener('toggle-right-sidebar', handleToggleRight);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle-left-sidebar', handleCustomToggle);
      window.removeEventListener('toggle-queue', handleToggleRight);
      window.removeEventListener('toggle-right-sidebar', handleToggleRight);
    };
  }, [resolveModalCluster, adminModalCluster, rightPaneView, currentTab, toggleTheme]);

  // Update cluster status from nodal action
  const handleUpdateClusterStatus = (
    clusterId: string,
    newStatus: TicketStatus,
    actionNote: string,
    actionType: AuditActionLog['action_type']
  ) => {
    let updatedTitle = '';
    let oldStatus: TicketStatus = 'open';

    setClusters(prev =>
      prev.map(c => {
        if (c.cluster_id === clusterId) {
          updatedTitle = c.title;
          oldStatus = c.status;
          return {
            ...c,
            status: newStatus,
            hours_remaining: newStatus === 'resolved' ? c.hours_remaining : Math.max(0.5, c.hours_remaining)
          };
        }
        return c;
      })
    );

    // Record immutable audit log entry
    const newLog: AuditActionLog = {
      id: `AUD-${Math.floor(8822 + Math.random() * 900)}`,
      cluster_id: clusterId,
      cluster_title: updatedTitle || clusterId,
      action_type: actionType,
      officer_id: 'OFF-MH-PMC-018',
      officer_name: 'Smt. P. S. Jadhav (Nodal Officer)',
      timestamp: 'Today, Just now',
      details: actionNote,
      status_before: oldStatus,
      status_after: newStatus
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Resolution and Formal Closure with verified AQI delta & evidence
  const handleConfirmResolution = (
    clusterId: string,
    resolution: ResolutionRecord,
    officerRemarks: string
  ) => {
    let targetTitle = '';
    let previousStatus: TicketStatus = 'open';

    setClusters(prev =>
      prev.map(c => {
        if (c.cluster_id === clusterId) {
          targetTitle = c.title;
          previousStatus = c.status;
          return {
            ...c,
            status: 'resolved',
            resolution: resolution,
            avg_aqi: resolution.post_intervention_aqi,
            priority_score: Math.max(10, Math.round(c.priority_score * 0.2)),
            admin_action_label: 'Intervention Verified'
          };
        }
        return c;
      })
    );

    // Append to Audit Logs View
    const resolutionLog: AuditActionLog = {
      id: `AUD-${Math.floor(8830 + Math.random() * 900)}`,
      cluster_id: clusterId,
      cluster_title: targetTitle || clusterId,
      action_type: 'MARK_RESOLVED',
      officer_id: resolution.officer_id,
      officer_name: 'Smt. P. S. Jadhav (Nodal Officer)',
      timestamp: 'Today, Just now',
      details: `Resolution verified: ${resolution.action_summary}. Ambient AQI: ${resolution.pre_intervention_aqi} -> ${resolution.post_intervention_aqi} (${resolution.aqi_delta} delta, ${resolution.pm10_delta_percent}% drop). Attribution: ${resolution.sensor_station_id}. Note: ${officerRemarks}`,
      status_before: previousStatus,
      status_after: 'resolved'
    };

    setAuditLogs(prev => [resolutionLog, ...prev]);
  };

  // Manual Officer Priority Override Handler
  const handleUpdatePriorityOverride = (
    clusterId: string,
    overridePts: number,
    reason: string
  ) => {
    let clusterTitle = '';
    setClusters(prev =>
      prev.map(c => {
        if (c.cluster_id === clusterId) {
          clusterTitle = c.title;
          const baseScore = c.statutory_weights.complaint_spike + 
                            c.statutory_weights.high_pollutant_source + 
                            c.statutory_weights.sla_urgency + 
                            c.statutory_weights.ambient_delta;
          const adjustedScore = Math.min(100, Math.max(10, baseScore + overridePts));

          return {
            ...c,
            priority_score: adjustedScore,
            manual_override_pts: overridePts,
            override_reason: reason
          };
        }
        return c;
      })
    );

    if (overridePts !== 0) {
      const overrideLog: AuditActionLog = {
        id: `AUD-OVR-${Math.floor(1000 + Math.random() * 9000)}`,
        cluster_id: clusterId,
        cluster_title: clusterTitle || clusterId,
        action_type: 'ISSUE_STATUTORY_NOTICE',
        officer_id: 'OFF-MH-PMC-018',
        officer_name: 'Smt. P. S. Jadhav (Nodal Officer)',
        timestamp: 'Today, Just now',
        details: `Officer Manual Priority Override applied (${overridePts > 0 ? `+${overridePts}` : overridePts} pts). Statutory Ground Reason: ${reason}.`,
        status_before: 'open',
        status_after: 'open'
      };
      setAuditLogs(prev => [overrideLog, ...prev]);
    }
  };

  const handleSelectCluster = (clusterId: string) => {
    setSelectedClusterId(clusterId);
  };

  const handleOpenDetail = (clusterId: string) => {
    setSelectedClusterId(clusterId);
    setRightPaneView('detail');
    setIsQueueCollapsed(false);
    setMobileTriageView('queue');
  };

  const handleExecuteAdminAction = (
    cluster: IncidentCluster,
    prefill?: {
      targetAgency?: string;
      directive?: string;
      legalProvision?: string;
      rationale?: string;
    }
  ) => {
    setAdminModalCluster(cluster);
    setAdminModalPrefill(prefill);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-100 dark:bg-[#151210] text-slate-900 dark:text-[#F1F5F9] overflow-hidden font-sans select-none transition-colors">
      
      {/* 1. Left Sidebar: Resizable with Smooth Width Transitions & Snap-to-Collapse */}
      <motion.aside
        animate={{
          width: isDesktop ? (isLeftSidebarCollapsed ? 0 : leftSidebarWidth) : undefined,
        }}
        transition={
          isLeftDragging 
            ? { duration: 0 } 
            : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
        }
        onAnimationComplete={() => {
          window.dispatchEvent(new Event('leaflet-invalidate-size'));
          window.dispatchEvent(new Event('resize'));
        }}
        className={`h-full relative shrink-0 overflow-hidden ${
          isLeftSidebarCollapsed ? 'border-r-0 md:w-0' : 'border-r border-slate-200 dark:border-[#2D2825]'
        } ${isMobileNavOpen ? 'fixed inset-0 z-50 w-72' : 'hidden md:flex'}`}
      >
        <div 
          style={isDesktop ? { width: `${leftSidebarWidth}px`, minWidth: `${leftSidebarWidth}px` } : undefined}
          className="h-full w-full flex flex-col overflow-hidden"
        >
          <Sidebar
            activeTab={currentTab}
            onTabChange={tab => {
              setCurrentTab(tab);
              if (tab === 'queue') {
                setRightPaneView('queue');
                setMobileTriageView('queue');
                setIsQueueCollapsed(false);
              } else if (tab === 'triage') {
                setMobileTriageView('map');
              }
            }}
            criticalCount={criticalCount}
            openCount={openCount}
            totalComplaints={totalComplaints}
            resolvedCount={resolvedCount}
            isMobileOpen={isMobileNavOpen}
            onMobileClose={() => setIsMobileNavOpen(false)}
            isCollapsed={isLeftSidebarCollapsed}
            onToggleCollapse={() => {
              setIsLeftSidebarCollapsed(true);
              window.dispatchEvent(new Event('leaflet-invalidate-size'));
            }}
          />
        </div>
      </motion.aside>

      {/* Vertical Drag Handle Splitter for Left Sidebar */}
      {!isLeftSidebarCollapsed && isDesktop && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Left Sidebar"
          title="Drag to resize navigation (180px - 380px), shrink <130px to collapse, or double-click to toggle"
          onMouseDown={handleLeftDragStart}
          onDoubleClick={() => {
            setIsLeftSidebarCollapsed(true);
            window.dispatchEvent(new Event('leaflet-invalidate-size'));
          }}
          className={`hidden md:flex items-center justify-center w-1.5 hover:w-2 cursor-col-resize hover:bg-amber-500/80 active:bg-amber-600 bg-slate-200/90 dark:bg-[#252018] transition-all z-20 shrink-0 select-none group ${
            isLeftDragging ? 'bg-amber-500 w-2' : ''
          }`}
        >
          <div className="w-1 h-8 rounded-full bg-slate-400/80 dark:bg-[#2A3747] group-hover:bg-white group-hover:h-12 transition-all duration-200" />
          {isLeftDragging && (
            <div className="absolute top-6 left-2 bg-slate-900 dark:bg-[#1D1916] text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-md pointer-events-none z-30 whitespace-nowrap border border-slate-700 dark:border-[#2D2825]">
              {Math.round(leftSidebarWidth)}px {leftSidebarWidth < 140 ? '(Release to Collapse)' : ''}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen transparent drag overlay to prevent hover thrashing or pointer loss */}
      {(isDragging || isLeftDragging) && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto bg-transparent" />
      )}

      {/* Pinned Left Edge Expand Tab: ALWAYS visible on screen edge when left sidebar is collapsed */}
      {isLeftSidebarCollapsed && (
        <button
          type="button"
          onClick={() => {
            setIsLeftSidebarCollapsed(false);
            window.dispatchEvent(new Event('leaflet-invalidate-size'));
          }}
          aria-label="Expand Navigation Sidebar"
          title="Expand Navigation Sidebar (⌘\ or [)"
          className="fixed top-1/3 -translate-y-1/2 left-0 z-50 w-8 h-20 bg-white/95 dark:bg-[#1D1916] border border-l-0 border-slate-300 dark:border-[#2D2825] rounded-r-xl shadow-2xl flex flex-col items-center justify-center text-slate-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-50 dark:hover:bg-[#252018] hover:w-10 transition-all cursor-pointer select-none group"
        >
          <PanelLeftOpen className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Pinned Right Edge Expand Tab: ALWAYS visible on right screen edge when right sidebar is collapsed */}
      {isQueueCollapsed && isDesktop && currentTab === 'triage' && (
        <button
          type="button"
          onClick={() => {
            setIsQueueCollapsed(false);
            window.dispatchEvent(new Event('leaflet-invalidate-size'));
          }}
          aria-label="Expand Priority Queue"
          title="Expand Priority Queue (⌘B or ])"
          className="fixed top-1/3 -translate-y-1/2 right-0 z-50 w-8 h-20 bg-white/95 dark:bg-[#1D1916] border border-r-0 border-slate-300 dark:border-[#2D2825] rounded-l-xl shadow-2xl flex flex-col items-center justify-center text-slate-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-50 dark:hover:bg-[#252018] hover:w-10 transition-all cursor-pointer select-none group"
        >
          <PanelRightOpen className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
          <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Global Floating Reopen Button for Left Sidebar */}
      <AnimatePresence>
        {isLeftSidebarCollapsed && (
          <motion.button
            key="reopen-left-button"
            initial={{ opacity: 0, x: -20, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            type="button"
            onClick={() => {
              setIsLeftSidebarCollapsed(false);
              window.dispatchEvent(new Event('leaflet-invalidate-size'));
            }}
            className="fixed top-3 left-3 z-50 flex items-center gap-2 px-3.5 py-2 bg-white/95 dark:bg-[#1D1916]/95 backdrop-blur-md border border-slate-300 dark:border-[#2D2825] shadow-xl hover:shadow-2xl rounded-lg text-xs font-semibold text-slate-900 dark:text-[#F1F5F9] hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all cursor-pointer group select-none"
            title="Expand Navigation Sidebar ([ or ⌘\)"
          >
            <PanelLeftOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-sans">Navigation</span>
            <kbd className="hidden lg:inline text-[9px] text-slate-500 dark:text-[#94A3B8] font-mono bg-slate-100 dark:bg-[#151210] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#2D2825]">
              ⌘\
            </kbd>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Command Workspace */}
      <main className="flex-1 h-full flex flex-col overflow-hidden relative">
        {/* Mobile Header Bar */}
        <header className="md:hidden bg-white dark:bg-[#1D1916] border-b border-slate-200 dark:border-[#2D2825] px-3.5 py-2.5 flex items-center justify-between shrink-0 z-30 transition-colors">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="min-h-[44px] min-w-[44px] -ml-2 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-[#252018] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">AirSense</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded font-medium">
                B2G
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-[#94A3B8]">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1 rounded-md text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#252018] transition-colors"
              title="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <span>PMC Pune</span>
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${dataSource === 'live' ? 'bg-emerald-500' : 'bg-amber-500'}`}
              title={dataSource === 'live' ? 'DBSCAN Live Data' : 'Demo Data'}
            ></span>
            {dataSource === 'live' && (
              <span className="text-[10px] font-mono px-1 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded">
                LIVE
              </span>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 h-full w-full overflow-hidden flex flex-col"
            onAnimationComplete={() => {
              if (currentTab === 'triage') {
                window.dispatchEvent(new Event('leaflet-invalidate-size'));
                window.dispatchEvent(new Event('resize'));
              }
            }}
          >
            {currentTab === 'impact_log' ? (
              <ErrorBoundary fallbackTitle="Impact Log View Error">
                <div className="flex-1 h-full overflow-hidden">
                  <ImpactLogView
                    clusters={clusters}
                    onBackToTriage={() => setCurrentTab('triage')}
                    onInspectCluster={handleOpenDetail}
                    onToggleSidebar={() => setIsLeftSidebarCollapsed(prev => !prev)}
                    isSidebarCollapsed={isLeftSidebarCollapsed}
                  />
                </div>
              </ErrorBoundary>
            ) : currentTab === 'queue' ? (
              /* Mode 2: Priority Queue (Full-width scannable triage view) */
              <ErrorBoundary fallbackTitle="Priority Queue View Error">
                <div className="flex-1 h-full overflow-hidden flex bg-slate-50 dark:bg-[#151210] relative transition-colors">
                  <div className="flex-1 h-full overflow-hidden flex justify-center">
                    {rightPaneView === 'detail' && selectedCluster ? (
                      <div className="w-full max-w-4xl h-full bg-white dark:bg-[#1D1916] border-x border-slate-200 dark:border-[#2D2825] overflow-hidden shadow-xs">
                        <ClusterDetail
                          cluster={selectedCluster}
                          onBack={() => setRightPaneView('queue')}
                          onUpdateStatus={handleUpdateClusterStatus}
                          onOpenAdminModal={handleExecuteAdminAction}
                          onOpenResolveModal={cluster => setResolveModalCluster(cluster)}
                          onOpenInterventionModal={(cluster, rec) => {
                            setInterventionModalCluster(cluster);
                            setInterventionModalRec(rec);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full max-w-5xl h-full bg-white dark:bg-[#1D1916] border-x border-slate-200 dark:border-[#2D2825] overflow-hidden shadow-xs flex flex-col">
                        <PriorityQueue
                          clusters={clusters}
                          selectedClusterId={selectedClusterId}
                          onSelectCluster={handleSelectCluster}
                          onOpenDetail={handleOpenDetail}
                          onExecuteAdminAction={handleExecuteAdminAction}
                          onOpenResolveModal={cluster => setResolveModalCluster(cluster)}
                          onUpdatePriorityOverride={handleUpdatePriorityOverride}
                          filterCategory={filterCategory}
                          onFilterCategoryChange={setFilterCategory}
                          searchQuery={searchQuery}
                          onSearchChange={setSearchQuery}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </ErrorBoundary>
            ) : currentTab === 'audit_logs' ? (
              <ErrorBoundary fallbackTitle="Audit Logs View Error">
                <div className="flex-1 h-full overflow-hidden">
                  <AuditLogsView
                    logs={auditLogs}
                    onBackToTriage={() => setCurrentTab('triage')}
                    onToggleSidebar={() => setIsLeftSidebarCollapsed(prev => !prev)}
                    isSidebarCollapsed={isLeftSidebarCollapsed}
                  />
                </div>
              </ErrorBoundary>
            ) : currentTab === 'system_health' ? (
              <ErrorBoundary fallbackTitle="System Health View Error">
                <div className="flex-1 h-full overflow-hidden">
                  <SystemHealthView
                    onBackToTriage={() => setCurrentTab('triage')}
                    clusterCount={clusters.length}
                    criticalCount={criticalCount}
                    onToggleSidebar={() => setIsLeftSidebarCollapsed(prev => !prev)}
                    isSidebarCollapsed={isLeftSidebarCollapsed}
                  />
                </div>
              </ErrorBoundary>
            ) : currentTab === 'settings' ? (
              <ErrorBoundary fallbackTitle="Settings View Error">
                <div className="flex-1 h-full overflow-hidden">
                  <SettingsView
                    onBackToTriage={() => setCurrentTab('triage')}
                    onToggleSidebar={() => setIsLeftSidebarCollapsed(prev => !prev)}
                    isSidebarCollapsed={isLeftSidebarCollapsed}
                    onStartTour={handleStartTour}
                  />
                </div>
              </ErrorBoundary>
            ) : (
              /* Executive Triage Command Workspace */
              <ErrorBoundary fallbackTitle="Live Triage & Map Error">
                <div className="flex-1 h-full flex flex-col overflow-hidden relative">
                  {/* Mobile View Switcher Tab Bar (< md) */}
                  <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-[#1D1916] border-b border-slate-200 dark:border-[#2D2825] px-3 py-2 flex items-center justify-center shrink-0 shadow-xs transition-colors">
                    <div className="flex bg-slate-100 dark:bg-[#151210] p-1 rounded border border-slate-200 dark:border-[#2D2825] w-full max-w-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileTriageView('map');
                          setTimeout(() => {
                            window.dispatchEvent(new Event('leaflet-invalidate-size'));
                            window.dispatchEvent(new Event('resize'));
                          }, 200);
                        }}
                        className={`flex-1 min-h-[40px] py-1.5 px-3 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation select-none ${
                          mobileTriageView === 'map'
                            ? 'bg-white dark:bg-[#252018] text-amber-900 dark:text-amber-300 shadow-xs border border-slate-200 dark:border-[#2D2825] font-semibold'
                            : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Interactive Map</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileTriageView('queue')}
                        className={`flex-1 min-h-[40px] py-1.5 px-3 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation select-none ${
                          mobileTriageView === 'queue'
                            ? 'bg-white dark:bg-[#252018] text-amber-900 dark:text-amber-300 shadow-xs border border-slate-200 dark:border-[#2D2825] font-semibold'
                            : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <ListOrdered className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Priority Queue ({clusters.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Responsive 2-Pane Container with exactly ONE InteractiveMap instance */}
                  <div 
                    ref={triageContainerRef}
                    className={`flex-1 h-full flex overflow-hidden relative ${isDragging ? 'select-none' : ''}`}
                  >
                    {/* 1. Geospatial Interactive Map */}
                    <section 
                      className={`h-full relative overflow-hidden bg-slate-100 dark:bg-[#151210] flex-1 ${
                        mobileTriageView === 'map' ? 'flex w-full' : 'hidden md:flex'
                      }`}
                    >
                      <InteractiveMap
                        clusters={clusters}
                        selectedClusterId={selectedClusterId}
                        onSelectCluster={handleOpenDetail}
                        onInspectCluster={handleOpenDetail}
                        isQueueCollapsed={isQueueCollapsed}
                        isLeftSidebarCollapsed={isLeftSidebarCollapsed}
                        onToggleSidebar={() => {
                          setIsLeftSidebarCollapsed(false);
                          window.dispatchEvent(new Event('leaflet-invalidate-size'));
                        }}
                        onToggleQueue={() => {
                          setIsQueueCollapsed(false);
                          window.dispatchEvent(new Event('leaflet-invalidate-size'));
                        }}
                        criticalCount={criticalCount}
                      />
                    </section>

                    {/* Vertical drag handle splitter between map and right queue pane */}
                    {!isQueueCollapsed && isDesktop && (
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize Triage Sidebar"
                        title="Drag to resize triage sidebar (300px - 650px), shrink <220px to collapse"
                        onMouseDown={handleDragStart}
                        onDoubleClick={() => {
                          setIsQueueCollapsed(true);
                          window.dispatchEvent(new Event('leaflet-invalidate-size'));
                        }}
                        className={`hidden md:flex items-center justify-center w-1.5 hover:w-2 -mr-0.5 cursor-col-resize hover:bg-amber-500/80 active:bg-amber-600 bg-slate-200/90 dark:bg-[#252018] transition-all z-20 shrink-0 select-none group ${
                          isDragging ? 'bg-amber-500 w-2' : ''
                        }`}
                      >
                        <div className="w-1 h-8 rounded-full bg-slate-400/80 dark:bg-[#2A3747] group-hover:bg-white group-hover:h-12 transition-all duration-200" />
                        {isDragging && (
                          <div className="absolute top-6 -left-12 bg-slate-900 dark:bg-[#1D1916] text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-md pointer-events-none z-30 whitespace-nowrap border border-slate-700 dark:border-[#2D2825]">
                            {Math.round(sidebarWidth)}px
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2 & 3. Right Pane: Smooth Width Transitions */}
                    <motion.aside 
                      animate={{
                        width: isDesktop ? (isQueueCollapsed ? 0 : sidebarWidth) : '100%',
                      }}
                      transition={
                        isDragging 
                          ? { duration: 0 } 
                          : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                      }
                      onAnimationComplete={() => {
                        window.dispatchEvent(new Event('leaflet-invalidate-size'));
                        window.dispatchEvent(new Event('resize'));
                      }}
                      className={`h-full relative flex-col bg-white/95 dark:bg-[#1D1916]/95 backdrop-blur-xl shrink-0 overflow-hidden ${
                        isQueueCollapsed ? 'border-l-0 md:w-0' : 'border-l border-slate-200/90 dark:border-[#2D2825]'
                      } ${mobileTriageView === 'queue' ? 'flex w-full' : 'hidden'} ${
                        isQueueCollapsed ? 'md:flex md:w-0' : 'md:flex'
                      }`}
                    >
                      {/* Edge Collapse Toggle Pill Button on left boundary of right pane (visible when open) */}
                      {!isQueueCollapsed && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsQueueCollapsed(true);
                            window.dispatchEvent(new Event('leaflet-invalidate-size'));
                          }}
                          aria-label="Collapse Priority Queue"
                          title="Collapse Priority Queue (⌘B or ])"
                          className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-2.5 z-30 w-5 h-12 bg-white/95 dark:bg-[#1D1916]/95 backdrop-blur-xs border border-slate-300/80 dark:border-[#2D2825] shadow-xs hover:shadow-md items-center justify-center text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#252018] rounded-md transition-all cursor-pointer select-none group"
                        >
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      )}

                      {/* Fixed-width inner wrapper ensures content doesn't squeeze during spring width transition */}
                      <div 
                        style={isDesktop ? { width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` } : undefined}
                        className="w-full h-full flex flex-col overflow-hidden"
                      >
                        <AnimatePresence mode="wait">
                          {rightPaneView === 'detail' && selectedCluster ? (
                            <motion.div
                              key={`detail-${selectedCluster.cluster_id}`}
                              initial={{ opacity: 0, x: 18 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 18 }}
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                              className="w-full h-full flex flex-col overflow-hidden"
                            >
                              <ClusterDetail
                                cluster={selectedCluster}
                                onBack={() => setRightPaneView('queue')}
                                onUpdateStatus={handleUpdateClusterStatus}
                                onOpenAdminModal={handleExecuteAdminAction}
                                onOpenResolveModal={cluster => setResolveModalCluster(cluster)}
                              />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="queue-view"
                              initial={{ opacity: 0, x: -18 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -18 }}
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                              className="w-full h-full flex flex-col overflow-hidden"
                            >
                              <PriorityQueue
                                clusters={clusters}
                                selectedClusterId={selectedClusterId}
                                onSelectCluster={handleSelectCluster}
                                onOpenDetail={handleOpenDetail}
                                onExecuteAdminAction={handleExecuteAdminAction}
                                onOpenResolveModal={cluster => setResolveModalCluster(cluster)}
                                onUpdatePriorityOverride={handleUpdatePriorityOverride}
                                onToggleCollapse={() => {
                                  setIsQueueCollapsed(true);
                                  window.dispatchEvent(new Event('leaflet-invalidate-size'));
                                }}
                                filterCategory={filterCategory}
                                onFilterCategoryChange={setFilterCategory}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.aside>
                  </div>
                </div>
              </ErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Intervention Intelligence Modal */}
      {interventionModalCluster && interventionModalRec && (
        <InterventionIntelligenceModal
          cluster={interventionModalCluster}
          recommendation={interventionModalRec}
          onClose={() => {
            setInterventionModalCluster(null);
            setInterventionModalRec(null);
          }}
        />
      )}

      {/* Administrative Directive Modal */}
      {adminModalCluster && (
        <AdminActionModal
          cluster={adminModalCluster}
          prefill={adminModalPrefill}
          onClose={() => {
            setAdminModalCluster(null);
            setAdminModalPrefill(undefined);
          }}
          onConfirmAction={handleUpdateClusterStatus}
        />
      )}

      {/* Formal Resolution & Impact Modal */}
      {resolveModalCluster && (
        <ResolveIncidentModal
          cluster={resolveModalCluster}
          onClose={() => setResolveModalCluster(null)}
          onConfirmResolution={handleConfirmResolution}
        />
      )}

      {/* Interactive Guided Officer Workflow Tour */}
      <OfficerWalkthrough
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          setResolveModalCluster(null);
          setAdminModalCluster(null);
        }}
        onNavigateToStep={handleTourStepChange}
      />
    </div>
  );
};

export default Dashboard;
