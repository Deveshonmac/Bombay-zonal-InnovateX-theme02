import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  IncidentCluster, 
  ComplaintCategory, 
  TicketStatus 
} from '../types';
import { 
  Search, 
  CheckCircle2, 
  SlidersHorizontal, 
  ExternalLink, 
  RotateCcw, 
  X, 
  Building2,
  PanelRightClose 
} from 'lucide-react';

type SortOption = 'priority' | 'sla' | 'volume';

interface PriorityQueueProps {
  clusters: IncidentCluster[];
  selectedClusterId: string | null;
  onSelectCluster: (id: string) => void;
  onOpenDetail?: (clusterId: string) => void;
  onExecuteAdminAction: (cluster: IncidentCluster) => void;
  onOpenResolveModal?: (cluster: IncidentCluster) => void;
  onUpdatePriorityOverride?: (clusterId: string, overridePts: number, reason: string) => void;
  onToggleCollapse?: () => void;
  filterCategory: 'all' | ComplaintCategory;
  onFilterCategoryChange: (cat: 'all' | ComplaintCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({
  clusters,
  selectedClusterId,
  onSelectCluster,
  onOpenDetail,
  onExecuteAdminAction,
  onOpenResolveModal,
  onUpdatePriorityOverride,
  onToggleCollapse,
  filterCategory,
  onFilterCategoryChange,
  searchQuery,
  onSearchChange
}) => {
  const [expandedExplainId, setExpandedExplainId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [overrideFormId, setOverrideFormId] = useState<string | null>(null);
  const [tempOverridePts, setTempOverridePts] = useState<number>(10);
  const [tempOverrideReason, setTempOverrideReason] = useState<string>('Sensitive Receptors (School / Hospital Zone)');
  
  // Hover morphing tracking states for segmented navigation
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSort, setHoveredSort] = useState<string | null>(null);

  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Category labels and semantic badges for display with dark mode support
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'construction_dust':
        return {
          label: 'Construction Dust',
          className: 'bg-amber-50/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80'
        };
      case 'biomass_burning':
        return {
          label: 'Waste Burning',
          className: 'bg-orange-50/80 dark:bg-orange-950/60 text-orange-900 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/80'
        };
      case 'vehicular':
        return {
          label: 'Vehicular',
          className: 'bg-blue-50/80 dark:bg-sky-950/60 text-blue-900 dark:text-sky-300 border-blue-200/80 dark:border-sky-800/80'
        };
      case 'industrial':
        return {
          label: 'Industrial Stack',
          className: 'bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80'
        };
      default:
        return {
          label: category,
          className: 'bg-slate-50 dark:bg-[#150F0A] text-slate-800 dark:text-[#94A3B8] border-slate-200 dark:border-[#2E2218]'
        };
    }
  };

  // Scroll active card into view when selected
  useEffect(() => {
    if (selectedClusterId && cardRefs.current[selectedClusterId]) {
      const el = cardRefs.current[selectedClusterId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedClusterId]);

  // Keyboard shortcut: '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="Filter by ward"]') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered and Sorted clusters
  const sortedClusters = useMemo(() => {
    return [...clusters]
      .filter(cluster => {
        // Category filter
        if (filterCategory !== 'all' && cluster.category !== filterCategory) {
          return false;
        }
        // Text search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = cluster.title.toLowerCase().includes(q);
          const matchWard = cluster.ward.toLowerCase().includes(q);
          const matchCategory = cluster.category.toLowerCase().includes(q);
          const matchLocation = cluster.location_name?.toLowerCase().includes(q);
          return matchTitle || matchWard || matchCategory || Boolean(matchLocation);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'sla') {
          return a.hours_remaining - b.hours_remaining;
        }
        if (sortBy === 'volume') {
          return b.complaint_count - a.complaint_count;
        }
        // Default: priority score descending
        return b.priority_score - a.priority_score;
      });
  }, [clusters, filterCategory, searchQuery, sortBy]);

  const toggleExplain = (e: React.MouseEvent, clusterId: string) => {
    e.stopPropagation();
    setExpandedExplainId(prev => (prev === clusterId ? null : clusterId));
  };

  const handleApplyOverride = (e: React.FormEvent, clusterId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onUpdatePriorityOverride) {
      onUpdatePriorityOverride(clusterId, tempOverridePts, tempOverrideReason);
    }
    setOverrideFormId(null);
  };

  const handleResetOverride = (e: React.MouseEvent, clusterId: string) => {
    e.stopPropagation();
    if (onUpdatePriorityOverride) {
      onUpdatePriorityOverride(clusterId, 0, 'Reset to automated score');
    }
    setOverrideFormId(null);
  };

  const activeCount = clusters.filter(c => c.status !== 'resolved').length;
  const slaRiskCount = clusters.filter(c => c.hours_remaining < 6 && c.status !== 'resolved').length;

  const categoryOptions: Array<{ id: 'all' | ComplaintCategory; label: string; count: number }> = [
    { id: 'all', label: 'All Hotspots', count: clusters.length },
    { id: 'construction_dust', label: 'Dust', count: clusters.filter(c => c.category === 'construction_dust').length },
    { id: 'biomass_burning', label: 'Waste Burning', count: clusters.filter(c => c.category === 'biomass_burning').length },
    { id: 'vehicular', label: 'Vehicular', count: clusters.filter(c => c.category === 'vehicular').length },
    { id: 'industrial', label: 'Industrial', count: clusters.filter(c => c.category === 'industrial').length },
  ];

  const sortOptions: Array<{ id: SortOption; label: string }> = [
    { id: 'priority', label: 'Priority' },
    { id: 'sla', label: 'SLA Urgency' },
    { id: 'volume', label: 'Volume' },
  ];

  return (
    <div className="h-full flex flex-col bg-white/95 dark:bg-[#1E1810]/95 backdrop-blur-xl select-none transition-colors">
      {/* 1. Command Header Bar */}
      <div className="bg-white/90 dark:bg-[#1E1810]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#2E2218] shrink-0 select-none shadow-2xs z-10 transition-colors">
        {/* Title Bar Area */}
        <div className="p-3.5 pb-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 dark:bg-emerald-400 absolute inline-block animate-ping opacity-75"></span>
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#F1F5F9] font-mono">
                CPCB SAMEER Triage Queue
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 font-medium shrink-0 shadow-2xs">
                24h Mandate
              </span>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden md:flex w-7 h-7 items-center justify-center text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-[#F1F5F9] rounded-md hover:bg-slate-100 dark:hover:bg-[#261C12] transition-colors cursor-pointer"
                  title="Collapse Priority Queue (⌘B or ])"
                  aria-label="Collapse priority queue"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono flex items-center gap-2">
            <span>
              <strong className="text-slate-800 dark:text-[#F1F5F9] font-semibold">{activeCount}</strong> Active Hotspots
            </span>
            <span className="text-slate-300 dark:text-[#2E2218]">·</span>
            <span className={slaRiskCount > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1' : 'text-slate-600 dark:text-[#94A3B8]'}>
              {slaRiskCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>}
              {slaRiskCount} SLA Risk (&lt;6h)
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="px-3.5 pb-2">
          <div className="relative group">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748B] group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Filter by ward, street, source (Press '/' to focus)..."
              className="w-full min-h-[36px] bg-slate-100/80 dark:bg-[#150F0A] hover:bg-slate-100 dark:hover:bg-[#261C12] focus:bg-white dark:focus:bg-[#1E1810] text-xs text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#64748B] pl-8.5 pr-8 py-1.5 rounded-lg border border-slate-200/70 dark:border-[#2E2218] focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none transition-all font-sans"
            />
            {searchQuery ? (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.85 }}
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-300 dark:bg-[#2E2218] hover:bg-slate-400 dark:hover:bg-[#324255] text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-2.5 h-2.5" />
              </motion.button>
            ) : (
              <kbd className="hidden group-hover:inline lg:inline absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-[#64748B] font-mono bg-white dark:bg-[#150F0A] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#2E2218] pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Segmented Category Tabs with Hover Morphing */}
        <div className="px-3.5 pb-2">
          <div 
            onMouseLeave={() => setHoveredCategory(null)}
            className="flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-[#150F0A] rounded-lg border border-slate-200/70 dark:border-[#2E2218] overflow-x-auto text-[11px]"
          >
            {categoryOptions.map(cat => {
              const isActive = filterCategory === cat.id;
              const isHovered = hoveredCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => onFilterCategoryChange(cat.id)}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer select-none whitespace-nowrap ${
                    isActive 
                      ? 'text-emerald-950 dark:text-emerald-300 font-semibold' 
                      : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryPill"
                      className="absolute inset-0 bg-white dark:bg-[#261C12] rounded-md shadow-xs border border-slate-200/80 dark:border-[#2E2218] -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}

                  {!isActive && isHovered && (
                    <motion.div
                      layoutId="hoverCategoryMorph"
                      className="absolute inset-0 bg-slate-200/60 dark:bg-[#261C12]/60 rounded-md -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}

                  <span>{cat.label}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${
                    isActive ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold' : 'text-slate-400 dark:text-[#64748B]'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Controls Bar */}
        <div className="px-3.5 py-1.5 border-t border-slate-100 dark:border-[#2E2218] flex items-center justify-between text-[11px] font-mono bg-slate-50/60 dark:bg-[#150F0A]/60">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#94A3B8]">
            <span className="font-semibold text-slate-800 dark:text-[#F1F5F9]">{sortedClusters.length}</span>
            <span>incidents sorted by</span>
          </div>

          <div 
            onMouseLeave={() => setHoveredSort(null)}
            className="flex items-center gap-1 p-0.5 bg-slate-200/50 dark:bg-[#150F0A] rounded-md border border-slate-200/60 dark:border-[#2E2218]"
          >
            {sortOptions.map(option => {
              const isActive = sortBy === option.id;
              const isHovered = hoveredSort === option.id;

              return (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => setHoveredSort(option.id)}
                  onClick={() => setSortBy(option.id)}
                  className={`relative px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer select-none ${
                    isActive 
                      ? 'text-emerald-900 dark:text-emerald-300 font-semibold' 
                      : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSortPill"
                      className="absolute inset-0 bg-white dark:bg-[#261C12] rounded shadow-2xs border border-slate-200/70 dark:border-[#2E2218]"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}

                  {!isActive && isHovered && (
                    <motion.div
                      layoutId="hoverSortMorph"
                      className="absolute inset-0 bg-slate-200/70 dark:bg-[#261C12]/50 rounded"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}

                  <span className="relative z-10">{option.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Incident Triage Cards List with Spring Layout Animations */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {sortedClusters.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 text-center text-slate-400 dark:text-[#64748B] text-xs font-mono bg-white dark:bg-[#1E1810] rounded-xl border border-slate-200 dark:border-[#2E2218] shadow-2xs"
          >
            No incident clusters match filter criteria.
          </motion.div>
        ) : (
          <LayoutGroup>
            {sortedClusters.map((cluster, index) => {
              const isSelected = cluster.cluster_id === selectedClusterId;
              const isCritical = cluster.hours_remaining < 6 && cluster.status !== 'resolved';
              const isResolved = cluster.status === 'resolved';
              const isExplainOpen = expandedExplainId === cluster.cluster_id;
              const isOverrideOpen = overrideFormId === cluster.cluster_id;
              const hasOverride = cluster.manual_override_pts && cluster.manual_override_pts !== 0;

              // Mathematical contributions:
              const volumePts = cluster.statutory_weights.complaint_spike || 35;
              const severityPts = cluster.statutory_weights.high_pollutant_source || 25;
              const slaPts = cluster.statutory_weights.sla_urgency || 25;
              const ambientPts = cluster.statutory_weights.ambient_delta || 15;

              const categoryBadge = getCategoryBadge(cluster.category);

              return (
                <motion.div
                  layout="position"
                  key={cluster.cluster_id}
                  ref={el => { cardRefs.current[cluster.cluster_id] = el; }}
                  onClick={() => onSelectCluster(cluster.cluster_id)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.988 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  className={`relative rounded-xl p-3.5 transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-emerald-50/40 dark:bg-[#18252C] border border-emerald-500/80 dark:border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                      : 'bg-white dark:bg-[#1E1810] border border-slate-200/90 dark:border-[#2E2218] hover:border-slate-300 dark:hover:border-[#303E50] hover:bg-slate-50/50 dark:hover:bg-[#18212B] shadow-2xs'
                  }`}
                >
                  {/* Tactile Selection Bar */}
                  {isSelected && (
                    <motion.div
                      layoutId="tactileSelectionPill"
                      className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-600 dark:bg-emerald-500 rounded-r-md shadow-xs"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  <div className="space-y-2">
                    {/* Card Header Row: Incident Title + SLA Countdown */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-1.5 flex-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-[#64748B] shrink-0 mt-0.5">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-[#F1F5F9] leading-snug">
                          {cluster.title}
                        </h3>
                      </div>

                      {/* SLA Status: Color-coded operational badge */}
                      <div className="shrink-0 text-right">
                        {isResolved ? (
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-1.5 whitespace-nowrap shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500"></span>
                            Resolved
                          </span>
                        ) : isCritical ? (
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 flex items-center gap-1.5 whitespace-nowrap shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-500 animate-pulse"></span>
                            {cluster.hours_remaining.toFixed(1)}h left
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#150F0A] text-slate-700 dark:text-[#94A3B8] border border-slate-200/80 dark:border-[#2E2218] flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-[#64748B]"></span>
                            {cluster.hours_remaining.toFixed(1)}h left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Subtitle Row: Ward location + Semantic Category Chip */}
                    <div className="text-[11px] text-slate-600 dark:text-[#94A3B8] flex items-center gap-2">
                      <span className="font-medium text-slate-700 dark:text-[#F1F5F9]">{cluster.ward}</span>
                      <span className="text-slate-300 dark:text-[#2E2218]">•</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md border font-medium ${categoryBadge.className}`}>
                        {categoryBadge.label}
                      </span>
                    </div>

                    {/* Card Telemetry Row (Tabular Format) */}
                    <div className="font-mono text-[11px] text-slate-600 dark:text-[#94A3B8] flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-[#2E2218]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 dark:text-[#F1F5F9] font-medium tabular-nums">{cluster.complaint_count} citizen reports</span>
                        <span className="text-slate-300 dark:text-[#2E2218]">|</span>
                        <span className="text-amber-800 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/80 tabular-nums">
                          AQI {cluster.avg_aqi}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 dark:text-[#94A3B8]">Urgency:</span>
                        <strong className={`font-bold font-mono text-xs tabular-nums ${
                          cluster.priority_score >= 90 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-[#F1F5F9]'
                        }`}>
                          {cluster.priority_score}
                        </strong>
                        <span className="text-slate-400 dark:text-[#64748B] text-[10px]">/100</span>

                        {hasOverride && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ml-1">
                            {cluster.manual_override_pts! > 0 ? `+${cluster.manual_override_pts}` : cluster.manual_override_pts}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Verified Impact Badge if resolved */}
                    {cluster.resolution && (
                      <div className="mt-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-md text-[10px] font-mono text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          Verified: {cluster.resolution.aqi_delta} AQI ({cluster.resolution.pm10_delta_percent}%)
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 text-[10px] truncate max-w-[130px]">
                          {cluster.resolution.sensor_station_id}
                        </span>
                      </div>
                    )}

                    {/* 3. Mathematical Explainability Component */}
                    <AnimatePresence>
                      {isExplainOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          onClick={e => e.stopPropagation()}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-3 bg-slate-50/90 dark:bg-[#150F0A] rounded-lg border border-slate-200 dark:border-[#2E2218] text-xs space-y-2.5 shadow-2xs">
                            {/* Formula Headline */}
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2E2218] pb-1.5">
                              <div>
                                <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] font-bold">
                                  Statutory Urgency Formula (Air Act §31A)
                                </div>
                                <div className="font-mono text-[11px] font-medium text-slate-800 dark:text-[#F1F5F9]">
                                  P = Volume + Category + SLA Urgency + AQI Delta
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-[#F1F5F9] tabular-nums">
                                  {cluster.priority_score}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 dark:text-[#64748B]">/100</span>
                              </div>
                            </div>

                            {/* Proportional Weight Bar */}
                            <div className="space-y-1">
                              <div className="h-2 w-full bg-slate-200/80 dark:bg-[#261C12] rounded-full overflow-hidden flex">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, volumePts)}%` }}
                                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                  className="bg-emerald-600 dark:bg-emerald-500 h-full"
                                  title={`Volume Spike: +${volumePts} pts`}
                                />
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, severityPts)}%` }}
                                  transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.05 }}
                                  className="bg-amber-500 dark:bg-amber-400 h-full"
                                  title={`Category Severity: +${severityPts} pts`}
                                />
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, slaPts)}%` }}
                                  transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }}
                                  className="bg-rose-500 dark:bg-rose-400 h-full"
                                  title={`SLA Urgency: +${slaPts} pts`}
                                />
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, ambientPts)}%` }}
                                  transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.15 }}
                                  className="bg-sky-600 dark:bg-sky-400 h-full"
                                  title={`Local AQI Delta: +${ambientPts} pts`}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] font-mono pt-0.5">
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Vol (+{volumePts})</span>
                                <span className="text-amber-700 dark:text-amber-400 font-semibold">Sev (+{severityPts})</span>
                                <span className="text-rose-700 dark:text-rose-400 font-semibold">SLA (+{slaPts})</span>
                                <span className="text-sky-700 dark:text-sky-400 font-semibold">AQI (+{ambientPts})</span>
                              </div>
                            </div>

                            {/* Breakdown Rows */}
                            <div className="space-y-1 font-mono text-[10px] text-slate-600 dark:text-[#94A3B8] bg-white dark:bg-[#1E1810] p-2.5 rounded-md border border-slate-200 dark:border-[#2E2218]">
                              <div className="flex justify-between items-baseline gap-1 pb-1 border-b border-slate-100 dark:border-[#2E2218]">
                                <span className="font-semibold text-slate-800 dark:text-[#F1F5F9] shrink-0">• Volume:</span>
                                <span className="text-slate-600 dark:text-[#94A3B8] font-sans text-right truncate">
                                  {cluster.complaint_count} citizen reports
                                </span>
                              </div>

                              <div className="flex justify-between items-baseline gap-1 pb-1 border-b border-slate-100 dark:border-[#2E2218]">
                                <span className="font-semibold text-slate-800 dark:text-[#F1F5F9] shrink-0">• Severity:</span>
                                <span className="text-slate-600 dark:text-[#94A3B8] font-sans text-right truncate">
                                  {getCategoryBadge(cluster.category).label}
                                </span>
                              </div>

                              <div className="flex justify-between items-baseline gap-1 pb-1 border-b border-slate-100 dark:border-[#2E2218]">
                                <span className="font-semibold text-slate-800 dark:text-[#F1F5F9] shrink-0">• SLA Risk:</span>
                                <span className="text-slate-600 dark:text-[#94A3B8] font-sans text-right truncate">
                                  {(24 - cluster.hours_remaining).toFixed(1)}h elapsed in 24h
                                </span>
                              </div>

                              <div className="flex justify-between items-baseline gap-1">
                                <span className="font-semibold text-slate-800 dark:text-[#F1F5F9] shrink-0">• Ambient AQI:</span>
                                <span className="text-slate-600 dark:text-[#94A3B8] font-sans text-right truncate">
                                  {cluster.avg_aqi} AQI reading
                                </span>
                              </div>
                            </div>

                            {/* Manual Officer Override Toggle */}
                            <div className="pt-0.5 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setOverrideFormId(isOverrideOpen ? null : cluster.cluster_id)}
                                className="text-[10px] font-sans font-medium text-slate-600 dark:text-[#94A3B8] hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <SlidersHorizontal className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{isOverrideOpen ? 'Close Adjustment' : 'Discretionary Officer Override'}</span>
                              </button>

                              {hasOverride && (
                                <button
                                  type="button"
                                  onClick={e => handleResetOverride(e, cluster.cluster_id)}
                                  className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8] hover:text-slate-800 dark:hover:text-[#F1F5F9] flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>Reset</span>
                                </button>
                              )}
                            </div>

                            {/* Manual Override Form */}
                            <AnimatePresence>
                              {isOverrideOpen && (
                                <motion.form
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                  onSubmit={e => handleApplyOverride(e, cluster.cluster_id)}
                                  className="p-2.5 bg-white dark:bg-[#1E1810] rounded-md border border-slate-200 dark:border-[#2E2218] text-xs space-y-2 shadow-2xs overflow-hidden"
                                >
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-medium text-slate-700 dark:text-[#F1F5F9] mb-0.5">
                                        Score Delta:
                                      </label>
                                      <select
                                        value={tempOverridePts}
                                        onChange={e => setTempOverridePts(Number(e.target.value))}
                                        className="w-full bg-slate-50 dark:bg-[#150F0A] border border-slate-300 dark:border-[#2E2218] rounded px-1.5 py-1 text-xs text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-emerald-600"
                                      >
                                        <option value={20}>+20 pts (Critical Escalation)</option>
                                        <option value={10}>+10 pts (Elevate Priority)</option>
                                        <option value={5}>+5 pts (Minor Adjustment)</option>
                                        <option value={-10}>-10 pts (Controlled)</option>
                                        <option value={-20}>-20 pts (False Alarm)</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-medium text-slate-700 dark:text-[#F1F5F9] mb-0.5">
                                        Justification:
                                      </label>
                                      <select
                                        value={tempOverrideReason}
                                        onChange={e => setTempOverrideReason(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#150F0A] border border-slate-300 dark:border-[#2E2218] rounded px-1.5 py-1 text-xs text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-emerald-600"
                                      >
                                        <option value="Sensitive Receptors (School / Hospital Zone)">
                                          Sensitive Receptors (School/Hospital)
                                        </option>
                                        <option value="VIP / High-Traffic Arterial Corridor">
                                          VIP / Arterial Corridor
                                        </option>
                                        <option value="Field Inspection Ground Team Escalation">
                                          Field Inspector Escalation
                                        </option>
                                        <option value="Transient Event (Rain / Microclimate Washout)">
                                          Transient Event / Rain
                                        </option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-end gap-1.5 pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => setOverrideFormId(null)}
                                      className="px-2 py-0.5 rounded text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#261C12] text-[11px]"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      className="px-2.5 py-0.5 rounded bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors shadow-2xs"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                </motion.form>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Card Action Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-[#2E2218] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Administrative directive button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onExecuteAdminAction(cluster);
                          }}
                          className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{cluster.admin_action_label}</span>
                        </motion.button>

                        {/* Mark Actioned Button if open */}
                        {cluster.status !== 'resolved' && onOpenResolveModal && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onOpenResolveModal(cluster);
                            }}
                            className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 bg-emerald-50/90 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Resolve</span>
                          </motion.button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Explain Formula Toggle */}
                        <button
                          type="button"
                          data-tour={index === 0 ? "explainability-btn" : undefined}
                          onClick={e => toggleExplain(e, cluster.cluster_id)}
                          className="text-[11px] font-mono text-slate-500 dark:text-[#94A3B8] hover:text-emerald-700 dark:hover:text-emerald-300 px-1 py-1 transition-colors cursor-pointer"
                          title="View transparent urgency score formula breakdown"
                        >
                          {isExplainOpen ? `Rank #${index + 1} ▴` : `Why #${index + 1}? ▾`}
                        </button>

                        {/* Inspect Dossier Trigger */}
                        {onOpenDetail && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onOpenDetail(cluster.cluster_id);
                            }}
                            className="text-[11px] font-medium text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] bg-slate-100 dark:bg-[#261C12] hover:bg-slate-200 dark:hover:bg-[#2E2218] border border-slate-200 dark:border-[#2E2218] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer font-sans shadow-2xs"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-500 dark:text-[#94A3B8]" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </LayoutGroup>
        )}
      </div>
    </div>
  );
};

export default PriorityQueue;
