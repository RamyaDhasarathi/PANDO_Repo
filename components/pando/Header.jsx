'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Bell, ChevronDown, Activity, Zap, BarChart2 } from 'lucide-react';
import ProfilePopup from '@/components/ProfilePopup';
import { useAuth } from '@/providers/AuthProvider';
import AuthForm from '@/components/AuthForm';

const OPENING_MASCOT_URL = '/pando-favicon.png';

export const Header = ({
  syncedAssetsCount = 4,
  onAudioToggle,
}) => {
  const [audioActive, setAudioActive] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('sign-in');
  
  const { user } = useAuth();

  const toggleAudio = () => {
    const next = !audioActive;
    setAudioActive(next);
    onAudioToggle?.(next);
  };

  return (
    <header
      style={{
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        flexShrink: 0,
        zIndex: 40,
        padding: '10px 24px',
        boxSizing: 'border-box',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div
        style={{
          maxWidth: '1540px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Left: Logo & Brand */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          {/* Avatar Icon */}
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src={OPENING_MASCOT_URL}
              alt="Hi Pando Mascot"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.target.src = '/images/pando-agent.png';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#111827',
                  letterSpacing: '-0.02em',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                Hi Pando!
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#DC2626',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                QUANTUM
              </span>
            </div>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#9CA3AF',
                marginTop: '1px',
              }}
            >
              DIFC DUBAI PRIME RESIDENTIAL INTELLIGENCE
            </span>
          </div>
        </Link>

        {/* Center: Intelligence Status Indicators matching Image 1 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
          className="quantum-indicators-center"
        >
          {/* Pill 1: Assets Synced */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#047857',
              fontSize: '11px',
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: '9999px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }}
            />
            <span>{syncedAssetsCount} Assets Synced</span>
          </div>

          {/* Pill 2: MLS Latency */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#047857',
              fontSize: '11px',
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: '9999px',
            }}
          >
            <Zap size={12} color="#047857" />
            <span>MLS Latency 8ms</span>
          </div>

          {/* Pill 3: Dubai Ultra-Prime & Off-Market */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#B45309',
              fontSize: '11px',
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: '9999px',
            }}
          >
            <BarChart2 size={12} color="#B45309" />
            <span>Dubai Ultra-Prime &amp; Off-Market</span>
          </div>

          {/* Pill 4: Neural Audio Active */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#047857',
              fontSize: '11px',
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: '9999px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '11px' }}>
              <span style={{ width: '2px', height: '6px', backgroundColor: '#047857', animation: 'bounceSoft 0.8s infinite' }} />
              <span style={{ width: '2px', height: '10px', backgroundColor: '#047857', animation: 'bounceSoft 0.8s infinite 0.15s' }} />
              <span style={{ width: '2px', height: '5px', backgroundColor: '#047857', animation: 'bounceSoft 0.8s infinite 0.3s' }} />
            </div>
            <span>Neural Audio Active</span>
          </div>
        </div>

        {/* Right: Controls & Profile Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Notification Bell */}
          <button
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#4B5563',
            }}
            title="Notifications"
          >
            <Bell size={15} />
          </button>

          {/* User Profile Pill */}
          {user ? (
            <button
              onClick={() => setIsProfileOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: '50%',
                padding: '3px',
                cursor: 'pointer',
              }}
              title="Profile"
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
              </div>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              style={{
                backgroundColor: '#d22c23',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontWeight: 600,
                fontSize: '11px',
                cursor: 'pointer',
                letterSpacing: '0.04em'
              }}
            >
              SIGN IN
            </button>
          )}
        </div>
      </div>
      
      {isProfileOpen && <ProfilePopup onClose={() => setIsProfileOpen(false)} />}
      
      {isAuthOpen && (
        <AuthForm
          mode={authMode}
          onSwitchMode={setAuthMode}
          onClose={() => setIsAuthOpen(false)}
        />
      )}
    </header>
  );
};
