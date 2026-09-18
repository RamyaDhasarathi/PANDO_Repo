'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import ProfilePopup from '@/components/ProfilePopup';
import { useAuth } from '@/providers/AuthProvider';
import AuthForm from '@/components/AuthForm';

// Same brand mascot used in the Home / Explore / Property headers
const MASCOT_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hf_20260623_061342_344d0b5a-9b73-4799-b66d-cb78af38510c-Photoroom-8tRuDAVe4O0Gxxg6amlBrVSCOL6ouf.png';

export const Header = ({
  syncedAssetsCount = 4,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('sign-in');
  
  const { user } = useAuth();
  return (
    <header
      style={{
        width: '100%',
        backgroundColor: 'var(--paper)',
        borderBottom: '2px solid rgba(30, 30, 34, 0.28)',
        flexShrink: 0,
        zIndex: 40,
        padding: '14px clamp(20px, 4vw, 56px)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Left: same bold brand mark as Home / Explore / Property */}
        <Link
          href="/"
          aria-label="Hi Pando home"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid var(--ink)',
              boxShadow: '2px 2px 0 var(--ink)',
              backgroundColor: '#f4eee2',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src={MASCOT_URL}
              alt=""
              style={{ width: '124%', height: '124%', objectFit: 'cover', objectPosition: '50% 30%' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </span>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--ink)',
              letterSpacing: '-0.04em',
            }}
          >
            Hi Pando!
          </span>
        </Link>

        {/* Right: notification and profile, restyled to the shared bordered/ink look */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '2px solid var(--ink)',
              backgroundColor: 'rgba(255, 250, 243, 0.68)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--ink)',
            }}
            title="Notifications"
            aria-label="Notifications"
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
