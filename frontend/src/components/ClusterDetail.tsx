import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IncidentCluster, 
  TicketStatus, 
  AuditActionLog 
} from '../types';
import {
  ArrowLeft,
  Clock,
  Scale,
  CheckCircle2,
  MapPin,
  Camera,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Building2,
  Flame,
  Wind,
  Factory,
  Car,
  AlertTriangle,
  Send,
  Edit3,
  Check,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Map
} from 'lucide-react';
import { 
  generateStatutoryRecommendation, 
  StatutoryRecommendation,
  getFallbackRecommendation 
} from '../services/geminiService';

interface ClusterDetailProps {
  cluster: IncidentCluster;
  onBack: () => void;
  onUpdateStatus: (
    clusterId: string,
    newStatus: TicketStatus,
    actionNote: string,
    actionType: AuditActionLog['action_type']
  ) => void;
  onOpenAdminModal: (
    cluster: IncidentCluster,
    prefill?: {
      targetAgency?: string;
      directive?: string;
      legalProvision?: string;
      rationale?: string;
    }
  ) => void;
  onOpenResolveModal?: (cluster: IncidentCluster) => void;
  onOpenInterventionModal?: (cluster: IncidentCluster, recommendation: StatutoryRecommendation) => void;
}

export const ClusterDetail: React.FC<ClusterDetailProps> = ({
  cluster,
  onBack,
  onUpdateStatus,
  onOpenAdminModal,
  onOpenResolveModal,
  onOpenInterventionModal,
}) => {
  const [showExplainability, setShowExplainability] = useState(false);
  const [showComplaints, setShowComplaints] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Recommendation generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState<StatutoryRecommendation | null>(() => {
    if (cluster.ai_recommendation) {
      return {
        targetAgency: cluster.ai_recommendation.target_agency || 'PMC Solid Waste & Works Dept',
        directive: cluster.ai_recommendation.action || cluster.admin_action_label || 'Deploy statutory dust suppression',
        legalProvision: cluster.ai_recommendation.statutory_rule || 'Air Act 1981 Section 31A',
        rationale: cluster.ai_recommendation.rationale || 'Automated compliance rule applied based on CPCB SAMEER density.',
        suggestedEquipment: cluster.ai_recommendation.suggested_equipment || ['2000L Anti-Smog Gun', 'Mobile Mist Cannon Truck'],
        isFallback: false,
      };
    }
    return null;
  });

  // Inline editing state for generated recommendation
  const [isEditing, setIsEditing] = useState(false);
  const [editedAgency, setEditedAgency] = useState('');
  const [editedDirective, setEditedDirective] = useState('');
  const [editedProvision, setEditedProvision] = useState('');

  // Sync edits when recommendation changes
  useEffect(() => {
    if (recommendation) {
      setEditedAgency(recommendation.targetAgency);
      setEditedDirective(recommendation.directive);
      setEditedProvision(recommendation.legalProvision);
    }
  }, [recommendation]);

  // Escape key closes detail
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const isResolved = cluster.status === 'resolved';
  const isCritical = cluster.hours_remaining < 6;

  // Handle generating recommendation via Gemini API
  const handleGenerateRecommendation = async () => {
    setIsGenerating(true);
    try {
      const rec = await generateStatutoryRecommendation({
        category: cluster.category,
        location: cluster.ward,
        aqi: cluster.avg_aqi,
        complaint_count: cluster.complaint_count,
        severity: cluster.hours_remaining < 6 ? 'high' : 'medium'
      });
      setRecommendation(rec);
    } catch (err) {
      console.warn('Using deterministic fallback recommendation:', err);
      const fallback = getFallbackRecommendation({
        category: cluster.category,
        location: cluster.ward,
        aqi: cluster.avg_aqi,
        complaint_count: cluster.complaint_count,
        severity: cluster.hours_remaining < 6 ? 'high' : 'medium'
      });
      setRecommendation(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  // Dispatch generated recommendation into official modal
  const handleApplyToDirective = () => {
    if (!recommendation) return;
    onOpenAdminModal(cluster, {
      targetAgency: editedAgency || recommendation.targetAgency,
      directive: editedDirective || recommendation.directive,
      legalProvision: editedProvision || recommendation.legalProvision,
      rationale: recommendation.rationale
    });
  };

  // Helper for category badge icons
  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'biomass_burning':
        return <Flame className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />;
      case 'construction_dust':
        return <Wind className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'industrial':
        return <Factory className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'vehicular':
        return <Car className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-slate-600 dark:text-[#94A3B8]" />;
    }
  };

  const formatCategoryName = (cat: string) => {
    switch (cat) {
      case 'biomass_burning': return 'Biomass / Waste Burning';
      case 'construction_dust': return 'Construction & Demolition Dust';
      case 'vehicular': return 'Vehicular Corridor Emissions';
      case 'industrial': return 'Industrial Stack Emission';
      default: return cat;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1D1916] text-slate-900 dark:text-[#F1F5F9] overflow-y-auto select-none transition-colors">
      {/* 1. Header with Back Button */}
      <div className="p-4 border-b border-slate-200 dark:border-[#2D2825] bg-white dark:bg-[#1D1916] sticky top-0 z-10 space-y-2 transition-colors">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] font-mono transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Queue</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#151210] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#2D2825]">
              {cluster.cluster_id}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              {cluster.ward}
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#94A3B8] font-mono mb-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748B]" />
            <span>{cluster.ward} Jurisdiction</span>
            <span>•</span>
            <span>{cluster.complaint_count} citizen complaints grouped</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-[#F1F5F9] leading-snug">
            {cluster.title}
          </h2>
        </div>
      </div>

      {successMessage && (
        <div className="mx-4 mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 rounded text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Body Dossier Content */}
      <div className="p-5 space-y-5">
        {/* Executive 3-Stat Summary Grid with 24h SLA Countdown */}
        <div className="grid grid-cols-3 gap-3">
          {/* 24h SLA Countdown Card */}
          <div className={`p-3 rounded border space-y-1 ${
            isCritical && !isResolved 
              ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60' 
              : 'bg-slate-50 dark:bg-[#151210] border-slate-200 dark:border-[#2D2825]'
          }`}>
            <div className="text-xs font-mono text-slate-500 dark:text-[#94A3B8] flex items-center justify-between">
              <span>SLA WINDOW</span>
              <Clock className={`w-3 h-3 ${isCritical && !isResolved ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-[#64748B]'}`} />
            </div>
            <div className={`text-sm font-mono font-bold flex items-center gap-1.5 ${
              isCritical && !isResolved ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-[#F1F5F9]'
            }`}>
              {isCritical && !isResolved && <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>}
              {isResolved ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Resolved</span>
              ) : (
                `${cluster.hours_remaining.toFixed(1)}h left`
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-[#64748B] font-mono">
              {isCritical ? 'Critical (<6h SLA)' : '24h Statutory'}
            </p>
          </div>

          {/* Reported AQI Card */}
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/40 rounded border border-amber-200/80 dark:border-amber-900/60 space-y-1">
            <div className="text-xs font-mono text-amber-800 dark:text-amber-400 font-semibold">AMBIENT AQI</div>
            <div className="text-sm font-mono font-bold text-amber-900 dark:text-amber-300">
              {cluster.avg_aqi}
            </div>
            <p className="text-xs text-amber-700/90 dark:text-amber-400/90 font-medium">
              {cluster.avg_aqi > 350 ? 'Severe (CPCB)' : 'Poor / Very Poor'}
            </p>
          </div>

          {/* Volume & Statutory Score Card */}
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/40 rounded border border-amber-200/80 dark:border-amber-900/60 space-y-1">
            <div className="text-xs font-mono text-amber-800 dark:text-amber-400 font-semibold">TRIAGE SCORE</div>
            <div className="text-sm font-mono font-bold text-amber-900 dark:text-amber-300">
              {cluster.priority_score} <span className="text-xs text-amber-600 dark:text-amber-400 font-normal">/100</span>
            </div>
            <p className="text-xs text-amber-700/90 dark:text-amber-400/90 font-mono">
              {cluster.complaint_count} Citizen Logs
            </p>
          </div>
        </div>

        {/* Priority Score Breakdown (Statutory Triage Score Weights) */}
        <div className="p-3.5 bg-slate-50 dark:bg-[#151210] rounded-lg border border-slate-200 dark:border-[#2D2825] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-[#F1F5F9] font-mono">Score Breakdown</h4>
            </div>
            <button
              type="button"
              onClick={() => setShowExplainability(prev => !prev)}
              className="text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer font-mono"
            >
              <span>{showExplainability ? 'Hide' : 'Show'}</span>
              {showExplainability ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <AnimatePresence>
            {showExplainability && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="space-y-2 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 dark:text-[#94A3B8]">
                  <div className="p-2 bg-white dark:bg-[#1D1916] rounded border border-slate-200 dark:border-[#2D2825] flex justify-between">
                    <span>Complaint Spike:</span>
                    <span className="font-bold text-amber-900 dark:text-amber-300">+{cluster.statutory_weights.complaint_spike} pts</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#1D1916] rounded border border-slate-200 dark:border-[#2D2825] flex justify-between">
                    <span>Category Source:</span>
                    <span className="font-bold text-amber-900 dark:text-amber-300">+{cluster.statutory_weights.high_pollutant_source} pts</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#1D1916] rounded border border-slate-200 dark:border-[#2D2825] flex justify-between">
                    <span>SLA Urgency:</span>
                    <span className="font-bold text-rose-900 dark:text-rose-300">+{cluster.statutory_weights.sla_urgency} pts</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#1D1916] rounded border border-slate-200 dark:border-[#2D2825] flex justify-between">
                    <span>Ambient Delta:</span>
                    <span className="font-bold text-sky-900 dark:text-sky-300">+{cluster.statutory_weights.ambient_delta} pts</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-normal font-sans">
                  {cluster.statutory_weights.weight_summary}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active Dominant Pollution Source */}
        <div className="p-3 bg-slate-50 dark:bg-[#151210] rounded-lg border border-slate-200 dark:border-[#2D2825] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-[#F1F5F9] flex items-center gap-1.5 text-xs">
              {renderCategoryIcon(cluster.category)}
              <span>Identified Source</span>
            </span>
            <span className="font-mono text-xs px-1.5 py-0.5 bg-white dark:bg-[#1D1916] border border-slate-200 dark:border-[#2D2825] rounded text-slate-700 dark:text-[#94A3B8] font-medium">
              {formatCategoryName(cluster.category)}
            </span>
          </div>

          <div className="p-2 bg-white dark:bg-[#1D1916] rounded border border-slate-200 dark:border-[#2D2825] text-xs">
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 dark:text-[#94A3B8] shrink-0">Source:</span>
              <span className="text-slate-900 dark:text-[#F1F5F9] font-semibold text-right">{cluster.primary_source}</span>
            </div>
          </div>
        </div>

        {/* 2. "Generate Action Recommendation" Workflow */}
        <div className="bg-white dark:bg-[#1D1916] rounded-lg border border-slate-200 dark:border-[#2D2825] overflow-hidden shadow-2xs">
          {/* Header Strip with Action Trigger */}
          <div className="p-3 bg-slate-50 dark:bg-[#151210] border-b border-slate-200 dark:border-[#2D2825] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-[#F1F5F9] font-mono">AI Enforcement Directive</h3>
            </div>

            <button
              type="button"
              data-tour="generate-directive-btn"
              onClick={handleGenerateRecommendation}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 disabled:opacity-50 text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer touch-manipulation"
            >
              <Sparkles className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>
                {isGenerating 
                  ? 'Drafting Protocol...' 
                  : recommendation 
                  ? 'Regenerate Protocol' 
                  : 'Draft Directive Protocol'}
              </span>
            </button>
          </div>

          {/* Loading Skeleton during AI Call */}
          {isGenerating && (
            <div className="p-4 space-y-2.5 animate-pulse bg-slate-50/50 dark:bg-[#151210]/50">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-[#94A3B8]">
                <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                <span>Generating statutory Section 31A protocol...</span>
              </div>
              
              <div className="p-2.5 bg-white dark:bg-[#1D1916] rounded border border-slate-200 dark:border-[#2D2825] space-y-1.5">
                <div className="h-2.5 w-1/4 bg-slate-200 dark:bg-[#2D2825] rounded"></div>
                <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-[#2D2825] rounded"></div>
              </div>
            </div>
          )}

          {/* Structured, Editable Action Card */}
          {!isGenerating && recommendation && (
            <div className="p-3.5 space-y-3 bg-white dark:bg-[#1D1916] text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-[#2D2825]">
                <span className="font-mono text-xs text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
                  AI Directive Draft
                </span>

                <button
                  type="button"
                  onClick={() => setIsEditing(prev => !prev)}
                  className="px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] flex items-center gap-1 rounded hover:bg-slate-100 dark:hover:bg-[#252018] transition-colors cursor-pointer"
                >
                  {isEditing ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Done</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3 h-3 text-slate-500 dark:text-[#64748B]" />
                      <span>Edit Fields</span>
                    </>
                  )}
                </button>
              </div>

              {/* Target Municipal Agency */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-slate-500 dark:text-[#94A3B8] font-semibold uppercase tracking-wider">
                  Target Municipal Agency
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAgency}
                    onChange={e => setEditedAgency(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#151210] border border-slate-300 dark:border-[#2D2825] rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-[#F1F5F9] font-medium focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-[#1D1916]"
                  />
                ) : (
                  <div className="p-2 bg-slate-50 dark:bg-[#151210] rounded border border-slate-200 dark:border-[#2D2825] font-medium text-slate-900 dark:text-[#F1F5F9] flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>{editedAgency || recommendation.targetAgency}</span>
                  </div>
                )}
              </div>

              {/* Recommended Directive */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-slate-500 dark:text-[#94A3B8] font-semibold uppercase tracking-wider">
                  Recommended Directive
                </label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={editedDirective}
                    onChange={e => setEditedDirective(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#151210] border border-slate-300 dark:border-[#2D2825] rounded p-2 text-xs text-slate-900 dark:text-[#F1F5F9] font-sans focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-[#1D1916] leading-relaxed"
                  />
                ) : (
                  <div className="p-2 bg-slate-50 dark:bg-[#151210] rounded border border-slate-200 dark:border-[#2D2825] text-slate-800 dark:text-[#F1F5F9] leading-relaxed text-xs">
                    {editedDirective || recommendation.directive}
                  </div>
                )}
              </div>

              {/* Legal Provision */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-slate-500 dark:text-[#94A3B8] font-semibold uppercase tracking-wider">
                  Legal Authority Provision
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProvision}
                    onChange={e => setEditedProvision(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#151210] border border-slate-300 dark:border-[#2D2825] rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-[#F1F5F9] font-mono focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-[#1D1916]"
                  />
                ) : (
                  <div className="p-2 bg-amber-50/50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded font-mono text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span className="font-semibold">{editedProvision || recommendation.legalProvision}</span>
                  </div>
                )}
              </div>

              {/* Rationale & Equipment tags */}
              {recommendation.rationale && (
                <div className="p-2 bg-slate-50 dark:bg-[#151210] rounded border border-slate-200 dark:border-[#2D2825] text-[11px] text-slate-600 dark:text-[#94A3B8] leading-relaxed font-sans">
                  <span className="font-medium text-slate-800 dark:text-[#F1F5F9]">Operational Assessment: </span>
                  {recommendation.rationale}
                </div>
              )}

              {recommendation.suggestedEquipment && recommendation.suggestedEquipment.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8] block uppercase">
                    Suggested Rapid Deployment Gear
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.suggestedEquipment.map((eq, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded text-xs font-mono font-medium"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={handleApplyToDirective}
                  className="w-full px-3 py-2 rounded-md bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer touch-manipulation"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Apply to Enforcement Directive</span>
                </button>

                {onOpenInterventionModal && (
                  <button
                    type="button"
                    onClick={() => onOpenInterventionModal(cluster, recommendation)}
                    className="w-full px-3 py-2 rounded-md bg-[#1C120A] hover:bg-[#2C1C0E] dark:bg-[#FEF3E2] dark:hover:bg-white text-white dark:text-[#1C120A] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer touch-manipulation border border-[#2C1C0E] dark:border-[#EAE2D8]"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>View Full Intervention Plan →</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Resolved Environmental Impact Ledger */}
        {cluster.resolution && (
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between text-emerald-950 dark:text-emerald-200 font-bold border-b border-emerald-200/80 dark:border-emerald-800/80 pb-1.5">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Verified Environmental Impact Outcome
              </span>
              <span className="font-mono text-xs text-emerald-800 dark:text-emerald-400">
                Resolved {cluster.resolution.resolved_at}
              </span>
            </div>

            <p className="text-emerald-900 dark:text-emerald-300 font-medium text-xs">{cluster.resolution.action_summary}</p>

            <div className="grid grid-cols-3 gap-2 font-mono text-xs bg-white dark:bg-[#151210] p-2.5 rounded border border-emerald-200/80 dark:border-emerald-800/80">
              <div>
                <span className="text-slate-500 dark:text-[#94A3B8] block text-[9px]">Pre-AQI:</span>
                <span className="font-bold text-slate-800 dark:text-[#F1F5F9]">{cluster.resolution.pre_intervention_aqi}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-[#94A3B8] block text-[9px]">Post-AQI:</span>
                <span className="font-bold text-slate-900 dark:text-[#F1F5F9]">{cluster.resolution.post_intervention_aqi}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 dark:text-[#94A3B8] block text-[9px]">Net Delta:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {cluster.resolution.aqi_delta} ({cluster.resolution.pm10_delta_percent}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Administrative Quick Actions Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <motion.button
            whileHover={!isResolved ? { scale: 1.01 } : undefined}
            whileTap={!isResolved ? { scale: 0.98 } : undefined}
            type="button"
            onClick={() => onOpenAdminModal(cluster)}
            disabled={isResolved}
            className="px-3 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer touch-manipulation select-none"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{cluster.admin_action_label}</span>
          </motion.button>

          <motion.button
            whileHover={!isResolved ? { scale: 1.01 } : undefined}
            whileTap={!isResolved ? { scale: 0.98 } : undefined}
            type="button"
            data-tour="mark-actioned-btn"
            onClick={() => {
              if (onOpenResolveModal) {
                onOpenResolveModal(cluster);
              } else {
                onUpdateStatus(
                  cluster.cluster_id,
                  'resolved',
                  'Ground verification completed. Emission source neutralized and particulate dispersion stabilized.',
                  'MARK_RESOLVED'
                );
                setSuccessMessage('Incident cluster marked verified resolved');
                setTimeout(() => setSuccessMessage(null), 4000);
              }
            }}
            disabled={isResolved}
            className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation border select-none ${
              isResolved 
                ? 'bg-slate-100 dark:bg-[#151210] text-slate-400 dark:text-[#64748B] border-slate-200 dark:border-[#2D2825] cursor-not-allowed'
                : 'bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60 shadow-2xs'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isResolved ? 'text-slate-400 dark:text-[#64748B]' : 'text-emerald-700 dark:text-emerald-400'}`} />
            <span>{isResolved ? 'Verified Resolved' : 'Mark Actioned'}</span>
          </motion.button>
        </div>

        {/* 3. Grouped Complaints List (collapsible) */}
        <div className="pt-1 border-t border-slate-200 dark:border-[#2D2825]">
          <button
            type="button"
            onClick={() => setShowComplaints(prev => !prev)}
            className="w-full flex items-center justify-between text-xs py-1 cursor-pointer"
          >
            <span className="font-bold text-slate-900 dark:text-[#F1F5F9] font-mono flex items-center gap-1.5">
              Citizen Complaints ({cluster.complaints.length})
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-[#94A3B8]">
              {showComplaints ? 'Hide' : 'Show'}
              {showComplaints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          <AnimatePresence>
          {showComplaints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="overflow-hidden"
          >
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-0.5 mt-2">
            {cluster.complaints.map(complaint => (
              <div
                key={complaint.id}
                className="p-2.5 bg-slate-50 dark:bg-[#151210] rounded-lg border border-slate-200 dark:border-[#2D2825] text-xs space-y-1 hover:border-slate-300 dark:hover:border-[#303E50] transition-colors"
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-900 dark:text-[#F1F5F9] font-bold">{complaint.id}</span>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-[#94A3B8]">
                    <span>{complaint.timestamp}</span>
                    <span className="text-amber-800 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/70 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800/80">
                      AQI {complaint.reported_AQI}
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 dark:text-[#94A3B8] leading-relaxed font-sans text-xs">
                  {complaint.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-[#2D2825] text-xs font-mono text-slate-400 dark:text-[#64748B]">
                  <span>Reporter: {complaint.reporter_masked || 'Citizen'}</span>
                  {complaint.evidence_photo ? (
                    <span className="flex items-center gap-1 text-slate-700 dark:text-[#F1F5F9] font-medium bg-white dark:bg-[#1D1916] px-1.5 py-0.2 rounded border border-slate-200 dark:border-[#2D2825]">
                      <Camera className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Geo-Photo</span>
                    </span>
                  ) : (
                    <span>Telemetry</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ClusterDetail;
