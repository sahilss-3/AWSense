import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Activity } from 'lucide-react';
import { SensorReading } from '../../types';

interface TimeSeriesChartProps {
  data: SensorReading[];
  parameter: 'temperature' | 'pressure' | 'humidity';
  onPointClick?: (point: SensorReading) => void;
  height?: number;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  parameter,
  onPointClick,
  height = 360
}) => {
  const paramConfig = {
    temperature: {
      name: 'Air Temperature',
      unit: '°C',
      dataKey: 'temperature',
      expKey: 'expected_temperature',
      color: '#1F4E79', // Institutional Blue
      expColor: '#5B6573', // Neutral Slate
      domain: ['auto', 'auto'] as [string, string]
    },
    pressure: {
      name: 'Atmospheric Pressure',
      unit: 'hPa',
      dataKey: 'pressure',
      expKey: 'expected_pressure',
      color: '#12355B', // Primary Navy
      expColor: '#5B6573',
      domain: ['auto', 'auto'] as [string, string]
    },
    humidity: {
      name: 'Relative Humidity',
      unit: '%',
      dataKey: 'humidity',
      expKey: 'expected_humidity',
      color: '#1976A8', // Info Blue
      expColor: '#5B6573',
      domain: [0, 105] as [number, number]
    }
  }[parameter];

  const isMultiDay =
    data.length > 1 &&
    new Date(data[data.length - 1].timestamp).getTime() - new Date(data[0].timestamp).getTime() >
      24 * 3600 * 1000;

  const chartData = data.map((d, idx) => {
    let formattedTime = d.timestamp;
    try {
      const dt = new Date(d.timestamp);
      if (isMultiDay) {
        formattedTime = `${dt.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        formattedTime = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      // fallback
    }

    return {
      ...d,
      chartIdx: idx,
      timeLabel: formattedTime,
      observed: d[paramConfig.dataKey as keyof SensorReading] as number | null,
      expected: d[paramConfig.expKey as keyof SensorReading] as number | null,
      isAnom: d.is_anomaly === 1
    };
  });

  return (
    <div className="w-full bg-white rounded-lg border border-[#D9DEE5] p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: paramConfig.color }} />
            <span className="text-xs font-semibold text-[#1F2937]">Raw Observation ({paramConfig.unit})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 border-t-2 border-dashed border-[#5B6573]" />
            <span className="text-xs font-medium text-[#5B6573]">AI Expected Baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#C62828]" />
            <span className="text-xs font-semibold text-[#C62828]">Flagged Anomaly</span>
          </div>
        </div>
        <span className="text-xs font-mono font-medium text-[#5B6573]">
          Observations: {data.length} cycles
        </span>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#5B6573]">
          <Activity className="animate-spin text-[#1F4E79] mb-2" size={24} />
          <p className="text-xs font-semibold text-[#12355B]">Synchronizing telemetry stream...</p>
          <p className="text-[11px] text-[#5B6573] mt-0.5">Fetching active sensor cycles from automated weather station</p>
        </div>
      ) : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#5B6573"
                fontSize={11}
                tickLine={false}
                dy={10}
                minTickGap={30}
              />
            <YAxis
              stroke="#5B6573"
              fontSize={11}
              tickLine={false}
              domain={paramConfig.domain}
              unit={` ${paramConfig.unit}`}
              dx={-5}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload;
                const obsVal = pt.observed !== null ? `${pt.observed} ${paramConfig.unit}` : 'Missing';
                const expVal = pt.expected !== null ? `${pt.expected} ${paramConfig.unit}` : 'N/A';
                const dev =
                  pt.observed !== null && pt.expected !== null
                    ? `${(pt.observed - pt.expected > 0 ? '+' : '')}${(pt.observed - pt.expected).toFixed(2)} ${paramConfig.unit}`
                    : 'N/A';

                return (
                  <div className="rounded-md border border-[#D9DEE5] bg-white p-3 shadow-lg text-xs font-sans text-[#1F2937]">
                    <div className="font-mono font-semibold text-[#12355B] pb-1.5 border-b border-[#E5E7EB] flex justify-between gap-4">
                      <span>Timestamp: {label}</span>
                      {pt.isAnom && (
                        <span className="text-[#C62828] font-bold uppercase tracking-wider bg-[#FFEBEE] px-1.5 py-0.5 rounded border border-[#FFCDD2]">
                          Anomaly Flag
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between gap-6">
                        <span className="text-[#5B6573]">Raw Observed:</span>
                        <span className="font-mono font-bold text-[#1F2937]">{obsVal}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-[#5B6573]">AI Expected:</span>
                        <span className="font-mono font-medium text-[#1F4E79]">{expVal}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-[#5B6573]">Deviation:</span>
                        <span className={`font-mono font-bold ${pt.isAnom ? 'text-[#C62828]' : 'text-[#1F2937]'}`}>
                          {dev}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {/* AI Expected curve */}
            <Line
              type="monotone"
              dataKey="expected"
              stroke="#5B6573"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
            {/* Raw Observation line */}
            <Line
              type="monotone"
              dataKey="observed"
              stroke={paramConfig.color}
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!payload || !cx || !cy) return null;
                if (payload.isAnom) {
                  return (
                    <circle
                      key={`dot-${payload.timestamp}`}
                      cx={cx}
                      cy={cy}
                      r={5.5}
                      fill="#C62828"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      className="cursor-pointer"
                      onClick={() => onPointClick && onPointClick(payload)}
                    />
                  );
                }
                return null;
              }}
              activeDot={{ r: 4.5, fill: paramConfig.color, stroke: '#FFFFFF', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
};
