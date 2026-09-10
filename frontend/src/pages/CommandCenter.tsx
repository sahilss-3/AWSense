import React from 'react';
import {
  Radio,
  Wifi,
  AlertTriangle,
  Flame,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Activity,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { SystemStatus, Station, Anomaly, SensorHealth } from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { ReliabilityChart } from '../components/charts/ReliabilityChart';

interface CommandCenterProps {
  systemStatus: SystemStatus | null;
  stations: Station[];
  anomalies: Anomaly[];
  sensorHealth: SensorHealth[];
  onSelectStation: (id: string) => void;
  onNavigateToTab: (tab: any, meta?: any) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  systemStatus,
  stations,
  anomalies,
  sensorHealth,
  onSelectStation,
  onNavigateToTab
}) => {
  const onlineCount = systemStatus?.online_stations ?? stations.filter((s) => s.status !== 'OFFLINE').length;
  const totalCount = systemStatus?.total_stations ?? stations.length;
  const activeAnomaliesCount = systemStatus?.active_anomalies ?? anomalies.filter((a) => a.status !== 'Resolved').length;
  const criticalSensorsCount = systemStatus?.critical_sensors ?? sensorHealth.filter((h) => h.status === 'Critical' || h.status === 'Maintenance Required').length;
  const overallRel = systemStatus?.overall_reliability ?? 96.8;

  // Sensor health distribution
  const healthySensors = sensorHealth.filter((s) => s.status === 'Healthy').length;
  const warningSensors = sensorHealth.filter((s) => s.status === 'Warning').length;
  const criticalSensors = sensorHealth.filter((s) => s.status === 'Critical' || s.status === 'Maintenance Required').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DEE5] pb-4 bg-white p-5 rounded-lg border shadow-card">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold font-sans text-[#12355B] tracking-tight">
              Command & Telemetry Control Center
            </h1>
            <span className="rounded border border-[#D9DEE5] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-mono font-semibold text-[#1F4E79]">
              SIH26073 • Synoptic Grid
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5B6573]">
            Automated Weather Station (AWS) Observation Quality Assurance, Anomaly Flagging & Transducer Health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTab('simulation-lab')}
            className="flex items-center gap-1.5 rounded-md border border-[#F28C28] bg-[#FEF3E9] px-3 py-1.5 text-xs font-bold text-[#12355B] hover:bg-[#FDE8D4] transition-colors shadow-sm"
          >
            <Flame size={14} className="text-[#F28C28]" />
            <span>Simulation Laboratory</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total AWS Stations"
          value={totalCount}
          subtitle="Regional synoptic network"
          icon={<Radio size={16} />}
        />
        <StatCard
          title="Online Stations"
          value={`${onlineCount}/${totalCount}`}
          subtitle="Active telemetry streaming"
          delta={onlineCount === totalCount ? '100%' : `${((onlineCount / totalCount) * 100).toFixed(0)}%`}
          deltaType="positive"
          icon={<Wifi size={16} />}
        />
        <StatCard
          title="Active Anomalies"
          value={activeAnomaliesCount}
          subtitle="Flagged by AI engine"
          delta={activeAnomaliesCount > 0 ? 'Action required' : 'Clear'}
          deltaType={activeAnomaliesCount > 0 ? 'negative' : 'positive'}
          icon={<AlertTriangle size={16} />}
        />
        <StatCard
          title="Critical Sensors"
          value={criticalSensorsCount}
          subtitle="Degradation risk high"
          delta="Inspection alert"
          deltaType={criticalSensorsCount > 0 ? 'negative' : 'neutral'}
          icon={<Flame size={16} />}
        />
        <StatCard
          title="Data Reliability"
          value={`${overallRel.toFixed(1)}%`}
          subtitle="Valid observations rate"
          delta="+0.4%"
          deltaType="positive"
          icon={<ShieldCheck size={16} />}
        />
      </div>

      {/* Grid: 24h Reliability Trend & Sensor Health Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 24-hr Data Reliability Trend */}
        <div className="lg:col-span-2 rounded-lg border border-[#D9DEE5] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-sm font-bold text-[#12355B] flex items-center gap-2">
                <TrendingUp size={16} className="text-[#1F4E79]" />
                Network Data Reliability Trend (24-Hour Window)
              </h2>
              <p className="text-xs text-[#5B6573]">Continuous telemetry verification index across synoptic nodes</p>
            </div>
            <span className="font-mono text-xs font-bold text-[#12355B] bg-[#EBF3FA] border border-[#D9DEE5] px-2.5 py-0.5 rounded">
              Average: {overallRel.toFixed(1)}%
            </span>
          </div>
          <ReliabilityChart reliability={overallRel} />
        </div>

        {/* Sensor Health Distribution & AI Engines Status */}
        <div className="space-y-6">
          <div className="rounded-lg border border-[#D9DEE5] bg-white p-5 shadow-card">
            <h2 className="text-sm font-bold text-[#12355B] flex items-center gap-2 mb-3 pb-2 border-b border-[#E5E7EB]">
              <Layers size={16} className="text-[#1F4E79]" />
              Sensor Health Distribution
            </h2>
            <div className="space-y-3 font-sans">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#12633D] font-semibold">Healthy Transducers ({healthySensors})</span>
                  <span className="font-mono text-[#5B6573]">
                    {sensorHealth.length ? ((healthySensors / sensorHealth.length) * 100).toFixed(0) : 75}%
                  </span>
                </div>
                <div className="h-2 rounded bg-[#E5E7EB] overflow-hidden border border-[#D9DEE5]">
                  <div
                    className="h-full bg-[#198754] rounded"
                    style={{ width: `${sensorHealth.length ? (healthySensors / sensorHealth.length) * 100 : 75}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#B78103] font-semibold">Warning / Calibration Drift ({warningSensors})</span>
                  <span className="font-mono text-[#5B6573]">
                    {sensorHealth.length ? ((warningSensors / sensorHealth.length) * 100).toFixed(0) : 15}%
                  </span>
                </div>
                <div className="h-2 rounded bg-[#E5E7EB] overflow-hidden border border-[#D9DEE5]">
                  <div
                    className="h-full bg-[#D99A00] rounded"
                    style={{ width: `${sensorHealth.length ? (warningSensors / sensorHealth.length) * 100 : 15}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#C62828] font-semibold">Critical / Maintenance Required ({criticalSensors})</span>
                  <span className="font-mono text-[#5B6573]">
                    {sensorHealth.length ? ((criticalSensors / sensorHealth.length) * 100).toFixed(0) : 10}%
                  </span>
                </div>
                <div className="h-2 rounded bg-[#E5E7EB] overflow-hidden border border-[#D9DEE5]">
                  <div
                    className="h-full bg-[#C62828] rounded"
                    style={{ width: `${sensorHealth.length ? (criticalSensors / sensorHealth.length) * 100 : 10}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#5B6573]">
              <span>Tracked Probes:</span>
              <span className="font-mono font-bold text-[#1F2937]">{sensorHealth.length || 24} units</span>
            </div>
          </div>

          {/* AI Operational Status Box */}
          <div className="rounded-lg border border-[#D9DEE5] bg-white p-4 shadow-card">
            <span className="text-xs font-bold uppercase tracking-wider text-[#12355B] flex items-center gap-1.5 mb-2.5">
              <Cpu size={14} className="text-[#1F4E79]" />
              AI System Status
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-2">
                <span className="text-[10px] text-[#5B6573] block">Anomaly Detector</span>
                <span className="font-bold text-[#198754]">ONLINE</span>
              </div>
              <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-2">
                <span className="text-[10px] text-[#5B6573] block">Streaming Pipeline</span>
                <span className="font-bold text-[#198754]">ACTIVE</span>
              </div>
              <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-2">
                <span className="text-[10px] text-[#5B6573] block">Health Engine</span>
                <span className="font-bold text-[#198754]">ONLINE</span>
              </div>
              <div className="rounded border border-[#D9DEE5] bg-[#F8FAFC] p-2">
                <span className="text-[10px] text-[#5B6573] block">Explainability XAI</span>
                <span className="font-bold text-[#198754]">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Live Network Status Table + Live Anomaly Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Network Status Table (7 cols) */}
        <div className="lg:col-span-7 rounded-lg border border-[#D9DEE5] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-sm font-bold text-[#12355B] flex items-center gap-2">
                <Radio size={16} className="text-[#1F4E79]" />
                Live Network Observation Status
              </h2>
              <p className="text-xs text-[#5B6573]">Surface meteorological monitoring nodes across Maharashtra</p>
            </div>
            <button
              onClick={() => onNavigateToTab('stations')}
              className="text-xs font-semibold text-[#1F4E79] hover:underline flex items-center gap-1"
            >
              All Stations <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D9DEE5] bg-[#F8FAFC] text-[11px] font-mono text-[#5B6573] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Health</th>
                  <th className="py-2.5 px-2">Reliability</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {stations.map((st) => (
                  <tr
                    key={st.station_id}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                    onClick={() => {
                      onSelectStation(st.station_id);
                      onNavigateToTab('live-monitoring');
                    }}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#12355B] group-hover:text-[#1F4E79] transition-colors">
                        {st.name}
                      </div>
                      <div className="text-[11px] text-[#5B6573]">{st.location}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <StatusBadge status={st.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-2 font-mono">
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
                    <td className="py-2.5 px-2 font-mono text-[#1F2937]">
                      {st.reliability.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStation(st.station_id);
                          onNavigateToTab('live-monitoring');
                        }}
                        className="rounded border border-[#D9DEE5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1F4E79] hover:bg-[#EBF3FA] transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Anomaly Feed (5 cols) */}
        <div className="lg:col-span-5 rounded-lg border border-[#D9DEE5] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-sm font-bold text-[#12355B] flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#C62828]" />
                Live Anomaly Feed
              </h2>
              <p className="text-xs text-[#5B6573]">Recently flagged sensor deviations</p>
            </div>
            <button
              onClick={() => onNavigateToTab('anomalies')}
              className="text-xs font-semibold text-[#1F4E79] hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {anomalies.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#5B6573]">Zero active anomalies</p>
            ) : (
              anomalies.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  onClick={() => onNavigateToTab('anomaly-investigation', { anomaly: a })}
                  className="rounded-md border border-[#D9DEE5] bg-[#F8FAFC] p-3 hover:bg-[#F1F5F9] hover:border-[#B8C2CC] transition-all cursor-pointer text-[#1F2937]"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-[#12355B]">
                        {a.station_id}
                      </span>
                      <span className="text-[11px] text-[#5B6573] uppercase">({a.parameter})</span>
                    </div>
                    <SeverityBadge severity={a.severity} />
                  </div>

                  <div className="flex items-baseline justify-between text-xs text-[#374151]">
                    <div className="space-x-2 font-mono text-[11px]">
                      <span>Obs: <strong className="text-[#1F2937]">{a.observed_value}</strong></span>
                      <span>Exp: <span className="text-[#5B6573]">{a.expected_value}</span></span>
                      <span className="text-[#C62828] font-bold">
                        {a.deviation > 0 ? `+${a.deviation}` : a.deviation}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#1F4E79] font-semibold">
                      {a.confidence.toFixed(0)}% conf
                    </span>
                  </div>

                  <p className="mt-1.5 text-[11px] text-[#5B6573] line-clamp-2 leading-relaxed font-sans">
                    {a.explanation}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
