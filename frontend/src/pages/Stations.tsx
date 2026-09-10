import React, { useState } from 'react';
import {
  Radio,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Search,
  ExternalLink
} from 'lucide-react';
import { Station } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { StationDetailModal } from './StationDetailModal';

interface StationsProps {
  stations: Station[];
  onSelectStation: (id: string) => void;
  onNavigateToLive: (id: string) => void;
}

export const StationsPage: React.FC<StationsProps> = ({
  stations,
  onSelectStation,
  onNavigateToLive
}) => {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = stations.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q) || s.station_id.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#D9DEE5] rounded-lg bg-white p-5 shadow-card">
        <div>
          <h1 className="text-xl font-bold font-sans text-[#12355B] tracking-tight flex items-center gap-2">
            <Radio className="text-[#1F4E79]" size={20} />
            Automatic Weather Stations Directory
          </h1>
          <p className="mt-1 text-xs text-[#5B6573]">
            Regional surface agro-meteorological and synoptic AWS network nodes and sensor health indices
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-[#5B6573]" />
          <input
            type="text"
            placeholder="Search stations or districts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-[#D9DEE5] bg-[#F4F6F8] pl-9 pr-3 py-1.5 text-xs text-[#1F2937] placeholder-[#8A94A6] focus:border-[#12355B] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Stations Table */}
      <div className="rounded-lg border border-[#D9DEE5] bg-white p-5 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9DEE5] bg-[#F8FAFC] text-[11px] font-mono text-[#5B6573] uppercase tracking-wider font-sans">
                <th className="py-2.5 px-3">Station ID</th>
                <th className="py-2.5 px-3">Station Name</th>
                <th className="py-2.5 px-3">Location / District</th>
                <th className="py-2.5 px-3">Operational Status</th>
                <th className="py-2.5 px-3">Health Score</th>
                <th className="py-2.5 px-3">Reliability</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filtered.map((st) => (
                <tr
                  key={st.station_id}
                  onClick={() => setSelectedStation(st)}
                  className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3 text-[#12355B] font-bold font-mono">{st.station_id}</td>
                  <td className="py-3 px-3 font-semibold text-[#1F2937] group-hover:text-[#1F4E79] transition-colors">
                    {st.name}
                  </td>
                  <td className="py-3 px-3 text-[#5B6573] text-xs">
                    {st.location}, {st.district}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={st.status} />
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span
                      className={`font-semibold ${
                        st.health_score >= 85
                          ? 'text-[#198754]'
                          : st.health_score >= 65
                          ? 'text-[#D99A00]'
                          : 'text-[#C62828]'
                      }`}
                    >
                      {st.health_score.toFixed(0)}/100
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#1F2937]">{st.reliability.toFixed(1)}%</td>
                  <td className="py-3 px-3 text-[#5B6573] text-[11px] font-mono">
                    {st.latitude.toFixed(2)}°N, {st.longitude.toFixed(2)}°E
                  </td>
                  <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStation(st);
                      }}
                      className="rounded border border-[#D9DEE5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B] transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStation(st.station_id);
                        onNavigateToLive(st.station_id);
                      }}
                      className="rounded border border-[#1F4E79] bg-[#EBF3FA] px-2.5 py-1 text-[11px] font-semibold text-[#12355B] hover:bg-[#D9EAF7] transition-colors"
                    >
                      Telemetry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Station Detail Modal */}
      {selectedStation && (
        <StationDetailModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onNavigateToLive={(id) => {
            setSelectedStation(null);
            onSelectStation(id);
            onNavigateToLive(id);
          }}
        />
      )}
    </div>
  );
};
