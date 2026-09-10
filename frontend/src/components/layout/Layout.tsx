import React, { useState } from 'react';
import { Sidebar, NavItem } from './Sidebar';
import { TopNav } from './TopNav';
import { Station, Alert } from '../../types';

interface LayoutProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  lastSync: Date;
  onRefresh: () => void;
  alerts: Alert[];
  onSignOut?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  stations,
  selectedStationId,
  onSelectStation,
  lastSync,
  onRefresh,
  alerts,
  onSignOut,
  children
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1F2937] flex flex-col font-sans">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeAlertsCount={alerts.filter((a) => a.status !== 'Resolved').length}
      />

      <TopNav
        sidebarCollapsed={sidebarCollapsed}
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={onSelectStation}
        lastSync={lastSync}
        onRefresh={onRefresh}
        alerts={alerts}
        onOpenAlerts={() => onSelectTab('alerts')}
        onSignOut={onSignOut}
      />

      <main
        className={`flex-1 transition-all duration-300 pt-20 pb-12 px-6 lg:px-8 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
