import React from 'react';

interface StatusBadgeProps {
  label: string;
  variant?: 'off-market' | 'exclusive' | 'sunset' | 'royal' | 'default';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'default',
  className = '',
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'off-market':
        return 'bg-[#EAF7F1] text-[#2E9B73] border-[#C8EDDE]';
      case 'exclusive':
        return 'bg-[#FBF4E6] text-[#A67C37] border-[#EEDDBF]';
      case 'sunset':
        return 'bg-[#FFF2EB] text-[#C46129] border-[#FED9C5]';
      case 'royal':
        return 'bg-[#FCEEF2] text-[#B83260] border-[#F7CFDC]';
      default:
        return 'bg-[#F2EFE9] text-[#555555] border-[#E0DACE]';
    }
  };

  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${getStyles()} ${className}`}
    >
      {label}
    </span>
  );
};
