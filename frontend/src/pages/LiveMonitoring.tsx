import React, { useState, useEffect } from 'react';
import {
  Activity,
  Thermometer,
  Gauge,
  Droplets,
  Clock,
  Radio,
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Station, SensorReading, Anomaly } from '../types';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart';
import { api } from '../services/api';
import { SeverityBadge } from '../components/common/SeverityBadge';

interface LiveMonitoringProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  onInvestigateAnomaly?: (anomaly: Anomaly) => void;
  onNavigateToInvestigation?: () => void;
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  onInvestigateAnomaly,
  onNavigateToInvestigation
}) => {
  const [selectedSensor, setSelectedSensor] = useState<'temperature' | 'pressure' | 'humidity'>('temperature');
  const [timeWindow, setTimeWindow] = useState<'Live' | '1h' | '6h' | '24h' | '7d'>('24h');
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [inspectPoint, setInspectPoint] = useState<SensorReading | null>(null);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const data = await api.getReadings(selectedStationId, 120, timeWindow);
      setReadings(data);
      if (data.length > 0) {
        const latestAnom = [...data].reverse().find((d) => d.is_anomaly === 1);
        setInspectPoint(latestAnom || data[data.length - 1]);
      }
    } catch (e) {
      console.error('Failed to load readings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [selectedStationId, timeWindow]);

  const currentStation = stations.find((s) => s.station_id === selectedStationId) || stations[0];
  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  const sensorMeta = {
    temperature: {
      name: 'Air Temperature',
      unit: '°C',
      icon: <Thermometer size={16} className="text-[#1F4E79]" />,
      currentVal: latestReading?.temperature,
      expVal: latestReading?.expected_temperature,
      correctedVal: latestReading?.corrected_temperature,
    },
    pressure: {
      name: 'Atmospheric Pressure',
      unit: 'hPa',
      icon: <Gauge size={16} className="text-[#12355B]" />,
      currentVal: latestReading?.pressure,
      expVal: latestReading?.expected_pressure,
      correctedVal: latestReading?.corrected_pressure,
    },
    humidity: {
      name: 'Relative Humidity',
      unit: '%',
      icon: <Droplets size={16} className="text-[#1976A8]" />,
      currentVal: latestReading?.humidity,
      expVal: latestReading?.expected_humidity,
      correctedVal: latestReading?.corrected_humidity,
    },
  }[selectedSensor];

  return (
    <div className="space-y-6">
      {/* Top Controls: Station, Sensor, Time Window */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-[#D9DEE5] rounded-lg bg-white p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-sans text-[#12355B] tracking-tight flex items-center gap-2">
              <Activity className="text-[#1F4E79]" size={20} />
              Real-Time Sensor Telemetry Stream
            </h1>
            <span className="rounded-md bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 text-[11px] font-sans font-semibold text-[#12633D]">
              TELEMETRY ACTIVE
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5B6573]">
            Continuous comparative verification of observed telemetry against Kalman & diurnal baseline curves
          </p>
        </div>

        {/* Station Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-[#F4F6F8] border border-[#D9DEE5] rounded-md px-3 py-1.5 text-xs">
            <Radio size={14} className="text-[#1F4E79]" />
            <select
              value={selectedStationId}
              onChange={(e) => onSelectStation(e.target.value)}
              className="bg-transparent text-[#1F2937] font-semibold focus:outline-none cursor-pointer"
            >
              {stations.map((s) => (
                <option key={s.station_id} value={s.station_id} className="bg-white">
                  {s.name} — {s.location}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchReadings}
            className="rounded-md border border-[#D9DEE5] bg-white p-2 text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B] transition-colors"
            title="Refresh stream"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Sensor Switcher Tabs & Quick Readout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setSelectedSensor('temperature')}
          className={`rounded-lg border p-4 text-left transition-all ${
            selectedSensor === 'temperature'
              ? 'border-[#12355B] bg-[#EBF3FA] ring-2 ring-[#12355B]/10 shadow-sm'
              : 'border-[#D9DEE5] bg-white hover:border-[#1F4E79] shadow-card'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#5B6573]">
            <span className="flex items-center gap-1.5 font-semibold text-[#12355B]">
              <Thermometer size={15} className="text-[#1F4E79]" /> Air Temperature
            </span>
            <span className="font-mono text-[11px] font-bold">°C</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#1F2937]">
              {latestReading?.temperature !== null && latestReading?.temperature !== undefined
                ? `${latestReading.temperature}°C`
                : '—'}
            </span>
            <span className="text-xs font-mono text-[#5B6573]">
              Exp: {latestReading?.expected_temperature?.toFixed(1) ?? '—'}°C
            </span>
          </div>
        </button>

        <button
          onClick={() => setSelectedSensor('pressure')}
          className={`rounded-lg border p-4 text-left transition-all ${
            selectedSensor === 'pressure'
              ? 'border-[#12355B] bg-[#EBF3FA] ring-2 ring-[#12355B]/10 shadow-sm'
              : 'border-[#D9DEE5] bg-white hover:border-[#1F4E79] shadow-card'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#5B6573]">
            <span className="flex items-center gap-1.5 font-semibold text-[#12355B]">
              <Gauge size={15} className="text-[#12355B]" /> Atmospheric Pressure
            </span>
            <span className="font-mono text-[11px] font-bold">hPa</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#1F2937]">
              {latestReading?.pressure !== null && latestReading?.pressure !== undefined
                ? `${latestReading.pressure} hPa`
                : '—'}
            </span>
            <span className="text-xs font-mono text-[#5B6573]">
              Exp: {latestReading?.expected_pressure?.toFixed(1) ?? '—'} hPa
            </span>
          </div>
        </button>

        <button
          onClick={() => setSelectedSensor('humidity')}
          className={`rounded-lg border p-4 text-left transition-all ${
            selectedSensor === 'humidity'
              ? 'border-[#12355B] bg-[#EBF3FA] ring-2 ring-[#12355B]/10 shadow-sm'
              : 'border-[#D9DEE5] bg-white hover:border-[#1F4E79] shadow-card'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#5B6573]">
            <span className="flex items-center gap-1.5 font-semibold text-[#12355B]">
              <Droplets size={15} className="text-[#1976A8]" /> Relative Humidity
            </span>
            <span className="font-mono text-[11px] font-bold">%</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#1F2937]">
              {latestReading?.humidity !== null && latestReading?.humidity !== undefined
                ? `${latestReading.humidity}%`
                : '—'}
            </span>
            <span className="text-xs font-mono text-[#5B6573]">
              Exp: {latestReading?.expected_humidity?.toFixed(1) ?? '—'}%
            </span>
          </div>
        </button>
      </div>

      {/* Time Window Filter Bar */}
      <div className="flex items-center justify-between bg-white border border-[#D9DEE5] rounded-lg px-4 py-2 shadow-card">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#5B6573]">
          <Clock size={14} className="text-[#1F4E79]" />
          <span>Timeline Filter:</span>
        </div>
        <div className="flex items-center gap-1">
          {(['Live', '1h', '6h', '24h', '7d'] as const).map((w) => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={`rounded-md px-3 py-1 text-xs font-mono font-bold uppercase transition-colors ${
                timeWindow === w
                  ? 'bg-[#12355B] text-white shadow-sm'
                  : 'text-[#5B6573] hover:text-[#12355B] hover:bg-[#F4F6F8]'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Time Series Chart */}
      <div className="space-y-4">
        <TimeSeriesChart
          data={readings}
          parameter={selectedSensor}
          onPointClick={(pt) => setInspectPoint(pt)}
          height={380}
        />
      </div>

      {/* Point Inspection Panel */}
      {inspectPoint && (
        <div className="rounded-lg border border-[#D9DEE5] bg-white p-5 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#12355B]">Selected Observation:</span>
              <span className="font-mono text-xs font-bold text-[#1F4E79]">{new Date(inspectPoint.timestamp).toLocaleString()}</span>
              {inspectPoint.is_anomaly === 1 ? (
                <span className="rounded bg-[#FFEBEE] border border-[#FFCDD2] px-2 py-0.5 text-[10px] font-mono font-bold text-[#C62828]">
                  ANOMALY FLAGGED
                </span>
              ) : (
                <span className="rounded bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 text-[10px] font-mono font-bold text-[#12633D]">
                  VALID OBSERVATION
                </span>
              )}
            </div>

            {inspectPoint.is_anomaly === 1 && onNavigateToInvestigation && (
              <button
                onClick={onNavigateToInvestigation}
                className="flex items-center gap-1 text-xs font-bold text-[#1F4E79] hover:underline"
              >
                Inspect Diagnostic Drill-down <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3">
              <span className="text-[#5B6573] text-[10px] block uppercase font-sans font-semibold">Raw Observed</span>
              <span className="text-base font-bold text-[#1F2937]">
                {inspectPoint[selectedSensor] !== null && inspectPoint[selectedSensor] !== undefined
                  ? `${inspectPoint[selectedSensor]} ${sensorMeta.unit}`
                  : 'Missing'}
              </span>
            </div>

            <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3">
              <span className="text-[#5B6573] text-[10px] block uppercase font-sans font-semibold">AI Expected</span>
              <span className="text-base font-bold text-[#1F4E79]">
                {inspectPoint[`expected_${selectedSensor}` as keyof SensorReading] !== null &&
                inspectPoint[`expected_${selectedSensor}` as keyof SensorReading] !== undefined
                  ? `${(inspectPoint[`expected_${selectedSensor}` as keyof SensorReading] as number).toFixed(1)} ${sensorMeta.unit}`
                  : '—'}
              </span>
            </div>

            <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3">
              <span className="text-[#5B6573] text-[10px] block uppercase font-sans font-semibold">Deviation</span>
              {(() => {
                const obs = inspectPoint[selectedSensor] as number | null;
                const exp = inspectPoint[`expected_${selectedSensor}` as keyof SensorReading] as number | null;
                if (obs !== null && exp !== null && obs !== undefined && exp !== undefined) {
                  const dev = obs - exp;
                  return (
                    <span className={`text-base font-bold ${Math.abs(dev) > 4 ? 'text-[#C62828]' : 'text-[#1F2937]'}`}>
                      {dev > 0 ? `+${dev.toFixed(2)}` : dev.toFixed(2)} {sensorMeta.unit}
                    </span>
                  );
                }
                return <span className="text-[#5B6573] text-base font-bold">—</span>;
              })()}
            </div>

            <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-3">
              <span className="text-[#5B6573] text-[10px] block uppercase font-sans font-semibold">Sanitized Value</span>
              <span className="text-base font-bold text-[#12633D]">
                {inspectPoint[`corrected_${selectedSensor}` as keyof SensorReading] !== null &&
                inspectPoint[`corrected_${selectedSensor}` as keyof SensorReading] !== undefined
                  ? `${(inspectPoint[`corrected_${selectedSensor}` as keyof SensorReading] as number).toFixed(1)} ${sensorMeta.unit}`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Observations Table */}
      <div className="rounded-lg border border-[#D9DEE5] bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold text-[#12355B] mb-3 pb-2 border-b border-[#E5E7EB]">
          Recent Telemetry Cycles (Last 10 Cycles)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#D9DEE5] bg-[#F8FAFC] text-[11px] text-[#5B6573] uppercase tracking-wider font-sans">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-2">Raw Temp</th>
                <th className="py-2.5 px-2">Exp Temp</th>
                <th className="py-2.5 px-2">Pressure</th>
                <th className="py-2.5 px-2">Humidity</th>
                <th className="py-2.5 px-3">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {readings
                .slice(-10)
                .reverse()
                .map((r, i) => (
                  <tr
                    key={i}
                    onClick={() => setInspectPoint(r)}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    <td className="py-2 px-3 text-[#5B6573]">
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-2 text-[#1F2937] font-bold">
                      {r.temperature !== null && r.temperature !== undefined ? `${r.temperature}°C` : '—'}
                    </td>
                    <td className="py-2 px-2 text-[#1F4E79]">
                      {r.expected_temperature?.toFixed(1) ?? '—'}°C
                    </td>
                    <td className="py-2 px-2 text-[#1F2937]">{r.pressure ?? '—'} hPa</td>
                    <td className="py-2 px-2 text-[#1F2937]">{r.humidity ?? '—'}%</td>
                    <td className="py-2 px-3">
                      {r.is_anomaly === 1 ? (
                        <span className="rounded bg-[#FFEBEE] border border-[#FFCDD2] px-1.5 py-0.5 text-[10px] font-bold text-[#C62828]">
                          ANOMALY
                        </span>
                      ) : (
                        <span className="text-[#198754] font-semibold text-[11px]">VALID</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
