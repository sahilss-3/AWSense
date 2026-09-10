import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Sliders,
  ShieldCheck,
  Check,
  RefreshCw,
  Cpu,
  Info
} from 'lucide-react';

export const SettingsPage: React.FC<{ onRefreshData: () => void }> = ({ onRefreshData }) => {
  const [anomalySensitivity, setAnomalySensitivity] = useState<number>(0.45);
  const [streamInterval, setStreamInterval] = useState<number>(5);
  const [psychrometricStrictness, setPsychrometricStrictness] = useState<number>(85);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DEE5] pb-5">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-[#12355B] flex items-center gap-2">
            <SettingsIcon className="text-[#1F4E79]" size={20} />
            System Configuration & AI Engine Parameters
          </h1>
          <p className="mt-1 text-xs text-[#5B6573]">
            Tune anomaly sensitivity thresholds, psychrometric physics coupling weights, and local storage
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded border border-[#12355B] bg-[#12355B] px-4 py-2 text-xs font-bold text-white hover:bg-[#1F4E79] transition-colors self-start shadow-sm"
        >
          {saved ? <Check size={14} /> : <Sliders size={14} />}
          <span>{saved ? 'Settings Saved' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* Model Parameters Card */}
      <div className="rounded-lg border border-[#D9DEE5] bg-white p-6 space-y-6 shadow-sm">
        <h2 className="text-sm font-semibold font-mono text-[#12355B] flex items-center gap-2">
          <Cpu size={16} className="text-[#1F4E79]" />
          Local AI/ML Detection Engine Parameters
        </h2>

        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-[#1F2937] font-medium">Composite Anomaly Cutoff Threshold</span>
              <span className="text-[#1F4E79] font-bold">{anomalySensitivity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.80"
              step="0.05"
              value={anomalySensitivity}
              onChange={(e) => setAnomalySensitivity(parseFloat(e.target.value))}
              className="w-full accent-[#1F4E79] cursor-pointer"
            />
            <p className="text-[11px] text-[#5B6573] mt-1 font-sans">
              Lower values increase sensitivity (flags subtle deviations); higher values only trigger on severe departures.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-[#1F2937] font-medium">Psychrometric Coupling Consistency Tolerance</span>
              <span className="text-[#198754] font-bold">{psychrometricStrictness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={psychrometricStrictness}
              onChange={(e) => setPsychrometricStrictness(parseInt(e.target.value))}
              className="w-full accent-[#198754] cursor-pointer"
            />
            <p className="text-[11px] text-[#5B6573] mt-1 font-sans">
              Evaluates Magnus-Tetens saturation vapor consistency to distinguish genuine solar heating from sensor faults.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-[#1F2937] font-medium">Simulated Live Stream Cycle (Seconds)</span>
              <span className="text-[#1F4E79] font-bold">{streamInterval}s</span>
            </div>
            <input
              type="range"
              min="2"
              max="30"
              step="1"
              value={streamInterval}
              onChange={(e) => setStreamInterval(parseInt(e.target.value))}
              className="w-full accent-[#1F4E79] cursor-pointer"
            />
            <p className="text-[11px] text-[#5B6573] mt-1 font-sans">
              Cadence for dashboard background telemetry sync.
            </p>
          </div>
        </div>
      </div>

      {/* Database & Storage Card */}
      <div className="rounded-lg border border-[#D9DEE5] bg-white p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold font-mono text-[#12355B] flex items-center gap-2">
          <Database size={16} className="text-[#1F4E79]" />
          Local Database & Storage (SQLite)
        </h2>
        <div className="rounded bg-[#F8FAFC] p-4 border border-[#E5E7EB] text-xs font-mono space-y-2">
          <div className="flex justify-between text-[#5B6573]">
            <span>Database Engine:</span>
            <span className="text-[#1F2937] font-semibold">SQLite 3 (Local Serverless)</span>
          </div>
          <div className="flex justify-between text-[#5B6573]">
            <span>Database Location:</span>
            <span className="text-[#1F2937] font-semibold">backend/data/awsense.db</span>
          </div>
          <div className="flex justify-between text-[#5B6573]">
            <span>Traceability Rule:</span>
            <span className="text-[#198754] font-bold">Non-Destructive Raw Data Preservation</span>
          </div>
        </div>
      </div>

      {/* SIH Compliance Card */}
      <div className="rounded-lg border border-[#1F4E79]/30 bg-[#EBF2F7] p-5 text-xs space-y-2">
        <div className="flex items-center gap-2 text-[#12355B] font-bold font-mono">
          <ShieldCheck size={16} className="text-[#1F4E79]" />
          <span>Smart India Hackathon 2026 Problem Statement SIH26073 Compliance</span>
        </div>
        <p className="text-[#374151] leading-relaxed font-sans">
          This system strictly adheres to the SIH constraint of analyzing the multivariate relationship among only 
          <strong> Temperature</strong>, <strong> Atmospheric Pressure</strong>, and <strong> Relative Humidity</strong>. 
          Zero external internet or paid API dependencies are required.
        </p>
      </div>
    </div>
  );
};
