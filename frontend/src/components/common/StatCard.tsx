import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  borderAccent?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  delta,
  deltaType = 'neutral',
  icon,
  borderAccent
}) => {
  return (
    <div className={`relative rounded-lg border border-[#D9DEE5] bg-white p-4 shadow-card hover:border-[#1F4E79] transition-all`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6573]">{title}</span>
        <div className="rounded p-1.5 bg-[#EBF3FA] text-[#12355B] border border-[#D9DEE5]/60">
          {icon}
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-bold font-mono text-[#1F2937] tracking-tight">{value}</span>
        {delta && (
          <span
            className={`text-xs font-semibold ${
              deltaType === 'positive'
                ? 'text-[#198754]'
                : deltaType === 'negative'
                ? 'text-[#C62828]'
                : 'text-[#5B6573]'
            }`}
          >
            {delta}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-[#5B6573] leading-snug">{subtitle}</p>}
    </div>
  );
};
