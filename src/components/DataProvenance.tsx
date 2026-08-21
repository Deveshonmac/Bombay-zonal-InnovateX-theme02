import React, { useState } from 'react';
import {
  Info,
  Database,
  Layers,
  CheckCircle2,
  FileCode,
  Download,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Activity,
  Calculator,
  Compass,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DataProvenance: React.FC = () => {
  const { allCities, currentCity } = useApp();
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const handleDownloadDataset = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allCities, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `airsense_global_aqi_telemetry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h1 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-100">
              Data Provenance, Physics Engine & Sensor QA/QC Methodology
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Transparent scientific architecture detailing multi-agency ingestion, EPA breakpoint equations, thermal inversion modeling, and hygroscopic humidity correction.
          </p>
        </div>

        <button
          onClick={handleDownloadDataset}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all shrink-0"
          id="export-raw-telemetry-btn"
        >
          <Download className="w-4 h-4" />
          <span>{downloadSuccess ? 'Downloaded Dataset!' : 'Export Global Dataset (.JSON)'}</span>
        </button>
      </div>

      {/* Grid of Methodological Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Pillar 1: Ingestion Network */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <Layers className="w-4 h-4" />
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              1. Multi-Agency Ingestion
            </h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Data is ingested continuously from verified regulatory bodies including US EPA AirNow (FEM/FRM monitors), Copernicus Atmosphere Monitoring Service (CAMS), European Environment Agency (EEA), OpenAQ, and CPCB India.
          </p>
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] space-y-1 text-zinc-500">
            <div>• Regulatory FEM/FRM Beta-Attenuation Monitors</div>
            <div>• Sentinel-5P TROPOMI Satellite Ozone/NO2 Soundings</div>
            <div>• ERA5 Atmospheric Reanalysis Wind Grids</div>
          </div>
        </div>

        {/* Pillar 2: Low-Cost Sensor Calibration */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Cpu className="w-4 h-4" />
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              2. Sensor QA/QC & Calibration
            </h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Citizen science and hyper-local low-cost laser particle counters (OPC) undergo dynamic humidity-dependent growth factor calibration (Kohler theory) to eliminate hygroscopic water vapor scattering bias.
          </p>
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
            PM2.5_corr = 0.524 × PM_raw - 0.0862 × RH + 5.75
          </div>
        </div>

        {/* Pillar 3: Boundary Layer Meteorology */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-500">
            <Activity className="w-4 h-4" />
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              3. Thermal Inversion Index
            </h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Calculates planetary boundary layer (PBL) height compression against ground surface radiation cooling. Inversion risks (&gt;75%) flag nocturnal trapping where ventilation coefficients drop below 2000 m²/s.
          </p>
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500">
            Ventilation Index = PBL Height (m) × Wind Speed (m/s)
          </div>
        </div>

      </div>

      {/* Mathematical AQI Equation Reference */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
            EPA Piecewise Linear Interpolation Formula & Breakpoint Table
          </h2>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-zinc-800 dark:text-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sky-600 dark:text-sky-400 font-bold">
              Ip = [(I_hi - I_lo) / (BP_hi - BP_lo)] × (Cp - BP_lo) + I_lo
            </div>
            <div className="text-[11px] text-zinc-500">
              Where Ip = Air Quality Index; Cp = Truncated Pollutant Concentration; [BP_lo, BP_hi] = Breakpoint range; [I_lo, I_hi] = Index range.
            </div>
          </div>
          <span className="px-3 py-1 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[11px] font-bold shrink-0">
            US EPA 40 CFR Part 58
          </span>
        </div>

        {/* Breakpoints Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px]">
                <th className="py-2.5 font-bold">AQI Category</th>
                <th className="py-2.5 font-bold">Index Range</th>
                <th className="py-2.5 font-bold">PM2.5 (24h µg/m³)</th>
                <th className="py-2.5 font-bold">PM10 (24h µg/m³)</th>
                <th className="py-2.5 font-bold">Ozone O3 (8h ppb)</th>
                <th className="py-2.5 font-bold">NO2 (1h ppb)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="py-2.5 font-bold text-emerald-600">Good</td>
                <td>0 - 50</td>
                <td>0.0 - 12.0</td>
                <td>0 - 54</td>
                <td>0 - 54</td>
                <td>0 - 53</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-amber-500">Moderate</td>
                <td>51 - 100</td>
                <td>12.1 - 35.4</td>
                <td>55 - 154</td>
                <td>55 - 70</td>
                <td>54 - 100</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-orange-500">Unhealthy for Sensitive Groups</td>
                <td>101 - 150</td>
                <td>35.5 - 55.4</td>
                <td>155 - 254</td>
                <td>71 - 85</td>
                <td>101 - 360</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-rose-500">Unhealthy</td>
                <td>151 - 200</td>
                <td>55.5 - 150.4</td>
                <td>255 - 354</td>
                <td>86 - 105</td>
                <td>361 - 649</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-purple-500">Very Unhealthy</td>
                <td>201 - 300</td>
                <td>150.5 - 250.4</td>
                <td>355 - 424</td>
                <td>106 - 200</td>
                <td>650 - 1249</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-rose-900 dark:text-rose-400">Hazardous</td>
                <td>301 - 500+</td>
                <td>250.5 - 500.4</td>
                <td>425 - 604</td>
                <td>201+</td>
                <td>1250+</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
