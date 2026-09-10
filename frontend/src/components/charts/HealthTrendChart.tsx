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

interface HealthTrendChartProps {
  healthScore: number;
  failureRisk: number;
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({ healthScore, failureRisk }) => {
  // Generate 14-day progressive degradation trend
  const days = 14;
  const data = Array.from({ length: days }, (_, i) => {
    const dayOffset = days - 1 - i;
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dateLabel = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const deltaH = (100 - healthScore) * (i / days);
    const deltaR = failureRisk * (i / days);
    const simulatedH = Math.min(100, Math.max(20, Math.round(100 - deltaH + (Math.sin(i) * 1.5))));
    const simulatedRisk = Math.min(95, Math.max(5, Math.round(deltaR * 0.7 + (Math.cos(i) * 1.2))));

    return {
      date: dateLabel,
      health: simulatedH,
      risk: simulatedRisk
    };
  });

  return (
    <div className="w-full h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#198754" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#198754" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C62828" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#C62828" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="date" stroke="#5B6573" fontSize={10} tickLine={false} />
          <YAxis stroke="#5B6573" fontSize={10} domain={[0, 100]} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D9DEE5', borderRadius: '6px', fontSize: '11px', color: '#1F2937' }}
          />
          <Area
            type="monotone"
            dataKey="health"
            name="Health Score"
            stroke="#198754"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#healthGrad)"
          />
          <Area
            type="monotone"
            dataKey="risk"
            name="Failure Risk %"
            stroke="#C62828"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#riskGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
