import React from 'react';

export const StatusBadge = ({ label, variant = 'off-market', className = '' }) => {
  const getBadgeStyles = () => {
    switch (variant) {
      case 'off-market':
        return {
          backgroundColor: '#DCFCE7',
          color: '#15803D',
          borderColor: '#BBF7D0',
        };
      case 'exclusive':
        return {
          backgroundColor: '#FEF3C7',
          color: '#B45309',
          borderColor: '#FDE68A',
        };
      case 'sunset':
        return {
          backgroundColor: '#FEE2E2',
          color: '#B91C1C',
          borderColor: '#FCA5A5',
        };
      case 'royal':
        return {
          backgroundColor: '#F3E8FF',
          color: '#7E22CE',
          borderColor: '#E9D5FF',
        };
      default:
        return {
          backgroundColor: '#F3F4F6',
          color: '#374151',
          borderColor: '#E5E7EB',
        };
    }
  };

  const badgeStyle = getBadgeStyles();

  return (
    <span
      style={{
        ...badgeStyle,
        display: 'inline-flex',
        alignItems: 'center',
        border: `1px solid ${badgeStyle.borderColor}`,
        fontSize: '11px',
        fontWeight: 500,
        padding: '3px 10px',
        borderRadius: '9999px',
        lineHeight: '1.2',
        whiteSpace: 'nowrap',
      }}
      className={className}
    >
      {label}
    </span>
  );
};
