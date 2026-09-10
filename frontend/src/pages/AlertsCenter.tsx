import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Check,
  Search,
  ArrowRight
} from 'lucide-react';
import { Alert, IncidentStatus } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { api } from '../services/api';

interface AlertsCenterProps {
  alerts: Alert[];
  onRefresh: () => void;
  onNavigateToTab: (tab: any, meta?: any) => void;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({
  alerts,
  onRefresh,
  onNavigateToTab
}) => {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (alertId: string, newStatus: IncidentStatus) => {
    setUpdatingId(alertId);
    try {
      await api.updateAlertStatus(alertId, newStatus);
      onRefresh();
    } catch (e) {
      console.error('Failed to update alert status', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  const activeCount = alerts.filter((a) => a.status !== 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DEE5] pb-5">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-[#12355B] flex items-center gap-2">
            <Bell className="text-[#C62828]" size={20} />
            Alerts & Incident Response Operations
          </h1>
          <p className="mt-1 text-xs text-[#5B6573]">
            Real-time incident dispatch, anomaly triage, and automated sensor malfunction alarms
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded border border-[#C62828]/30 bg-[#FEE2E2] px-3.5 py-1.5 text-[#991B1B] font-bold shadow-xs">
            {activeCount} Active Incidents
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#D9DEE5] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded border border-[#D9DEE5] bg-[#F8FAFC] px-3 py-1.5 text-xs text-[#1F2937] font-medium focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-[#D9DEE5] bg-[#F8FAFC] px-3 py-1.5 text-xs text-[#1F2937] font-medium focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <span className="text-xs font-mono text-[#5B6573]">
          Showing <strong className="text-[#12355B]">{filtered.length}</strong> incidents
        </span>
      </div>

      {/* Incident Cards / Table */}
      <div className="rounded-lg border border-[#D9DEE5] bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9DEE5] bg-[#F8FAFC] text-[11px] font-sans font-semibold text-[#5B6573] uppercase tracking-wider">
                <th className="py-2.5 px-3">Station</th>
                <th className="py-2.5 px-3">Sensor</th>
                <th className="py-2.5 px-3">Problem Description</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Current Status</th>
                <th className="py-2.5 px-3 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#5B6573] font-sans">
                    Zero incidents matching filter.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-3 text-[#12355B] font-bold">{a.station_id}</td>
                    <td className="py-3 px-3 uppercase text-[#5B6573] text-[11px]">{a.sensor_parameter}</td>
                    <td className="py-3 px-3 font-sans text-[#1F2937] max-w-xs">{a.problem}</td>
                    <td className="py-3 px-3 text-[#5B6573]">
                      {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <SeverityBadge severity={a.severity} />
                    </td>
                    <td className="py-3 px-3 text-[#1F4E79] font-bold">{a.confidence.toFixed(0)}%</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-semibold ${
                          a.status === 'Resolved'
                            ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]'
                            : a.status === 'Investigating'
                            ? 'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]'
                            : a.status === 'Acknowledged'
                            ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                            : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-sans space-x-1.5 whitespace-nowrap">
                      {a.status === 'New' && (
                        <button
                          disabled={updatingId === a.id}
                          onClick={() => handleStatusChange(a.id, 'Acknowledged')}
                          className="rounded bg-[#F1F5F9] border border-[#CBD5E1] px-2.5 py-1 text-[11px] font-medium text-[#334155] hover:bg-[#E2E8F0] transition-colors shadow-xs"
                        >
                          Ack
                        </button>
                      )}
                      {a.status !== 'Investigating' && a.status !== 'Resolved' && (
                        <button
                          disabled={updatingId === a.id}
                          onClick={() => handleStatusChange(a.id, 'Investigating')}
                          className="rounded bg-[#FEF3C7] border border-[#FDE047] px-2.5 py-1 text-[11px] font-medium text-[#92400E] hover:bg-[#FDE68A] transition-colors shadow-xs"
                        >
                          Investigate
                        </button>
                      )}
                      {a.status !== 'Resolved' && (
                        <button
                          disabled={updatingId === a.id}
                          onClick={() => handleStatusChange(a.id, 'Resolved')}
                          className="rounded bg-[#DCFCE7] border border-[#86EFAC] px-2.5 py-1 text-[11px] font-medium text-[#166534] hover:bg-[#BBF7D0] transition-colors shadow-xs"
                        >
                          Resolve
                        </button>
                      )}
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
