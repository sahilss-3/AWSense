import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export const ReliabilityChart: React.FC<{ reliability: number }> = ({ reliability }) => {
  const hours = 24;
  const data = Array.from({ length: hours }, (_, i) => {
    const h = (i + 1) % 24;
    const timeLabel = `${h.toString().padStart(2, '0')}:00`;
    const noise = Math.sin(i * 0.8) * 1.0 + (i === 18 ? -2.5 : 0);
    const val = Math.max(88, Math.min(100, reliability + noise));
    return {
      time: timeLabel,
      reliability: parseFloat(val.toFixed(1))
    };
  });

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="relGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1F4E79" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#1F4E79" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="time" stroke="#5B6573" fontSize={10} tickLine={false} />
          <YAxis stroke="#5B6573" fontSize={10} domain={[85, 100]} unit="%" tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D9DEE5', borderRadius: '6px', fontSize: '11px', color: '#1F2937' }}
          />
          <Area
            type="monotone"
            dataKey="reliability"
            name="Network Reliability"
            stroke="#1F4E79"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#relGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
