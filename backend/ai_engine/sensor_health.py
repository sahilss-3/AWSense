import numpy as np
from typing import Dict, Any, List
from datetime import datetime

def assess_sensor_health(
    readings: List[float],
    anomalies_count_14d: int,
    total_observations_14d: int,
    missing_count_14d: int,
    drift_slope: float
) -> Dict[str, Any]:
    """
    Evaluates sensor health and estimates predictive degradation risk.
    Formula integrates anomaly frequency, missing data rate, variance stability,
    and cumulative calibration drift.
    """
    total = max(1, total_observations_14d)
    anomaly_freq = round((anomalies_count_14d / total) * 100.0, 2)
    missing_rate = round((missing_count_14d / total) * 100.0, 2)
    
    # 1. Drift Score: 100 is zero drift, decreases as slope increases
    abs_drift = abs(drift_slope)
    drift_penalty = min(60.0, abs_drift * 1200.0)
    drift_score = max(20.0, round(100.0 - drift_penalty, 1))

    # 2. Stability Score: based on local variance consistency
    clean_readings = [r for r in readings if r is not None and not np.isnan(r)]
    if len(clean_readings) >= 6:
        diffs = np.diff(clean_readings)
        var_diff = float(np.var(diffs))
        stability_score = max(30.0, min(100.0, round(100.0 - (var_diff * 4.0), 1)))
    else:
        stability_score = 75.0

    # 3. Health Score Composite (0 to 100)
    # Penalized by anomaly frequency, missing rate, and drift
    penalty = (anomaly_freq * 3.5) + (missing_rate * 2.0) + (100.0 - drift_score) * 0.35
    health_score = max(15.0, min(100.0, round(100.0 - penalty, 1)))

    # 4. AI-Estimated Failure Risk (0% to 100%)
    # Non-linear logistic degradation risk
    risk_raw = ((100.0 - health_score) * 0.65) + (anomaly_freq * 2.8) + (abs_drift * 800.0)
    failure_risk = max(4.0, min(95.0, round(risk_raw, 1)))

    # 5. Trend & Status
    if health_score >= 88.0:
        status = "Healthy"
        trend = "STABLE"
        rec = "Sensor operational. Next routine calibration in 6 months."
    elif health_score >= 70.0:
        status = "Warning"
        trend = "DEGRADING" if failure_risk > 25.0 else "STABLE"
        rec = "Sensor showing early variance drift. Schedule inspection within 14 days."
    elif health_score >= 45.0:
        status = "Critical"
        trend = "DEGRADING"
        rec = "High anomaly rate detected. Inspect physical probe and check ADC wiring immediately."
    else:
        status = "Maintenance Required"
        trend = "DEGRADING"
        rec = "Sensor reliability threshold breached. Immediate technician dispatch and recalibration required."

    return {
        "health_score": health_score,
        "stability_score": stability_score,
        "drift_score": drift_score,
        "anomaly_frequency": anomaly_freq,
        "missing_data_rate": missing_rate,
        "failure_risk": failure_risk,
        "trend": trend,
        "status": status,
        "maintenance_recommendation": rec
    }
