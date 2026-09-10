import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Radio,
  Activity,
  Cpu,
  HeartPulse,
  Wrench,
  Clock,
  Box,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { Station, SensorReading, Anomaly, SensorHealth } from '../../types';
import { Station3DCanvas } from './Station3DCanvas';
import { SensorDetailPanel } from './SensorDetailPanel';
import { SensorPinInfo } from './SensorPinsOverlay';
import { api } from '../../services/api';

interface DigitalTwinViewProps {
  station: Station;
  allStations: Station[];
  onSelectStation: (id: string) => void;
  onBackToMap: () => void;
  onNavigateToLive?: (id: string) => void;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  station,
  allStations,
  onSelectStation,
  onBackToMap,
  onNavigateToLive
}) => {
  const [activeSubNav, setActiveSubNav] = useState<
    '3d_view' | 'live_data' | 'ai_analysis' | 'sensor_health' | 'maintenance' | 'historical_data'
  >('3d_view');

  const [selectedSensorId, setSelectedSensorId] = useState<string>('temperature');
  const [hoveredSensorId, setHoveredSensorId] = useState<string | null>(null);

  // Live telemetry, anomalies and sensor health for selected station
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [healthItems, setHealthItems] = useState<SensorHealth[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStationData = async () => {
    setLoading(true);
    try {
      const [reading, anoms, healthList] = await Promise.all([
        api.getLiveReading(station.station_id).catch(() => null),
        api.getAnomalies({ station_id: station.station_id, limit: 10 }),
        api.getSensorHealth(station.station_id).catch(() => [])
      ]);

      if (reading) setLatestReading(reading);
      setAnomalies(anoms);
      setHealthItems(healthList);

      // Auto-focus on active critical anomaly sensor on initial station load
      const criticalAnom = anoms.find((a) => a.severity === 'Critical' && a.status !== 'Resolved');
      if (criticalAnom) {
        if (criticalAnom.parameter === 'temperature') setSelectedSensorId('temperature');
        else if (criticalAnom.parameter === 'pressure') setSelectedSensorId('pressure');
        else if (criticalAnom.parameter === 'humidity') setSelectedSensorId('humidity');
      }
    } catch (e) {
      console.error('Failed to load station digital twin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStationData();
    const interval = setInterval(fetchStationData, 15000); // 15s sync
    return () => clearInterval(interval);
  }, [station.station_id]);

  // Construct SensorPinInfo map bound to real backend telemetry
  const isTempAnom =
    Boolean(anomalies.find((a) => a.parameter === 'temperature' && a.status !== 'Resolved')) ||
    station.station_id === 'AWS-NAG-04';

  const isPressAnom =
    Boolean(anomalies.find((a) => a.parameter === 'pressure' && a.status !== 'Resolved')) ||
    (station.station_id === 'AWS-NAG-04' && latestReading?.pressure === 978.4);

  const isHumAnom =
    Boolean(anomalies.find((a) => a.parameter === 'humidity' && a.status !== 'Resolved')) ||
    station.station_id === 'AWS-KOL-06';

  const isOffline = station.status === 'OFFLINE';

  const pinsData: Record<string, SensorPinInfo> = {
    wind_speed: {
      id: 'wind_speed',
      name: 'Wind Speed Sensor',
      category: 'Anemometer (3-Cup Rotor)',
      value: '2.4 m/s',
      unit: 'm/s',
      status: isOffline ? 'Offline' : 'Healthy',
      isAnomaly: false,
      healthScore: 98
    },
    wind_direction: {
      id: 'wind_direction',
      name: 'Wind Direction Sensor',
      category: 'Aerodynamic Wind Vane',
      value: '286° (WNW)',
      unit: 'deg',
      status: isOffline ? 'Offline' : 'Healthy',
      isAnomaly: false,
      healthScore: 99
    },
    temperature: {
      id: 'temperature',
      name: 'Temperature Sensor',
      category: 'PT-100 Multi-Plate Radiation Shield',
      value:
        latestReading?.temperature !== null && latestReading?.temperature !== undefined
          ? `${latestReading.temperature.toFixed(1)} °C`
          : isOffline
          ? 'OFFLINE'
          : '31.8 °C',
      unit: '°C',
      status: isOffline ? 'Offline' : isTempAnom ? 'Critical' : 'Healthy',
      isAnomaly: isTempAnom,
      healthScore: station.station_id === 'AWS-NAG-04' ? 46 : station.health_score > 80 ? 96 : 78
    },
    humidity: {
      id: 'humidity',
      name: 'Humidity Sensor',
      category: 'Capacitive Hygrometer',
      value:
        latestReading?.humidity !== null && latestReading?.humidity !== undefined
          ? `${latestReading.humidity.toFixed(1)} %`
          : isOffline
          ? 'OFFLINE'
          : '41.2 %',
      unit: '%',
      status: isOffline ? 'Offline' : isHumAnom ? 'Warning' : 'Healthy',
      isAnomaly: isHumAnom,
      healthScore: station.station_id === 'AWS-KOL-06' ? 62 : 95
    },
    pressure: {
      id: 'pressure',
      name: 'Pressure Sensor',
      category: 'Barometric Port Transducer',
      value:
        latestReading?.pressure !== null && latestReading?.pressure !== undefined
          ? `${latestReading.pressure.toFixed(1)} hPa`
          : isOffline
          ? 'OFFLINE'
          : '1008.6 hPa',
      unit: 'hPa',
      status: isOffline ? 'Offline' : isPressAnom ? 'Warning' : 'Healthy',
      isAnomaly: isPressAnom,
      healthScore: isPressAnom ? 68 : 98
    },
    solar_panel: {
      id: 'solar_panel',
      name: 'Solar Panel',
      category: 'Monocrystalline PV Module',
      value: '24.1 V',
      unit: 'V',
      status: isOffline ? 'Offline' : 'Healthy',
      isAnomaly: false,
      healthScore: 97
    },
    data_logger: {
      id: 'data_logger',
      name: 'Data Logger',
      category: 'ARM Microcontroller & Modems',
      value: isOffline ? 'OFFLINE' : 'Online',
      unit: '',
      status: isOffline ? 'Offline' : 'Healthy',
      isAnomaly: false,
      healthScore: station.health_score
    }
  };

  const selectedSensorPin = pinsData[selectedSensorId] || pinsData['temperature'];
  const activeAnomaly = anomalies.find((a) => a.parameter === selectedSensorId && a.status !== 'Resolved');
  const activeHealth = healthItems.find((h) => h.sensor_parameter === selectedSensorId);

  return (
    <div className="space-y-4 font-sans select-none animate-fadeIn">
      {/* =================================================================== */}
      {/* TOP BAR: STATION TITLE, STATUS & BACK TO MAP BUTTON                  */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#D9DEE5] rounded-xl bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMap}
            className="flex items-center gap-1.5 rounded-lg border border-[#D9DEE5] bg-[#F8FAFC] hover:bg-[#EBF3FA] hover:border-[#1F4E79] px-3 py-2 text-xs font-semibold text-[#12355B] transition-all shadow-xs"
            title="Return to Maharashtra Synoptic Map"
          >
            <ArrowLeft size={14} className="text-[#1F4E79]" />
            <span>Back to Network Map</span>
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold font-sans text-[#12355B] tracking-tight">
                {station.name}
              </h1>
              <span
                className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  station.status === 'CRITICAL'
                    ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
                    : station.status === 'WARNING'
                    ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]'
                    : station.status === 'OFFLINE'
                    ? 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'
                    : 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]'
                }`}
              >
                {station.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#5B6573]">
              Live station view with sensor data, AI diagnostics and system health
            </p>
          </div>
        </div>

        {/* Station Selector Dropdown & Live Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#F4F6F8] border border-[#D9DEE5] rounded-lg px-3 py-1.5 text-xs">
            <Radio size={14} className="text-[#1F4E79]" />
            <select
              value={station.station_id}
              onChange={(e) => onSelectStation(e.target.value)}
              className="bg-transparent text-[#1F2937] font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {allStations.map((s) => (
                <option key={s.station_id} value={s.station_id} className="bg-white">
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchStationData}
            className="rounded-lg border border-[#D9DEE5] bg-white p-2 text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B] transition-colors shadow-xs"
            title="Refresh digital twin stream"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MAIN DIGITAL TWIN VIEWPORT LAYOUT (Matches reference image)          */}
      {/* =================================================================== */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* LEFT SUB-NAVIGATION COLUMN (Matches reference left tab menu) */}
        <div className="w-full lg:w-48 flex lg:flex-col gap-1.5 bg-white rounded-xl border border-[#D9DEE5] p-2 shadow-card shrink-0">
          <button
            onClick={() => setActiveSubNav('3d_view')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubNav === '3d_view'
                ? 'bg-[#1D4ED8] text-white shadow-sm'
                : 'text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B]'
            }`}
          >
            <Box size={16} />
            <span>3D Station View</span>
          </button>

          <button
            onClick={() => {
              if (onNavigateToLive) onNavigateToLive(station.station_id);
              else setActiveSubNav('live_data');
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubNav === 'live_data'
                ? 'bg-[#1D4ED8] text-white shadow-sm'
                : 'text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B]'
            }`}
          >
            <Activity size={16} />
            <span>Live Data</span>
          </button>

          <button
            onClick={() => setActiveSubNav('ai_analysis')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubNav === 'ai_analysis'
                ? 'bg-[#1D4ED8] text-white shadow-sm'
                : 'text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B]'
            }`}
          >
            <Cpu size={16} />
            <span>AI Analysis</span>
          </button>

          <button
            onClick={() => setActiveSubNav('sensor_health')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubNav === 'sensor_health'
                ? 'bg-[#1D4ED8] text-white shadow-sm'
                : 'text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B]'
            }`}
          >
            <HeartPulse size={16} />
            <span>Sensor Health</span>
          </button>

          <button
            onClick={() => setActiveSubNav('maintenance')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubNav === 'maintenance'
                ? 'bg-[#1D4ED8] text-white shadow-sm'
                : 'text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B]'
            }`}
          >
            <Wrench size={16} />
            <span>Maintenance</span>
          </button>

          <button
            onClick={() => setActiveSubNav('historical_data')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubNav === 'historical_data'
                ? 'bg-[#1D4ED8] text-white shadow-sm'
                : 'text-[#5B6573] hover:bg-[#F4F6F8] hover:text-[#12355B]'
            }`}
          >
            <Clock size={16} />
            <span>Historical Data</span>
          </button>
        </div>

        {/* CENTER: 3D STATION DIGITAL TWIN CANVAS */}
        <div className="flex-1 w-full">
          <Station3DCanvas
            selectedSensorId={selectedSensorId}
            onSelectSensor={setSelectedSensorId}
            hoveredSensorId={hoveredSensorId}
            onHoverSensor={setHoveredSensorId}
            pinsData={pinsData}
            isAnomalyActive={isTempAnom}
            windSpeedVal={2.4}
          />
        </div>

        {/* RIGHT: DETAILED SENSOR INFORMATION PANEL */}
        <SensorDetailPanel
          selectedSensor={selectedSensorPin}
          anomaly={activeAnomaly}
          health={activeHealth}
          allSensors={pinsData}
          onSelectSensor={setSelectedSensorId}
          stationName={station.name}
          stationStatus={station.status}
        />
      </div>
    </div>
  );
};
