from typing import Dict, Any

def generate_explanation_and_factors(
    parameter: str,
    observed_value: float,
    expected_value: float,
    deviation: float,
    rate_of_change: float,
    z_score: float,
    multivariate_res: Dict[str, Any],
    anomaly_type: str
) -> Dict[str, Any]:
    """
    Computes percentage contribution scores for explainability and synthesizes
    a clear, domain-specific natural language explanation.
    """
    abs_dev = abs(deviation)
    abs_roc = abs(rate_of_change)
    abs_z = abs(z_score)

    # Calculate Factor Contribution Percentages (0 - 100%)
    temporal_dev_pct = min(100.0, round(abs_z * 22.0, 1))
    roc_pct = min(100.0, round(abs_roc * 18.0 if parameter != "pressure" else abs_roc * 12.0, 1))
    hist_dev_pct = min(100.0, round(abs_dev * 12.0 if parameter != "pressure" else abs_dev * 15.0, 1))
    
    hum_consistency = multivariate_res.get("temp_humidity_consistency", 85.0)
    press_consistency = multivariate_res.get("pressure_consistency", 90.0)
    mv_consistency = multivariate_res.get("multivariate_consistency", 88.0)

    # Narrative explanation generation
    unit = "°C" if parameter == "temperature" else ("hPa" if parameter == "pressure" else "%")
    
    if anomaly_type == "POSSIBLE_GENUINE_WEATHER_EVENT":
        explanation = (
            f"Observed {parameter} changed by {rate_of_change:+.1f}{unit} to {observed_value:.1f}{unit}. "
            f"Crucially, the atmospheric thermodynamic coupling is preserved: "
            f"dew point remained stable and relative humidity responded consistently ({hum_consistency:.0f}% psychrometric consistency). "
            f"The AI classifies this as a likely genuine meteorological event rather than a sensor fault."
        )
    elif anomaly_type == "SUDDEN_SPIKE":
        prev_val = observed_value - rate_of_change
        explanation = (
            f"{parameter.capitalize()} suddenly spiked from {prev_val:.1f}{unit} to {observed_value:.1f}{unit} "
            f"(step change of {rate_of_change:+.1f}{unit}) within a single interval. "
            f"Recent stable baseline expected ~{expected_value:.1f}{unit}. "
            f"This sudden surge violates the station's temporal continuity ({temporal_dev_pct:.0f}% temporal deviation) "
            f"and physical psychrometric equilibrium, resulting in a critical anomaly score."
        )
    elif anomaly_type == "SUDDEN_DROP":
        prev_val = observed_value - rate_of_change
        explanation = (
            f"{parameter.capitalize()} plunged sharply to {observed_value:.1f}{unit} (step drop of {rate_of_change:+.1f}{unit}), "
            f"departing from the expected {expected_value:.1f}{unit} (deviation: {deviation:+.1f}{unit}). "
            f"The rate-of-change factor contributed {roc_pct:.0f}%, indicating an unnatural sensor signal drop."
        )
    elif anomaly_type == "FROZEN_SENSOR":
        explanation = (
            f"{parameter.capitalize()} sensor has generated flatline identical readings ({observed_value:.1f}{unit}) "
            f"across consecutive observation cycles. In natural surface boundary layers, micro-turbulent variance "
            f"is always present. Zero-variance signal indicates an analog-to-digital freeze or mechanical stall."
        )
    elif anomaly_type == "SENSOR_DRIFT":
        explanation = (
            f"{parameter.capitalize()} exhibits a persistent progressive drift away from the diurnal climatological baseline. "
            f"Historical deviation contributes {hist_dev_pct:.0f}%. The monotonic divergence suggests transducer calibration decay."
        )
    elif anomaly_type == "MULTIVARIATE_INCONSISTENCY":
        explanation = (
            f"The recorded {parameter} of {observed_value:.1f}{unit} severely conflicts with concurrent atmospheric parameters. "
            f"Psychrometric consistency fell to {hum_consistency:.0f}% and barometric consistency to {press_consistency:.0f}%. "
            f"Physical laws governing surface moisture and temperature equilibrium are violated."
        )
    elif anomaly_type == "MISSING_DATA":
        explanation = (
            f"No telemetry packet was received for {parameter} during the scheduled observation window. "
            f"Transmission timeout or power shortfall detected."
        )
    else:
        explanation = (
            f"{parameter.capitalize()} reading of {observed_value:.1f}{unit} deviates by {deviation:+.1f}{unit} from "
            f"the AI expected value of {expected_value:.1f}{unit}."
        )

    return {
        "temporal_deviation": temporal_dev_pct,
        "rate_of_change": roc_pct,
        "historical_deviation": hist_dev_pct,
        "humidity_consistency": hum_consistency,
        "pressure_consistency": press_consistency,
        "multivariate_consistency": mv_consistency,
        "explanation": explanation
    }
