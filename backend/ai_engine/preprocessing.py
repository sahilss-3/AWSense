import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

def compute_rolling_features(values: List[float], window: int = 12) -> Dict[str, float]:
    """
    Computes rolling mean, std, rate of change (first difference), 
    and acceleration (second difference) for a given series of values.
    """
    if not values or len(values) == 0:
        return {
            "mean": 0.0,
            "std": 1.0,
            "rate_of_change": 0.0,
            "acceleration": 0.0,
            "z_score": 0.0
        }
    
    clean_vals = [v for v in values if v is not None and not np.isnan(v)]
    if len(clean_vals) == 0:
        return {"mean": 0.0, "std": 1.0, "rate_of_change": 0.0, "acceleration": 0.0, "z_score": 0.0}
        
    s = pd.Series(clean_vals)
    w = min(window, len(s))
    
    rolling_mean = float(s.tail(w).mean())
    rolling_std = float(s.tail(w).std())
    if np.isnan(rolling_std) or rolling_std < 0.01:
        rolling_std = 0.5  # fallback to avoid div by zero
        
    latest = clean_vals[-1]
    prev = clean_vals[-2] if len(clean_vals) >= 2 else latest
    prev2 = clean_vals[-3] if len(clean_vals) >= 3 else prev
    
    rate_of_change = latest - prev
    prev_roc = prev - prev2
    acceleration = rate_of_change - prev_roc
    z_score = (latest - rolling_mean) / rolling_std
    
    return {
        "mean": round(rolling_mean, 2),
        "std": round(rolling_std, 2),
        "rate_of_change": round(rate_of_change, 2),
        "acceleration": round(acceleration, 2),
        "z_score": round(z_score, 2)
    }

def detect_frozen_sensor(values: List[float], window: int = 6, tolerance: float = 0.01) -> bool:
    """
    Detects if sensor readings have remained identical within tolerance for >= window steps.
    """
    if len(values) < window:
        return False
    recent = values[-window:]
    if any(v is None or np.isnan(v) for v in recent):
        return False
    return bool(np.std(recent) <= tolerance)

def detect_drift_pattern(residuals: List[float], window: int = 24) -> float:
    """
    Estimates monotonic residual drift slope over recent window.
    Evaluated on (observed - expected) residual to ignore normal diurnal cycle.
    Returns slope in degrees/hPa per observation step.
    """
    if len(residuals) < 12:
        return 0.0
    recent = [r for r in residuals[-window:] if r is not None and not np.isnan(r)]
    if len(recent) < 12:
        return 0.0
    x = np.arange(len(recent))
    slope, _ = np.polyfit(x, recent, 1)
    return float(round(slope, 4))
