export type StationStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface Station {
  station_id: string;
  name: string;
  location: string;
  district: string;
  latitude: number;
  longitude: number;
  elevation: number;
  status: StationStatus;
  health_score: number;
  reliability: number;
  last_reading_time?: string;
  created_at?: string;
  sensors_summary?: Record<string, SensorHealth>;
  recent_anomalies_count?: number;
  active_alerts_count?: number;
}

export interface SensorReading {
  id?: number;
  station_id: string;
  timestamp: string;
  temperature?: number | null;
  pressure?: number | null;
  humidity?: number | null;
  expected_temperature?: number | null;
  expected_pressure?: number | null;
  expected_humidity?: number | null;
  corrected_temperature?: number | null;
  corrected_pressure?: number | null;
  corrected_humidity?: number | null;
  is_anomaly: number;
  anomaly_id?: string | null;
}

export type AnomalyType =
  | 'NORMAL'
  | 'SUDDEN_SPIKE'
  | 'SUDDEN_DROP'
  | 'SENSOR_DRIFT'
  | 'FROZEN_SENSOR'
  | 'MISSING_DATA'
  | 'TRANSMISSION_ERROR'
  | 'MULTIVARIATE_INCONSISTENCY'
  | 'ABNORMAL_TEMPORAL_PATTERN'
  | 'POSSIBLE_GENUINE_WEATHER_EVENT';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus = 'New' | 'Acknowledged' | 'Investigating' | 'Resolved';

export interface Anomaly {
  id: string;
  station_id: string;
  timestamp: string;
  parameter: 'temperature' | 'pressure' | 'humidity';
  observed_value: number;
  expected_value: number;
  deviation: number;
  anomaly_score: number;
  confidence: number;
  anomaly_type: AnomalyType;
  severity: SeverityLevel;
  status: IncidentStatus;
  temporal_deviation: number;
  rate_of_change: number;
  historical_deviation: number;
  humidity_consistency: number;
  pressure_consistency: number;
  multivariate_consistency: number;
  explanation: string;
  root_cause: string;
  recommended_action: string;
}

export interface Alert {
  id: string;
  station_id: string;
  sensor_parameter: string;
  problem: string;
  severity: SeverityLevel;
  confidence: number;
  status: IncidentStatus;
  created_at: string;
  resolved_at?: string | null;
  anomaly_id?: string | null;
}

export interface SensorHealth {
  id?: number;
  station_id: string;
  sensor_parameter: 'temperature' | 'pressure' | 'humidity';
  health_score: number;
  stability_score: number;
  drift_score: number;
  anomaly_frequency: number;
  missing_data_rate: number;
  failure_risk: number;
  trend: 'STABLE' | 'DEGRADING' | 'IMPROVING';
  status: 'Healthy' | 'Warning' | 'Critical' | 'Maintenance Required';
  maintenance_recommendation: string;
  last_calibrated?: string | null;
  updated_at: string;
}

export interface SystemStatus {
  anomaly_detection_engine: string;
  streaming_analysis: string;
  sensor_health_engine: string;
  explainability_engine: string;
  total_stations: number;
  online_stations: number;
  active_anomalies: number;
  critical_sensors: number;
  overall_reliability: number;
  last_sync: string;
}

export interface SimulationScenario {
  scenario_id: string;
  scenario_name: string;
  parameter: string;
  description: string;
  injected_delta: number;
  fixed_value?: number | null;
  is_genuine: boolean;
}

export interface SimulationResult {
  success: boolean;
  scenario_id: string;
  scenario_name: string;
  station_id: string;
  parameter: string;
  observed_value?: number | null;
  expected_value?: number | null;
  deviation?: number | null;
  anomaly_score: number;
  confidence: number;
  classification: AnomalyType;
  severity: SeverityLevel;
  is_genuine_event: boolean;
  root_cause: string;
  explanation: string;
  recommended_action: string;
  new_reading: SensorReading;
  new_anomaly?: Anomaly | null;
  new_alert?: Alert | null;
}

export interface Insight {
  id: string;
  category: 'Network' | 'Sensor' | 'Anomaly' | 'Maintenance';
  title: string;
  description: string;
  severity: 'Info' | 'Warning' | 'Critical';
  station_id?: string | null;
  created_at: string;
}

export interface ReportSummary {
  generated_at: string;
  total_observations: number;
  valid_observations: number;
  anomalous_observations: number;
  data_reliability: number;
  critical_sensors: number;
  anomaly_breakdown: Record<string, number>;
  station_risk_rankings: Array<{
    station_id: string;
    name: string;
    reliability: number;
    max_risk: number;
    status: StationStatus;
  }>;
}
