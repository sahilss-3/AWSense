import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

SCENARIOS = {
    "sudden_spike": {
        "scenario_id": "sudden_spike",
        "scenario_name": "Sudden Sensor Spike",
        "parameter": "temperature",
        "description": "Temperature suddenly surges from ~31.8°C to 89.6°C while ambient pressure & humidity remain unchanged.",
        "injected_delta": 57.5,
        "fixed_value": 89.6,
        "is_genuine": False
    },
    "sudden_drop": {
        "scenario_id": "sudden_drop",
        "scenario_name": "Sudden Sensor Drop",
        "parameter": "temperature",
        "description": "Temperature abruptly plunges to -10.0°C due to transducer ground loop or telemetry drop.",
        "injected_delta": -42.0,
        "fixed_value": -10.0,
        "is_genuine": False
    },
    "frozen_sensor": {
        "scenario_id": "frozen_sensor",
        "scenario_name": "Frozen / Stuck Sensor",
        "parameter": "temperature",
        "description": "ADC sampler freeze or mechanical stickiness resulting in exact identical readings (32.10°C) across consecutive cycles.",
        "injected_delta": 0.0,
        "fixed_value": 32.1,
        "is_genuine": False
    },
    "sensor_drift": {
        "scenario_id": "sensor_drift",
        "scenario_name": "Progressive Calibration Drift",
        "parameter": "temperature",
        "description": "Gradual monotonic offset accumulation (+0.4°C per hour) caused by analog transducer aging.",
        "injected_delta": 4.5,
        "fixed_value": 36.8,
        "is_genuine": False
    },
    "missing_data": {
        "scenario_id": "missing_data",
        "scenario_name": "Telemetry Missing Packets",
        "parameter": "temperature",
        "description": "Complete packet transmission failure or modem power cut during observation epoch.",
        "injected_delta": 0.0,
        "fixed_value": None,
        "is_genuine": False
    },
    "transmission_error": {
        "scenario_id": "transmission_error",
        "scenario_name": "Transmission Bit Corruption",
        "parameter": "pressure",
        "description": "Bit flip in serial RS-485 or cellular transmission payload producing unphysical pressure (1240.5 hPa).",
        "injected_delta": 290.0,
        "fixed_value": 1240.5,
        "is_genuine": False
    },
    "genuine_heat_event": {
        "scenario_id": "genuine_heat_event",
        "scenario_name": "Genuine Weather Event (Thermal Peak)",
        "parameter": "temperature",
        "description": "Natural solar insolation surge: Temperature climbs to 35.1°C with psychrometrically consistent humidity decline and stable dew point.",
        "injected_delta": 3.8,
        "fixed_value": 35.1,
        "hum_value": 52.0,
        "press_value": 947.2,
        "is_genuine": True
    },
    "multivariate_inconsistency": {
        "scenario_id": "multivariate_inconsistency",
        "scenario_name": "Multivariate Inconsistency",
        "parameter": "humidity",
        "description": "Relative humidity spikes to 99% under direct blistering afternoon heat (34°C) with zero rain or pressure perturbation.",
        "injected_delta": 45.0,
        "fixed_value": 99.0,
        "is_genuine": False
    }
}
