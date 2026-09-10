import React from 'react';
import {
  Thermometer,
  Gauge,
  Droplets,
  Wind,
  Compass,
  Sun,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Station, SensorReading, Anomaly, SensorHealth } from '../../types';

export interface SensorPinInfo {
  id: string;
  name: string;
  category: string;
  value: string;
  unit: string;
  status: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
  isAnomaly: boolean;
  healthScore: number;
}

interface SensorPinsOverlayProps {
  screenPositions: Record<string, { x: number; y: number; visible: boolean }>;
  activeSensorId: string;
  onSelectSensor: (id: string) => void;
  hoveredSensorId: string | null;
  onHoverSensor: (id: string | null) => void;
  pinsData: Record<string, SensorPinInfo>;
  showSensorLabels?: boolean;
}

export const SensorPinsOverlay: React.FC<SensorPinsOverlayProps> = ({
  screenPositions,
  activeSensorId,
  onSelectSensor,
  hoveredSensorId,
  onHoverSensor,
  pinsData,
  showSensorLabels = false
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10">
      {/* Minimal sleek hover tooltip when Sensor Labels are OFF */}
      {!showSensorLabels && hoveredSensorId && screenPositions[hoveredSensorId]?.visible && pinsData[hoveredSensorId] && (
        <div
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded-lg bg-[#0F172A]/90 backdrop-blur-md border border-white/20 text-white shadow-xl flex items-center gap-2 z-30 transition-all"
          style={{
            left: `${screenPositions[hoveredSensorId].x}px`,
            top: `${screenPositions[hoveredSensorId].y - 10}px`
          }}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              pinsData[hoveredSensorId].isAnomaly
                ? 'bg-[#EF4444] animate-ping'
                : pinsData[hoveredSensorId].status === 'Warning'
                ? 'bg-[#F59E0B]'
                : 'bg-[#10B981]'
            }`}
          />
          <span className="text-xs font-bold font-sans">{pinsData[hoveredSensorId].name}</span>
          <span className="text-[10px] text-slate-300 font-mono font-semibold">
            ({pinsData[hoveredSensorId].value})
          </span>
        </div>
      )}

      {/* Full floating callout cards and leader lines when Sensor Labels are ON */}
      {showSensorLabels && Object.entries(screenPositions).map(([id, pos]) => {
        if (!pos.visible) return null;

        const pin = pinsData[id];
        if (!pin) return null;

        const isSelected = activeSensorId === id;
        const isHovered = hoveredSensorId === id;
        const isCritical = pin.status === 'Critical' || pin.isAnomaly;
        const isWarning = pin.status === 'Warning';
        const isOffline = pin.status === 'Offline';

        // Styling based on status matching reference
        let badgeBg = 'bg-[#0F172A]/85 hover:bg-[#0F172A]/95 text-white border-white/20';
        let dotColor = 'bg-[#10B981]'; // Healthy green
        let lineStroke = '#10B981';
        let statusLabel = 'Healthy';

        if (isCritical) {
          badgeBg = 'bg-[#7F1D1D]/90 hover:bg-[#991B1B]/95 text-white border-[#EF4444] shadow-lg shadow-[#EF4444]/20';
          dotColor = 'bg-[#EF4444] animate-ping';
          lineStroke = '#EF4444';
          statusLabel = 'Critical Anomaly';
        } else if (isWarning) {
          badgeBg = 'bg-[#78350F]/90 hover:bg-[#92400E]/95 text-white border-[#F59E0B]';
          dotColor = 'bg-[#F59E0B]';
          lineStroke = '#F59E0B';
          statusLabel = 'Warning';
        } else if (isOffline) {
          badgeBg = 'bg-[#334155]/85 hover:bg-[#475569]/95 text-[#CBD5E1] border-slate-500';
          dotColor = 'bg-[#94A3B8]';
          lineStroke = '#94A3B8';
          statusLabel = 'Offline';
        }

        // Leader line offset based on sensor side
        const isLeftSide = pos.x < 350;
        const pillOffsetX = isLeftSide ? -180 : 25;
        const pillOffsetY = -30;

        return (
          <div
            key={id}
            className="absolute transition-transform duration-75 ease-out"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`
            }}
          >
            {/* 3D Anchor Indicator Dot */}
            <div className="relative -left-2 -top-2 w-4 h-4 pointer-events-auto cursor-pointer flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full ${isCritical ? 'bg-[#EF4444]' : isWarning ? 'bg-[#F59E0B]' : 'bg-[#10B981]'} border-2 border-white shadow-md`} />
              {isCritical && (
                <div className="absolute w-5 h-5 rounded-full bg-[#EF4444]/40 animate-ping" />
              )}
            </div>

            {/* Connecting Leader Line SVG */}
            <svg
              className="absolute pointer-events-none"
              style={{
                left: isLeftSide ? pillOffsetX + 170 : 0,
                top: Math.min(0, pillOffsetY),
                width: '100px',
                height: '40px',
                overflow: 'visible'
              }}
            >
              <line
                x1={isLeftSide ? 10 : 0}
                y1={isLeftSide ? 30 : 0}
                x2={isLeftSide ? -60 : 25}
                y2={pillOffsetY + 15}
                stroke={lineStroke}
                strokeWidth={isSelected || isHovered ? 2 : 1.2}
                strokeDasharray={isCritical ? 'none' : '3 2'}
                opacity={0.85}
              />
            </svg>

            {/* Interactive Callout Badge Card */}
            <div
              onClick={() => onSelectSensor(id)}
              onMouseEnter={() => onHoverSensor(id)}
              onMouseLeave={() => onHoverSensor(null)}
              className={`absolute pointer-events-auto cursor-pointer rounded-lg px-3 py-1.5 backdrop-blur-md border transition-all duration-200 ${badgeBg} ${
                isSelected ? 'ring-2 ring-white scale-105 shadow-xl' : isHovered ? 'scale-102 shadow-md' : 'shadow-sm'
              }`}
              style={{
                left: `${pillOffsetX}px`,
                top: `${pillOffsetY}px`,
                minWidth: '150px'
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-[#EF4444]' : dotColor}`} />
                  <span className="text-[11px] font-bold tracking-tight">{pin.name}</span>
                </div>
                {isCritical && (
                  <span className="text-[9px] font-black uppercase bg-[#EF4444] text-white px-1.5 py-0.2 rounded">
                    ALERT
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex items-baseline justify-between gap-3">
                <span className={`font-mono text-sm font-bold ${isCritical ? 'text-[#FCA5A5]' : 'text-white'}`}>
                  {pin.value}
                </span>
                <span className={`text-[10px] font-semibold ${isCritical ? 'text-[#FCA5A5]' : isWarning ? 'text-[#FDE68A]' : 'text-[#86EFAC]'}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
