import numpy as np
from typing import Dict, Any, Tuple

def calculate_saturation_vapor_pressure(temp_c: float) -> float:
    """
    Magnus-Tetens formula for saturation vapor pressure (hPa) over liquid water.
    Valid for -40°C <= T <= 60°C.
    """
    if temp_c is None or np.isnan(temp_c):
        return 6.112
    # Cap extreme temperature for numerical stability
    t_clamped = max(-60.0, min(100.0, temp_c))
    return 6.112 * np.exp((17.67 * t_clamped) / (t_clamped + 243.5))

def calculate_dew_point(temp_c: float, humidity_rh: float) -> float:
    """
    Calculates dew point temperature (°C) using Magnus-Tetens formula.
    """
    if temp_c is None or humidity_rh is None or humidity_rh <= 0:
        return temp_c if temp_c is not None else 20.0
    
    rh = max(1.0, min(100.0, humidity_rh))
    es = calculate_saturation_vapor_pressure(temp_c)
    e = es * (rh / 100.0)
    
    if e <= 0.001:
        return -40.0
        
    val = np.log(e / 6.112)
    denom = 17.67 - val
    if abs(denom) < 1e-4:
        return temp_c
    dew_point = (243.5 * val) / denom
    return float(round(dew_point, 2))

def evaluate_multivariate_consistency(
    temp_c: float,
    press_hpa: float,
    hum_rh: float,
    prev_temp: float = None,
    prev_press: float = None,
    prev_hum: float = None
) -> Dict[str, Any]:
    """
    Evaluates physical meteorological consistency among Temperature, Pressure, and Humidity.
    
    Returns:
      - temp_humidity_consistency: 0 to 100 (%)
      - pressure_consistency: 0 to 100 (%)
      - multivariate_consistency: 0 to 100 (%)
      - is_physically_viable: bool
      - physical_violation: Optional[str]
      - is_genuine_event: bool (if rapid change matches expected thermodynamic coupling)
    """
    if None in (temp_c, press_hpa, hum_rh):
        return {
            "temp_humidity_consistency": 50.0,
            "pressure_consistency": 50.0,
            "multivariate_consistency": 50.0,
            "is_physically_viable": False,
            "physical_violation": "Missing one or more core parameters",
            "is_genuine_event": False
        }

    violations = []
    
    # 1. Absolute Physical Domain Limits (Terrestrial meteorological surface observations)
    if temp_c < -40.0 or temp_c > 65.0:
        violations.append(f"Temperature {temp_c}°C outside terrestrial bounds (-40 to 65°C)")
    if press_hpa < 800.0 or press_hpa > 1080.0:
        violations.append(f"Pressure {press_hpa} hPa outside surface atmospheric bounds (800 to 1080 hPa)")
    if hum_rh < 1.0 or hum_rh > 100.0:
        violations.append(f"Humidity {hum_rh}% outside physical range (1 to 100%)")

    # 2. Psychrometric Coupling
    es = calculate_saturation_vapor_pressure(temp_c)
    vapor_pressure = es * (hum_rh / 100.0)
    dew_point = calculate_dew_point(temp_c, hum_rh)
    
    # Vapor pressure at surface rarely exceeds 45 hPa (extremely hot & humid tropical coasts reach ~38-40 hPa)
    hum_consistency = 100.0
    if vapor_pressure > 50.0:
        penalty = min(80.0, (vapor_pressure - 50.0) * 1.5)
        hum_consistency -= penalty
        violations.append(f"Derived vapor pressure ({vapor_pressure:.1f} hPa) violates surface thermodynamic equilibrium")
    
    if dew_point > temp_c + 1.5:
        # Dew point significantly higher than ambient temp violates physics
        hum_consistency -= 60.0
        violations.append(f"Dew point ({dew_point:.1f}°C) exceeds ambient temperature ({temp_c:.1f}°C)")
        
    # 3. Barometric Consistency
    press_consistency = 100.0
    # Normal station pressure variability
    if press_hpa < 870 or press_hpa > 1050:
        press_consistency -= 30.0

    # 4. Dynamic Coupling with Previous Observation
    is_genuine_event = False
    if prev_temp is not None and prev_hum is not None and prev_press is not None:
        delta_t = temp_c - prev_temp
        delta_rh = hum_rh - prev_hum
        delta_p = press_hpa - prev_press
        
        # Unrealistic step changes (sensor glitch / transmission drop)
        if abs(delta_t) > 15.0:
            hum_consistency = max(5.0, hum_consistency - 75.0)
            violations.append(f"Unphysical temperature step change ({delta_t:+.1f}°C in single observation interval)")
        if abs(delta_p) > 12.0:
            press_consistency = max(5.0, press_consistency - 75.0)
            violations.append(f"Unphysical barometric pressure step change ({delta_p:+.1f} hPa)")
        if abs(delta_rh) > 40.0 and abs(delta_t) < 1.0:
            hum_consistency = max(10.0, hum_consistency - 60.0)
            violations.append(f"Abrupt humidity jump ({delta_rh:+.1f}%) with zero thermal coupling")

        # GENUINE WEATHER EVENT CHECK:
        # For demonstration: When an intense thermal surge occurs (delta_t >= 3.0°C or rapid excursion)
        # where naive threshold systems would trigger a false alarm, but humidity responds
        # with high psychrometric consistency (dew point shift < 2.0°C), AWSense flags it
        # as a Possible Genuine Meteorological Event instead of a sensor fault.
        prev_dp = calculate_dew_point(prev_temp, prev_hum)
        curr_dp = calculate_dew_point(temp_c, hum_rh)
        dp_shift = abs(curr_dp - prev_dp)
        
        if (delta_t >= 3.0 and delta_rh <= -4.0 and dp_shift < 2.0 and abs(delta_p) < 4.0 and temp_c <= 50.0):
            is_genuine_event = True
            hum_consistency = min(98.0, hum_consistency + 10.0)
            press_consistency = min(98.0, press_consistency + 5.0)

    # Calculate overall multivariate consistency score
    hum_consistency = max(0.0, min(100.0, hum_consistency))
    press_consistency = max(0.0, min(100.0, press_consistency))
    multivariate_consistency = round((hum_consistency * 0.6 + press_consistency * 0.4), 1)
    
    is_physically_viable = len(violations) == 0

    return {
        "temp_humidity_consistency": round(hum_consistency, 1),
        "pressure_consistency": round(press_consistency, 1),
        "multivariate_consistency": multivariate_consistency,
        "is_physically_viable": is_physically_viable,
        "physical_violation": "; ".join(violations) if violations else None,
        "is_genuine_event": is_genuine_event,
        "dew_point": dew_point,
        "vapor_pressure": round(vapor_pressure, 2)
    }
