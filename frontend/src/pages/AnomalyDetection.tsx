import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { Anomaly, Station } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';

interface AnomalyDetectionProps {
  anomalies: Anomaly[];
  stations: Station[];
  onSelectAnomaly: (anomaly: Anomaly) => void;
  onRefresh: () => void;
}

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({
  anomalies,
  stations,
  onSelectAnomaly,
  onRefresh
}) => {
  const [stationFilter, setStationFilter] = useState('ALL');
  const [parameterFilter, setParameterFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = anomalies.filter((a) => {
    if (stationFilter !== 'ALL' && a.station_id !== stationFilter) return false;
    if (parameterFilter !== 'ALL' && a.parameter !== parameterFilter) return false;
    if (typeFilter !== 'ALL' && a.anomaly_type !== typeFilter) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.station_id.toLowerCase().includes(q) ||
        a.explanation.toLowerCase().includes(q) ||
        a.anomaly_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const anomalyTypes = Array.from(new Set(anomalies.map((a) => a.anomaly_type)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#D9DEE5] rounded-lg bg-white p-5 shadow-card">
        <div>
          <h1 className="text-xl font-bold font-sans text-[#12355B] tracking-tight flex items-center gap-2">
            <AlertTriangle className="text-[#C62828]" size={20} />
            Meteorological Anomaly Detection Registry
          </h1>
          <p className="mt-1 text-xs text-[#5B6573]">
            Algorithmic statistical outlier classification across temperature, pressure, and relative humidity
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 rounded border border-[#D9DEE5] bg-white px-3 py-1.5 text-xs font-semibold text-[#12355B] hover:bg-[#F4F6F8] transition-colors self-start"
        >
          <RefreshCw size={13} />
          <span>Refresh Catalog</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border border-[#D9DEE5] bg-white p-4 space-y-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-2.5 text-[#5B6573]" />
            <input
              type="text"
              placeholder="Search station, anomaly type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#D9DEE5] bg-[#F4F6F8] pl-9 pr-3 py-1.5 text-xs text-[#1F2937] placeholder-[#8A94A6] focus:border-[#12355B] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Station Filter */}
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="rounded-md border border-[#D9DEE5] bg-[#F4F6F8] px-3 py-1.5 text-xs text-[#1F2937] focus:border-[#12355B] focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Stations</option>
            {stations.map((s) => (
              <option key={s.station_id} value={s.station_id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Parameter Filter */}
          <select
            value={parameterFilter}
            onChange={(e) => setParameterFilter(e.target.value)}
            className="rounded-md border border-[#D9DEE5] bg-[#F4F6F8] px-3 py-1.5 text-xs text-[#1F2937] focus:border-[#12355B] focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Parameters</option>
            <option value="temperature">Temperature</option>
            <option value="pressure">Pressure</option>
            <option value="humidity">Humidity</option>
          </select>

          {/* Anomaly Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-[#D9DEE5] bg-[#F4F6F8] px-3 py-1.5 text-xs text-[#1F2937] focus:border-[#12355B] focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Anomaly Types</option>
            {anomalyTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-md border border-[#D9DEE5] bg-[#F4F6F8] px-3 py-1.5 text-xs text-[#1F2937] focus:border-[#12355B] focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-[#5B6573] pt-2 border-t border-[#E5E7EB]">
          <span>Displaying <strong>{filtered.length}</strong> of {anomalies.length} registered anomalies</span>
          {(stationFilter !== 'ALL' || parameterFilter !== 'ALL' || typeFilter !== 'ALL' || severityFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setStationFilter('ALL');
                setParameterFilter('ALL');
                setTypeFilter('ALL');
                setSeverityFilter('ALL');
                setSearchQuery('');
              }}
              className="text-[#1F4E79] font-semibold hover:underline text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Anomalies Table */}
      <div className="rounded-lg border border-[#D9DEE5] bg-white p-5 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9DEE5] bg-[#F8FAFC] text-[11px] font-mono text-[#5B6573] uppercase tracking-wider font-sans">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Station</th>
                <th className="py-2.5 px-3">Parameter</th>
                <th className="py-2.5 px-3">Observed</th>
                <th className="py-2.5 px-3">Expected</th>
                <th className="py-2.5 px-3">Deviation</th>
                <th className="py-2.5 px-3">Anomaly Classification</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3 text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#5B6573] font-sans">
                    No anomalies match current filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => onSelectAnomaly(a)}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 text-[#5B6573]">
                      {new Date(a.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-3 text-[#12355B] font-bold group-hover:text-[#1F4E79] transition-colors">
                      {a.station_id}
                    </td>
                    <td className="py-3 px-3 text-[#5B6573] uppercase text-[11px]">
                      {a.parameter}
                    </td>
                    <td className="py-3 px-3 text-[#1F2937] font-bold">
                      {a.observed_value}
                      {a.parameter === 'temperature' ? '°C' : a.parameter === 'pressure' ? ' hPa' : '%'}
                    </td>
                    <td className="py-3 px-3 text-[#1F4E79]">
                      {a.expected_value}
                      {a.parameter === 'temperature' ? '°C' : a.parameter === 'pressure' ? ' hPa' : '%'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${Math.abs(a.deviation) > 4 ? 'text-[#C62828]' : 'text-[#1F2937]'}`}>
                        {a.deviation > 0 ? `+${a.deviation}` : a.deviation}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="text-[11px] font-semibold text-[#1F2937]">
                        {a.anomaly_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <SeverityBadge severity={a.severity} />
                    </td>
                    <td className="py-3 px-3 text-[#12355B] font-bold">
                      {a.confidence.toFixed(0)}%
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAnomaly(a);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-[#D9DEE5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1F4E79] hover:bg-[#EBF3FA] transition-colors"
                      >
                        Investigate <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
