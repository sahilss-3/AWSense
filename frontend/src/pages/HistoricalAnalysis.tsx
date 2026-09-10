import React, { useState, useEffect } from 'react';
import {
  History,
  Radio,
  Calendar,
  Download,
  Filter,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { Station, SensorReading, Anomaly } from '../types';
import { api } from '../services/api';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart';

interface HistoricalAnalysisProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
}

export const HistoricalAnalysisPage: React.FC<HistoricalAnalysisProps> = ({
  stations,
  selectedStationId,
  onSelectStation
}) => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [activeParam, setActiveParam] = useState<'temperature' | 'pressure' | 'humidity'>('temperature');
  const [timeRange, setTimeRange] = useState<'24h' | '7d'>('24h');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getReadings(selectedStationId, 200, timeRange)
      .then((data) => setReadings(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [selectedStationId, timeRange]);

  const currentStation = stations.find((s) => s.station_id === selectedStationId) || stations[0];
  const totalObs = readings.length;
  const anomObs = readings.filter((r) => r.is_anomaly === 1).length;
  const rel = totalObs > 0 ? (((totalObs - anomObs) / totalObs) * 100).toFixed(1) : '100.0';

  const exportCSV = () => {
    if (!readings.length) return;
    const headers = ['Timestamp', 'Station', 'Temperature', 'Pressure', 'Humidity', 'ExpTemp', 'ExpPress', 'ExpHum', 'IsAnomaly'];
    const rows = readings.map((r) => [
      r.timestamp,
      r.station_id,
      r.temperature ?? '',
      r.pressure ?? '',
      r.humidity ?? '',
      r.expected_temperature ?? '',
      r.expected_pressure ?? '',
      r.expected_humidity ?? '',
      r.is_anomaly
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AWSense_${selectedStationId}_telemetry.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DEE5] pb-5">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-[#12355B] flex items-center gap-2">
            <History className="text-[#1F4E79]" size={20} />
            Historical Telemetry & Climatological Analysis
          </h1>
          <p className="mt-1 text-xs text-[#5B6573]">
            Multi-day multi-trace retrospective analysis of AWS observations against baseline expectations
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded border border-[#D9DEE5] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1F4E79] hover:bg-[#F4F6F8] shadow-sm transition-colors self-start"
        >
          <Download size={14} className="text-[#1F4E79]" />
          <span>Export CSV Telemetry</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#D9DEE5] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#D9DEE5] rounded px-3 py-1.5 text-xs">
            <Radio size={14} className="text-[#1F4E79]" />
            <select
              value={selectedStationId}
              onChange={(e) => onSelectStation(e.target.value)}
              className="bg-transparent text-[#1F2937] font-semibold focus:outline-none cursor-pointer"
            >
              {stations.map((s) => (
                <option key={s.station_id} value={s.station_id} className="bg-white text-[#1F2937]">
                  {s.name} ({s.location})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 rounded border border-[#D9DEE5] bg-[#F8FAFC] p-1 text-xs font-mono">
            <button
              onClick={() => setActiveParam('temperature')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeParam === 'temperature' ? 'bg-[#12355B] text-white font-semibold shadow-xs' : 'text-[#5B6573] hover:text-[#1F2937]'
              }`}
            >
              Temperature
            </button>
            <button
              onClick={() => setActiveParam('pressure')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeParam === 'pressure' ? 'bg-[#12355B] text-white font-semibold shadow-xs' : 'text-[#5B6573] hover:text-[#1F2937]'
              }`}
            >
              Pressure
            </button>
            <button
              onClick={() => setActiveParam('humidity')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeParam === 'humidity' ? 'bg-[#12355B] text-white font-semibold shadow-xs' : 'text-[#5B6573] hover:text-[#1F2937]'
              }`}
            >
              Humidity
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="flex items-center gap-5 text-xs font-mono">
          <div>
            <span className="text-[#5B6573]">Total Cycles: </span>
            <strong className="text-[#12355B] font-bold">{totalObs}</strong>
          </div>
          <div>
            <span className="text-[#5B6573]">Anomalies: </span>
            <strong className={anomObs > 0 ? 'text-[#C62828] font-bold' : 'text-[#198754] font-bold'}>{anomObs}</strong>
          </div>
          <div>
            <span className="text-[#5B6573]">Data Reliability: </span>
            <strong className="text-[#1F4E79] font-bold">{rel}%</strong>
          </div>
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div className="space-y-2">
        <TimeSeriesChart data={readings} parameter={activeParam} height={340} />
      </div>

      {/* Detailed Telemetry Table */}
      <div className="rounded-lg border border-[#D9DEE5] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#12355B] mb-3">Multi-Parameter Historical Records Table</h2>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#D9DEE5]">
              <tr className="text-[11px] text-[#5B6573] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Temperature (°C)</th>
                <th className="py-2.5 px-3">Expected Temp</th>
                <th className="py-2.5 px-3">Pressure (hPa)</th>
                <th className="py-2.5 px-3">Humidity (%)</th>
                <th className="py-2.5 px-3">AI Flag</th>
                <th className="py-2.5 px-3 text-right">Deviation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {readings.slice(-50).reverse().map((r, i) => {
                const diff = r.temperature !== null && r.expected_temperature !== null && r.temperature !== undefined && r.expected_temperature !== undefined
                  ? (r.temperature - r.expected_temperature)
                  : 0;

                return (
                  <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-3 text-[#5B6573]">
                      {new Date(r.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-[#1F2937] font-semibold">
                      {r.temperature !== null && r.temperature !== undefined ? `${r.temperature}°C` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[#5B6573]">
                      {r.expected_temperature?.toFixed(1) ?? '—'}°C
                    </td>
                    <td className="py-2.5 px-3 text-[#1F2937]">{r.pressure ?? '—'} hPa</td>
                    <td className="py-2.5 px-3 text-[#1F2937]">{r.humidity ?? '—'}%</td>
                    <td className="py-2.5 px-3">
                      {r.is_anomaly === 1 ? (
                        <span className="rounded bg-[#FEE2E2] px-1.5 py-0.5 text-[10px] font-bold text-[#991B1B] border border-[#FCA5A5]">
                          ANOMALY
                        </span>
                      ) : (
                        <span className="text-[#166534] font-medium text-[11px]">VALID</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={Math.abs(diff) > 3 ? 'text-[#C62828] font-bold' : 'text-[#1F2937]'}>
                        {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}°C
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
