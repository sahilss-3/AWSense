import asyncio
import numpy as np
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from database.connection import get_db_connection
from ai_engine.data_generator import STATIONS_CONFIG
from ai_engine.anomaly_detector import AWSAnomalyDetector

async def telemetry_streamer():
    """
    Simulates real-time streaming telemetry from all 8 Automated Weather Stations.
    Pushes a new observation cycle every 20 seconds.
    Ensures telemetry data stays alive, active, and realistic 24/7 without manual intervention.
    """
    detector = AWSAnomalyDetector()
    print("Background Telemetry Streamer initialized.")

    while True:
        try:
            await asyncio.sleep(20)
            now = datetime.now(timezone.utc)
            now_iso = now.isoformat()
            hour = now.hour + now.minute / 60.0

            conn = get_db_connection()
            c = conn.cursor()

            for st in STATIONS_CONFIG:
                sid = st["station_id"]
                base_t = st["base_temp"]
                base_p = st["base_press"]
                base_h = st["base_hum"]

                # Fetch recent history for baseline and detection
                recent_rows = c.execute(
                    "SELECT * FROM sensor_readings WHERE station_id = ? ORDER BY timestamp DESC LIMIT 20",
                    (sid,)
                ).fetchall()
                history = [dict(r) for r in reversed(recent_rows)]

                # Theoretical expected diurnal curves
                exp_t = round(base_t + 5.5 * np.sin(2 * np.pi * (hour - 8.5) / 24.0), 2)
                exp_p = round(base_p + 1.2 * np.sin(4 * np.pi * (hour - 4.0) / 24.0), 2)
                exp_h = round(base_h - 18.0 * np.sin(2 * np.pi * (hour - 8.5) / 24.0), 2)
                exp_h = max(15.0, min(96.0, exp_h))

                # Raw observation with natural stochastic sensor noise
                diurnal_t = exp_t + np.random.normal(0, 0.30)
                diurnal_p = exp_p + np.random.normal(0, 0.18)
                diurnal_h = exp_h + np.random.normal(0, 1.10)
                diurnal_h = max(15.0, min(96.0, diurnal_h))

                obs_t = round(diurnal_t, 2)
                obs_p = round(diurnal_p, 2)
                obs_h = round(diurnal_h, 2)

                # Station condition simulation
                if sid == "AWS-PUN-01":
                    # Ongoing temperature drift
                    obs_t = round(obs_t + 3.8, 2)
                elif sid == "AWS-KOL-06":
                    # Humidity flatline / frozen
                    obs_h = 72.4
                elif sid == "AWS-SAT-07":
                    # Offline station — missing packets
                    obs_t = None
                    obs_p = None
                    obs_h = None
                elif sid == "AWS-NAG-04":
                    # Pressure frozen
                    obs_p = 978.4

                # Analyze with AI Engine
                ai_res = detector.analyze_observation(
                    station_id=sid,
                    timestamp=now_iso,
                    temperature=obs_t,
                    pressure=obs_p,
                    humidity=obs_h,
                    history=history
                )

                anom_id = None
                if ai_res["is_anomaly"]:
                    anom_rec = ai_res["anomaly_record"]
                    if anom_rec:
                        anom_id = anom_rec["id"]

                c.execute("""
                INSERT INTO sensor_readings (
                    station_id, timestamp, temperature, pressure, humidity,
                    expected_temperature, expected_pressure, expected_humidity,
                    corrected_temperature, corrected_pressure, corrected_humidity,
                    is_anomaly, anomaly_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    sid, now_iso, obs_t, obs_p, obs_h,
                    ai_res["expected_temperature"], ai_res["expected_pressure"], ai_res["expected_humidity"],
                    ai_res["corrected_temperature"], ai_res["corrected_pressure"], ai_res["corrected_humidity"],
                    ai_res["is_anomaly"], anom_id
                ))

                c.execute(
                    "UPDATE stations SET last_reading_time = ? WHERE station_id = ?",
                    (now_iso, sid)
                )

            # Prune readings older than 7 days to maintain lightweight database size
            seven_days_ago = (now - timedelta(days=7)).isoformat()
            c.execute("DELETE FROM sensor_readings WHERE timestamp < ?", (seven_days_ago,))

            conn.commit()
            conn.close()

        except asyncio.CancelledError:
            print("Telemetry streamer shutting down cleanly.")
            break
        except Exception as e:
            print(f"Error in telemetry streamer iteration: {e}")
            await asyncio.sleep(5)
