'use client';

import React, { useState } from 'react';
import { PandoMascot } from './PandoMascot';
import './pando-mascot.css'

interface LiveAgentProps {
  onTriggerVoice?: () => void;
  isListening?: boolean;
}

export const LiveAgent: React.FC<LiveAgentProps> = ({
  onTriggerVoice,
  isListening: externalIsListening,
}) => {
  const [internalListening, setInternalListening] = useState(false);

  const isListening = externalIsListening ?? internalListening;

  const handleMascotClick = () => {
    if (onTriggerVoice) {
      onTriggerVoice();
    } else {
      setInternalListening(true);
      setTimeout(() => {
        setInternalListening(false);
      }, 2500);
    }
  };

  return (
    <div className="bg-[#FAF5EC] rounded-xl sm:rounded-2xl border border-[#E8E1D8] p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs relative overflow-hidden flex-shrink-0">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        {/* Live 3D Agent Pill */}
        <div className="inline-flex items-center space-x-1.5 bg-white/90 border border-[#D5EADF] text-[#248259] text-[9.5px] sm:text-[10.5px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E9B73] animate-pulse" />
          <span className="tracking-wider uppercase">LIVE 3D AGENT</span>
        </div>
      </div>

      {/* Main Agent Area (Mascot & Speech Bubble from PandoMascot) */}
      <div className="w-full relative z-20">
        <PandoMascot
          src="/images/pando/pando.png"
          message={
            isListening
              ? 'Pando listening... Speak or type.'
              : 'I can help you find a place that feels like home. Tell me your city, budget, and one non-negotiable.'
          }
          isSpeaking={!isListening}
          isListening={isListening}
          onClick={handleMascotClick}
        />
      </div>
    </div>
  );
};
