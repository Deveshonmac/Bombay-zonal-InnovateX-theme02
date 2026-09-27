import React, { useState, useEffect } from 'react';
import { IncidentCluster, AuditActionLog, TicketStatus } from '../types';
import { X, Scale, Truck } from 'lucide-react';

export interface AdminPrefillData {
  targetAgency?: string;
  directive?: string;
  legalProvision?: string;
  rationale?: string;
}

interface AdminActionModalProps {
  cluster: IncidentCluster;
  onClose: () => void;
  onConfirmAction: (
    clusterId: string,
    newStatus: TicketStatus,
    actionNote: string,
    actionType: AuditActionLog['action_type']
  ) => void;
  prefill?: AdminPrefillData;
}

export const AdminActionModal: React.FC<AdminActionModalProps> = ({
  cluster,
  onClose,
  onConfirmAction,
  prefill
}) => {
  const isDirective = cluster.admin_action_label.includes('Directive') || cluster.admin_action_label.includes('Air Act');
  const [assignedSquad, setAssignedSquad] = useState(
    prefill?.targetAgency || 'PMC Flying Squad Team-B (Central)'
  );
  const [statutoryNoticeRef, setStatutoryNoticeRef] = useState(`PMC/ENV/2026/${cluster.cluster_id.replace('CLUST-PUN-', 'DIR-')}`);
  const [complianceDeadline, setComplianceDeadline] = useState('4 Hours (Statutory Emergency)');
  const [executiveNote, setExecutiveNote] = useState(
    prefill?.directive
      ? `${prefill.directive}${prefill.legalProvision ? ` [Provision: ${prefill.legalProvision}]` : ''}`
      : isDirective
      ? `Formal show cause notice under Section 31A of Air Act 1981 issued to responsible commercial operator. Immediate cessation of uncontained emissions ordered.`
      : `Requisition order dispatched to PMC Solid Waste & Works Dept for rapid mist cannon deployment and wet dust suppression along ${cluster.ward}.`
  );

  useEffect(() => {
    if (prefill) {
      if (prefill.targetAgency) setAssignedSquad(prefill.targetAgency);
      if (prefill.directive) {
        setExecutiveNote(
          `${prefill.directive}${prefill.legalProvision ? ` [Provision: ${prefill.legalProvision}]` : ''}`
        );
      }
    }
  }, [prefill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let actionType: AuditActionLog['action_type'] = 'ISSUE_STATUTORY_NOTICE';
    if (cluster.admin_action_label.includes('Tanker') || cluster.admin_action_label.includes('Sprinkler') || cluster.admin_action_label.includes('Cannon')) {
      actionType = 'DEPLOY_WATER_SPRINKLERS';
    } else if (cluster.admin_action_label.includes('Fine') || cluster.admin_action_label.includes('Inspection')) {
      actionType = 'DISPATCH_INSPECTION';
    }

    onConfirmAction(
      cluster.cluster_id,
      'dispatched',
      `${cluster.admin_action_label} executed: ${executiveNote} [Ref: ${statutoryNoticeRef}, Assigned: ${assignedSquad}]`,
      actionType
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 transition-colors">
      <div className="bg-white dark:bg-[#131922] rounded-lg border border-slate-200 dark:border-[#222E3C] shadow-2xl w-[95vw] max-w-lg mx-auto overflow-hidden max-h-[90vh] flex flex-col text-slate-900 dark:text-[#F1F5F9] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-[#222E3C] bg-slate-50 dark:bg-[#0C1015] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shrink-0">
              {isDirective ? <Scale className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9] truncate">{cluster.admin_action_label}</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono truncate">CPCB Statutory Enforcement Protocol</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 text-slate-400 hover:text-slate-700 dark:hover:text-[#F1F5F9] flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-[#1A232F] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto">
          {/* Target Cluster Brief */}
          <div className="p-3 bg-slate-50 dark:bg-[#0C1015] rounded border border-slate-200 dark:border-[#222E3C] space-y-1">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-500 dark:text-[#94A3B8]">Target Hotspot:</span>
              <span className="font-bold text-slate-900 dark:text-[#F1F5F9]">{cluster.cluster_id}</span>
            </div>
            <p className="font-semibold text-slate-900 dark:text-[#F1F5F9] truncate">{cluster.title}</p>
            <div className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-[#94A3B8] pt-1 border-t border-slate-200/60 dark:border-[#222E3C]">
              <span>{cluster.ward}</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">{cluster.hours_remaining.toFixed(1)}h SLA remaining</span>
            </div>
          </div>

          {/* Responsible Agency / Squad */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono font-medium text-slate-700 dark:text-[#94A3B8]">
              Assigned Nodal Enforcement Agency / Squad
            </label>
            <input
              type="text"
              value={assignedSquad}
              onChange={e => setAssignedSquad(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0C1015] border border-slate-300 dark:border-[#222E3C] rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-[#131922]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Statutory Reference ID */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono font-medium text-slate-700 dark:text-[#94A3B8]">
                Official Reference Notice No.
              </label>
              <input
                type="text"
                value={statutoryNoticeRef}
                onChange={e => setStatutoryNoticeRef(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0C1015] border border-slate-300 dark:border-[#222E3C] rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-[#F1F5F9] font-mono focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-[#131922]"
                required
              />
            </div>

            {/* Compliance SLA Window */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono font-medium text-slate-700 dark:text-[#94A3B8]">
                Mandated Turnaround Window
              </label>
              <select
                value={complianceDeadline}
                onChange={e => setComplianceDeadline(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0C1015] border border-slate-300 dark:border-[#222E3C] rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-[#131922]"
              >
                <option value="2 Hours (Critical Ambient Spike)">2 Hours (Critical Ambient Spike)</option>
                <option value="4 Hours (Statutory Emergency)">4 Hours (Statutory Emergency)</option>
                <option value="8 Hours (Standard Ground Action)">8 Hours (Standard Ground Action)</option>
                <option value="24 Hours (Full CPCB SLA Cap)">24 Hours (Full CPCB SLA Cap)</option>
              </select>
            </div>
          </div>

          {/* Operational Directive Details */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono font-medium text-slate-700 dark:text-[#94A3B8]">
              Statutory Order Directive &amp; Compliance Notes
            </label>
            <textarea
              rows={4}
              value={executiveNote}
              onChange={e => setExecutiveNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0C1015] border border-slate-300 dark:border-[#222E3C] rounded p-2.5 text-xs text-slate-900 dark:text-[#F1F5F9] font-sans focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-[#131922] leading-relaxed"
              required
            />
          </div>

          {/* Officer Stamp Stamp / Audit Trail Notice */}
          <div className="p-2.5 bg-slate-100/70 dark:bg-[#0C1015] rounded border border-slate-200 dark:border-[#222E3C] text-[10px] text-slate-500 dark:text-[#94A3B8] font-mono flex items-center justify-between">
            <span>Issuing Officer: Smt. P. S. Jadhav (PMC-ENV-14)</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Digitally Signed</span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#222E3C]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-slate-300 dark:border-[#222E3C] text-slate-700 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1A232F] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Dispatch Statutory Directive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminActionModal;
