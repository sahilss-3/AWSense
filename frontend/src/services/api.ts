import {
  Station,
  SensorReading,
  Anomaly,
  Alert,
  SensorHealth,
  SystemStatus,
  SimulationScenario,
  SimulationResult,
  Insight,
  ReportSummary,
  IncidentStatus
} from '../types';

const API_BASE = '/api';

export const api = {
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/system/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async getStations(): Promise<Station[]> {
    const res = await fetch(`${API_BASE}/stations`);
    if (!res.ok) throw new Error('Failed to fetch stations');
    return res.json();
  },

  async getStationDetail(stationId: string): Promise<Station> {
    const res = await fetch(`${API_BASE}/stations/${stationId}`);
    if (!res.ok) throw new Error(`Failed to fetch station ${stationId}`);
    return res.json();
  },

  async getReadings(stationId: string, limit = 100, timeWindow?: string): Promise<SensorReading[]> {
    const url = new URL(`${API_BASE}/readings/${stationId}`, window.location.origin);
    url.searchParams.set('limit', limit.toString());
    if (timeWindow && timeWindow !== 'Live') {
      url.searchParams.set('time_window', timeWindow);
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch readings for ${stationId}`);
    return res.json();
  },

  async getLiveReading(stationId: string): Promise<SensorReading> {
    const res = await fetch(`${API_BASE}/readings/${stationId}/live`);
    if (!res.ok) throw new Error(`Failed to fetch live reading for ${stationId}`);
    return res.json();
  },

  async getAnomalies(filters?: {
    station_id?: string;
    parameter?: string;
    anomaly_type?: string;
    severity?: string;
    status?: string;
    limit?: number;
  }): Promise<Anomaly[]> {
    const url = new URL(`${API_BASE}/anomalies`, window.location.origin);
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'ALL') url.searchParams.set(k, v.toString());
      });
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch anomalies');
    return res.json();
  },

  async getAnomalyById(anomalyId: string): Promise<Anomaly> {
    const res = await fetch(`${API_BASE}/anomalies/${anomalyId}`);
    if (!res.ok) throw new Error(`Failed to fetch anomaly ${anomalyId}`);
    return res.json();
  },

  async getAlerts(severity?: string, status?: string): Promise<Alert[]> {
    const url = new URL(`${API_BASE}/alerts`, window.location.origin);
    if (severity && severity !== 'ALL') url.searchParams.set('severity', severity);
    if (status && status !== 'ALL') url.searchParams.set('status', status);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async updateAlertStatus(alertId: string, newStatus: IncidentStatus): Promise<Alert> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update alert status');
    return res.json();
  },

  async getSensorHealth(stationId?: string): Promise<SensorHealth[]> {
    const url = new URL(`${API_BASE}/sensor-health`, window.location.origin);
    if (stationId) url.searchParams.set('station_id', stationId);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch sensor health');
    return res.json();
  },

  async getInsights(): Promise<Insight[]> {
    const res = await fetch(`${API_BASE}/insights`);
    if (!res.ok) throw new Error('Failed to fetch insights');
    return res.json();
  },

  async getReports(): Promise<ReportSummary> {
    const res = await fetch(`${API_BASE}/reports`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  async getSimulationScenarios(): Promise<SimulationScenario[]> {
    const res = await fetch(`${API_BASE}/simulation/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch simulation scenarios');
    return res.json();
  },

  async triggerSimulation(scenarioId: string, stationId = 'AWS-PUN-01', parameter = 'temperature'): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE}/simulation/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, station_id: stationId, parameter })
    });
    if (!res.ok) throw new Error('Simulation execution failed');
    return res.json();
  }
};
