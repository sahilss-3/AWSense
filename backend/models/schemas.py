from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class StationBase(BaseModel):
    station_id: str
    name: str
    location: str
    district: str
    latitude: float
    longitude: float
    elevation: float
    status: str
    health_score: float
    reliability: float
    last_reading_time: Optional[str] = None

class StationDetail(StationBase):
    sensors_summary: Optional[Dict[str, Any]] = None
    recent_anomalies_count: int = 0
    active_alerts_count: int = 0

class SensorReadingItem(BaseModel):
    id: Optional[int] = None
    station_id: str
    timestamp: str
    temperature: Optional[float] = None
    pressure: Optional[float] = None
    humidity: Optional[float] = None
    expected_temperature: Optional[float] = None
    expected_pressure: Optional[float] = None
    expected_humidity: Optional[float] = None
    corrected_temperature: Optional[float] = None
    corrected_pressure: Optional[float] = None
    corrected_humidity: Optional[float] = None
    is_anomaly: int = 0
    anomaly_id: Optional[str] = None

class AnomalyItem(BaseModel):
    id: str
    station_id: str
    timestamp: str
    parameter: str
    observed_value: float
    expected_value: float
    deviation: float
    anomaly_score: float
    confidence: float
    anomaly_type: str
    severity: str
    status: str
    temporal_deviation: Optional[float] = 0.0
    rate_of_change: Optional[float] = 0.0
    historical_deviation: Optional[float] = 0.0
    humidity_consistency: Optional[float] = 0.0
    pressure_consistency: Optional[float] = 0.0
    multivariate_consistency: Optional[float] = 0.0
    explanation: str
    root_cause: str
    recommended_action: str

class AlertItem(BaseModel):
    id: str
    station_id: str
    sensor_parameter: str
    problem: str
    severity: str
    confidence: float
    status: str
    created_at: str
    resolved_at: Optional[str] = None
    anomaly_id: Optional[str] = None

class AlertStatusUpdate(BaseModel):
    status: str # 'Acknowledged', 'Investigating', 'Resolved'

class SensorHealthItem(BaseModel):
    id: Optional[int] = None
    station_id: str
    sensor_parameter: str
    health_score: float
    stability_score: float
    drift_score: float
    anomaly_frequency: float
    missing_data_rate: float
    failure_risk: float
    trend: str
    status: str
    maintenance_recommendation: str
    last_calibrated: Optional[str] = None
    updated_at: str

class SimulationTriggerRequest(BaseModel):
    scenario_id: str # 'sudden_spike', 'sudden_drop', 'frozen_sensor', 'sensor_drift', 'missing_data', 'transmission_error', 'genuine_heat_event', 'multivariate_inconsistency'
    station_id: Optional[str] = "AWS-PUN-01"
    parameter: Optional[str] = "temperature"

class SimulationTriggerResponse(BaseModel):
    success: bool
    scenario_id: str
    scenario_name: str
    station_id: str
    parameter: str
    observed_value: Optional[float] = None
    expected_value: Optional[float] = None
    deviation: Optional[float] = None
    anomaly_score: float
    confidence: float
    classification: str
    severity: str
    is_genuine_event: bool
    root_cause: str
    explanation: str
    recommended_action: str
    new_reading: Dict[str, Any]
    new_anomaly: Optional[Dict[str, Any]] = None
    new_alert: Optional[Dict[str, Any]] = None

class SystemStatus(BaseModel):
    anomaly_detection_engine: str = "ONLINE"
    streaming_analysis: str = "ACTIVE"
    sensor_health_engine: str = "ONLINE"
    explainability_engine: str = "ONLINE"
    total_stations: int
    online_stations: int
    active_anomalies: int
    critical_sensors: int
    overall_reliability: float
    last_sync: str

class InsightItem(BaseModel):
    id: str
    category: str # 'Network', 'Sensor', 'Anomaly', 'Maintenance'
    title: str
    description: str
    severity: str # 'Info', 'Warning', 'Critical'
    station_id: Optional[str] = None
    created_at: str

class ReportSummary(BaseModel):
    generated_at: str
    total_observations: int
    valid_observations: int
    anomalous_observations: int
    data_reliability: float
    critical_sensors: int
    anomaly_breakdown: Dict[str, int]
    station_risk_rankings: List[Dict[str, Any]]
