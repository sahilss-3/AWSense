import numpy as np
from typing import Dict, Any, List, Optional
import uuid

from .preprocessing import compute_rolling_features, detect_frozen_sensor, detect_drift_pattern
from .multivariate import evaluate_multivariate_consistency
from .expected_value import compute_expected_value
from .classifier import classify_anomaly
from .explainability import generate_explanation_and_factors

try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class AWSAnomalyDetector:
    def __init__(self):
        self.iso_forest = None
        if SKLEARN_AVAILABLE:
            try:
                # Pre-fit a reference Isolation Forest on typical diurnal surface meteorological features:
                # [T, P_norm, RH, dT, dP, dRH]
                np.random.seed(42)
                n_samples = 400
                hours = np.random.uniform(0, 24, n_samples)
                synth_t = 28.0 + 6.0 * np.sin(2 * np.pi * (hours - 8.5) / 24.0) + np.random.normal(0, 0.8, n_samples)
                synth_rh = 65.0 - 20.0 * np.sin(2 * np.pi * (hours - 8.5) / 24.0) + np.random.normal(0, 2.5, n_samples)
                synth_p = 955.0 + 1.2 * np.sin(4 * np.pi * (hours - 4.0) / 24.0) + np.random.normal(0, 0.4, n_samples)
                synth_dt = np.random.normal(0, 0.4, n_samples)
                synth_drh = np.random.normal(0, 1.2, n_samples)
                synth_dp = np.random.normal(0, 0.2, n_samples)

                X_train = np.column_stack([synth_t, synth_p, synth_rh, synth_dt, synth_drh, synth_dp])
                self.iso_forest = IsolationForest(n_estimators=40, contamination=0.03, random_state=42)
                self.iso_forest.fit(X_train)
            except Exception:
                self.iso_forest = None

    def analyze_observation(
        self,
        station_id: str,
        timestamp: str,
        temperature: Optional[float],
        pressure: Optional[float],
        humidity: Optional[float],
        history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Executes the full AWSense AI detection pipeline:
        Ingestion -> Preprocessing -> Multivariate -> Expected Value -> Scoring -> Classification -> Explainability
        """
        # Extract recent stable baseline history (excluding anomalous outliers)
        valid_hist = [h for h in history if not h.get("is_anomaly")]
        if not valid_hist:
            valid_hist = history

        temp_hist = [h["temperature"] for h in valid_hist if h.get("temperature") is not None][-24:]
        press_hist = [h["pressure"] for h in valid_hist if h.get("pressure") is not None][-24:]
        hum_hist = [h["humidity"] for h in valid_hist if h.get("humidity") is not None][-24:]

        prev_temp = temp_hist[-1] if temp_hist else temperature
        prev_press = press_hist[-1] if press_hist else pressure
        prev_hum = hum_hist[-1] if hum_hist else humidity

        # 1. Preprocessing & Temporal Features
        temp_stats = compute_rolling_features(temp_hist + ([temperature] if temperature is not None else []))
        press_stats = compute_rolling_features(press_hist + ([pressure] if pressure is not None else []))
        hum_stats = compute_rolling_features(hum_hist + ([humidity] if humidity is not None else []))

        # Check frozen sensor condition
        is_frozen_t = detect_frozen_sensor(temp_hist + ([temperature] if temperature is not None else []))
        is_frozen_p = detect_frozen_sensor(press_hist + ([pressure] if pressure is not None else []))
        is_frozen_h = detect_frozen_sensor(hum_hist + ([humidity] if humidity is not None else []))
        is_frozen = is_frozen_t or is_frozen_p or is_frozen_h

        # 2. Expected Value Estimation
        # Look up station-specific baseline climate parameters
        from .data_generator import STATIONS_CONFIG
        st_cfg = next((s for s in STATIONS_CONFIG if s["station_id"] == station_id), None)
        base_t = st_cfg["base_temp"] if st_cfg else 28.5
        base_p = st_cfg["base_press"] if st_cfg else 955.0
        base_h = st_cfg["base_hum"] if st_cfg else 65.0

        exp_temp = compute_expected_value("temperature", temp_hist, timestamp, base_station_value=base_t)
        exp_press = compute_expected_value("pressure", press_hist, timestamp, base_station_value=base_p)
        exp_hum = compute_expected_value("humidity", hum_hist, timestamp, base_station_value=base_h)

        # Check drift slope on residuals (observed - expected)
        temp_residuals = [(h.get("temperature", 0.0) - h.get("expected_temperature", h.get("temperature", 0.0))) for h in history if h.get("temperature") is not None]
        if temperature is not None:
            temp_residuals.append(temperature - exp_temp)
        t_drift = detect_drift_pattern(temp_residuals)

        # 3. Multivariate Consistency Analysis
        mv_res = evaluate_multivariate_consistency(
            temp_c=temperature,
            press_hpa=pressure,
            hum_rh=humidity,
            prev_temp=prev_temp,
            prev_press=prev_press,
            prev_hum=prev_hum
        )

        # Deviations
        dev_t = round((temperature - exp_temp), 2) if temperature is not None else 0.0
        dev_p = round((pressure - exp_press), 2) if pressure is not None else 0.0
        dev_h = round((humidity - exp_hum), 2) if humidity is not None else 0.0

        # Determine primary anomalous parameter (if any)
        # Weight deviations by their standard meteorological variance scales:
        # 1°C temp ~ 1 hPa pressure ~ 4% humidity
        severity_scores = {
            "temperature": abs(dev_t) / 1.5 + abs(temp_stats["rate_of_change"]) * 1.5,
            "pressure": abs(dev_p) / 1.2 + abs(press_stats["rate_of_change"]) * 2.0,
            "humidity": abs(dev_h) / 6.0 + abs(hum_stats["rate_of_change"]) * 0.8,
        }
        
        primary_param = max(severity_scores, key=severity_scores.get)
        primary_obs = temperature if primary_param == "temperature" else (pressure if primary_param == "pressure" else humidity)
        primary_exp = exp_temp if primary_param == "temperature" else (exp_press if primary_param == "pressure" else exp_hum)
        primary_dev = dev_t if primary_param == "temperature" else (dev_p if primary_param == "pressure" else dev_h)
        primary_roc = temp_stats["rate_of_change"] if primary_param == "temperature" else (
            press_stats["rate_of_change"] if primary_param == "pressure" else hum_stats["rate_of_change"]
        )
        primary_z = temp_stats["z_score"] if primary_param == "temperature" else (
            press_stats["z_score"] if primary_param == "pressure" else hum_stats["z_score"]
        )

        # 4. Anomaly Classification
        anomaly_type, severity, confidence, root_cause, action = classify_anomaly(
            parameter=primary_param,
            observed_value=primary_obs,
            expected_value=primary_exp,
            deviation=primary_dev,
            rate_of_change=primary_roc,
            is_frozen=is_frozen,
            drift_slope=t_drift,
            multivariate_res=mv_res,
            recent_history_len=len(temp_hist)
        )

        # 5. Composite Anomaly Score (0.0 to 1.0)
        # Isolation Forest scoring if available
        iso_score = 0.0
        if self.iso_forest and None not in (temperature, pressure, humidity):
            try:
                feat = np.array([[
                    temperature, pressure, humidity,
                    temp_stats["rate_of_change"],
                    hum_stats["rate_of_change"],
                    press_stats["rate_of_change"]
                ]])
                raw_iso = self.iso_forest.decision_function(feat)[0] # negative for anomalies
                iso_score = max(0.0, min(1.0, float(-raw_iso * 2.5 + 0.3)))
            except Exception:
                iso_score = 0.0

        if anomaly_type == "POSSIBLE_GENUINE_WEATHER_EVENT":
            anomaly_score = 0.22 # Suppress false alarm
        elif anomaly_type in ("SUDDEN_SPIKE", "SUDDEN_DROP"):
            anomaly_score = min(0.99, max(0.92, round(0.85 + abs(primary_dev) * 0.005 + iso_score * 0.1, 2)))
        elif anomaly_type == "FROZEN_SENSOR":
            anomaly_score = 0.89
        elif anomaly_type == "MULTIVARIATE_INCONSISTENCY":
            anomaly_score = 0.86
        elif anomaly_type == "SENSOR_DRIFT":
            anomaly_score = 0.68
        elif anomaly_type == "ABNORMAL_TEMPORAL_PATTERN":
            anomaly_score = 0.62
        elif anomaly_type == "MISSING_DATA":
            anomaly_score = 0.95
        else:
            anomaly_score = max(0.02, min(0.18, round(abs(primary_dev) * 0.03 + iso_score * 0.05, 2)))

        # 6. Explainability
        explain_res = generate_explanation_and_factors(
            parameter=primary_param,
            observed_value=primary_obs if primary_obs is not None else 0.0,
            expected_value=primary_exp,
            deviation=primary_dev,
            rate_of_change=primary_roc,
            z_score=primary_z,
            multivariate_res=mv_res,
            anomaly_type=anomaly_type
        )

        is_anomaly = 1 if anomaly_score >= 0.45 and anomaly_type != "POSSIBLE_GENUINE_WEATHER_EVENT" else 0

        # Non-destructive: raw observation is never overwritten!
        # Provide corrected value only when anomaly is confirmed
        corrected_temp = exp_temp if is_anomaly and primary_param == "temperature" else temperature
        corrected_press = exp_press if is_anomaly and primary_param == "pressure" else pressure
        corrected_hum = exp_hum if is_anomaly and primary_param == "humidity" else humidity

        anomaly_record = None
        if is_anomaly or anomaly_type == "POSSIBLE_GENUINE_WEATHER_EVENT":
            anomaly_record = {
                "id": f"anom-{uuid.uuid4().hex[:8]}",
                "station_id": station_id,
                "timestamp": timestamp,
                "parameter": primary_param,
                "observed_value": primary_obs,
                "expected_value": primary_exp,
                "deviation": primary_dev,
                "anomaly_score": anomaly_score,
                "confidence": confidence,
                "anomaly_type": anomaly_type,
                "severity": severity,
                "status": "New",
                "temporal_deviation": explain_res["temporal_deviation"],
                "rate_of_change": explain_res["rate_of_change"],
                "historical_deviation": explain_res["historical_deviation"],
                "humidity_consistency": explain_res["humidity_consistency"],
                "pressure_consistency": explain_res["pressure_consistency"],
                "multivariate_consistency": explain_res["multivariate_consistency"],
                "explanation": explain_res["explanation"],
                "root_cause": root_cause,
                "recommended_action": action
            }

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_score,
            "confidence": confidence,
            "anomaly_type": anomaly_type,
            "severity": severity,
            "primary_param": primary_param,
            "expected_temperature": exp_temp,
            "expected_pressure": exp_press,
            "expected_humidity": exp_hum,
            "corrected_temperature": corrected_temp,
            "corrected_pressure": corrected_press,
            "corrected_humidity": corrected_hum,
            "anomaly_record": anomaly_record,
            "explainability": explain_res,
            "multivariate": mv_res,
            "root_cause": root_cause,
            "recommended_action": action
        }
