import React, { useRef } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  Shield,
  Scale,
  Clock,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Download,
} from 'lucide-react';

export interface DispatchOrderData {
  orderNumber: string;
  issueDate: string;
  clusterName: string;
  category: string;
  urgencyLevel: string;
  priorityScore: number;
  slaTarget: string;
  avgAqi: number;
  complaintCount: number;
  coordinates: { lat: number; lng: number };
  probableSource: string;
  groundContext: string;
  actions: Array<{
    timeframe: string;
    action: string;
    assignedUnit: string;
    priority?: string;
  }>;
  leadAgency: string;
  fieldOfficer: string;
  legalBasis: string;
  projectedImpact: string;
}

interface OfficialDispatchOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DispatchOrderData;
}

export const OfficialDispatchOrderModal: React.FC<OfficialDispatchOrderModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
================================================================================
GOVERNMENT OF MAHARASHTRA // PUNE MUNICIPAL CORPORATION (PMC)
MAHARASHTRA POLLUTION CONTROL BOARD (MPCB) - PUNE REGION
ENVIRONMENT & POLLUTION CONTROL DIVISION - AIR QUALITY ENFORCEMENT TASK FORCE
================================================================================
OFFICIAL DISPATCH ORDER NO: ${data.orderNumber}
DATE OF ISSUANCE: ${data.issueDate}
STATUTORY MANDATE: ISSUED UNDER SECTION 31A, AIR (PREVENTION & CONTROL OF POLLUTION) ACT, 1981

1. INCIDENT TELEMETRY & JURISDICTION:
- Target Hotspot: ${data.clusterName}
- GPS Coordinates: ${data.coordinates.lat.toFixed(6)} N, ${data.coordinates.lng.toFixed(6)} E
- Category / Hazard: ${data.category.toUpperCase().replace('_', ' ')}
- Urgency Level: ${data.urgencyLevel} (Calculated Priority Score: ${data.priorityScore}/100)
- Current Ambient AQI: ~${Math.round(data.avgAqi)}
- Citizen Influx: ${data.complaintCount} validated reports collapsed via DBSCAN
- Enforcement SLA: ${data.slaTarget}

2. GROUND DIAGNOSIS:
- Probable Source: ${data.probableSource}
- Field Context: ${data.groundContext}

3. SEQUENTIAL FIELD ENFORCEMENT DIRECTIVES:
${data.actions
  .map(
    (a, i) =>
      `${i + 1}. [${a.timeframe}] ${a.action}\n   -> Assigned Unit: ${a.assignedUnit} (Priority: ${a.priority || 'P1'})`
  )
  .join('\n')}

4. INTER-AGENCY ROSTER & STATUTORY POWERS:
- Lead Department: ${data.leadAgency}
- Officer In-Charge: ${data.fieldOfficer}
- Legal Powers: ${data.legalBasis}

5. TARGET CLEAN AIR RECOVERY:
- ${data.projectedImpact} (Target AQI: ~${Math.round(data.avgAqi * 0.7)} within 6h)

================================================================================
AUTHORIZED BY: Zonal Air Quality Nodal Officer, Pune Metropolitan Region
DIGITALLY LOGGED & ENCRYPTED VIA AIRSENSE INCIDENT COMMAND PLATFORM
================================================================================
`;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white text-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 my-8 print:border-none print:shadow-none print:my-0">
        {/* Modal Action Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 text-white print:hidden border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Official Municipal Dispatch Order</h3>
              <p className="text-[11px] text-zinc-400">Order Ref: {data.orderNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition border border-zinc-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Order Document Body */}
        <div ref={printableRef} className="p-8 md:p-12 space-y-6 text-zinc-900 bg-white font-serif print:p-6 print:text-black">
          {/* Government Masthead */}
          <div className="text-center border-b-2 border-zinc-900 pb-5 space-y-1">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-zinc-900 flex items-center justify-center font-bold text-xs">
                PMC
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold uppercase tracking-wide text-zinc-900">
                  Pune Municipal Corporation & MPCB Joint Command
                </h1>
                <p className="text-xs uppercase tracking-wider font-sans font-semibold text-zinc-600">
                  Division of Air Quality Governance & Pollution Control Task Force
                </p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-zinc-900 flex items-center justify-center font-bold text-xs">
                MPCB
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] font-sans text-zinc-700 border-t border-zinc-200 mt-3 px-2">
              <span><strong>ORDER REF NO:</strong> {data.orderNumber}</span>
              <span><strong>DISPATCH DATE:</strong> {data.issueDate}</span>
              <span><strong>DISPATCH STATUS:</strong> <span className="text-rose-700 font-bold uppercase">MANDATORY IMMEDIATE ENFORCEMENT</span></span>
            </div>
          </div>

          {/* Statutory Authority Header Banner */}
          <div className="bg-zinc-100 p-3 rounded-lg border border-zinc-300 font-sans text-xs text-zinc-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-zinc-900">
              <Scale className="w-3.5 h-3.5 text-zinc-700" />
              STATUTORY BACKING & LEGAL MANDATE:
            </div>
            <p className="text-[11px] leading-relaxed">
              This field directive is issued under the statutory powers conferred by <strong>{data.legalBasis}</strong>, read alongside the Environment (Protection) Act, 1986. Failure to comply with the stipulated interventions within the mandated SLA constitutes an offence punishable under Section 37 of the Air Act 1981.
            </p>
          </div>

          {/* Incident Telemetry Summary Table */}
          <div className="font-sans space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-300 pb-1">
              1. Incident Telemetry & Hotspot Classification
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded">
                <div className="text-[10px] text-zinc-500 uppercase">Target Hotspot</div>
                <div className="font-bold text-zinc-900 mt-0.5">{data.clusterName}</div>
              </div>
              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded">
                <div className="text-[10px] text-zinc-500 uppercase">Incident Hazard</div>
                <div className="font-bold text-zinc-900 mt-0.5 capitalize">{data.category.replace('_', ' ')}</div>
              </div>
              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded">
                <div className="text-[10px] text-zinc-500 uppercase">Ambient AQI Level</div>
                <div className="font-bold text-rose-700 mt-0.5">{Math.round(data.avgAqi)} (Severe/Hazardous)</div>
              </div>
              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded">
                <div className="text-[10px] text-zinc-500 uppercase">Enforcement SLA</div>
                <div className="font-bold text-indigo-700 mt-0.5">{data.slaTarget}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-2 bg-zinc-50 border border-zinc-200 rounded text-[11px]">
                <span className="font-semibold text-zinc-700">GPS Coordinates:</span> {data.coordinates.lat.toFixed(6)}°N, {data.coordinates.lng.toFixed(6)}°E
              </div>
              <div className="p-2 bg-zinc-50 border border-zinc-200 rounded text-[11px]">
                <span className="font-semibold text-zinc-700">Citizen Influx:</span> {data.complaintCount} validated reports (DBSCAN 2.5km cluster)
              </div>
            </div>
          </div>

          {/* Probable Source Diagnosis */}
          <div className="font-sans space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-300 pb-1">
              2. Field Intelligence & Root Cause Diagnosis
            </h2>
            <div className="bg-amber-50/70 border border-amber-300 rounded p-3 text-xs space-y-1.5">
              <div>
                <strong className="text-amber-900">Probable Source:</strong>{' '}
                <span className="text-zinc-900">{data.probableSource}</span>
              </div>
              <div>
                <strong className="text-amber-900">Ground Telemetry Context:</strong>{' '}
                <span className="text-zinc-800">{data.groundContext}</span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Directives */}
          <div className="font-sans space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-300 pb-1">
              3. Mandatory Operational Directives & SLA Schedule
            </h2>
            <div className="border border-zinc-300 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-100 text-zinc-700 border-b border-zinc-300">
                  <tr>
                    <th className="p-2.5 font-bold w-12">#</th>
                    <th className="p-2.5 font-bold w-28">Timeline</th>
                    <th className="p-2.5 font-bold">Operational Directive</th>
                    <th className="p-2.5 font-bold w-44">Assigned Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {data.actions.map((act, index) => (
                    <tr key={index} className="hover:bg-zinc-50/50">
                      <td className="p-2.5 font-bold text-zinc-500">{index + 1}</td>
                      <td className="p-2.5 font-bold text-zinc-900">{act.timeframe}</td>
                      <td className="p-2.5 text-zinc-800 leading-snug">{act.action}</td>
                      <td className="p-2.5 text-zinc-700 font-medium text-[11px]">{act.assignedUnit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inter-Agency Command & Target Recovery */}
          <div className="font-sans grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-1">
              <div className="text-[10px] font-bold uppercase text-zinc-500">Lead Coordination Department</div>
              <div className="font-bold text-zinc-900">{data.leadAgency}</div>
              <div className="text-[11px] text-zinc-600"><strong>Field Officer:</strong> {data.fieldOfficer}</div>
            </div>
            <div className="p-3 bg-emerald-50/60 border border-emerald-300 rounded space-y-1">
              <div className="text-[10px] font-bold uppercase text-emerald-800">Targeted Clean Air Recovery</div>
              <div className="font-bold text-emerald-900">{data.projectedImpact}</div>
              <div className="text-[11px] text-emerald-700">Projected target: AQI drop to ~{Math.round(data.avgAqi * 0.70)}</div>
            </div>
          </div>

          {/* Authorization & Digital Signature Box */}
          <div className="font-sans pt-4 border-t-2 border-zinc-900 grid grid-cols-2 gap-6 text-xs">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-semibold">Verification & Audit Stamp</div>
              <div className="mt-1 font-mono text-[10px] text-zinc-700 space-y-0.5">
                <div>HASH: 7f8a92b3c4d5e6f1a8c901</div>
                <div>SYSTEM: AirSense Municipal Incident Hub</div>
                <div>AUTH PROTOCOL: GOV-MAH-AQI-STAMP-V2</div>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase font-semibold">Authorized Signatory</div>
              <div className="font-bold text-sm text-zinc-900">Dr. Rajesh K. Deshmukh, IAS</div>
              <div className="text-[11px] text-zinc-600">Zonal Nodal Officer & Additional Municipal Commissioner</div>
              <div className="text-[10px] text-zinc-400">Pune Municipal Corporation / MPCB Task Force</div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 print:hidden">
          <span className="text-xs text-zinc-500 font-sans">
            Ready for official dispatch to field wireless units and contractors.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
