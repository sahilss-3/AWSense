import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from database.connection import get_db_connection, init_db
from ai_engine.data_generator import STATIONS_CONFIG, generate_telemetry_series
from ai_engine.anomaly_detector import AWSAnomalyDetector
from ai_engine.sensor_health import assess_sensor_health

def seed_database(force: bool = False):
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc)

    # Check if database already has fresh data (within last 30 minutes)
    if not force:
        cursor.execute("SELECT COUNT(*) FROM stations")
        st_count = cursor.fetchone()[0]
        if st_count > 0:
            cursor.execute("SELECT MAX(timestamp) FROM sensor_readings")
            max_row = cursor.fetchone()
            if max_row and max_row[0]:
                try:
                    max_dt = datetime.fromisoformat(max_row[0])
                    # If max reading is within last 30 minutes, it's already fresh
                    if (now - max_dt).total_seconds() < 1800:
                        conn.close()
                        return
                except Exception:
                    pass

    print(f"[{now.isoformat()}] Seeding/Refreshing AWSense telemetry dataset...")

    # Wipe old data
    cursor.execute("DELETE FROM alerts")
    cursor.execute("DELETE FROM anomalies")
    cursor.execute("DELETE FROM sensor_readings")
    cursor.execute("DELETE FROM sensor_health")
    cursor.execute("DELETE FROM stations")
    conn.commit()

    detector = AWSAnomalyDetector()
    start_time = now - timedelta(days=3)

    # 1. Insert Stations
    for st in STATIONS_CONFIG:
        cursor.execute("""
        INSERT INTO stations (
            station_id, name, location, district, latitude, longitude,
            elevation, status, health_score, reliability, last_reading_time, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            st["station_id"], st["name"], st["location"], st["district"],
            st["latitude"], st["longitude"], st["elevation"], st["status"],
            st["health_score"], st["reliability"], now.isoformat(), start_time.isoformat()
        ))

    # 2. Generate and Insert Readings & Anomalies
    all_readings = []
    for st in STATIONS_CONFIG:
        st_readings = generate_telemetry_series(st, start_time, now, interval_minutes=30)
        all_readings.extend(st_readings)

    # Sort readings chronologically
    all_readings.sort(key=lambda x: x["timestamp"])

    station_history = {}
    for st in STATIONS_CONFIG:
        station_history[st["station_id"]] = []

    for r in all_readings:
        sid = r["station_id"]
        hist = station_history[sid]
        
        # Analyze with AI Engine if flagged or every reading
        ai_res = detector.analyze_observation(
            station_id=sid,
            timestamp=r["timestamp"],
            temperature=r["temperature"],
            pressure=r["pressure"],
            humidity=r["humidity"],
            history=hist
        )

        anom_id = None
        if ai_res["is_anomaly"] or ai_res["anomaly_type"] == "POSSIBLE_GENUINE_WEATHER_EVENT":
            anom_rec = ai_res["anomaly_record"]
            anom_id = anom_rec["id"]
            
            # Store anomaly in database
            cursor.execute("""
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

            # Store Alert if severity is Medium, High, or Critical
            if anom_rec["severity"] in ("Medium", "High", "Critical") and anom_rec["anomaly_type"] != "POSSIBLE_GENUINE_WEATHER_EVENT":
                alert_id = f"alt-{uuid.uuid4().hex[:8]}"
                problem_desc = f"{anom_rec['anomaly_type'].replace('_', ' ').title()} on {anom_rec['parameter']}"
                cursor.execute("""
                INSERT INTO alerts (
                    id, station_id, sensor_parameter, problem, severity,
                    confidence, status, created_at, anomaly_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    alert_id, sid, anom_rec["parameter"], problem_desc,
                    anom_rec["severity"], anom_rec["confidence"], "New",
                    anom_rec["timestamp"], anom_rec["id"]
                ))

        cursor.execute("""
        INSERT INTO sensor_readings (
            station_id, timestamp, temperature, pressure, humidity,
            expected_temperature, expected_pressure, expected_humidity,
            corrected_temperature, corrected_pressure, corrected_humidity,
            is_anomaly, anomaly_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sid, r["timestamp"], r["temperature"], r["pressure"], r["humidity"],
            ai_res["expected_temperature"], ai_res["expected_pressure"], ai_res["expected_humidity"],
            ai_res["corrected_temperature"], ai_res["corrected_pressure"], ai_res["corrected_humidity"],
            ai_res["is_anomaly"], anom_id
        ))

        hist.append({
            "timestamp": r["timestamp"],
            "temperature": r["temperature"],
            "pressure": r["pressure"],
            "humidity": r["humidity"]
        })

    # 3. Seed Sensor Health Table for each station & sensor
    for st in STATIONS_CONFIG:
        sid = st["station_id"]
        # Temperature sensor health
        temp_anoms = cursor.execute("SELECT COUNT(*) FROM anomalies WHERE station_id = ? AND parameter = 'temperature'", (sid,)).fetchone()[0]
        press_anoms = cursor.execute("SELECT COUNT(*) FROM anomalies WHERE station_id = ? AND parameter = 'pressure'", (sid,)).fetchone()[0]
        hum_anoms = cursor.execute("SELECT COUNT(*) FROM anomalies WHERE station_id = ? AND parameter = 'humidity'", (sid,)).fetchone()[0]

        temp_readings = [h["temperature"] for h in station_history[sid] if h["temperature"] is not None]
        press_readings = [h["pressure"] for h in station_history[sid] if h["pressure"] is not None]
        hum_readings = [h["humidity"] for h in station_history[sid] if h["humidity"] is not None]

        drift_t = 0.08 if sid == "AWS-PUN-01" else 0.005
        drift_p = 0.002
        drift_h = 0.003

        # Assess for temperature
        health_t = assess_sensor_health(temp_readings, temp_anoms, len(station_history[sid]), 0 if st["status"] != "OFFLINE" else 16, drift_t)
        health_p = assess_sensor_health(press_readings, press_anoms, len(station_history[sid]), 0 if st["status"] != "OFFLINE" else 16, drift_p)
        health_h = assess_sensor_health(hum_readings, hum_anoms, len(station_history[sid]), 0 if st["status"] != "OFFLINE" else 16, drift_h)

        if sid == "AWS-KOL-06": # Kolhapur has frozen humidity
            health_h["health_score"] = 62.0
            health_h["stability_score"] = 40.0
            health_h["status"] = "Warning"
            health_h["failure_risk"] = 38.0
            health_h["maintenance_recommendation"] = "Hygrometer flatline detected. Clean or replace sensor element."

        if sid == "AWS-NAG-04": # Nagpur has critical sensor issues
            health_t["health_score"] = 44.0
            health_t["failure_risk"] = 78.0
            health_t["status"] = "Critical"
            health_t["maintenance_recommendation"] = "Inspect temperature sensor transducer and recalibrate immediately."

        for param, h_data in [("temperature", health_t), ("pressure", health_p), ("humidity", health_h)]:
            cursor.execute("""
            INSERT OR REPLACE INTO sensor_health (
                station_id, sensor_parameter, health_score, stability_score,
                drift_score, anomaly_frequency, missing_data_rate, failure_risk,
                trend, status, maintenance_recommendation, last_calibrated, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sid, param, h_data["health_score"], h_data["stability_score"],
                h_data["drift_score"], h_data["anomaly_frequency"], h_data["missing_data_rate"],
                h_data["failure_risk"], h_data["trend"], h_data["status"],
                h_data["maintenance_recommendation"], "2026-05-15", now.isoformat()
            ))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    seed_database()
    print("Database seeded successfully.")
