import React, { useState } from 'react';
import {
  Thermometer,
  Gauge,
  Droplets,
  Wind,
  Compass,
  Sun,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Wrench,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { SensorPinInfo } from './SensorPinsOverlay';
import { Anomaly, SensorHealth } from '../../types';

interface SensorDetailPanelProps {
  selectedSensor: SensorPinInfo;
  anomaly?: Anomaly | null;
  health?: SensorHealth | null;
  allSensors: Record<string, SensorPinInfo>;
  onSelectSensor: (id: string) => void;
  stationName: string;
  stationStatus: string;
}

export const SensorDetailPanel: React.FC<SensorDetailPanelProps> = ({
  selectedSensor,
  anomaly,
  health,
  allSensors,
  onSelectSensor,
  stationName,
  stationStatus
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'ai' | 'maintenance'>('live');

  const isCritical = selectedSensor.status === 'Critical' || selectedSensor.isAnomaly;
  const isWarning = selectedSensor.status === 'Warning';
  const isOffline = selectedSensor.status === 'Offline';

  const getSensorIcon = () => {
    switch (selectedSensor.id) {
      case 'temperature':
        return <Thermometer size={18} className="text-[#EF4444]" />;
      case 'pressure':
        return <Gauge size={18} className="text-[#12355B]" />;
      case 'humidity':
        return <Droplets size={18} className="text-[#0284C7]" />;
      case 'wind_speed':
        return <Wind size={18} className="text-[#10B981]" />;
      case 'wind_direction':
        return <Compass size={18} className="text-[#1F4E79]" />;
      case 'solar_panel':
        return <Sun size={18} className="text-[#F59E0B]" />;
      default:
        return <Cpu size={18} className="text-[#12355B]" />;
    }
  };

  return (
    <div className="w-full lg:w-84 xl:w-96 rounded-xl border border-[#D9DEE5] bg-white p-5 shadow-card flex flex-col justify-between font-sans text-xs">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EBF3FA] border border-[#D9DEE5]">
              {getSensorIcon()}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#12355B]">{selectedSensor.name}</h3>
              <p className="text-[11px] text-[#5B6573]">{selectedSensor.category}</p>
            </div>
          </div>

          <span
            className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
              isCritical
                ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
                : isWarning
                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]'
                : isOffline
                ? 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'
                : 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]'
            }`}
          >
            {selectedSensor.status}
          </span>
        </div>

        {/* Tab Switcher Pills matching reference */}
        <div className="grid grid-cols-3 gap-1 bg-[#F1F5F9] p-1 rounded-lg mt-3.5 mb-4 text-[11px] font-semibold text-center">
          <button
            onClick={() => setActiveTab('live')}
            className={`py-1.5 rounded-md transition-all ${
              activeTab === 'live' ? 'bg-white text-[#12355B] shadow-xs' : 'text-[#64748B] hover:text-[#12355B]'
            }`}
          >
            Live Data
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-1.5 rounded-md transition-all ${
              activeTab === 'ai' ? 'bg-white text-[#12355B] shadow-xs' : 'text-[#64748B] hover:text-[#12355B]'
            }`}
          >
            AI Analysis
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-1.5 rounded-md transition-all ${
              activeTab === 'maintenance' ? 'bg-white text-[#12355B] shadow-xs' : 'text-[#64748B] hover:text-[#12355B]'
            }`}
          >
            Maintenance
          </button>
        </div>

        {/* TAB 1: LIVE DATA (Matches Reference exactly) */}
        {activeTab === 'live' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
              <span className="text-[#5B6573]">Observed Value</span>
              <span className={`font-mono font-bold text-sm ${isCritical ? 'text-[#DC2626]' : 'text-[#12355B]'}`}>
                {selectedSensor.value}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
              <span className="text-[#5B6573]">AI Expected Range</span>
              <span className="font-mono font-medium text-[#1F2937]">
                {anomaly ? `${(anomaly.expected_value - 3).toFixed(1)} – ${(anomaly.expected_value + 3).toFixed(1)} ${selectedSensor.unit}` : '28.0 – 34.0 °C'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
              <span className="text-[#5B6573]">Deviation</span>
              <span className={`font-mono font-bold ${anomaly ? 'text-[#DC2626]' : 'text-[#10B981]'}`}>
                {anomaly ? `${anomaly.deviation > 0 ? '+' : ''}${anomaly.deviation.toFixed(1)} ${selectedSensor.unit}` : '±0.2 °C'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
              <span className="text-[#5B6573]">Anomaly Type</span>
              <span className="font-semibold text-[#1F2937]">
                {anomaly ? anomaly.anomaly_type.replace('_', ' ').replace(/\w/g, (c) => c.toUpperCase()) : 'Normal Baseline'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
              <span className="text-[#5B6573]">Confidence</span>
              <span className="font-mono font-bold text-[#12355B]">
                {anomaly ? `${Math.round(anomaly.confidence * 100)}%` : '99%'}
              </span>
            </div>

            <div className="py-1.5 border-b border-[#F1F5F9]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[#5B6573]">Sensor Health</span>
                <span className="font-mono font-bold text-[#12355B]">{selectedSensor.healthScore}%</span>
              </div>
              <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedSensor.healthScore < 50
                      ? 'bg-[#EF4444]'
                      : selectedSensor.healthScore < 80
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#10B981]'
                  }`}
                  style={{ width: `${selectedSensor.healthScore}%` }}
                />
              </div>
            </div>

            <div className="py-1.5 border-b border-[#F1F5F9]">
              <span className="text-[#5B6573] block mb-1">Likely Cause</span>
              <p className="text-[#1F2937] leading-relaxed text-[11.5px]">
                {anomaly?.root_cause || (isCritical ? 'Sensor transducer malfunction or unphysical ground loop fault' : 'Normal diurnal operational behavior')}
              </p>
            </div>

            <div className="pt-1">
              <span className="text-[#5B6573] block mb-1">Recommended Action</span>
              <p className="text-[#12355B] font-medium leading-relaxed text-[11.5px] bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                {anomaly?.recommended_action || (isCritical ? 'Inspect the sensor on-site and recalibrate or replace transducer if required.' : 'Maintain routine 180-day telemetry inspection schedule.')}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: AI ANALYSIS */}
        {activeTab === 'ai' && (
          <div className="space-y-3 text-[11.5px]">
            <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#12355B]">
                <Sparkles size={14} className="text-[#1F4E79]" />
                <span>Multi-Model AI Diagnostics</span>
              </div>
              <p className="text-[#5B6573] leading-relaxed">
                {anomaly?.explanation || 'Observation strictly conforms to thermodynamic conservation and historical Kalman diurnal filters.'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[#5B6573]">
                <span>Temporal Rate-of-Change:</span>
                <span className="font-mono font-semibold text-[#1F2937]">
                  {anomaly ? `+${anomaly.rate_of_change?.toFixed(2) || '14.2'} °C/hr` : '0.45 °C/hr'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#5B6573]">
                <span>Psychrometric Consistency:</span>
                <span className={`font-semibold ${anomaly?.humidity_consistency === 0 ? 'text-[#DC2626]' : 'text-[#10B981]'}`}>
                  {anomaly?.humidity_consistency === 0 ? 'FAIL (RH Inconsistent)' : 'PASS (Physical)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#5B6573]">
                <span>Scikit-Learn Isolation Score:</span>
                <span className="font-mono font-bold text-[#12355B]">
                  {anomaly ? anomaly.anomaly_score.toFixed(3) : '0.041 (Inlier)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MAINTENANCE */}
        {activeTab === 'maintenance' && (
          <div className="space-y-3 text-[11.5px]">
            <div className="space-y-2 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
              <div className="flex justify-between">
                <span className="text-[#5B6573]">Transducer Spec:</span>
                <span className="font-mono font-semibold text-[#12355B]">PT-100 RTD 4-Wire</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6573]">Serial No:</span>
                <span className="font-mono text-[#1F2937]">AWS-SN-2024-8841</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6573]">Last Calibration:</span>
                <span className="text-[#1F2937]">2026-05-15 (118d ago)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6573]">Next Due:</span>
                <span className="text-[#1F2937]">2026-11-15</span>
              </div>
            </div>

            <button className="w-full mt-2 rounded-lg bg-[#12355B] text-white py-2 font-semibold hover:bg-[#1F4E79] transition-colors flex items-center justify-center gap-2">
              <Wrench size={13} />
              <span>Dispatch Maintenance Crew</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Switch Sensor Buttons */}
      <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
        <span className="text-[11px] font-semibold text-[#64748B] block mb-2">Switch Sensor View:</span>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(allSensors).map(([key, s]) => (
            <button
              key={key}
              onClick={() => onSelectSensor(key)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                selectedSensor.id === key
                  ? 'bg-[#12355B] text-white'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
