import React from 'react';
import { StationStatus } from '../../types';

interface StatusBadgeProps {
  status: StationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();
  
  let bg = 'bg-[#F1F3F5] text-[#5B6573] border-[#D9DEE5]';
  let dot = 'bg-[#5B6573]';

  if (normalized === 'HEALTHY' || normalized === 'ONLINE') {
    bg = 'bg-[#E8F5E9] text-[#12633D] border-[#C8E6C9]';
    dot = 'bg-[#198754]';
  } else if (normalized === 'WARNING') {
    bg = 'bg-[#FFF8E1] text-[#B78103] border-[#FFE082]';
    dot = 'bg-[#D99A00]';
  } else if (normalized === 'CRITICAL') {
    bg = 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]';
    dot = 'bg-[#C62828]';
  } else if (normalized === 'OFFLINE') {
    bg = 'bg-[#F1F3F5] text-[#5B6573] border-[#D9DEE5]';
    dot = 'bg-[#8A94A6]';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${px} font-sans font-semibold tracking-wide`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {normalized}
    </span>
  );
};
