import sqlite3
import os
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DB_DIR / "awsense.db"

def get_db_connection():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Stations Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stations (
        station_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        district TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        elevation REAL NOT NULL,
        status TEXT NOT NULL,
        health_score REAL NOT NULL,
        reliability REAL NOT NULL,
        last_reading_time TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # Sensor Readings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        temperature REAL,
        pressure REAL,
        humidity REAL,
        expected_temperature REAL,
        expected_pressure REAL,
        expected_humidity REAL,
        corrected_temperature REAL,
        corrected_pressure REAL,
        corrected_humidity REAL,
        is_anomaly INTEGER DEFAULT 0,
        anomaly_id TEXT,
        FOREIGN KEY (station_id) REFERENCES stations(station_id)
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_readings_station_time ON sensor_readings(station_id, timestamp);")

    # Anomalies Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS anomalies (
        id TEXT PRIMARY KEY,
        station_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        parameter TEXT NOT NULL,
        observed_value REAL NOT NULL,
        expected_value REAL NOT NULL,
        deviation REAL NOT NULL,
        anomaly_score REAL NOT NULL,
        confidence REAL NOT NULL,
        anomaly_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        temporal_deviation REAL,
        rate_of_change REAL,
        historical_deviation REAL,
        humidity_consistency REAL,
        pressure_consistency REAL,
        multivariate_consistency REAL,
        explanation TEXT NOT NULL,
        root_cause TEXT NOT NULL,
        recommended_action TEXT NOT NULL,
        FOREIGN KEY (station_id) REFERENCES stations(station_id)
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_anomalies_station_time ON anomalies(station_id, timestamp);")

    # Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        station_id TEXT NOT NULL,
        sensor_parameter TEXT NOT NULL,
        problem TEXT NOT NULL,
        severity TEXT NOT NULL,
        confidence REAL NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        anomaly_id TEXT,
        FOREIGN KEY (station_id) REFERENCES stations(station_id)
    );
    """)

    # Sensor Health Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_health (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_id TEXT NOT NULL,
        sensor_parameter TEXT NOT NULL,
        health_score REAL NOT NULL,
        stability_score REAL NOT NULL,
        drift_score REAL NOT NULL,
        anomaly_frequency REAL NOT NULL,
        missing_data_rate REAL NOT NULL,
        failure_risk REAL NOT NULL,
        trend TEXT NOT NULL,
        status TEXT NOT NULL,
        maintenance_recommendation TEXT NOT NULL,
        last_calibrated TEXT,
        updated_at TEXT NOT NULL,
        UNIQUE(station_id, sensor_parameter),
        FOREIGN KEY (station_id) REFERENCES stations(station_id)
    );
    """)

    # Simulation Events Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS simulation_events (
        id TEXT PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        scenario_name TEXT NOT NULL,
        station_id TEXT NOT NULL,
        parameter TEXT NOT NULL,
        injected_value REAL NOT NULL,
        expected_value REAL NOT NULL,
        classification TEXT NOT NULL,
        confidence REAL NOT NULL,
        timestamp TEXT NOT NULL,
        is_genuine_event INTEGER DEFAULT 0
    );
    """)

    conn.commit()
    conn.close()
