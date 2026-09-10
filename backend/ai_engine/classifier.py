from typing import Dict, Any, Tuple, Optional

def classify_anomaly(
    parameter: str,
    observed_value: Optional[float],
    expected_value: float,
    deviation: float,
    rate_of_change: float,
    is_frozen: bool,
    drift_slope: float,
    multivariate_res: Dict[str, Any],
    recent_history_len: int
) -> Tuple[str, str, float, str, str]:
    """
    Classifies the anomaly type, severity, confidence, root cause, and recommended action.
    
    Returns:
      (anomaly_type, severity, confidence, root_cause, recommended_action)
    """
    # 1. Missing Data
    if observed_value is None:
        return (
            "MISSING_DATA",
            "High",
            99.0,
            "Communication channel timeout or station power failure",
            "Check AWS power supply, telemetry modem, and transmission schedule."
        )

    # 2. Frozen Sensor Check
    if is_frozen:
        return (
            "FROZEN_SENSOR",
            "High",
            94.0,
            "ADC sampler freeze or mechanical sensor element stuck",
            "Dispatch technician to inspect transducer and power-cycle the AWS data logger."
        )

    # 3. Genuine Weather Event vs Sensor Fault
    # This is a critical feature!
    if multivariate_res.get("is_genuine_event", False):
        return (
            "POSSIBLE_GENUINE_WEATHER_EVENT",
            "Low",
            88.0,
            "Rapid atmospheric heating / advective front with consistent thermodynamic response",
            "Continue automated monitoring; no sensor recalibration required as physics coupling is preserved."
        )

    abs_dev = abs(deviation)
    abs_roc = abs(rate_of_change)

    # 4. Sudden Spike / Drop / Transmission Error
    if parameter == "temperature":
        # e.g., 31.8°C -> 89.6°C
        if observed_value > 60.0 or abs_roc >= 25.0:
            return (
                "SUDDEN_SPIKE",
                "Critical",
                98.0,
                "Sensor transducer breakdown or telemetry bit-shift corruption",
                "Flag observation as unverified. Inspect RTD/thermistor wiring and recalibrate."
            )
        elif observed_value < -20.0 or abs_roc <= -25.0:
            return (
                "SUDDEN_DROP",
                "Critical",
                97.0,
                "Ground loop fault, sudden open-circuit, or corrupted telemetry packet",
                "Verify sensor grounding, probe integrity, and communication packet CRC."
            )
        elif abs_dev >= 8.0:
            if multivariate_res.get("multivariate_consistency", 100) < 40:
                return (
                    "MULTIVARIATE_INCONSISTENCY",
                    "High",
                    92.0,
                    "Temperature divergence violating local psychrometric equilibrium",
                    "Cross-check with nearby synoptic stations and verify sensor calibration."
                )
            else:
                return (
                    "ABNORMAL_TEMPORAL_PATTERN",
                    "Medium",
                    82.0,
                    "Anomalous thermal rate of change compared to diurnal baseline",
                    "Inspect station surroundings for artificial heat sources or obstructions."
                )
    elif parameter == "pressure":
        if abs_roc >= 15.0 or observed_value < 850.0 or observed_value > 1060.0:
            return (
                "SUDDEN_SPIKE" if deviation > 0 else "SUDDEN_DROP",
                "Critical",
                96.0,
                "Barometric transducer malfunction or port obstruction",
                "Clean barometer vent and check pressure port for moisture or insect blockage."
            )
        elif abs_dev >= 8.0 and abs_roc >= 3.0:
            return (
                "ABNORMAL_TEMPORAL_PATTERN",
                "High",
                86.0,
                "Excessive barometric fluctuation beyond diurnal atmospheric tide",
                "Verify pneumatic static port tube and station enclosure seals."
            )
    elif parameter == "humidity":
        if observed_value > 105.0 or observed_value < 0.0 or abs_roc >= 45.0:
            return (
                "SUDDEN_SPIKE" if deviation > 0 else "SUDDEN_DROP",
                "High",
                95.0,
                "Capacitive RH polymer saturation failure or circuit short",
                "Replace capacitive humidity sensor chip and inspect protective filter cap."
            )
        elif abs_dev >= 25.0:
            if multivariate_res.get("multivariate_consistency", 100) < 40:
                return (
                    "MULTIVARIATE_INCONSISTENCY",
                    "High",
                    90.0,
                    "Humidity reading severely contradicts ambient temperature and dew point",
                    "Inspect hygrometer filter cap for contamination and clean radiation shield."
                )
        elif abs_dev >= 30.0 and abs_roc >= 12.0:
            return (
                "ABNORMAL_TEMPORAL_PATTERN",
                "Medium",
                80.0,
                "Unusual humidity departure from historical diurnal range",
                "Observe subsequent readings to confirm trend."
            )

    # 5. Sensor Drift
    if abs(drift_slope) >= 0.12:
        return (
            "SENSOR_DRIFT",
            "Medium",
            85.0,
            "Gradual calibration drift or component aging",
            "Schedule station maintenance for precision calibration against transfer standard."
        )

    # 6. Moderate Anomaly / Mild Inconsistency
    param_threshold = 7.0 if parameter in ("temperature", "pressure") else 25.0
    if abs_dev >= param_threshold or (abs_dev >= param_threshold * 0.7 and abs_roc >= 5.0):
        return (
            "ABNORMAL_TEMPORAL_PATTERN",
            "Low",
            75.0,
            "Minor departure from station rolling expectation",
            "Observe subsequent readings to determine if divergence persists."
        )

    return (
        "NORMAL",
        "Low",
        99.0,
        "Operating within normal meteorological parameters",
        "No maintenance action needed."
    )
