import React from 'react';

interface ContributionBarProps {
  label: string;
  percentage: number;
  description?: string;
  colorType?: 'danger' | 'warning' | 'info' | 'success';
}

export const ContributionBar: React.FC<ContributionBarProps> = ({
  label,
  percentage,
  description,
  colorType = 'danger'
}) => {
  const clamped = Math.max(0, Math.min(100, percentage));

  let barBg = 'bg-[#1F4E79]';
  if (colorType === 'danger') {
    barBg = clamped > 70 ? 'bg-[#C62828]' : clamped > 40 ? 'bg-[#D99A00]' : 'bg-[#1F4E79]';
  } else if (colorType === 'warning') {
    barBg = 'bg-[#D99A00]';
  } else if (colorType === 'success') {
    barBg = 'bg-[#198754]';
  }

  return (
    <div className="space-y-1 py-1">
      <div className="flex items-center justify-between text-xs font-sans">
        <span className="font-semibold text-[#1F2937]">{label}</span>
        <span className="font-mono font-bold text-[#12355B]">{clamped.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-[#E5E7EB] border border-[#D9DEE5]">
        <div
          className={`h-full rounded transition-all duration-500 ease-out ${barBg}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {description && (
        <p className="text-[11px] text-[#5B6573] leading-tight font-sans">{description}</p>
      )}
    </div>
  );
};
