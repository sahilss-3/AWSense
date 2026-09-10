import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  MapPin,
  Clock,
  HeartPulse,
  AlertTriangle,
  Activity,
  Wrench,
  Thermometer,
  Gauge,
  Droplets
} from 'lucide-react';
import { Station, SensorReading, Anomaly, SensorHealth } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../services/api';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart';

interface StationDetailModalProps {
  station: Station | null;
  onClose: () => void;
  onNavigateToLive: (stationId: string) => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  onClose,
  onNavigateToLive
}) => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [stationAnomalies, setStationAnomalies] = useState<Anomaly[]>([]);
  const [stationHealth, setStationHealth] = useState<SensorHealth[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'health' | 'anomalies'>('overview');

  useEffect(() => {
    if (station) {
      api.getReadings(station.station_id, 30)
        .then((data) => setReadings(data))
        .catch((e) => console.error(e));

      api.getAnomalies({ station_id: station.station_id })
        .then((data) => setStationAnomalies(data))
        .catch((e) => console.error(e));

      api.getSensorHealth(station.station_id)
        .then((data) => setStationHealth(data))
        .catch((e) => console.error(e));
    }
  }, [station]);

  if (!station) return null;

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-lg border border-[#D9DEE5] bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-[#1F2937]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EBF3FA] text-[#12355B] border border-[#D9DEE5]">
              <Radio size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-sans text-[#12355B]">{station.name}</h2>
                <StatusBadge status={station.status} />
              </div>
              <p className="text-xs text-[#5B6573] mt-0.5 flex items-center gap-2">
                <MapPin size={13} className="text-[#1F4E79]" />
                {station.location} ({station.district}) • Elevation: {station.elevation}m • Station ID: <strong className="font-mono text-[#12355B]">{station.station_id}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1.5 text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E5E7EB] gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-[#12355B] text-[#12355B]'
                : 'text-[#5B6573] hover:text-[#12355B]'
            }`}
          >
            Overview & Telemetry
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`pb-2.5 transition-colors ${
              activeTab === 'health'
                ? 'border-b-2 border-[#12355B] text-[#12355B]'
                : 'text-[#5B6573] hover:text-[#12355B]'
            }`}
          >
            Transducer Health Breakdown ({stationHealth.length})
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`pb-2.5 transition-colors ${
              activeTab === 'anomalies'
                ? 'border-b-2 border-[#12355B] text-[#12355B]'
                : 'text-[#5B6573] hover:text-[#12355B]'
            }`}
          >
            Historical Anomalies ({stationAnomalies.length})
          </button>
        </div>

        {/* Content: Overview & Telemetry */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Live Readouts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="rounded-lg border border-[#D9DEE5] bg-[#F8FAFC] p-4">
                <div className="flex items-center justify-between text-xs text-[#5B6573]">
                  <span className="flex items-center gap-1.5 font-bold text-[#12355B]">
                    <Thermometer size={14} className="text-[#1F4E79]" /> Air Temp
                  </span>
                  <span>°C</span>
                </div>
                <div className="mt-2 text-2xl font-bold text-[#1F2937]">
                  {latestReading?.temperature !== null && latestReading?.temperature !== undefined
                    ? `${latestReading.temperature}°C`
                    : 'Offline'}
                </div>
                <span className="text-[11px] text-[#5B6573]">
                  AI Expected: {latestReading?.expected_temperature?.toFixed(1) ?? '—'}°C
                </span>
              </div>

              <div className="rounded-lg border border-[#D9DEE5] bg-[#F8FAFC] p-4">
                <div className="flex items-center justify-between text-xs text-[#5B6573]">
                  <span className="flex items-center gap-1.5 font-bold text-[#12355B]">
                    <Gauge size={14} className="text-[#12355B]" /> Pressure
                  </span>
                  <span>hPa</span>
                </div>
                <div className="mt-2 text-2xl font-bold text-[#1F2937]">
                  {latestReading?.pressure !== null && latestReading?.pressure !== undefined
                    ? `${latestReading.pressure} hPa`
                    : 'Offline'}
                </div>
                <span className="text-[11px] text-[#5B6573]">
                  AI Expected: {latestReading?.expected_pressure?.toFixed(1) ?? '—'} hPa
                </span>
              </div>

              <div className="rounded-lg border border-[#D9DEE5] bg-[#F8FAFC] p-4">
                <div className="flex items-center justify-between text-xs text-[#5B6573]">
                  <span className="flex items-center gap-1.5 font-bold text-[#12355B]">
                    <Droplets size={14} className="text-[#1976A8]" /> Humidity
                  </span>
                  <span>%</span>
                </div>
                <div className="mt-2 text-2xl font-bold text-[#1F2937]">
                  {latestReading?.humidity !== null && latestReading?.humidity !== undefined
                    ? `${latestReading.humidity}%`
                    : 'Offline'}
                </div>
                <span className="text-[11px] text-[#5B6573]">
                  AI Expected: {latestReading?.expected_humidity?.toFixed(1) ?? '—'}%
                </span>
              </div>
            </div>

            {/* Quick Chart */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6573]">
                Temperature Telemetry (Recent 30 Cycles)
              </h3>
              <TimeSeriesChart data={readings} parameter="temperature" height={220} />
            </div>

            {/* Geographic Coordinates Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="rounded border border-[#D9DEE5] bg-white p-3">
                <span className="text-[#5B6573] text-[10px] block font-sans">Latitude</span>
                <span className="font-bold text-[#1F2937]">{station.latitude}° N</span>
              </div>
              <div className="rounded border border-[#D9DEE5] bg-white p-3">
                <span className="text-[#5B6573] text-[10px] block font-sans">Longitude</span>
                <span className="font-bold text-[#1F2937]">{station.longitude}° E</span>
              </div>
              <div className="rounded border border-[#D9DEE5] bg-white p-3">
                <span className="text-[#5B6573] text-[10px] block font-sans">Health Score</span>
                <span className="font-bold text-[#198754]">{station.health_score.toFixed(0)}/100</span>
              </div>
              <div className="rounded border border-[#D9DEE5] bg-white p-3">
                <span className="text-[#5B6573] text-[10px] block font-sans">Reliability</span>
                <span className="font-bold text-[#12355B]">{station.reliability.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Content: Health Breakdown */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stationHealth.map((h) => (
                <div key={h.sensor_parameter} className="rounded-lg border border-[#D9DEE5] bg-[#F8FAFC] p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]">
                    <span className="font-bold uppercase text-[#12355B] font-sans">{h.sensor_parameter}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-[#D9DEE5] text-[#5B6573] font-sans">{h.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B6573]">Health Index:</span>
                    <span className="text-[#198754] font-bold">{h.health_score.toFixed(0)}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B6573]">Failure Risk:</span>
                    <span className="text-[#C62828] font-bold">{h.failure_risk.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B6573]">Drift Index:</span>
                    <span className="text-[#1F2937] font-semibold">{h.drift_score.toFixed(0)}/100</span>
                  </div>
                  <p className="text-[11px] text-[#5B6573] font-sans pt-2 border-t border-[#E5E7EB] leading-relaxed">
                    {h.maintenance_recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content: Anomalies History */}
        {activeTab === 'anomalies' && (
          <div className="space-y-2">
            {stationAnomalies.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#5B6573]">Zero anomalies recorded for this station</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
                {stationAnomalies.map((a) => (
                  <div key={a.id} className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-[#12355B] uppercase">{a.parameter}</span>
                        <span className="text-[#5B6573] font-sans">{a.anomaly_type.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-[#5B6573] text-[11px] mt-0.5">{a.explanation}</p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[#C62828] font-bold block">{a.deviation > 0 ? `+${a.deviation}` : a.deviation}</span>
                      <span className="text-[10px] text-[#5B6573]">{new Date(a.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
          <button
            onClick={onClose}
            className="rounded border border-[#D9DEE5] bg-white px-4 py-2 text-xs font-semibold text-[#5B6573] hover:bg-[#F4F6F8] transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigateToLive(station.station_id);
            }}
            className="rounded bg-[#12355B] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D2744] transition-colors shadow-sm"
          >
            Open Live Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};
