import React, { useState } from 'react';
import {
  HeartPulse,
  Thermometer,
  Gauge,
  Droplets,
  AlertTriangle,
  TrendingDown,
  Clock,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { SensorHealth, Station } from '../types';
import { HealthTrendChart } from '../components/charts/HealthTrendChart';

interface SensorHealthProps {
  sensorHealth: SensorHealth[];
  stations: Station[];
  onSelectStation: (stationId: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const SensorHealthPage: React.FC<SensorHealthProps> = ({
  sensorHealth,
  stations,
  onSelectStation,
  onNavigateToTab
}) => {
  const [stationFilter, setStationFilter] = useState('ALL');
  const [paramFilter, setParamFilter] = useState('ALL');

  const filtered = sensorHealth.filter((h) => {
    if (stationFilter !== 'ALL' && h.station_id !== stationFilter) return false;
    if (paramFilter !== 'ALL' && h.sensor_parameter !== paramFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DEE5] pb-5">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-[#12355B] flex items-center gap-2">
            <HeartPulse className="text-[#1F4E79]" size={20} />
            Sensor Health & Predictive Degradation
          </h1>
          <p className="mt-1 text-xs text-[#5B6573]">
            Algorithmic health tracking, calibration drift index, and predictive failure estimation for AWS transducers
          </p>
        </div>

        {/* Disclaimer alert */}
        <div className="rounded border border-[#D99A00]/40 bg-[#FFFBEB] px-3 py-1.5 text-xs text-[#B45309] flex items-center gap-2 font-medium">
          <AlertTriangle size={14} className="text-[#D99A00] shrink-0" />
          <span>Notice: Failure Risk is an algorithmic degradation indicator, not a confirmed hardware failure.</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#D9DEE5] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="rounded border border-[#D9DEE5] bg-[#F8FAFC] px-3 py-1.5 text-xs text-[#1F2937] font-medium focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
          >
            <option value="ALL">All Stations</option>
            {stations.map((s) => (
              <option key={s.station_id} value={s.station_id}>
                {s.name} ({s.station_id})
              </option>
            ))}
          </select>

          <select
            value={paramFilter}
            onChange={(e) => setParamFilter(e.target.value)}
            className="rounded border border-[#D9DEE5] bg-[#F8FAFC] px-3 py-1.5 text-xs text-[#1F2937] font-medium focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
          >
            <option value="ALL">All Parameters</option>
            <option value="temperature">Temperature Transducer</option>
            <option value="pressure">Barometric Transducer</option>
            <option value="humidity">Hygrometer Transducer</option>
          </select>
        </div>

        <span className="text-xs font-mono text-[#5B6573]">
          Tracking <strong className="text-[#12355B]">{filtered.length}</strong> active sensor probes
        </span>
      </div>

      {/* Sensor Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const isCritical = item.status === 'Critical' || item.status === 'Maintenance Required';
          const isWarning = item.status === 'Warning';

          let icon = <Thermometer className="text-[#1F4E79]" size={18} />;
          if (item.sensor_parameter === 'pressure') {
            icon = <Gauge className="text-[#1F4E79]" size={18} />;
          } else if (item.sensor_parameter === 'humidity') {
            icon = <Droplets className="text-[#1F4E79]" size={18} />;
          }

          return (
            <div
              key={`${item.station_id}-${item.sensor_parameter}`}
              className={`rounded-lg border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                isCritical
                  ? 'border-[#C62828] ring-1 ring-[#C62828]/20'
                  : isWarning
                  ? 'border-[#D99A00]'
                  : 'border-[#D9DEE5]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2.5">
                  <div className="rounded bg-[#F4F6F8] p-2 text-[#1F4E79] border border-[#D9DEE5]">
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#12355B] font-mono">
                      {item.station_id}
                    </h3>
                    <span className="text-xs text-[#5B6573] capitalize">
                      {item.sensor_parameter} Transducer
                    </span>
                  </div>
                </div>

                <span
                  className={`rounded px-2.5 py-0.5 text-xs font-semibold ${
                    item.status === 'Healthy'
                      ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]'
                      : item.status === 'Warning'
                      ? 'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]'
                      : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Health and Failure Risk Gauges */}
              <div className="mt-4 grid grid-cols-2 gap-3 font-mono">
                <div className="rounded bg-[#F8FAFC] p-3 border border-[#E5E7EB]">
                  <span className="text-[10px] text-[#5B6573] uppercase font-bold tracking-wider block">Health Score</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-2xl font-bold ${
                        item.health_score >= 80
                          ? 'text-[#198754]'
                          : item.health_score >= 60
                          ? 'text-[#D99A00]'
                          : 'text-[#C62828]'
                      }`}
                    >
                      {item.health_score.toFixed(0)}
                    </span>
                    <span className="text-xs text-[#5B6573]">/100</span>
                  </div>
                </div>

                <div className="rounded bg-[#F8FAFC] p-3 border border-[#E5E7EB]">
                  <span className="text-[10px] text-[#5B6573] uppercase font-bold tracking-wider block">Degradation Risk</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-2xl font-bold ${
                        item.failure_risk > 50
                          ? 'text-[#C62828]'
                          : item.failure_risk > 25
                          ? 'text-[#D99A00]'
                          : 'text-[#198754]'
                      }`}
                    >
                      {item.failure_risk.toFixed(0)}%
                    </span>
                    <span className="text-xs text-[#5B6573] capitalize">{item.trend}</span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Factors List */}
              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#5B6573]">
                  <span>Stability Index:</span>
                  <span className="text-[#1F2937] font-semibold">{item.stability_score.toFixed(0)}/100</span>
                </div>
                <div className="flex justify-between text-[#5B6573]">
                  <span>Calibration Drift Score:</span>
                  <span className="text-[#1F2937] font-semibold">{item.drift_score.toFixed(0)}/100</span>
                </div>
                <div className="flex justify-between text-[#5B6573]">
                  <span>Anomaly Frequency:</span>
                  <span className="text-[#1F2937] font-semibold">{item.anomaly_frequency.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[#5B6573]">
                  <span>Missing Data Rate:</span>
                  <span className="text-[#1F2937] font-semibold">{item.missing_data_rate.toFixed(1)}%</span>
                </div>
              </div>

              {/* 14-Day Degradation Trend Chart */}
              <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between text-[11px] text-[#5B6573] mb-1">
                  <span className="font-medium">14-Day Trajectory Projection</span>
                  <span className="text-[#1F4E79] font-mono text-[10px] font-semibold">Health vs Risk</span>
                </div>
                <HealthTrendChart healthScore={item.health_score} failureRisk={item.failure_risk} />
              </div>

              {/* Maintenance Recommendation */}
              <div className="mt-4 rounded bg-[#F8FAFC] p-3 border border-[#E5E7EB] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#1F4E79] tracking-wider block mb-1">
                  Algorithmic Advisory
                </span>
                <p className="text-[#374151] text-[11px] leading-relaxed">
                  {item.maintenance_recommendation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
