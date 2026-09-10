import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Radio,
  AlertTriangle,
  Search,
  HeartPulse,
  MapPin,
  Box,
  History,
  Bell,
  Sparkles,
  FileText,
  FlaskConical,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export type NavItem =
  | 'command-center'
  | 'live-monitoring'
  | 'stations'
  | 'anomalies'
  | 'anomaly-investigation'
  | 'sensor-health'
  | 'network-view'
  | 'digital-twin'
  | 'historical-analysis'
  | 'alerts'
  | 'ai-insights'
  | 'reports'
  | 'simulation-lab'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  activeAlertsCount = 0
}) => {
  const menuItems: Array<{ id: NavItem; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'command-center', label: 'Command Center', icon: <LayoutDashboard size={17} /> },
    { id: 'live-monitoring', label: 'Live Monitoring', icon: <Activity size={17} /> },
    { id: 'stations', label: 'AWS Stations', icon: <Radio size={17} /> },
    { id: 'anomalies', label: 'Anomaly Detection', icon: <AlertTriangle size={17} /> },
    { id: 'anomaly-investigation', label: 'Anomaly Investigation', icon: <Search size={17} /> },
    { id: 'sensor-health', label: 'Sensor Health', icon: <HeartPulse size={17} /> },
    { id: 'network-view', label: 'Network View', icon: <MapPin size={17} /> },
    { id: 'digital-twin', label: '3D Digital Twin', icon: <Box size={17} /> },
    { id: 'historical-analysis', label: 'Historical Analysis', icon: <History size={17} /> },
    { id: 'alerts', label: 'Alerts & Incidents', icon: <Bell size={17} />, badge: activeAlertsCount },
    { id: 'ai-insights', label: 'AI Insights', icon: <Sparkles size={17} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={17} /> },
    { id: 'simulation-lab', label: 'Simulation Lab', icon: <FlaskConical size={17} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={17} /> },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col bg-[#12355B] text-white transition-all duration-300 shadow-lg border-r border-[#0D2744] ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#1A426F] px-4 bg-[#0F2D4E]">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-white/10 text-white border border-white/20">
              <ShieldCheck size={18} className="text-[#F28C28]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-base font-bold tracking-tight text-white font-sans">
                  AWS<span className="text-[#F28C28]">ense</span>
                </span>
                <span className="rounded bg-[#F28C28]/20 px-1 py-0.2 text-[9px] font-mono font-bold text-[#F28C28] border border-[#F28C28]/30">
                  SIH26073
                </span>
              </div>
              <span className="block text-[9px] tracking-wider text-[#CBD5E1] uppercase font-medium">
                AWS Quality & Reliability
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded bg-white/10 text-[#F28C28]">
            <ShieldCheck size={18} />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="rounded p-1 text-[#CBD5E1] hover:bg-[#1A426F] hover:text-white transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          const isSimLab = item.id === 'simulation-lab';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white text-[#12355B] font-semibold shadow-sm border-l-4 border-[#F28C28]'
                  : 'text-[#E2E8F0] hover:bg-[#1A426F] hover:text-white'
              }`}
            >
              <div
                className={`transition-colors ${
                  isActive
                    ? 'text-[#12355B]'
                    : isSimLab
                    ? 'text-[#F28C28]'
                    : 'text-[#CBD5E1] group-hover:text-white'
                }`}
              >
                {item.icon}
              </div>
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto rounded bg-[#C62828] px-1.5 py-0.2 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                  {isSimLab && !isActive && (
                    <span className="ml-auto rounded bg-[#F28C28]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#F28C28]">
                      LAB
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="border-t border-[#1A426F] p-3 bg-[#0F2D4E]">
        {!collapsed ? (
          <div className="rounded bg-[#12355B] border border-[#1A426F] p-2.5 text-left">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#CBD5E1] font-medium">Data Scope:</span>
              <span className="font-mono text-[#F28C28] font-bold">T • P • RH</span>
            </div>
            <p className="mt-1 text-[10px] text-[#94A3B8] leading-tight font-sans">
              3-Parameter Thermodynamic & ML Monitoring
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title="T • P • RH 3-Parameter Scope">
            <div className="h-2 w-2 rounded-full bg-[#F28C28]" />
          </div>
        )}
      </div>
    </aside>
  );
};
