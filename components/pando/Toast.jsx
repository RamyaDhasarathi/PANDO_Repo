'use client';

import React from 'react';
import { Sparkles, X } from 'lucide-react';

export const Toast = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        backgroundColor: '#181818',
        color: '#FFFFFF',
        border: '1px solid #333333',
        padding: '10px 18px',
        borderRadius: '9999px',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '90vw',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: '#D92828',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Sparkles size={11} color="#FFFFFF" />
      </div>

      <span
        style={{
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: '#FAF6EE',
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
            color: '#888888',
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
