'use client';

import React from 'react';
import { Sparkles, CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 bg-[#111111] text-white px-4 py-3 rounded-2xl shadow-xl border border-[#333333] animate-slide-up">
      <CheckCircle2 className="w-4 h-4 text-[#2E9B73] flex-shrink-0" />
      <span className="text-xs font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-[#888888] hover:text-white transition-colors ml-2"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
