# AWSense — Intelligent Weather Station Data Reliability & Sensor Health Platform

> **Smart India Hackathon 2026 Problem Statement:** `SIH26073` — AI/ML Based Intelligent Anomaly Detection for Automated Weather Stations (AWS)  
> **Tagline:** Intelligent Weather Station Data Reliability & Sensor Health Platform

---

## 1. Executive Overview

**AWSense** is an advanced operational monitoring platform built specifically for meteorologists, weather scientists, AWS operators, government weather-monitoring departments (e.g. IMD), data-quality teams, and sensor maintenance engineers.

Automatic Weather Stations (AWS) continuously generate surface observations in remote, harsh environments. Sensor malfunction, calibration drift, communication dropouts, frozen analog-to-digital converters, and transmission corruption frequently pollute meteorological archives.

Rather than relying on naive static thresholds (e.g., $T > 50^\circ\text{C}$), AWSense deploys an intelligent, offline-capable AI/ML engine combining:
1. **Temporal Rate-of-Change & Rolling Z-Scores**
2. **Atmospheric Physics & Psychrometric Coupling** (Magnus-Tetens saturation vapor pressure equilibrium)
3. **Unsupervised Local Machine Learning** (Isolation Forest)
4. **Kalman / Diurnal Sinusoidal Expected Value Estimation**
5. **Deterministic Explainable AI (XAI)**
6. **Predictive Sensor Degradation Risk Modeling**

### The Core Paradigm:
> *"Don't just detect bad weather data. Understand why it is bad."*
> 
> **DETECT → EXPLAIN → ESTIMATE → ASSESS → ALERT → ACT**

---

## 2. SIH Data Constraint Compliance

In strict compliance with the **SIH26073** problem statement, the core AI detection model works **EXCLUSIVELY with the three fundamental parameters**:
1. **Temperature (°C)**
2. **Atmospheric Pressure (hPa)**
3. **Relative Humidity (%)**

No auxiliary parameters (such as wind speed, rainfall, solar radiation, or UV) are required for core detection. The platform evaluates the coupled thermodynamic and psychrometric relationships among these three variables.

---

## 3. Sensor Fault vs Genuine Weather Event Discrimination

A marquee capability of AWSense is distinguishing between an unphysical **Sensor Fault** and a **Possible Genuine Meteorological Event**:

| Characteristic | Scenario A: Sensor Malfunction | Scenario B: Genuine Meteorological Event |
| :--- | :--- | :--- |
| **Observation** | 31.4°C → 31.8°C → **89.6°C** | 31.0°C → 32.5°C → **35.1°C** |
| **Concurrent Variables** | Humidity & Pressure stagnant | Humidity drops from 68% to 52%, Pressure steady |
| **Physics Verification** | Implies impossible surface vapor pressure ($e > 400$ hPa) | Preserves dew point ($T_d$ shift $< 1.5^\circ\text{C}$); obeys Clausius-Clapeyron |
| **AI Classification** | `SUDDEN_SPIKE` / `SENSOR_FAULT` | `POSSIBLE_GENUINE_WEATHER_EVENT` |
| **Confidence** | **98% (High)** | **88% (High confidence that it is genuine)** |
| **System Action** | Triggers Critical Alert & Quarantines Reading | Suppresses false alarm & Logs valid atmospheric event |

---

## 4. Architectural Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AWSense Architecture                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [ React 18 + TypeScript + Vite + Tailwind CSS + Recharts + Lucide ]   │
│  ├── Command Center (KPIs, live network status, anomaly feed, health) │
│  ├── Live Monitoring (Raw vs Expected vs Anomaly markers, real-time)   │
│  ├── Anomaly Investigation (Contribution bars, AI reasoning, root cause)│
│  ├── Sensor Health & Predictive Maintenance (Health/Drift/Failure Risk)│
│  ├── Simulation Lab (8 Interactive scenarios + Genuine vs Fault demo)  │
│  ├── Network View (Custom SVG Maharashtra station map with live status)│
│  ├── Historical Analysis, Alerts & Incidents, AI Insights, Reports    │
│                               ▲                                        │
│                               │ REST API (JSON, Zero External Keys)    │
│                               ▼                                        │
│  [ Python 3.13 FastAPI Backend + SQLite Database ]                     │
│  ├── main.py (FastAPI App, CORS, Static serving, Lifespan initialization)│
│  ├── database/ (SQLite engine, schema, models, automated seeding)       │
│  ├── api/routes.py (REST endpoints for stations, readings, anomalies)  │
│  └── ai_engine/                                                        │
│      ├── preprocessing.py (Z-score, rolling stats, 1st/2nd derivative) │
│      ├── multivariate.py (Psychrometric & thermodynamic consistency)   │
│      ├── anomaly_detector.py (Composite statistical + Isolation Forest)│
│      ├── classifier.py (Spike, Drop, Drift, Frozen, Genuine Event, etc)│
│      ├── expected_value.py (Kalman/rolling autoregressive estimation)  │
│      ├── explainability.py (Factor contribution % + narrative reasoning)│
│      ├── sensor_health.py (Health score, stability, drift, failure risk)│
│      └── simulator.py (Inject faults, live stream generator, scenarios)│
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Non-Destructive Observation Protocol

In meteorological science, raw sensor observations must **NEVER** be overwritten or erased. AWSense guarantees data provenance by maintaining separate, immutable fields:
- `observed_value`: The exact raw telemetry received from the station ADC.
- `expected_value`: The AI-estimated physical expectation derived from rolling history and diurnal physics.
- `corrected_value`: The optional sanitized observation available for downstream assimilation models.

---

## 6. Supported Anomaly Classifications

- `NORMAL`: Observation operates within physical and historical bounds.
- `SUDDEN_SPIKE`: Sudden step increase ($\ge 25^\circ\text{C}$ or unphysical spike).
- `SUDDEN_DROP`: Sudden negative plunge (open-circuit, ground-loop drop).
- `SENSOR_DRIFT`: Progressive monotonic residual drift away from diurnal baseline.
- `FROZEN_SENSOR`: Zero-variance flatline across $\ge 6$ consecutive observation cycles.
- `MISSING_DATA`: Telemetry modem timeout or station power interruption.
- `TRANSMISSION_ERROR`: CRC / bit corruption producing impossible values.
- `MULTIVARIATE_INCONSISTENCY`: Core parameters contradict surface psychrometric equilibrium.
- `ABNORMAL_TEMPORAL_PATTERN`: Departure from rolling diurnal acceleration.
- `POSSIBLE_GENUINE_WEATHER_EVENT`: High rate of change preserving thermodynamic coupling.

---

## 7. Fast Installation & Startup

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** & **npm**

### Option A: One-Click Startup (Windows)
Double-click `start.bat` or run in PowerShell:
```powershell
.\run.ps1
```
This automatically initializes the backend, seeds the SQLite database, and launches both services.

### Option B: Manual Startup

#### 1. Backend Setup
```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python main.py
```
*Backend runs at:* `http://127.0.0.1:8000`  
*Interactive Swagger API Docs:* `http://127.0.0.1:8000/docs`

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Web Application runs at:* `http://localhost:5173`

---

## 8. REST API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/system/status` | Network health, online stations, reliability, active anomalies |
| `GET` | `/api/stations` | List all 8 Maharashtra AWS stations with telemetry status |
| `GET` | `/api/stations/{id}` | Detailed station profile and sensor breakdown |
| `GET` | `/api/readings/{id}` | Historical time-series observations with AI expected values |
| `GET` | `/api/readings/{id}/live` | Most recent real-time observation packet |
| `GET` | `/api/anomalies` | Filterable anomalies list with XAI contribution scores |
| `GET` | `/api/anomalies/{id}` | Deep diagnostic details for a specific anomaly |
| `GET` | `/api/alerts` | Incident response center alarms |
| `POST`| `/api/alerts/{id}/status` | Triage alert (`Acknowledged`, `Investigating`, `Resolved`) |
| `GET` | `/api/sensor-health` | Health index, stability, drift, and AI failure risk |
| `GET` | `/api/insights` | Data-driven automated network insights |
| `GET` | `/api/reports` | Meteorological compliance summary for printing/export |
| `POST`| `/api/simulation/trigger` | Inject simulated faults and trigger live AI pipeline |
| `GET` | `/api/simulation/scenarios`| List all 8 simulation test scenarios |

---

## 9. 3–5 Minute SIH Demonstration Flow

1. **Command Center**: Review the 8 AWS synoptic stations, data reliability score (95%+), active anomaly feed, and operational status.
2. **Live Monitoring**: Select `AWS Pune-01` or `AWS Nagpur-04`. Explore Temperature, Pressure, and Humidity traces comparing Raw vs AI Expected vs Anomaly markers.
3. **Simulation Lab**:
   - Run **Scenario A (Sudden Sensor Spike)**: Watch the simulated 89.6°C jump trigger instant Critical Anomaly classification with 98% confidence.
   - Run **Scenario B (Genuine Heat Event)**: Demonstrate how AWSense confirms psychrometric consistency and correctly classifies it as a *Possible Genuine Weather Event*.
4. **Anomaly Investigation**: Inspect the factor contribution bars (Temporal, Rate of Change, Historical, Psychrometric Consistency), read the AI Reasoning, and transition the alert status to *Resolved*.
5. **Sensor Health**: Examine 14-day degradation trajectories and predictive failure risk trends.
6. **Network View**: Explore the custom SVG Maharashtra map with live telemetry node pulses.
7. **Reports**: Generate and download an instant CSV audit summary.

---

## 10. Future Integration with Real AWS Hardware

AWSense is architected for zero-friction transition to physical AWS hardware:
- Replace `data_generator.py` with an MQTT / HTTP ingestion webhook connected to Campbell Scientific, Sutron, or IMD data loggers.
- The `AWSAnomalyDetector` class operates statelessly on streaming tuples `(timestamp, T, P, RH, history)`, ready for real-time edge or server deployment.
