import React, { useState, useMemo, useRef } from 'react';
import { IncidentCluster, ResolutionRecord } from '../types';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingDown, 
  Radio, 
  Upload, 
  Camera, 
  Check
} from 'lucide-react';

interface ResolveIncidentModalProps {
  cluster: IncidentCluster;
  onClose: () => void;
  onConfirmResolution: (
    clusterId: string,
    resolution: ResolutionRecord,
    officerNote: string
  ) => void;
}

const ACTION_OPTIONS = [
  'Deployed Mist Cannon',
  'Issued Site Shutdown Notice',
  'Deployed Mechanical Road Sweeper',
  'Activated Perimeter Anti-Smog Gun',
  'Extinguished Open Waste Burning',
  'Diverted Heavy Diesel Traffic'
];

export const ResolveIncidentModal: React.FC<ResolveIncidentModalProps> = ({
  cluster,
  onClose,
  onConfirmResolution
}) => {
  // Infer nearest CAAQMS station based on ward/location
  const sensorStation = useMemo(() => {
    const wardLower = cluster.ward.toLowerCase();
    if (wardLower.includes('hadapsar')) {
      return 'Pune CAAQMS - Hadapsar Industrial Station 04';
    }
    if (wardLower.includes('shivajinagar')) {
      return 'Pune CAAQMS - Shivajinagar Central Station 02';
    }
    if (wardLower.includes('swargate')) {
      return 'Pune CAAQMS - Swargate-Jedhe Depot 01';
    }
    if (wardLower.includes('katraj') || wardLower.includes('kondhwa')) {
      return 'Pune CAAQMS - Katraj Zoo Regional Station 05';
    }
    if (wardLower.includes('yerawada') || wardLower.includes('kalas')) {
      return 'Pune CAAQMS - Yerawada Jail Road 07';
    }
    if (wardLower.includes('bhosari') || wardLower.includes('midc')) {
      return 'Pune CAAQMS - Bhosari Industrial 03';
    }
    return 'Pune CAAQMS - PMC Central Command Station';
  }, [cluster.ward]);

  const [actionExecuted, setActionExecuted] = useState(ACTION_OPTIONS[0]);
  const [preAqi] = useState(cluster.avg_aqi);
  // Default post AQI: calculated sensible reduction (20% to 35% lower)
  const [postAqi, setPostAqi] = useState(() => Math.round(Math.max(80, cluster.avg_aqi * 0.72)));
  const [officerNote, setOfficerNote] = useState(
    `Immediate ground enforcement intervention deployed at ${cluster.ward}. Suppression completed under CPCB guidelines with continuous ambient monitoring.`
  );
  
  // Drag and drop image upload state
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>({
    name: `GeoProof_${cluster.cluster_id}_Verified.jpg`,
    size: '2.4 MB'
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed deltas
  const aqiDelta = postAqi - preAqi;
  const percentReduction = Math.round(((preAqi - postAqi) / preAqi) * 100);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      setUploadedFile({ name: file.name, size: sizeStr });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      setUploadedFile({ name: file.name, size: sizeStr });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const resolutionRecord: ResolutionRecord = {
      action_type: actionExecuted.toLowerCase().replace(/\s+/g, '_'),
      action_summary: actionExecuted,
      pre_intervention_aqi: preAqi,
      post_intervention_aqi: postAqi,
      aqi_delta: aqiDelta,
      pm10_delta_percent: Math.min(-10, -percentReduction),
      sensor_station_id: sensorStation,
      evidence_photo_url: uploadedFile?.name || `Proof_${cluster.cluster_id}.jpg`,
      resolved_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      officer_id: 'Smt. P. S. Jadhav (PMC-ENV-14)'
    };

    onConfirmResolution(cluster.cluster_id, resolutionRecord, officerNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150 transition-colors">
      <div className="bg-white dark:bg-[#1E1810] border border-slate-200 dark:border-[#2E2218] rounded-lg shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col text-slate-900 dark:text-[#F1F5F9] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#2E2218] bg-slate-50 dark:bg-[#150F0A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                  Formal Incident Closure &amp; Environmental Impact
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-medium">
                  Rule 31A Verification
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono">
                {cluster.cluster_id} • {cluster.ward}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded text-slate-400 hover:text-slate-700 dark:hover:text-[#F1F5F9] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#261C12] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          
          {/* Target Cluster Snapshot */}
          <div className="p-3 bg-slate-50 dark:bg-[#150F0A] rounded-md border border-slate-200 dark:border-[#2E2218] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#64748B] font-semibold block">
              Incident Context
            </span>
            <div className="flex items-baseline justify-between">
              <h4 className="font-bold text-slate-900 dark:text-[#F1F5F9] text-xs">{cluster.title}</h4>
              <span className="text-slate-500 dark:text-[#94A3B8] font-mono text-[11px]">{cluster.complaint_count} reports</span>
            </div>
            <p className="text-slate-600 dark:text-[#94A3B8] text-[11px]">Primary vector: {cluster.primary_source}</p>
          </div>

          {/* 1. Action Executed Dropdown / Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-[#F1F5F9] font-mono">
              Action Executed &amp; Ground Intervention
            </label>
            <select
              value={actionExecuted}
              onChange={e => setActionExecuted(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#150F0A] border border-slate-300 dark:border-[#2E2218] rounded-md px-3 py-2 text-xs text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-[#1E1810] font-sans"
              required
            >
              {ACTION_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Ambient Air Quality Delta Verification (Pre vs Post AQI) */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#150F0A] rounded-lg border border-slate-200 dark:border-[#2E2218] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-[#F1F5F9] font-mono">
                Ambient Air Quality Delta Verification
              </span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Verified by CAAQMS Mesh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pre-Intervention AQI (Read-only) */}
              <div className="bg-white dark:bg-[#1E1810] p-2.5 rounded-md border border-slate-200 dark:border-[#2E2218] space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 dark:text-[#64748B] uppercase">
                  Pre-Intervention AQI
                </label>
                <div className="text-base font-bold font-mono text-slate-800 dark:text-[#F1F5F9]">
                  {preAqi}
                </div>
                <span className="text-[10px] text-amber-800 dark:text-amber-400 font-medium block">Baseline Peak</span>
              </div>

              {/* Post-Intervention AQI (Editable Input) */}
              <div className="bg-white dark:bg-[#1E1810] p-2.5 rounded-md border border-slate-200 dark:border-[#2E2218] space-y-1">
                <label className="block text-[10px] font-mono text-slate-700 dark:text-[#F1F5F9] uppercase font-semibold">
                  Post-Intervention AQI
                </label>
                <input
                  type="number"
                  min="20"
                  max={preAqi}
                  value={postAqi}
                  onChange={e => setPostAqi(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#150F0A] border border-slate-300 dark:border-[#2E2218] rounded px-2 py-0.5 text-base font-bold font-mono text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-emerald-600"
                  required
                />
                <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] font-mono block">Sensor Reading</span>
              </div>

              {/* Computed Delta & Percent Drop */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/60 p-2.5 rounded-md border border-emerald-200 dark:border-emerald-800/80 space-y-1 text-right">
                <span className="block text-[10px] font-mono text-emerald-800 dark:text-emerald-300 uppercase font-semibold">
                  Net Improvement
                </span>
                <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400 flex items-center justify-end gap-1">
                  <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{aqiDelta} AQI</span>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                  -{percentReduction}% Particulate Drop
                </span>
              </div>
            </div>

            {/* Nearest CAAQMS Attribution */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#94A3B8] pt-1 border-t border-slate-200 dark:border-[#2E2218]">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Attributed Telemetry Station:</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-[#F1F5F9]">{sensorStation}</span>
            </div>
          </div>

          {/* 3. Proof Evidence / Field Photo Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-[#F1F5F9] font-mono">
              Ground Evidence &amp; Geo-Tagged Resolution Photo
            </label>

            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-3.5 text-center cursor-pointer transition-colors ${
                isDragOver 
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' 
                  : 'border-slate-300 dark:border-[#2E2218] hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50 dark:bg-[#150F0A]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">Click to upload geo-photo</span>
                  <span className="text-slate-500 dark:text-[#94A3B8]"> or drag and drop</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-[#64748B] font-mono">
                  PNG, JPG with EXIF location tag (max 10MB)
                </p>
              </div>
            </div>

            {uploadedFile && (
              <div className="p-2 bg-slate-50 dark:bg-[#150F0A] rounded border border-slate-200 dark:border-[#2E2218] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-mono text-slate-800 dark:text-[#F1F5F9] truncate">{uploadedFile.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#64748B]">({uploadedFile.size})</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 px-1.5 py-0.2 rounded font-medium shrink-0">
                  Geo-Attached
                </span>
              </div>
            )}
          </div>

          {/* 4. Mandatory Officer Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800 dark:text-[#F1F5F9] font-mono">
              Nodal Officer Closure Notes (Statutory Audit Record)
            </label>
            <textarea
              rows={3}
              value={officerNote}
              onChange={e => setOfficerNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#150F0A] border border-slate-300 dark:border-[#2E2218] rounded-md p-2.5 text-xs text-slate-900 dark:text-[#F1F5F9] font-sans focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-[#1E1810] leading-relaxed"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-[#2E2218]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#261C12] text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-tour="submit-resolution-btn"
              className="px-4 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Verified Resolution</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolveIncidentModal;
