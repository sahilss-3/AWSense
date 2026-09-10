import React, { useState } from 'react';
import {
  Bell,
  RefreshCw,
  Cpu,
  Radio,
  User,
  ShieldCheck,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { Station, Alert } from '../../types';

interface TopNavProps {
  sidebarCollapsed: boolean;
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  lastSync: Date;
  onRefresh: () => void;
  alerts: Alert[];
  onOpenAlerts: () => void;
  onSignOut?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  sidebarCollapsed,
  stations,
  selectedStationId,
  onSelectStation,
  lastSync,
  onRefresh,
  alerts,
  onOpenAlerts,
  onSignOut
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const activeAlerts = alerts.filter((a) => a.status !== 'Resolved');

  return (
    <header
      className={`fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-[#D9DEE5] bg-white px-6 shadow-sm transition-all duration-300 ${
        sidebarCollapsed ? 'left-16' : 'left-64'
      }`}
    >
      {/* Top Saffron/Navy Accent Stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#12355B] via-[#1F4E79] to-[#F28C28]" />

      {/* Left: System Status & Telemetry Pipeline Info */}
      <div className="flex items-center gap-4">
        {/* Government Institutional Status Badge */}
        <div className="flex items-center gap-2 rounded-md border border-[#C8E6C9] bg-[#E8F5E9] px-2.5 py-1">
          <span className="h-2 w-2 rounded-full bg-[#198754]" />
          <span className="text-xs font-semibold tracking-wide text-[#12633D] font-sans">
            SYSTEM OPERATIONAL
          </span>
        </div>

        {/* AI Engine Status */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#5B6573] border-l border-[#D9DEE5] pl-4">
          <Cpu size={14} className="text-[#1F4E79]" />
          <span>AI Engine: <strong className="text-[#1F2937] font-semibold">Active (Scikit-Learn ML)</strong></span>
        </div>

        {/* Last Synchronization */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[#5B6573] border-l border-[#D9DEE5] pl-4">
          <span>Synced: <strong className="text-[#1F2937] font-mono">{lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong></span>
          <button
            onClick={onRefresh}
            className="rounded p-1 hover:bg-[#F4F6F8] text-[#5B6573] hover:text-[#12355B] transition-colors"
            title="Refresh latest telemetry"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Right: Station Selector & Notifications & Operator Tag */}
      <div className="flex items-center gap-3">
        {/* Quick Station Switcher */}
        <div className="flex items-center gap-2 bg-[#F4F6F8] border border-[#D9DEE5] rounded-md px-2.5 py-1 text-xs">
          <Radio size={14} className="text-[#1F4E79] hidden sm:inline" />
          <select
            value={selectedStationId}
            onChange={(e) => onSelectStation(e.target.value)}
            className="bg-transparent text-[#1F2937] font-medium focus:outline-none cursor-pointer"
          >
            {stations.map((s) => (
              <option key={s.station_id} value={s.station_id} className="bg-white text-[#1F2937]">
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-md border border-[#D9DEE5] bg-white p-2 text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B] transition-colors"
            title="Active Incidents"
          >
            <Bell size={16} />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C62828] text-[9px] font-bold text-white shadow-sm">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-[#D9DEE5] bg-white p-3 shadow-xl z-50 text-[#1F2937]">
              <div className="flex items-center justify-between pb-2 border-b border-[#D9DEE5]">
                <span className="text-xs font-bold text-[#12355B]">Active Incidents ({activeAlerts.length})</span>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onOpenAlerts();
                  }}
                  className="text-[11px] font-semibold text-[#1F4E79] hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="mt-2 max-h-60 overflow-y-auto space-y-1.5">
                {activeAlerts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-[#5B6573]">No unresolved alerts</p>
                ) : (
                  activeAlerts.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        setShowNotifications(false);
                        onOpenAlerts();
                      }}
                      className="cursor-pointer rounded border border-[#E5E7EB] bg-[#F8FAFC] p-2 hover:bg-[#F1F5F9] text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="font-bold text-[#12355B]">{a.station_id}</span>
                        <span className="text-[#C62828] font-bold uppercase">{a.severity}</span>
                      </div>
                      <p className="mt-1 text-[#374151] truncate text-[11px]">{a.problem}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Operator Profile Tag */}
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-[#D9DEE5] bg-[#F8FAFC] px-2.5 py-1 text-xs">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12355B] text-white">
            <User size={12} />
          </div>
          <div className="text-left">
            <span className="block font-semibold text-[#12355B] leading-none text-[11px]">MetOps Lead</span>
            <span className="text-[10px] text-[#5B6573] leading-none">SIH Evaluator</span>
          </div>
        </div>

        {/* Sign Out Button */}
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 rounded-md border border-[#D9DEE5] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#5B6573] hover:bg-[#FEE2E2] hover:text-[#C62828] hover:border-[#FCA5A5] transition-colors shadow-xs cursor-pointer"
            title="Sign out of AWSense"
          >
            <LogOut size={13} />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
};
