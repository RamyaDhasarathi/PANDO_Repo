'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Radio, Sparkles } from 'lucide-react';

interface HeaderProps {
  syncedAssetsCount?: number;
  onAudioToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  syncedAssetsCount = 4,
}) => {
  const [audioActive, setAudioActive] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const toggleAudio = () => {
    setAudioActive(!audioActive);
  };

  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-[#E8E1D8] flex-shrink-0 z-40 px-2.5 sm:px-6 py-1.5 sm:py-2 transition-all overflow-hidden">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          {/* Pando Mascot Brand Logo */}
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center overflow-visible flex-shrink-0 group cursor-pointer">
            <img
              src="/images/pando/pando.png"
              alt="Pando Logo Mascot"
              className="w-full h-full object-contain transform transition-transform duration-300 group-hover:scale-110 drop-shadow-sm"
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="text-xs sm:text-base font-bold text-[#111111] tracking-tight whitespace-nowrap">
                Hi Pando
              </span>
              <span className="text-[8px] sm:text-[10px] font-bold text-[#D92828] bg-[#FDEBEC] border border-[#FAD0D4] px-1.5 py-0.2 sm:py-0.5 rounded-full tracking-wider uppercase inline-flex items-center whitespace-nowrap">
                // QUANTUM
              </span>
            </div>
            <span className="hidden sm:block text-[8.5px] sm:text-[9.5px] font-semibold uppercase tracking-wider text-[#8A8680] truncate">
              DIFC DUBAI PRIME RESIDENTIAL INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Center: Intelligence Status Indicators */}
        <div className="hidden lg:flex items-center space-x-2">
          {/* Pill 1: Assets Synced & Latency */}
          <div
            className="relative group cursor-pointer"
            onMouseEnter={() => setActiveTooltip('sync')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div className="flex items-center space-x-1.5 bg-[#EAF7F1] border border-[#CDEEDB] text-[#237854] text-[10.5px] font-bold px-3 py-1 rounded-full transition-colors hover:bg-[#DDF3E7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E9B73] animate-pulse" />
              <span>{syncedAssetsCount} ASSETS SYNCED</span>
              <span className="text-[#8DCDB1] font-light">|</span>
              <span className="text-[#3A8F6A]">MLS LATENCY 8ms</span>
            </div>
            {activeTooltip === 'sync' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2.5 py-1 bg-[#111111] text-white text-[10.5px] rounded shadow-md whitespace-nowrap z-50 animate-fade-in">
                Property intelligence sources connected
              </div>
            )}
          </div>

          {/* Pill 2: Sector Off-market */}
          <div
            className="relative group cursor-pointer"
            onMouseEnter={() => setActiveTooltip('sector')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div className="flex items-center space-x-1.5 bg-[#FAF4E5] border border-[#EBDDB6] text-[#8C6D27] text-[10.5px] font-bold px-3 py-1 rounded-full transition-colors hover:bg-[#F3EACB]">
              <span className="text-[9.5px] text-[#A68334]">SECTOR //</span>
              <span>DUBAI ULTRA-PRIME &amp; OFF-MARKET</span>
            </div>
            {activeTooltip === 'sector' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2.5 py-1 bg-[#111111] text-white text-[10.5px] rounded shadow-md whitespace-nowrap z-50 animate-fade-in">
                Market data synchronization status
              </div>
            )}
          </div>

          {/* Pill 3: Neural Audio Engine */}
          <div
            className="relative group cursor-pointer"
            onMouseEnter={() => setActiveTooltip('audio')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div className="flex items-center space-x-1.5 bg-[#EAF7F1] border border-[#CDEEDB] text-[#237854] text-[10.5px] font-bold px-3 py-1 rounded-full transition-colors hover:bg-[#DDF3E7]">
              <div className="flex items-end space-x-0.5 h-2.5">
                <span className="w-0.5 h-1.5 bg-[#2E9B73] animate-pulse" />
                <span className="w-0.5 h-2.5 bg-[#2E9B73] animate-pulse delay-75" />
                <span className="w-0.5 h-1 bg-[#2E9B73] animate-pulse delay-150" />
                <span className="w-0.5 h-2 bg-[#2E9B73] animate-pulse" />
              </div>
              <span className="tracking-wide">NEURAL AUDIO ACTIVE</span>
            </div>
            {activeTooltip === 'audio' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2.5 py-1 bg-[#111111] text-white text-[10.5px] rounded shadow-md whitespace-nowrap z-50 animate-fade-in">
                Voice interface ready
              </div>
            )}
          </div>
        </div>

        {/* Right: Audio Speaker Button & Mobile status indicator */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="lg:hidden flex items-center space-x-1 bg-[#EAF7F1] border border-[#CDEEDB] text-[#237854] text-[9.5px] font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E9B73] animate-pulse" />
            <span>{syncedAssetsCount} SYNCED</span>
          </div>

          <button
            onClick={toggleAudio}
            aria-label="Toggle Neural Audio"
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              audioActive
                ? 'bg-white border-[#E0D8CC] text-[#111111] hover:bg-[#FBF6EE]'
                : 'bg-[#F2ECE1] border-[#D9D0C3] text-[#888888]'
            }`}
            title={audioActive ? 'Neural Audio Enabled' : 'Neural Audio Muted'}
          >
            {audioActive ? (
              <Volume2 className="w-3.5 h-3.5 text-[#444444]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#888888]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
