import numpy as np
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

STATIONS_CONFIG = [
    {
        "station_id": "AWS-PUN-01",
        "name": "AWS Pune-01",
        "location": "Pune Agro-Meteorological Observatory",
        "district": "Pune",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "elevation": 560.0,
        "status": "WARNING",
        "base_temp": 28.5,
        "base_press": 948.0,
        "base_hum": 62.0,
        "health_score": 78.5,
        "reliability": 94.2,
        "anomaly_type": "SENSOR_DRIFT" # Exhibits mild temperature drift
    },
    {
        "station_id": "AWS-NSK-02",
        "name": "AWS Nashik-02",
        "location": "Nashik Vineyard Agro-Met Centre",
        "district": "Nashik",
        "latitude": 19.9975,
        "longitude": 73.7898,
        "elevation": 600.0,
        "status": "HEALTHY",
        "base_temp": 26.8,
        "base_press": 942.0,
        "base_hum": 58.0,
        "health_score": 96.8,
        "reliability": 99.4,
        "anomaly_type": None
    },
    {
        "station_id": "AWS-MUM-03",
        "name": "AWS Mumbai-03",
        "location": "Colaba Coastal Meteorology Station",
        "district": "Mumbai City",
        "latitude": 18.9067,
        "longitude": 72.8147,
        "elevation": 11.0,
        "status": "HEALTHY",
        "base_temp": 30.5,
        "base_press": 1012.0,
        "base_hum": 78.0,
        "health_score": 94.2,
        "reliability": 98.8,
        "anomaly_type": "POSSIBLE_GENUINE_WEATHER_EVENT" # Genuine afternoon sea breeze / solar warming
    },
    {
        "station_id": "AWS-NAG-04",
        "name": "AWS Nagpur-04",
        "location": "Vidarbha Central Synoptic Station",
        "district": "Nagpur",
        "latitude": 21.1458,
        "longitude": 79.0882,
        "elevation": 310.0,
        "status": "CRITICAL",
        "base_temp": 33.2,
        "base_press": 978.0,
        "base_hum": 42.0,
        "health_score": 48.0,
        "reliability": 82.5,
        "anomaly_type": "SUDDEN_SPIKE" # Spike and frozen pressure
    },
    {
        "station_id": "AWS-AUR-05",
        "name": "AWS Aurangabad-05",
        "location": "Chhatrapati Sambhajinagar Met Station",
        "district": "Aurangabad",
        "latitude": 19.8762,
        "longitude": 75.3433,
        "elevation": 568.0,
        "status": "HEALTHY",
        "base_temp": 29.0,
        "base_press": 947.0,
        "base_hum": 52.0,
        "health_score": 92.5,
        "reliability": 98.2,
        "anomaly_type": None
    },
    {
        "station_id": "AWS-KOL-06",
        "name": "AWS Kolhapur-06",
        "location": "Western Ghats Foothills AWS",
        "district": "Kolhapur",
        "latitude": 16.7050,
        "longitude": 74.2433,
        "elevation": 569.0,
        "status": "WARNING",
        "base_temp": 27.2,
        "base_press": 946.0,
        "base_hum": 70.0,
        "health_score": 74.0,
        "reliability": 91.8,
        "anomaly_type": "FROZEN_SENSOR" # Humidity sensor frozen
    },
    {
        "station_id": "AWS-SAT-07",
        "name": "AWS Satara-07",
        "location": "Mahabaleshwar Plateau Edge AWS",
        "district": "Satara",
        "latitude": 17.6805,
        "longitude": 73.9930,
        "elevation": 1220.0,
        "status": "OFFLINE",
        "base_temp": 21.0,
        "base_press": 878.0,
        "base_hum": 84.0,
        "health_score": 32.0,
        "reliability": 71.0,
        "anomaly_type": "MISSING_DATA"
    },
    {
        "station_id": "AWS-SOL-08",
        "name": "AWS Solapur-08",
        "location": "Solapur Semi-Arid Drought Obs",
        "district": "Solapur",
        "latitude": 17.6599,
        "longitude": 75.9064,
        "elevation": 458.0,
        "status": "HEALTHY",
        "base_temp": 32.0,
        "base_press": 962.0,
        "base_hum": 45.0,
        "health_score": 95.0,
        "reliability": 99.1,
        "anomaly_type": None
    }
]

def generate_telemetry_series(
    station: Dict[str, Any],
    start_dt: datetime,
    end_dt: datetime,
    interval_minutes: int = 60
) -> List[Dict[str, Any]]:
    """
    Generates realistic historical meteorological time-series for an AWS station.
    Injects specific real-world anomalies based on station condition.
    """
    records = []
    curr_dt = start_dt
    np.random.seed(abs(hash(station["station_id"])) % (2**31))

    total_steps = int((end_dt - start_dt).total_seconds() / (interval_minutes * 60))
    step_idx = 0

    base_t = station["base_temp"]
    base_p = station["base_press"]
    base_h = station["base_hum"]

    while curr_dt <= end_dt:
        hour = curr_dt.hour + curr_dt.minute / 60.0
        
        # Diurnal curves
        diurnal_t = base_t + 5.5 * np.sin(2 * np.pi * (hour - 8.5) / 24.0) + np.random.normal(0, 0.35)
        diurnal_p = base_p + 1.2 * np.sin(4 * np.pi * (hour - 4.0) / 24.0) + np.random.normal(0, 0.2)
        diurnal_h = base_h - 18.0 * np.sin(2 * np.pi * (hour - 8.5) / 24.0) + np.random.normal(0, 1.2)
        
        diurnal_h = max(15.0, min(96.0, diurnal_h))

        obs_t = round(diurnal_t, 2)
        obs_p = round(diurnal_p, 2)
        obs_h = round(diurnal_h, 2)
        
        exp_t = round(diurnal_t, 2)
        exp_p = round(diurnal_p, 2)
        exp_h = round(diurnal_h, 2)

        is_anom = 0
        anom_id = None

        # Inject anomalies into specific stations toward the end of the timeline
        # AWS-PUN-01: Temperature drift over last 18 hours
        if station["station_id"] == "AWS-PUN-01" and step_idx > (total_steps - 18):
            drift_offset = (step_idx - (total_steps - 18)) * 0.45
            obs_t = round(obs_t + drift_offset, 2)
            if drift_offset > 3.0:
                is_anom = 1

        # AWS-NAG-04: Sudden spike at 3 hours ago, and sudden drop 2 hours ago
        elif station["station_id"] == "AWS-NAG-04":
            if step_idx == (total_steps - 4): # Sudden Spike: 31.8 -> 89.6
                obs_t = 89.6
                is_anom = 1
            elif step_idx == (total_steps - 12): # Sudden Drop: 32.0 -> -10.0
                obs_t = -10.0
                is_anom = 1
            elif step_idx > (total_steps - 8): # Pressure frozen
                obs_p = 978.4
                is_anom = 1

        # AWS-KOL-06: Frozen humidity sensor for the last 10 hours
        elif station["station_id"] == "AWS-KOL-06" and step_idx > (total_steps - 10):
            obs_h = 72.4
            is_anom = 1

        # AWS-SAT-07: Missing data (Offline station)
        elif station["station_id"] == "AWS-SAT-07" and step_idx > (total_steps - 16):
            obs_t = None
            obs_p = None
            obs_h = None
            is_anom = 1

        # AWS-MUM-03: Genuine meteorological event (coastal solar warming & sea breeze shift)
        elif station["station_id"] == "AWS-MUM-03" and step_idx == (total_steps - 2):
            # T rises from 31.0 -> 35.1 while RH drops from 74% -> 58%
            obs_t = 35.1
            obs_h = 58.0
            is_anom = 0 # Classified as Genuine Event

        records.append({
            "station_id": station["station_id"],
            "timestamp": curr_dt.isoformat(),
            "temperature": obs_t,
            "pressure": obs_p,
            "humidity": obs_h,
            "expected_temperature": exp_t,
            "expected_pressure": exp_p,
            "expected_humidity": exp_h,
            "corrected_temperature": exp_t if is_anom and obs_t is not None and abs(obs_t - exp_t) > 5.0 else obs_t,
            "corrected_pressure": exp_p if is_anom and obs_p is not None and abs(obs_p - exp_p) > 5.0 else obs_p,
            "corrected_humidity": exp_h if is_anom and obs_h is not None and abs(obs_h - exp_h) > 15.0 else obs_h,
            "is_anomaly": is_anom,
            "anomaly_id": anom_id
        })

        curr_dt += timedelta(minutes=interval_minutes)
        step_idx += 1

    return records
