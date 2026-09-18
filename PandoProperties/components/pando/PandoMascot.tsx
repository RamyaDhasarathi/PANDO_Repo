'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Radio, Sparkles } from 'lucide-react';
import { usePandoTTS } from '@/hooks/usePandoTTS';
import './pando-mascot.css';

export interface PandoMascotProps {
  message?: string;
  enableVoice?: boolean;
  mascotUrl?: string;
  src?: string;
  isSpeaking?: boolean;
  isListening?: boolean;
  statusState?: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';
  onClick?: () => void;
  onVoiceToggle?: (muted: boolean) => void;
  className?: string;
}

const DEFAULT_MASCOT_URL = '/images/pando/pando.png';
const DEFAULT_MESSAGE =
  'Select any luxury residence or ask me a question to synthesize dynamic AI property insights.';

export function PandoMascot({
  message = DEFAULT_MESSAGE,
  enableVoice = true,
  mascotUrl,
  src,
  isSpeaking: externalIsSpeaking,
  isListening = false,
  statusState = 'IDLE',
  onClick,
  onVoiceToggle,
  className = '',
}: PandoMascotProps) {
  const finalMascotUrl = mascotUrl || src || DEFAULT_MASCOT_URL;
  const { muted, isSpeaking: internalSpeaking, speak, toggleMute: toggleTTSMute } = usePandoTTS({ enabled: enableVoice });
  const isSpeaking = externalIsSpeaking ?? internalSpeaking;
  const [mascotMove, setMascotMove] = useState('');

  // Periodic subtle idle mascot animations (twist, jump, dance)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const moves = ['mascot-twist', 'mascot-jump', 'mascot-dance'];

    const scheduleMove = () => {
      const move = moves[Math.floor(Math.random() * moves.length)];
      setMascotMove(move);
      timeoutId = setTimeout(() => {
        setMascotMove('');
        scheduleMove();
      }, 2200);
    };

    timeoutId = setTimeout(scheduleMove, 4000 + Math.random() * 2500);
    return () => clearTimeout(timeoutId);
  }, []);

  // Trigger speech whenever message updates
  useEffect(() => {
    if (message) {
      speak(message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const toggleMute = () => {
    toggleTTSMute(message);
    onVoiceToggle?.(!muted);
  };

  return (
    <div className={`pando-embedded-container ${className}`}>
      {/* PANDO RESPONSE SPEECH BUBBLE */}
      <div
        className={`pando-speech-bubble ${isSpeaking ? 'is-speaking' : ''}`}
        role="status"
        aria-live="polite"
      >
        {/* Header Row with PANDO SAYS on Left & VOICE ON button on Top-Right */}
        <div className="bubble-header flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="red-dot" />
            <span className="header-text">PANDO SAYS</span>
          </div>

          {/* Top Right Controls: Speaking Waveform + Voice Toggle Button */}
          <div className="flex items-center gap-1.5">
            {isSpeaking && (
              <div className="flex items-center gap-1 bg-[#D92828] text-white text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
                <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            {/* Voice Mute / Unmute Button on Top-Right of Speech Note */}
            <button
              type="button"
              className={`pando-voice-header-btn ${muted ? 'is-muted' : 'is-active'}`}
              onClick={toggleMute}
              aria-label={muted ? 'Unmute Pando voice' : 'Mute Pando voice'}
            >
              {muted ? <VolumeX size={10} /> : <Volume2 size={10} />}
              <span>{muted ? 'MUTED' : 'VOICE ON'}</span>
            </button>
          </div>
        </div>

        {/* Message Content */}
        <p className="bubble-message">{message}</p>

        {/* Speech Bubble Pointer */}
        <div className="bubble-pointer" />
      </div>

      {/* PANDO MASCOT CHARACTER */}
      <div
        className={`pando-character-wrap ${mascotMove} ${isSpeaking ? 'is-talking-anim' : ''}`}
        onClick={onClick}
        title="Click to interact with Pando"
      >
        <img
          src={finalMascotUrl}
          alt="Pando 3D AI Concierge Mascot"
          className="pando-mascot-img"
        />
      </div>
    </div>
  );
}

export default PandoMascot;


