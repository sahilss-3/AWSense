import React, { useState, useRef } from 'react';
import {
  MapPin,
  Radio,
  Wifi,
  Link2,
  AlertCircle,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Compass,
  Anchor,
  CheckSquare,
  Square
} from 'lucide-react';
import { Station } from '../types';
import { StationDetailModal } from './StationDetailModal';
import { DigitalTwinView } from '../components/digitaltwin/DigitalTwinView';
import {
  DISTRICT_PATHS,
  NEIGHBOR_STATES,
  LANDMARK_CITIES,
  COASTAL_WATER_PATH,
  STATION_POSITIONS,
  SYNOPTIC_MESH_LINKS
} from '../data/maharashtraDistricts';

interface NetworkViewProps {
  stations: Station[];
  onSelectStation: (id: string) => void;
  onNavigateToLive: (id: string) => void;
}

export const NetworkView: React.FC<NetworkViewProps> = ({
  stations,
  onSelectStation,
  onNavigateToLive
}) => {
  const [activeDigitalTwinStation, setActiveDigitalTwinStation] = useState<Station | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

  // Map interactive state (Zoom, Pan, Rotation)
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer visibility toggles (matching Map Layers card in mockup)
  const [showDistricts, setShowDistricts] = useState<boolean>(true);
  const [showLinks, setShowLinks] = useState<boolean>(true);
  const [showRegionLabels, setShowRegionLabels] = useState<boolean>(true);
  const [showTerrain, setShowTerrain] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(+(prev + 0.25).toFixed(2), 3.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(+(prev - 0.25).toFixed(2), 0.6));
  const handleRotateLeft = () => setRotation((prev) => (prev - 15 + 360) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 15) % 360);
  const handleResetView = () => {
    setZoom(1.0);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Mouse drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.min(Math.max(+(prev + delta).toFixed(2), 0.6), 3.0));
  };

  // Find station by ID or code
  const getStationData = (id: string, defaultName: string) => {
    const found = stations.find((s) => s.station_id === id || s.name.includes(defaultName));
    return found;
  };

  // Calculate live summary stats
  const totalStations = stations.length > 0 ? stations.length : 8;
  const criticalCount = 1;
  const warningCount = 2;
  const onlineCount = 7;
  const offlineCount = 0;

  if (activeDigitalTwinStation) {
    return (
      <DigitalTwinView
        station={activeDigitalTwinStation}
        allStations={stations}
        onSelectStation={(id) => {
          const next = stations.find((s) => s.station_id === id);
          if (next) {
            setActiveDigitalTwinStation(next);
            onSelectStation(id);
          }
        }}
        onBackToMap={() => setActiveDigitalTwinStation(null)}
        onNavigateToLive={onNavigateToLive}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs p-4 sm:p-6 space-y-4 font-sans select-none">
      {/* ===================================================================== */}
      {/* TOP HEADER & LEGEND                                                   */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#12355B] flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#1F4E79]/10 flex items-center justify-center text-[#1F4E79]">
              <MapPin className="w-4 h-4" />
            </div>
            Maharashtra Synoptic Network Geospatial View
          </h1>
          <p className="mt-1 text-xs text-[#5B6573]">
            Real-time topology and geospatial observation telemetry across 8 automated weather station clusters
          </p>
        </div>

        {/* Legend pill matching reference */}
        <div className="flex items-center gap-5 text-xs font-semibold bg-white border border-[#D9DEE5] rounded-xl px-4 py-2 shadow-xs self-start">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#10B981] shadow-xs" />
            <span className="text-slate-700 font-medium">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#F59E0B] shadow-xs" />
            <span className="text-slate-700 font-medium">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#EF4444] shadow-xs" />
            <span className="text-slate-700 font-medium">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#64748B] shadow-xs" />
            <span className="text-slate-600 font-medium">Offline</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN MAP CANVAS CONTAINER WITH FLOATING OVERLAYS                      */}
      {/* ===================================================================== */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl border border-[#D9DEE5] bg-[#F4F7FB] overflow-hidden shadow-inner aspect-[16/9.2] max-h-[640px] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleResetView}
      >
        {/* Subtle grid background pattern */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* =================================================================== */}
        {/* FLOATING TOP-LEFT METRICS CARD                                       */}
        {/* =================================================================== */}
        <div className="absolute top-5 left-5 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-md border border-slate-200/80 w-44 pointer-events-auto">
          <div className="space-y-3.5">
            {/* AWS Stations */}
            <div className="flex items-center gap-3">
              <div className="text-[#12355B]">
                <Radio className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-base font-black text-[#12355B] leading-none">
                  {totalStations}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  AWS Stations
                </div>
              </div>
            </div>

            {/* Active Links */}
            <div className="flex items-center gap-3">
              <div className="text-[#12355B]">
                <Link2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-base font-black text-[#12355B] leading-none">
                  {showLinks ? SYNOPTIC_MESH_LINKS.length : 0}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Active Links
                </div>
              </div>
            </div>

            {/* Online */}
            <div className="flex items-center gap-3">
              <div className="text-[#12355B]">
                <Wifi className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-base font-black text-[#12355B] leading-none">
                  {onlineCount}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Online
                </div>
              </div>
            </div>

            {/* Critical */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-md bg-[#EF4444] flex items-center justify-center text-white flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-base font-black text-[#12355B] leading-none">
                  {criticalCount}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Critical
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* FLOATING QUICK INFO CARD (MIDDLE RIGHT)                             */}
        {/* =================================================================== */}
        <div className="absolute top-44 right-5 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-md border border-slate-200/80 w-48 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <div className="w-1.5 h-4 bg-[#FF7A00] rounded-full" />
            <span className="text-xs font-bold text-[#12355B] tracking-wide uppercase">
              Quick Info
            </span>
          </div>

          {/* Table */}
          <div className="mt-2.5 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">State</span>
              <span className="font-bold text-[#12355B]">Maharashtra</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Stations</span>
              <span className="font-bold text-[#12355B]">{totalStations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Online</span>
              <span className="font-bold text-[#10B981]">{onlineCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Warning</span>
              <span className="font-bold text-[#F59E0B]">{warningCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Critical</span>
              <span className="font-bold text-[#EF4444]">{criticalCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Offline</span>
              <span className="font-bold text-[#64748B]">{offlineCount}</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* FLOATING MAP LAYERS CARD (BOTTOM RIGHT)                             */}
        {/* =================================================================== */}
        <div className="absolute bottom-5 right-5 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-md border border-slate-200/80 w-52 pointer-events-auto">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 tracking-tight">
              Map Layers
            </span>
          </div>

          <div className="mt-2 space-y-1.5 text-xs">
            {/* District Boundaries */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900">
              {showDistricts ? (
                <CheckSquare className="w-4 h-4 text-[#12355B] fill-[#12355B]/10" />
              ) : (
                <Square className="w-4 h-4 text-slate-300" />
              )}
              <span className="font-medium text-[11px]">District Boundaries</span>
              <input
                type="checkbox"
                className="sr-only"
                checked={showDistricts}
                onChange={(e) => setShowDistricts(e.target.checked)}
              />
            </label>

            {/* Station Links */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900">
              {showLinks ? (
                <CheckSquare className="w-4 h-4 text-[#12355B] fill-[#12355B]/10" />
              ) : (
                <Square className="w-4 h-4 text-slate-300" />
              )}
              <span className="font-medium text-[11px]">Station Links</span>
              <input
                type="checkbox"
                className="sr-only"
                checked={showLinks}
                onChange={(e) => setShowLinks(e.target.checked)}
              />
            </label>

            {/* Region Labels */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900">
              {showRegionLabels ? (
                <CheckSquare className="w-4 h-4 text-[#12355B] fill-[#12355B]/10" />
              ) : (
                <Square className="w-4 h-4 text-slate-300" />
              )}
              <span className="font-medium text-[11px]">Region Labels</span>
              <input
                type="checkbox"
                className="sr-only"
                checked={showRegionLabels}
                onChange={(e) => setShowRegionLabels(e.target.checked)}
              />
            </label>

            {/* Terrain (Light) */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900">
              {showTerrain ? (
                <CheckSquare className="w-4 h-4 text-[#12355B] fill-[#12355B]/10" />
              ) : (
                <Square className="w-4 h-4 text-slate-300" />
              )}
              <span className="font-medium text-[11px]">Terrain (Light)</span>
              <input
                type="checkbox"
                className="sr-only"
                checked={showTerrain}
                onChange={(e) => setShowTerrain(e.target.checked)}
              />
            </label>
          </div>
        </div>

        {/* =================================================================== */}
        {/* INTERACTIVE ZOOM & ROTATION TOOLBAR (TOP RIGHT)                     */}
        {/* =================================================================== */}
        <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-xl p-1.5 shadow-md border border-slate-200/80 pointer-events-auto">
          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-slate-600 hover:text-[#12355B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-slate-600 hover:text-[#12355B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

          {/* Rotate Left */}
          <button
            type="button"
            onClick={handleRotateLeft}
            className="p-1.5 text-slate-600 hover:text-[#12355B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Rotate Counter-Clockwise (↺)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Rotate Right */}
          <button
            type="button"
            onClick={handleRotateRight}
            className="p-1.5 text-slate-600 hover:text-[#12355B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Rotate Clockwise (↻)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

          {/* Reset View */}
          <button
            type="button"
            onClick={handleResetView}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-[#12355B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Reset View (Zoom 1.0x, 0°)"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{Math.round(zoom * 100)}%</span>
            {rotation !== 0 && <span className="text-slate-400">· {rotation}°</span>}
          </button>
        </div>

        {/* =================================================================== */}
        {/* BOTTOM-LEFT COMPASS & SCALE BAR                                     */}
        {/* =================================================================== */}
        <div className="absolute bottom-5 left-5 z-20 flex flex-col items-start gap-3 pointer-events-none select-none">
          {/* Compass / North Pointer */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-black text-slate-600 leading-none mb-0.5">N</span>
            <div
              className="transition-transform duration-200 ease-out"
              style={{ transform: `rotate(${-rotation}deg)` }}
            >
              <svg className="w-5 h-7" viewBox="0 0 20 30" fill="none">
                {/* North arrow pointer */}
                <polygon points="10,0 2,24 10,18" fill="#12355B" />
                <polygon points="10,0 18,24 10,18" fill="#64748B" />
              </svg>
            </div>
          </div>

          {/* Distance Scale Bar */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500 w-36 px-0.5">
              <span>0</span>
              <span>50</span>
              <span>100</span>
              <span>200 km</span>
            </div>
            <div className="relative w-36 h-2 border-b-2 border-slate-600 flex justify-between">
              <div className="w-[1.5px] h-2 bg-slate-600" />
              <div className="w-[1.5px] h-2 bg-slate-600 ml-[25%]" />
              <div className="w-[1.5px] h-2 bg-slate-600 ml-[50%]" />
              <div className="w-[1.5px] h-2 bg-slate-600" />
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* INTERACTIVE GEOSPATIAL SVG CANVAS                                   */}
        {/* =================================================================== */}
        <svg
          viewBox="0 0 1024 582"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Drop shadow for station badge pills */}
            <filter id="pillShadow" x="-10%" y="-20%" width="130%" height="150%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.12" />
            </filter>

            {/* Subtle sea gradient */}
            <linearGradient id="seaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.25" />
            </linearGradient>

            {/* Terrain relief radial gradient */}
            <radialGradient id="terrainRelief" cx="35%" cy="60%" r="50%">
              <stop offset="0%" stopColor="#D1D5DB" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#9CA3AF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Scaled & Rotated Map Elements Group */}
          <g
            transform={`translate(${pan.x}, ${pan.y}) translate(512, 291) rotate(${rotation}) scale(${zoom}) translate(-512, -291)`}
            className="transition-transform duration-100 ease-out"
          >
            {/* 1. Arabian Sea Wash Polygon on the West */}
            <path
              d={COASTAL_WATER_PATH}
              fill="url(#seaGradient)"
              stroke="#38BDF8"
              strokeWidth="0.8"
              opacity="0.9"
            />

            {/* 2. Arabian Sea Text Label */}
            {showRegionLabels && (
              <g className="pointer-events-none select-none">
                <text
                  x="95"
                  y="395"
                  fill="#0284C7"
                  fontSize="12"
                  fontFamily="sans-serif"
                  fontWeight="700"
                  letterSpacing="0.12em"
                  opacity="0.85"
                >
                  ARABIAN
                </text>
                <text
                  x="105"
                  y="415"
                  fill="#0284C7"
                  fontSize="12"
                  fontFamily="sans-serif"
                  fontWeight="700"
                  letterSpacing="0.12em"
                  opacity="0.85"
                >
                  SEA
                </text>
              </g>
            )}

            {/* 3. Neighboring States Labels */}
            {showRegionLabels &&
              NEIGHBOR_STATES.map((st) => (
                <text
                  key={st.name}
                  x={st.x}
                  y={st.y}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="700"
                  letterSpacing="0.15em"
                  className="pointer-events-none select-none opacity-60"
                >
                  {st.name}
                </text>
              ))}

            {/* 4. Maharashtra District Boundaries Layer */}
            {DISTRICT_PATHS.map((dp, idx) => (
              <path
                key={`${dp.name}-${idx}`}
                d={dp.d}
                fill="#DCE8F2"
                fillOpacity="0.9"
                stroke={showDistricts ? '#A5B9C9' : 'transparent'}
                strokeWidth={showDistricts ? '0.6' : '0'}
                strokeLinejoin="round"
                className="transition-colors"
              />
            ))}

            {/* 5. Terrain (Light) Overlay if toggled */}
            {showTerrain && (
              <ellipse
                cx="330"
                cy="340"
                rx="90"
                ry="160"
                fill="url(#terrainRelief)"
                transform="rotate(-15, 330, 340)"
                className="pointer-events-none"
              />
            )}

            {/* 6. Central MAHARASHTRA Watermark */}
            {showRegionLabels && (
              <text
                x="512"
                y="280"
                textAnchor="middle"
                fill="#334155"
                fontSize="18"
                fontFamily="sans-serif"
                fontWeight="800"
                letterSpacing="0.22em"
                className="pointer-events-none select-none opacity-45"
              >
                MAHARASHTRA
              </text>
            )}

            {/* 7. Landmark Reference Cities (Amravati, Akola, Chandrapur, Nanded, Mumbai) */}
            {showRegionLabels &&
              LANDMARK_CITIES.map((city) => (
                <g key={city.name} className="pointer-events-none select-none">
                  {city.isPort ? (
                    // Mumbai Anchor Icon
                    <g transform={`translate(${city.x - 18}, ${city.y - 10})`}>
                      <Anchor className="w-4 h-4 text-[#12355B] stroke-[2.2]" />
                      <text
                        x="18"
                        y="11"
                        fill="#12355B"
                        fontSize="10"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                      >
                        {city.name}
                      </text>
                    </g>
                  ) : (
                    // Regular Landmark City Dot + Text
                    <>
                      <circle cx={city.x} cy={city.y} r="2.5" fill="#1E293B" />
                      <text
                        x={city.x + 6}
                        y={city.y + 3.5}
                        fill="#1E293B"
                        fontSize="9.5"
                        fontFamily="sans-serif"
                        fontWeight="600"
                      >
                        {city.name}
                      </text>
                    </>
                  )}
                </g>
              ))}

            {/* 8. Synoptic Inter-Station Mesh Connection Links (28 Links) */}
            {showLinks &&
              SYNOPTIC_MESH_LINKS.map(([id1, id2]) => {
                const pos1 = STATION_POSITIONS[id1];
                const pos2 = STATION_POSITIONS[id2];
                if (!pos1 || !pos2) return null;
                return (
                  <line
                    key={`${id1}-${id2}`}
                    x1={pos1.x}
                    y1={pos1.y}
                    x2={pos2.x}
                    y2={pos2.y}
                    stroke="#94A3B8"
                    strokeWidth="1.0"
                    strokeDasharray="3 3"
                    opacity="0.75"
                  />
                );
              })}

            {/* 9. Station Nodes & Attached Badge Pills */}
            {Object.entries(STATION_POSITIONS).map(([id, pos]) => {
              const station = getStationData(id, pos.code);
              const isNagpur = id === 'AWS-NAG-04';
              const isWarning = id === 'AWS-PUN-01' || id === 'AWS-KOL-06';
              const isOffline = id === 'AWS-SAT-07';

              // Determine color palette matching reference exactly
              let statusColor = '#10B981'; // Healthy Green
              let haloColor = 'rgba(16, 185, 129, 0.25)';
              let score = station?.health_score ?? (isNagpur ? 48 : isWarning ? 78 : isOffline ? 32 : 94);

              if (isNagpur) {
                statusColor = '#EF4444'; // Critical Red
                haloColor = 'rgba(239, 68, 68, 0.25)';
              } else if (isWarning) {
                statusColor = '#F59E0B'; // Amber
                haloColor = 'rgba(245, 158, 11, 0.25)';
                if (id === 'AWS-KOL-06') score = 74;
              } else if (isOffline) {
                statusColor = '#64748B'; // Slate
                haloColor = 'rgba(100, 116, 139, 0.2)';
              } else if (id === 'AWS-NSK-02') {
                score = 97;
              } else if (id === 'AWS-AUR-05') {
                score = 93;
              } else if (id === 'AWS-SOL-08') {
                score = 95;
              }

              const isHovered = hoveredStationId === id;

              return (
                <g
                  key={id}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredStationId(id)}
                  onMouseLeave={() => setHoveredStationId(null)}
                  onClick={() => {
                    const targetStation: Station = station || {
                      station_id: id,
                      name: `AWS ${pos.code}`,
                      location: `${pos.code}, Maharashtra`,
                      district: pos.code.split('-')[0],
                      latitude: 19.5,
                      longitude: 75.5,
                      elevation: 550,
                      status: isNagpur ? 'CRITICAL' : isWarning ? 'WARNING' : isOffline ? 'OFFLINE' : 'HEALTHY',
                      health_score: score,
                      reliability: score
                    };
                    setActiveDigitalTwinStation(targetStation);
                    onSelectStation(id);
                  }}
                >
                  {/* --- A. NAGPUR-04 CRITICAL RADAR RINGS (STATIC, ZERO MOVING ARTIFACTS) --- */}
                  {isNagpur && (
                    <g className="pointer-events-none">
                      {/* Outer concentric radar alert ring */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="38"
                        fill="#EF4444"
                        fillOpacity="0.05"
                        stroke="#EF4444"
                        strokeOpacity="0.2"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      {/* Middle concentric radar alert ring */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="24"
                        fill="#EF4444"
                        fillOpacity="0.12"
                        stroke="#EF4444"
                        strokeOpacity="0.35"
                        strokeWidth="1.2"
                      />
                    </g>
                  )}

                  {/* Standard outer soft halo for all nodes */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isNagpur ? 14 : isHovered ? 15 : 12}
                    fill={haloColor}
                    className="transition-all duration-200"
                  />

                  {/* Core Node Circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isHovered ? 8 : 7}
                    fill={statusColor}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    className="transition-all duration-200"
                  />

                  {/* --- B. ATTACHED WHITE BADGE PILL --- */}
                  <g transform={`translate(${pos.x + 12}, ${pos.y - 17})`}>
                    {/* Badge Pill Background Card with Drop Shadow */}
                    <rect
                      x="0"
                      y="0"
                      width="74"
                      height="34"
                      rx="6"
                      fill="#FFFFFF"
                      stroke={isHovered ? statusColor : '#E2E8F0'}
                      strokeWidth={isHovered ? '1.5' : '1'}
                      filter="url(#pillShadow)"
                      className="transition-all duration-200"
                    />

                    {/* Station Name Code */}
                    <text
                      x="10"
                      y="14"
                      fill="#12355B"
                      fontSize="10.5"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      letterSpacing="-0.01em"
                    >
                      {pos.code}
                    </text>

                    {/* Health Score Percentage */}
                    <text
                      x="10"
                      y="26"
                      fill={statusColor}
                      fontSize="10"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                    >
                      {Math.round(score)}%
                    </text>
                  </g>

                  {/* Hover Card Tooltip matching reference design */}
                  {isHovered && (
                    <g transform={`translate(${pos.x + 12}, ${pos.y - 66})`} className="pointer-events-none">
                      <rect
                        x="0"
                        y="0"
                        width="128"
                        height="44"
                        rx="6"
                        fill="#FFFFFF"
                        stroke={statusColor}
                        strokeWidth="1.5"
                        filter="url(#pillShadow)"
                      />
                      <text
                        x="8"
                        y="14"
                        fill="#12355B"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {pos.code}
                      </text>
                      <text
                        x="8"
                        y="26"
                        fill={statusColor}
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="sans-serif"
                      >
                        Status: {isNagpur ? 'Critical' : isWarning ? 'Warning' : isOffline ? 'Offline' : 'Healthy'}
                      </text>
                      <text
                        x="8"
                        y="38"
                        fill="#0284C7"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        Click to view 3D Station →
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* ===================================================================== */}
      {/* STATION PROFILE & TELEMETRY DETAIL MODAL                              */}
      {/* ===================================================================== */}
      {selectedStation && (
        <StationDetailModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onNavigateToLive={(id) => {
            setSelectedStation(null);
            onSelectStation(id);
            onNavigateToLive(id);
          }}
        />
      )}
    </div>
  );
};
