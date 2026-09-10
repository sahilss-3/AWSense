import React from 'react';
import { SeverityLevel } from '../../types';

interface SeverityBadgeProps {
  severity: SeverityLevel | string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const s = severity.toLowerCase();

  let color = 'bg-[#F1F3F5] text-[#5B6573] border-[#D9DEE5]';
  if (s === 'critical') {
    color = 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]';
  } else if (s === 'high') {
    color = 'bg-[#FFF3E0] text-[#D84315] border-[#FFCC80]';
  } else if (s === 'medium') {
    color = 'bg-[#FFF8E1] text-[#B78103] border-[#FFE082]';
  } else if (s === 'low') {
    color = 'bg-[#E1F5FE] text-[#0277BD] border-[#B3E5FC]';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${color} font-sans`}>
      {severity}
    </span>
  );
};
