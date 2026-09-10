import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from database.connection import get_db_connection
from models.schemas import (
    StationBase, StationDetail, SensorReadingItem, AnomalyItem,
    AlertItem, AlertStatusUpdate, SensorHealthItem,
    SimulationTriggerRequest, SimulationTriggerResponse,
    SystemStatus, InsightItem, ReportSummary
)
from ai_engine.simulator import SCENARIOS
from ai_engine.anomaly_detector import AWSAnomalyDetector
from ai_engine.sensor_health import assess_sensor_health

router = APIRouter()
detector = AWSAnomalyDetector()

@router.get("/system/status", response_model=SystemStatus)
def get_system_status():
    conn = get_db_connection()
    c = conn.cursor()
    
    total_st = c.execute("SELECT COUNT(*) FROM stations").fetchone()[0]
    online_st = c.execute("SELECT COUNT(*) FROM stations WHERE status != 'OFFLINE'").fetchone()[0]
    active_anom = c.execute("SELECT COUNT(*) FROM anomalies WHERE status IN ('New', 'Investigating')").fetchone()[0]
    crit_sensors = c.execute("SELECT COUNT(*) FROM sensor_health WHERE status IN ('Critical', 'Maintenance Required')").fetchone()[0]
    
    # Calculate overall reliability
    rel_row = c.execute("SELECT AVG(reliability) FROM stations WHERE status != 'OFFLINE'").fetchone()
    overall_rel = round(rel_row[0], 1) if rel_row and rel_row[0] is not None else 96.8
    
    conn.close()
    return SystemStatus(
        anomaly_detection_engine="ONLINE",
        streaming_analysis="ACTIVE",
        sensor_health_engine="ONLINE",
        explainability_engine="ONLINE",
        total_stations=total_st,
        online_stations=online_st,
        active_anomalies=active_anom,
        critical_sensors=crit_sensors,
        overall_reliability=overall_rel,
        last_sync=datetime.now(timezone.utc).isoformat()
    )

@router.get("/stations", response_model=List[StationBase])
def list_stations():
    conn = get_db_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM stations ORDER BY station_id ASC").fetchall()
    stations = [dict(r) for r in rows]
    conn.close()
    return stations

@router.get("/stations/{station_id}", response_model=StationDetail)
def get_station_detail(station_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    st_row = c.execute("SELECT * FROM stations WHERE station_id = ?", (station_id,)).fetchone()
    if not st_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Station not found")
    
    station = dict(st_row)
    
    # Sensor health summary
    h_rows = c.execute("SELECT * FROM sensor_health WHERE station_id = ?", (station_id,)).fetchall()
    station["sensors_summary"] = {r["sensor_parameter"]: dict(r) for r in h_rows}
    
    # Anomaly count
    anom_count = c.execute("SELECT COUNT(*) FROM anomalies WHERE station_id = ?", (station_id,)).fetchone()[0]
    station["recent_anomalies_count"] = anom_count
    
    # Active alerts
    alert_count = c.execute("SELECT COUNT(*) FROM alerts WHERE station_id = ? AND status != 'Resolved'", (station_id,)).fetchone()[0]
    station["active_alerts_count"] = alert_count
    
    conn.close()
    return station

@router.get("/readings/{station_id}", response_model=List[SensorReadingItem])
def get_readings(
    station_id: str,
    limit: int = Query(100, ge=1, le=500),
    time_window: Optional[str] = Query(None, description="e.g. 1h, 6h, 24h, 7d")
):
    conn = get_db_connection()
    c = conn.cursor()
    
    query = "SELECT * FROM sensor_readings WHERE station_id = ?"
    params = [station_id]
    
    if time_window:
        now = datetime.now(timezone.utc)
        delta = timedelta(hours=24)
        if time_window.lower() == "1h":
            delta = timedelta(hours=1)
        elif time_window.lower() == "6h":
            delta = timedelta(hours=6)
        elif time_window.lower() == "24h":
            delta = timedelta(hours=24)
        elif time_window.lower() == "7d":
            delta = timedelta(days=7)
        start_filter = (now - delta).isoformat()
        query += " AND timestamp >= ?"
        params.append(start_filter)
        
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    rows = c.execute(query, params).fetchall()
    conn.close()
    
    # Return chronologically ascending for chart rendering
    results = [dict(r) for r in reversed(rows)]
    return results

@router.get("/readings/{station_id}/live", response_model=SensorReadingItem)
def get_live_reading(station_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    row = c.execute(
        "SELECT * FROM sensor_readings WHERE station_id = ? ORDER BY timestamp DESC LIMIT 1",
        (station_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="No readings found for station")
    return dict(row)

@router.get("/anomalies", response_model=List[AnomalyItem])
def get_anomalies(
    station_id: Optional[str] = None,
    parameter: Optional[str] = None,
    anomaly_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
):
    conn = get_db_connection()
    c = conn.cursor()
    query = "SELECT * FROM anomalies WHERE 1=1"
    params = []
    
    if station_id:
        query += " AND station_id = ?"
        params.append(station_id)
    if parameter:
        query += " AND parameter = ?"
        params.append(parameter)
    if anomaly_type:
        query += " AND anomaly_type = ?"
        params.append(anomaly_type)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if status:
        query += " AND status = ?"
        params.append(status)
        
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    rows = c.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/anomalies/{anomaly_id}", response_model=AnomalyItem)
def get_anomaly_by_id(anomaly_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    row = c.execute("SELECT * FROM anomalies WHERE id = ?", (anomaly_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return dict(row)

@router.get("/alerts", response_model=List[AlertItem])
def get_alerts(severity: Optional[str] = None, status: Optional[str] = None):
    conn = get_db_connection()
    c = conn.cursor()
    query = "SELECT * FROM alerts WHERE 1=1"
    params = []
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC"
    rows = c.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/alerts/{alert_id}/status", response_model=AlertItem)
@router.post("/alerts/{alert_id}/acknowledge")
@router.post("/alerts/{alert_id}/resolve")
def update_alert_status(alert_id: str, payload: Optional[AlertStatusUpdate] = None):
    conn = get_db_connection()
    c = conn.cursor()
    
    row = c.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found")
    
    new_status = payload.status if payload else "Acknowledged"
    resolved_at = datetime.now(timezone.utc).isoformat() if new_status == "Resolved" else None
    
    c.execute(
        "UPDATE alerts SET status = ?, resolved_at = ? WHERE id = ?",
        (new_status, resolved_at, alert_id)
    )
    
    # Also update associated anomaly if exists
    if row["anomaly_id"]:
        c.execute("UPDATE anomalies SET status = ? WHERE id = ?", (new_status, row["anomaly_id"]))
        
    conn.commit()
    updated = c.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    conn.close()
    return dict(updated)

@router.get("/sensor-health", response_model=List[SensorHealthItem])
def get_all_sensor_health(station_id: Optional[str] = None):
    conn = get_db_connection()
    c = conn.cursor()
    if station_id:
        rows = c.execute("SELECT * FROM sensor_health WHERE station_id = ?", (station_id,)).fetchall()
    else:
        rows = c.execute("SELECT * FROM sensor_health ORDER BY failure_risk DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/insights", response_model=List[InsightItem])
def get_insights():
    conn = get_db_connection()
    c = conn.cursor()
    
    insights = []
    now_iso = datetime.now(timezone.utc).isoformat()

    # Insight 1: Drift analysis
    drift_row = c.execute(
        "SELECT station_id, sensor_parameter, drift_score, failure_risk FROM sensor_health WHERE drift_score < 75 LIMIT 1"
    ).fetchone()
    if drift_row:
        insights.append(InsightItem(
            id="ins-drift",
            category="Sensor",
            title=f"Progressive Sensor Drift on {drift_row['station_id']}",
            description=f"{drift_row['sensor_parameter'].capitalize()} sensor displays calibration decay with {drift_row['drift_score']:.1f}/100 drift score and estimated {drift_row['failure_risk']:.0f}% failure risk.",
            severity="Warning",
            station_id=drift_row["station_id"],
            created_at=now_iso
        ))

    # Insight 2: High anomaly frequency station
    freq_row = c.execute(
        "SELECT station_id, COUNT(*) as cnt FROM anomalies GROUP BY station_id ORDER BY cnt DESC LIMIT 1"
    ).fetchone()
    if freq_row:
        insights.append(InsightItem(
            id="ins-anom-freq",
            category="Anomaly",
            title=f"Elevated Anomaly Frequency at {freq_row['station_id']}",
            description=f"{freq_row['station_id']} recorded {freq_row['cnt']} anomalous observations over the recent observation window.",
            severity="Critical",
            station_id=freq_row["station_id"],
            created_at=now_iso
        ))

    # Insight 3: Network reliability
    nashik_row = c.execute("SELECT reliability FROM stations WHERE station_id = 'AWS-NSK-02'").fetchone()
    rel_val = nashik_row[0] if nashik_row else 98.4
    insights.append(InsightItem(
        id="ins-network",
        category="Network",
        title="AWS Nashik-02 Leading Network Reliability",
        description=f"AWS Nashik-02 has maintained {rel_val:.1f}% data reliability with zero telemetry packet loss over 7 consecutive days.",
        severity="Info",
        station_id="AWS-NSK-02",
        created_at=now_iso
    ))

    # Insight 4: Predictive maintenance warning
    crit_sensors = c.execute(
        "SELECT station_id, sensor_parameter, failure_risk FROM sensor_health WHERE failure_risk >= 50"
    ).fetchall()
    if crit_sensors:
        s_names = ", ".join([f"{r['station_id']} ({r['sensor_parameter']})" for r in crit_sensors[:2]])
        insights.append(InsightItem(
            id="ins-maint",
            category="Maintenance",
            title="Predictive Maintenance Intervention Required",
            description=f"Elevated degradation risk identified on: {s_names}. Immediate inspection recommended to prevent data disruption.",
            severity="Critical",
            station_id=crit_sensors[0]["station_id"],
            created_at=now_iso
        ))

    conn.close()
    return insights

@router.get("/reports", response_model=ReportSummary)
def get_report_summary():
    conn = get_db_connection()
    c = conn.cursor()
    
    total_obs = c.execute("SELECT COUNT(*) FROM sensor_readings").fetchone()[0]
    anom_obs = c.execute("SELECT COUNT(*) FROM sensor_readings WHERE is_anomaly = 1").fetchone()[0]
    valid_obs = total_obs - anom_obs
    rel = round((valid_obs / max(1, total_obs)) * 100.0, 2)
    
    crit_sensors = c.execute("SELECT COUNT(*) FROM sensor_health WHERE status IN ('Critical', 'Maintenance Required')").fetchone()[0]
    
    # Anomaly breakdown by type
    anom_types = c.execute("SELECT anomaly_type, COUNT(*) FROM anomalies GROUP BY anomaly_type").fetchall()
    breakdown = {r[0]: r[1] for r in anom_types}
    
    # Station risk rankings
    st_risks = c.execute("""
        SELECT s.station_id, s.name, s.reliability, MAX(h.failure_risk) as max_risk, s.status
        FROM stations s
        LEFT JOIN sensor_health h ON s.station_id = h.station_id
        GROUP BY s.station_id
        ORDER BY max_risk DESC
    """).fetchall()
    rankings = [dict(r) for r in st_risks]
    
    conn.close()
    return ReportSummary(
        generated_at=datetime.now(timezone.utc).isoformat(),
        total_observations=total_obs,
        valid_observations=valid_obs,
        anomalous_observations=anom_obs,
        data_reliability=rel,
        critical_sensors=crit_sensors,
        anomaly_breakdown=breakdown,
        station_risk_rankings=rankings
    )

@router.get("/simulation/scenarios")
def get_simulation_scenarios():
    return list(SCENARIOS.values())

@router.post("/simulation/trigger", response_model=SimulationTriggerResponse)
@router.post("/simulation/{scenario_id}", response_model=SimulationTriggerResponse)
def trigger_simulation(scenario_id: str, request_data: Optional[SimulationTriggerRequest] = None):
    scen_id = scenario_id if scenario_id in SCENARIOS else (request_data.scenario_id if request_data else "sudden_spike")
    if scen_id not in SCENARIOS:
        raise HTTPException(status_code=400, detail=f"Invalid scenario: {scen_id}")
        
    scen = SCENARIOS[scen_id]
    station_id = request_data.station_id if request_data and request_data.station_id else "AWS-PUN-01"
    param = scen["parameter"]
    
    conn = get_db_connection()
    c = conn.cursor()
    
    # Fetch recent readings for baseline
    recent_rows = c.execute(
        "SELECT * FROM sensor_readings WHERE station_id = ? ORDER BY timestamp DESC LIMIT 20",
        (station_id,)
    ).fetchall()
    history = [dict(r) for r in reversed(recent_rows)]
    
    # Get last valid non-anomalous reading for baseline delta
    valid_row = c.execute(
        "SELECT * FROM sensor_readings WHERE station_id = ? AND is_anomaly = 0 ORDER BY timestamp DESC LIMIT 1",
        (station_id,)
    ).fetchone()
    last_reading = dict(valid_row) if valid_row else {
        "temperature": 31.2, "pressure": 948.0, "humidity": 64.0
    }
    
    # Compute simulated values
    now_iso = datetime.now(timezone.utc).isoformat()
    sim_t = last_reading.get("temperature", 31.2)
    sim_p = last_reading.get("pressure", 948.0)
    sim_h = last_reading.get("humidity", 64.0)
    
    if scen_id == "sudden_spike":
        sim_t = 89.6
    elif scen_id == "sudden_drop":
        sim_t = -10.0
    elif scen_id == "frozen_sensor":
        sim_t = 32.10
    elif scen_id == "sensor_drift":
        sim_t = round(sim_t + 4.8, 2)
    elif scen_id == "missing_data":
        sim_t = None
        sim_p = None
        sim_h = None
    elif scen_id == "transmission_error":
        sim_p = 1240.5
    elif scen_id == "genuine_heat_event":
        sim_t = round(sim_t + 3.8, 1)
        sim_h = max(20.0, round(sim_h - 14.0, 1))  # Physically consistent psychrometric drop
        sim_p = round(sim_p - 0.4, 1)
    elif scen_id == "multivariate_inconsistency":
        sim_h = 99.0
        sim_t = 34.0
        
    # Execute AI detection pipeline
    ai_res = detector.analyze_observation(
        station_id=station_id,
        timestamp=now_iso,
        temperature=sim_t,
        pressure=sim_p,
        humidity=sim_h,
        history=history
    )
    
    anom_rec = ai_res["anomaly_record"]
    anom_id = anom_rec["id"] if anom_rec else None
    
    # Insert new reading
    c.execute("""
    INSERT INTO sensor_readings (
        station_id, timestamp, temperature, pressure, humidity,
        expected_temperature, expected_pressure, expected_humidity,
        corrected_temperature, corrected_pressure, corrected_humidity,
        is_anomaly, anomaly_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        station_id, now_iso, sim_t, sim_p, sim_h,
        ai_res["expected_temperature"], ai_res["expected_pressure"], ai_res["expected_humidity"],
        ai_res["corrected_temperature"], ai_res["corrected_pressure"], ai_res["corrected_humidity"],
        ai_res["is_anomaly"], anom_id
    ))
    
    alert_rec = None
    if anom_rec:
        # Save anomaly
        c.execute("""
        INSERT INTO anomalies (
            id, station_id, timestamp, parameter, observed_value, expected_value,
            deviation, anomaly_score, confidence, anomaly_type, severity, status,
            temporal_deviation, rate_of_change, historical_deviation,
            humidity_consistency, pressure_consistency, multivariate_consistency,
            explanation, root_cause, recommended_action
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            anom_rec["id"], anom_rec["station_id"], anom_rec["timestamp"], anom_rec["parameter"],
            anom_rec["observed_value"] if anom_rec["observed_value"] is not None else -999.0,
            anom_rec["expected_value"], anom_rec["deviation"], anom_rec["anomaly_score"],
            anom_rec["confidence"], anom_rec["anomaly_type"], anom_rec["severity"], anom_rec["status"],
            anom_rec["temporal_deviation"], anom_rec["rate_of_change"], anom_rec["historical_deviation"],
            anom_rec["humidity_consistency"], anom_rec["pressure_consistency"], anom_rec["multivariate_consistency"],
            anom_rec["explanation"], anom_rec["root_cause"], anom_rec["recommended_action"]
        ))
        
        # Save alert if anomaly is not genuine event
        if anom_rec["anomaly_type"] != "POSSIBLE_GENUINE_WEATHER_EVENT":
            alt_id = f"alt-{uuid.uuid4().hex[:8]}"
            c.execute("""
            INSERT INTO alerts (
                id, station_id, sensor_parameter, problem, severity,
                confidence, status, created_at, anomaly_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                alt_id, station_id, anom_rec["parameter"],
                f"Simulated {scen['scenario_name']} detected",
                anom_rec["severity"], anom_rec["confidence"], "New",
                now_iso, anom_rec["id"]
            ))
            alert_rec = {
                "id": alt_id,
                "station_id": station_id,
                "sensor_parameter": anom_rec["parameter"],
                "problem": f"Simulated {scen['scenario_name']} detected",
                "severity": anom_rec["severity"],
                "confidence": anom_rec["confidence"],
                "status": "New",
                "created_at": now_iso
            }

        # Update sensor health
        if anom_rec["severity"] in ("Critical", "High") and anom_rec["anomaly_type"] != "POSSIBLE_GENUINE_WEATHER_EVENT":
            c.execute("""
            UPDATE sensor_health 
            SET health_score = MAX(20.0, health_score - 12.0),
                failure_risk = MIN(95.0, failure_risk + 18.0),
                status = 'Critical',
                trend = 'DEGRADING',
                updated_at = ?
            WHERE station_id = ? AND sensor_parameter = ?
            """, (now_iso, station_id, anom_rec["parameter"]))

    # Save to simulation events log
    c.execute("""
    INSERT INTO simulation_events (
        id, scenario_id, scenario_name, station_id, parameter,
        injected_value, expected_value, classification, confidence, timestamp, is_genuine_event
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        f"sim-{uuid.uuid4().hex[:8]}", scen_id, scen["scenario_name"], station_id, param,
        sim_t if param == "temperature" else (sim_p if param == "pressure" else sim_h),
        ai_res["expected_temperature"] if param == "temperature" else (ai_res["expected_pressure"] if param == "pressure" else ai_res["expected_humidity"]),
        ai_res["anomaly_type"], ai_res["confidence"], now_iso, 1 if scen["is_genuine"] else 0
    ))
    
    conn.commit()
    conn.close()
    
    new_reading = {
        "station_id": station_id,
        "timestamp": now_iso,
        "temperature": sim_t,
        "pressure": sim_p,
        "humidity": sim_h,
        "expected_temperature": ai_res["expected_temperature"],
        "expected_pressure": ai_res["expected_pressure"],
        "expected_humidity": ai_res["expected_humidity"],
        "is_anomaly": ai_res["is_anomaly"]
    }
    
    return SimulationTriggerResponse(
        success=True,
        scenario_id=scen_id,
        scenario_name=scen["scenario_name"],
        station_id=station_id,
        parameter=param,
        observed_value=sim_t if param == "temperature" else (sim_p if param == "pressure" else sim_h),
        expected_value=ai_res["expected_temperature"] if param == "temperature" else (ai_res["expected_pressure"] if param == "pressure" else ai_res["expected_humidity"]),
        deviation=anom_rec["deviation"] if anom_rec else 0.0,
        anomaly_score=ai_res["anomaly_score"],
        confidence=ai_res["confidence"],
        classification=ai_res["anomaly_type"],
        severity=ai_res["severity"],
        is_genuine_event=scen["is_genuine"] or ai_res["anomaly_type"] == "POSSIBLE_GENUINE_WEATHER_EVENT",
        root_cause=ai_res["root_cause"],
        explanation=ai_res["explainability"]["explanation"],
        recommended_action=ai_res["recommended_action"],
        new_reading=new_reading,
        new_anomaly=anom_rec,
        new_alert=alert_rec
    )
