'use client';

import React from 'react';

interface QuickSuggestionProps {
  label: string;
  onClick: (label: string) => void;
  disabled?: boolean;
}

export const QuickSuggestion: React.FC<QuickSuggestionProps> = ({
  label,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(label)}
      className="bg-white hover:bg-[#FAF6EE] active:scale-95 border border-[#E0D8CC] text-[#222222] text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all shadow-2xs hover:border-[#C8BEAE] whitespace-nowrap disabled:opacity-50"
    >
      {label}
    </button>
  );
};
