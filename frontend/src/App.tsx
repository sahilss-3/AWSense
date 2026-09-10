import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/layout/Layout';
import { NavItem } from './components/layout/Sidebar';
import {
  Station,
  Anomaly,
  Alert,
  SensorHealth,
  SystemStatus
} from './types';
import { api } from './services/api';

// Pages
import { CommandCenter } from './pages/CommandCenter';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { StationsPage } from './pages/Stations';
import { AnomalyDetection } from './pages/AnomalyDetection';
import { AnomalyInvestigation } from './pages/AnomalyInvestigation';
import { SensorHealthPage } from './pages/SensorHealth';
import { NetworkView } from './pages/NetworkView';
import { HistoricalAnalysisPage } from './pages/HistoricalAnalysis';
import { AlertsCenter } from './pages/AlertsCenter';
import { AIInsightsPage } from './pages/AIInsights';
import { ReportsPage } from './pages/Reports';
import { SimulationLab } from './pages/SimulationLab';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('auth=true')) {
      return true;
    }
    return Boolean(localStorage.getItem('awsense_auth') || sessionStorage.getItem('awsense_auth'));
  });
  const [currentTab, setCurrentTab] = useState<NavItem>(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs: NavItem[] = [
      'command-center', 'live-monitoring', 'stations', 'anomalies',
      'anomaly-investigation', 'sensor-health', 'network-view',
      'historical-analysis', 'alerts', 'ai-insights', 'reports', 'simulation-lab', 'settings'
    ];
    return validTabs.includes(hash as NavItem) ? (hash as NavItem) : 'command-center';
  });
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('AWS-PUN-01');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sensorHealth, setSensorHealth] = useState<SensorHealth[]>([]);
  const [investigatingAnomaly, setInvestigatingAnomaly] = useState<Anomaly | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGlobalData = useCallback(async () => {
    try {
      const [stList, status, anomList, alertList, healthList] = await Promise.all([
        api.getStations(),
        api.getSystemStatus(),
        api.getAnomalies({ limit: 150 }),
        api.getAlerts(),
        api.getSensorHealth()
      ]);

      setStations(stList);
      setSystemStatus(status);
      setAnomalies(anomList);
      setAlerts(alertList);
      setSensorHealth(healthList);
      setLastSync(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Failed to sync AWSense telemetry:', err);
      setError('Unable to communicate with local FastAPI backend. Ensure server is running on http://127.0.0.1:8000');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalData();
    // Periodic stream sync every 8 seconds
    const interval = setInterval(() => {
      fetchGlobalData();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchGlobalData]);

  const handleNavigateToTab = (tab: NavItem, meta?: any) => {
    if (tab === 'anomaly-investigation' && meta?.anomaly) {
      setInvestigatingAnomaly(meta.anomaly);
    }
    setCurrentTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInvestigateAnomaly = (a: Anomaly) => {
    setInvestigatingAnomaly(a);
    setCurrentTab('anomaly-investigation');
    window.location.hash = 'anomaly-investigation';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = () => {
    localStorage.removeItem('awsense_auth');
    sessionStorage.removeItem('awsense_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={(tab) => {
        setCurrentTab(tab);
        window.location.hash = tab;
      }}
      stations={stations}
      selectedStationId={selectedStationId}
      onSelectStation={setSelectedStationId}
      lastSync={lastSync}
      onRefresh={fetchGlobalData}
      alerts={alerts}
      onSignOut={handleSignOut}
    >
      {error && (
        <div className="mb-6 rounded-lg border border-[#C62828]/40 bg-[#FEE2E2] p-4 text-xs font-mono text-[#991B1B] flex items-center justify-between shadow-sm">
          <span className="font-medium">{error}</span>
          <button
            onClick={fetchGlobalData}
            className="rounded bg-[#C62828] px-3 py-1 text-white hover:bg-[#B71C1C] font-semibold transition-colors shadow-xs"
          >
            Retry
          </button>
        </div>
      )}

      {currentTab === 'command-center' && (
        <CommandCenter
          systemStatus={systemStatus}
          stations={stations}
          anomalies={anomalies}
          sensorHealth={sensorHealth}
          onSelectStation={setSelectedStationId}
          onNavigateToTab={handleNavigateToTab}
        />
      )}

      {currentTab === 'live-monitoring' && (
        <LiveMonitoring
          stations={stations}
          selectedStationId={selectedStationId}
          onSelectStation={setSelectedStationId}
          onInvestigateAnomaly={handleInvestigateAnomaly}
          onNavigateToInvestigation={() => setCurrentTab('anomaly-investigation')}
        />
      )}

      {currentTab === 'stations' && (
        <StationsPage
          stations={stations}
          onSelectStation={setSelectedStationId}
          onNavigateToLive={(id) => {
            setSelectedStationId(id);
            setCurrentTab('live-monitoring');
          }}
        />
      )}

      {currentTab === 'anomalies' && (
        <AnomalyDetection
          anomalies={anomalies}
          stations={stations}
          onSelectAnomaly={handleInvestigateAnomaly}
          onRefresh={fetchGlobalData}
        />
      )}

      {currentTab === 'anomaly-investigation' && (
        <AnomalyInvestigation
          anomaly={investigatingAnomaly}
          anomaliesList={anomalies}
          onBackToList={() => setCurrentTab('anomalies')}
          onSelectAnomaly={setInvestigatingAnomaly}
          onAlertStatusUpdated={fetchGlobalData}
        />
      )}

      {currentTab === 'sensor-health' && (
        <SensorHealthPage
          sensorHealth={sensorHealth}
          stations={stations}
          onSelectStation={setSelectedStationId}
          onNavigateToTab={handleNavigateToTab}
        />
      )}

      {currentTab === 'network-view' && (
        <NetworkView
          stations={stations}
          onSelectStation={setSelectedStationId}
          onNavigateToLive={(id) => {
            setSelectedStationId(id);
            setCurrentTab('live-monitoring');
          }}
        />
      )}

      {currentTab === 'historical-analysis' && (
        <HistoricalAnalysisPage
          stations={stations}
          selectedStationId={selectedStationId}
          onSelectStation={setSelectedStationId}
        />
      )}

      {currentTab === 'alerts' && (
        <AlertsCenter
          alerts={alerts}
          onRefresh={fetchGlobalData}
          onNavigateToTab={handleNavigateToTab}
        />
      )}

      {currentTab === 'ai-insights' && <AIInsightsPage />}

      {currentTab === 'reports' && <ReportsPage />}

      {currentTab === 'simulation-lab' && (
        <SimulationLab
          stations={stations}
          selectedStationId={selectedStationId}
          onSelectStation={setSelectedStationId}
          onNavigateToTab={handleNavigateToTab}
          onRefreshData={fetchGlobalData}
        />
      )}

      {currentTab === 'settings' && <SettingsPage onRefreshData={fetchGlobalData} />}
    </Layout>
  );
}

export default App;
