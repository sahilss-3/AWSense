import numpy as np
from typing import List, Dict, Optional
from datetime import datetime

def estimate_diurnal_temperature_expectation(hour: float, base_temp: float = 28.0, amplitude: float = 6.5) -> float:
    """
    Diurnal sinusoidal model of terrestrial temperature in Maharashtra.
    Minimum around 05:30 (sunrise), maximum around 14:30 (solar insolation peak).
    """
    # Peak at 14.5 hr -> phase shift = 14.5 - 6 = 8.5
    phase = 2 * np.pi * (hour - 8.5) / 24.0
    return base_temp + amplitude * np.sin(phase)

def estimate_diurnal_pressure_expectation(hour: float, base_pressure: float = 955.0) -> float:
    """
    Diurnal and semi-diurnal atmospheric barometric tide (S2 tide has peaks at ~10:00 and ~22:00).
    """
    tide = 1.2 * np.sin(4 * np.pi * (hour - 4.0) / 24.0)
    return base_pressure + tide

def estimate_diurnal_humidity_expectation(hour: float, base_humidity: float = 65.0, amplitude: float = 20.0) -> float:
    """
    Relative humidity has an inverse diurnal relationship to temperature.
    Peak humidity at sunrise (~05:30), minimum at peak heating (~14:30).
    """
    phase = 2 * np.pi * (hour - 8.5) / 24.0
    val = base_humidity - amplitude * np.sin(phase)
    return max(15.0, min(95.0, val))

def compute_expected_value(
    parameter: str,
    recent_readings: List[float],
    timestamp_str: str,
    base_station_value: Optional[float] = None
) -> float:
    """
    Calculates the AI Expected Value for a sensor observation using:
    1. Filtered Exponential Moving Average of recent stable observations (70% weight)
    2. Meteorological Diurnal Solar Model (30% weight)
    """
    # Parse hour of day
    try:
        dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        hour = dt.hour + dt.minute / 60.0
    except Exception:
        hour = 12.0

    # Filter out obvious outliers (> 3 std dev or extreme spikes) from recent readings
    clean_history = [r for r in recent_readings if r is not None and not np.isnan(r)]
    if len(clean_history) >= 3:
        # Exclude the very last reading if we are calculating expectation for a suspicious current reading
        hist_sample = clean_history[:-1] if len(clean_history) > 3 else clean_history
        med = np.median(hist_sample)
        mad = np.median(np.abs(hist_sample - med))
        cutoff = max(2.0, 3.5 * mad)
        filtered = [x for x in hist_sample if abs(x - med) <= cutoff]
        if not filtered:
            filtered = hist_sample
            
        # Exponential weights for recent observations
        weights = np.exp(np.linspace(-1.5, 0, len(filtered)))
        weights /= weights.sum()
        ema_val = float(np.sum(np.array(filtered) * weights))
    elif clean_history:
        ema_val = float(clean_history[0])
    else:
        ema_val = base_station_value if base_station_value is not None else 30.0

    if parameter == "temperature":
        base = base_station_value if base_station_value is not None else 29.0
        diurnal = estimate_diurnal_temperature_expectation(hour, base_temp=base)
        expected = 0.70 * ema_val + 0.30 * diurnal
    elif parameter == "pressure":
        base = base_station_value if base_station_value is not None else 955.0
        diurnal = estimate_diurnal_pressure_expectation(hour, base_pressure=base)
        expected = 0.85 * ema_val + 0.15 * diurnal
    elif parameter == "humidity":
        base = base_station_value if base_station_value is not None else 65.0
        diurnal = estimate_diurnal_humidity_expectation(hour, base_humidity=base)
        expected = 0.70 * ema_val + 0.30 * diurnal
    else:
        expected = ema_val

    return round(float(expected), 2)
