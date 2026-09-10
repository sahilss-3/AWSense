import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Cpu,
  RefreshCw,
  Flame,
  Zap,
  SplitSquareVertical,
  Activity
} from 'lucide-react';
import { SimulationScenario, SimulationResult, Station, Anomaly } from '../types';
import { api } from '../services/api';
import { SeverityBadge } from '../components/common/SeverityBadge';

interface SimulationLabProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  onNavigateToTab: (tab: any, meta?: any) => void;
  onRefreshData: () => void;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  onNavigateToTab,
  onRefreshData
}) => {
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<SimulationResult | null>(null);
  const [sideBySideMode, setSideBySideMode] = useState<boolean>(true);

  // Scenarios defined as per SIH specification
  const scenarios: Array<{
    id: string;
    name: string;
    parameter: string;
    description: string;
    sampleFlow: string;
    isGenuine?: boolean;
  }> = [
    {
      id: 'sudden_spike',
      name: 'Sudden Sensor Spike',
      parameter: 'temperature',
      description: 'Temperature surges from ~31.8°C to 89.6°C while humidity & pressure remain normal.',
      sampleFlow: '31.4°C → 31.8°C → 89.6°C → Flagged Critical Anomaly (98% Conf)'
    },
    {
      id: 'sudden_drop',
      name: 'Sudden Sensor Drop',
      parameter: 'temperature',
      description: 'Temperature abruptly drops to -10.0°C due to open-circuit or ground loop fault.',
      sampleFlow: '32.0°C → 31.8°C → -10.0°C → Ground Loop / Open-Circuit Fault'
    },
    {
      id: 'frozen_sensor',
      name: 'Frozen / Stuck Sensor',
      parameter: 'temperature',
      description: 'ADC sampler freeze or mechanical stickiness resulting in zero variance (32.10°C).',
      sampleFlow: '32.1°C → 32.1°C → 32.1°C → 32.1°C → Zero-Variance Stall Detected'
    },
    {
      id: 'sensor_drift',
      name: 'Progressive Calibration Drift',
      parameter: 'temperature',
      description: 'Monotonic residual offset accumulating (+0.45°C/hr) from transducer aging.',
      sampleFlow: '31.0°C → 31.5°C → 32.0°C → 32.6°C → Monotonic Drift Alarm'
    },
    {
      id: 'missing_data',
      name: 'Telemetry Missing Packets',
      parameter: 'temperature',
      description: 'Data logger transmission failure or station modem power cut.',
      sampleFlow: '31.5°C → 31.7°C → NULL → NULL → Communication Channel Timeout'
    },
    {
      id: 'transmission_error',
      name: 'Transmission Bit Corruption',
      parameter: 'pressure',
      description: 'Bit flip in RS-485 serial packet producing unphysical barometric pressure (1240.5 hPa).',
      sampleFlow: '948.0 hPa → 1240.5 hPa → CRC / Physical Limit Breach'
    },
    {
      id: 'genuine_heat_event',
      name: 'Genuine Weather Event (Diurnal Thermal Surge)',
      parameter: 'temperature',
      description: 'Intense atmospheric heating (ΔT +3.8°C) accompanied by psychrometrically consistent RH drop.',
      sampleFlow: '31.0°C → 34.8°C with RH 64% → 50% → Classified Genuine Weather Event',
      isGenuine: true
    },
    {
      id: 'multivariate_inconsistency',
      name: 'Multivariate Inconsistency',
      parameter: 'humidity',
      description: 'Humidity jumps to 99% under blistering 34°C sunshine with zero precipitation or pressure drop.',
      sampleFlow: 'T=34°C & RH jumps to 99% → Violates Clausius-Clapeyron Equilibrium'
    }
  ];

  const handleRunSimulation = async (scenarioId: string) => {
    setRunningScenarioId(scenarioId);
    try {
      const res = await api.triggerSimulation(scenarioId, selectedStationId);
      setLatestResult(res);
      onRefreshData();
    } catch (e) {
      console.error('Simulation trigger failed', e);
    } finally {
      setRunningScenarioId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DEE5] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#12355B] flex items-center gap-2">
              <FlaskConical className="text-[#1F4E79]" size={22} />
              Weather Observation Simulation Laboratory
            </h1>
            <span className="rounded border border-[#1F4E79]/30 bg-[#EBF2F7] px-2.5 py-0.5 text-[10px] font-mono text-[#1F4E79] uppercase tracking-wider font-bold">
              Verification Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5B6573]">
            Real-time telemetry fault injection and live end-to-end AI detection & classification engine
          </p>
        </div>

        {/* Station Target Selector */}
        <div className="flex items-center gap-3 bg-white border border-[#D9DEE5] rounded-lg px-4 py-2 text-xs shadow-sm self-start">
          <span className="text-[#5B6573] font-sans font-medium">Target Station:</span>
          <select
            value={selectedStationId}
            onChange={(e) => onSelectStation(e.target.value)}
            className="bg-transparent font-mono font-bold text-[#12355B] focus:outline-none cursor-pointer"
          >
            {stations.map((s) => (
              <option key={s.station_id} value={s.station_id} className="bg-white text-[#1F2937]">
                {s.name} ({s.location})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* HIGHLIGHT SHOWCASE: SIDE-BY-SIDE SENSOR FAULT VS GENUINE WEATHER EVENT */}
      <div className="rounded-lg border border-[#D9DEE5] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#1F4E79] uppercase tracking-wider">
                Scientific Verification Demonstration
              </span>
              <span className="rounded bg-[#F4F6F8] border border-[#D9DEE5] px-2 py-0.5 text-[10px] font-sans font-semibold text-[#1F4E79]">
                Core SIH Benchmark
              </span>
            </div>
            <h2 className="text-base font-bold font-mono text-[#12355B] mt-1">
              Sensor Fault vs Genuine Weather Event Discrimination
            </h2>
            <p className="text-xs text-[#5B6573]">
              Demonstrates why AWSense does not blindly flag extreme observations as sensor failures.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Side A: Sensor Fault */}
          <div className="rounded-lg border border-[#C62828]/30 bg-[#FFF5F5] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#991B1B]">
                SCENARIO A — SENSOR FAULT
              </span>
              <span className="rounded bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-mono text-[#991B1B] font-bold">
                Artificial Spike
              </span>
            </div>
            <p className="text-xs text-[#374151] leading-relaxed font-sans">
              Temperature abruptly jumps to <strong>89.6°C</strong> while humidity remains stagnant at 65%. Violates psychrometric saturation laws.
            </p>
            <div className="rounded bg-white p-3 font-mono text-xs space-y-1 text-[#5B6573] border border-[#FCA5A5]">
              <div>Observed: <strong className="text-[#1F2937]">89.6°C</strong></div>
              <div>AI Expected: <strong className="text-[#374151]">~31.5°C</strong> (Dev: +58.1°C)</div>
              <div>Psychrometric Residual: <strong className="text-[#C62828]">Extreme violation</strong></div>
              <div>Classification: <strong className="text-[#C62828] font-bold">SUDDEN SENSOR SPIKE</strong></div>
            </div>
            <button
              disabled={runningScenarioId !== null}
              onClick={() => handleRunSimulation('sudden_spike')}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#C62828] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#B71C1C] transition-colors shadow-xs disabled:opacity-50"
            >
              <Play size={14} />
              <span>Simulate Sensor Fault (89.6°C Spike)</span>
            </button>
          </div>

          {/* Side B: Genuine Weather Event */}
          <div className="rounded-lg border border-[#198754]/30 bg-[#F0FDF4] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#166534]">
                SCENARIO B — GENUINE METEOROLOGICAL EVENT
              </span>
              <span className="rounded bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-mono text-[#166534] font-bold">
                Thermodynamic Surge
              </span>
            </div>
            <p className="text-xs text-[#374151] leading-relaxed font-sans">
              Temperature climbs rapidly to <strong>35.1°C</strong>, but humidity drops proportionally to 50%, maintaining stable dew point.
            </p>
            <div className="rounded bg-white p-3 font-mono text-xs space-y-1 text-[#5B6573] border border-[#86EFAC]">
              <div>Observed: <strong className="text-[#1F2937]">35.1°C</strong></div>
              <div>Humidity Coupling: <strong className="text-[#166534]">Preserved (98% consistency)</strong></div>
              <div>Dew Point Shift: <strong className="text-[#374151]">&lt; 1.5°C</strong></div>
              <div>Classification: <strong className="text-[#166534] font-bold">POSSIBLE GENUINE WEATHER EVENT</strong></div>
            </div>
            <button
              disabled={runningScenarioId !== null}
              onClick={() => handleRunSimulation('genuine_heat_event')}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#198754] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#157347] transition-colors shadow-xs disabled:opacity-50"
            >
              <Play size={14} />
              <span>Simulate Genuine Weather Event (Solar Surge)</span>
            </button>
          </div>
        </div>
      </div>

      {/* LATEST SIMULATION EXECUTION PIPELINE RESULT */}
      {latestResult && (
        <div className="rounded-lg border border-[#1F4E79] bg-white p-6 shadow-md space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Zap className="text-[#1F4E79]" size={18} />
              <h3 className="text-sm font-bold font-mono text-[#12355B]">
                SIMULATION PIPELINE EXECUTION COMPLETED
              </h3>
              <span className="rounded bg-[#EBF2F7] border border-[#D9DEE5] px-2 py-0.5 text-[10px] font-mono text-[#1F4E79]">
                Station: {latestResult.station_id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {latestResult.new_anomaly && (
                <button
                  onClick={() => onNavigateToTab('anomaly-investigation', { anomaly: latestResult.new_anomaly })}
                  className="flex items-center gap-1 text-xs font-semibold text-[#1F4E79] hover:underline"
                >
                  Open in Anomaly Investigation <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>

          {/* End-to-End Pipeline Steps Display */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div className="rounded bg-[#F8FAFC] p-3 border border-[#E5E7EB]">
              <span className="text-[10px] text-[#5B6573] block uppercase font-bold tracking-wider">1. Injected Value</span>
              <span className="text-base font-bold text-[#12355B]">
                {latestResult.observed_value !== null ? `${latestResult.observed_value}` : 'NULL'}
              </span>
            </div>

            <div className="rounded bg-[#F8FAFC] p-3 border border-[#E5E7EB]">
              <span className="text-[10px] text-[#5B6573] block uppercase font-bold tracking-wider">2. AI Expected</span>
              <span className="text-base font-bold text-[#374151]">
                {latestResult.expected_value !== null ? `${latestResult.expected_value}` : '—'}
              </span>
            </div>

            <div className="rounded bg-[#F8FAFC] p-3 border border-[#E5E7EB]">
              <span className="text-[10px] text-[#5B6573] block uppercase font-bold tracking-wider">3. Anomaly Score</span>
              <span className="text-base font-bold text-[#C62828]">
                {latestResult.anomaly_score.toFixed(2)}
              </span>
            </div>

            <div className="rounded bg-[#F8FAFC] p-3 border border-[#E5E7EB]">
              <span className="text-[10px] text-[#5B6573] block uppercase font-bold tracking-wider">4. Confidence</span>
              <span className="text-base font-bold text-[#1F4E79]">
                {latestResult.confidence.toFixed(0)}%
              </span>
            </div>

            <div className="rounded bg-[#F8FAFC] p-3 border border-[#E5E7EB]">
              <span className="text-[10px] text-[#5B6573] block uppercase font-bold tracking-wider">5. Classification</span>
              <span className={`text-xs font-sans font-bold block truncate ${latestResult.is_genuine_event ? 'text-[#166534]' : 'text-[#C62828]'}`}>
                {latestResult.classification.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="rounded bg-[#F8FAFC] p-3 border border-[#E5E7EB]">
              <span className="text-[10px] text-[#5B6573] block uppercase font-bold tracking-wider">6. Event Nature</span>
              <span className={`text-xs font-sans font-bold block ${latestResult.is_genuine_event ? 'text-[#166534]' : 'text-[#C62828]'}`}>
                {latestResult.is_genuine_event ? 'Genuine Weather Event' : 'Sensor Fault / Corruption'}
              </span>
            </div>
          </div>

          {/* AI Explanation & Action Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="rounded bg-[#F8FAFC] p-3.5 border border-[#E5E7EB]">
              <span className="text-[10px] font-mono uppercase text-[#1F4E79] block font-bold mb-1">
                Algorithmic Diagnostic Explanation
              </span>
              <p className="text-[#374151] leading-relaxed">
                {latestResult.explanation}
              </p>
            </div>

            <div className="rounded bg-[#F8FAFC] p-3.5 border border-[#E5E7EB]">
              <span className="text-[10px] font-mono uppercase text-[#1F4E79] block font-bold mb-1">
                Recommended Operational Action
              </span>
              <p className="text-[#166534] font-semibold mb-1">
                {latestResult.recommended_action}
              </p>
              <span className="text-[11px] text-[#5B6573]">
                Likely Root Cause: <strong className="text-[#1F2937]">{latestResult.root_cause}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ALL 8 SIMULATION SCENARIOS GRID */}
      <div>
        <h2 className="text-sm font-semibold uppercase font-mono tracking-wider text-[#12355B] mb-4 flex items-center gap-2">
          <Activity size={16} className="text-[#1F4E79]" />
          Full Operational Telemetry Scenario Suite (8 Scenarios)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenarios.map((s) => {
            const isRunning = runningScenarioId === s.id;
            return (
              <div
                key={s.id}
                className="rounded-lg border border-[#D9DEE5] bg-white p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <span className="text-[10px] font-mono uppercase text-[#1F4E79] font-bold">
                      {s.parameter}
                    </span>
                    {s.isGenuine && (
                      <span className="rounded bg-[#DCFCE7] px-1.5 py-0.5 text-[9px] font-mono text-[#166534] border border-[#86EFAC] font-bold">
                        GENUINE
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-[#12355B] font-mono mt-2">
                    {s.name}
                  </h3>
                  <p className="text-[11px] text-[#5B6573] font-sans mt-1 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
                  <div className="rounded bg-[#F8FAFC] p-2 text-[10px] font-mono text-[#374151] border border-[#E5E7EB] leading-tight">
                    {s.sampleFlow}
                  </div>

                  <button
                    disabled={runningScenarioId !== null}
                    onClick={() => handleRunSimulation(s.id)}
                    className="w-full flex items-center justify-center gap-1.5 rounded border border-[#D9DEE5] bg-white px-3 py-2 text-xs font-semibold text-[#12355B] hover:bg-[#F4F6F8] hover:border-[#1F4E79] transition-colors shadow-xs disabled:opacity-50"
                  >
                    <Play size={12} className={isRunning ? 'animate-spin' : 'text-[#1F4E79]'} />
                    <span>{isRunning ? 'Injecting...' : 'Run Simulation'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
