'use client';

import React from 'react';
import { X } from 'lucide-react';

export const Toast = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        backgroundColor: 'var(--p-ink, #1E1E22)',
        color: '#F5F0E6',
        border: '1px solid rgba(245, 240, 230, 0.14)',
        padding: '10px 18px',
        borderRadius: '8px',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '90vw',
        animation: 'slideUp 0.3s ease-out',
        fontFamily: 'var(--font-plus-jakarta), sans-serif',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'var(--p-bronze, #B08A4E)',
          flexShrink: 0,
        }}
      />

      <span
        style={{
          fontSize: '12.5px',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: '#F5F0E6',
        }}
      >
        {message}
      </span>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(245, 240, 230, 0.55)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            marginLeft: '4px',
          }}
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
