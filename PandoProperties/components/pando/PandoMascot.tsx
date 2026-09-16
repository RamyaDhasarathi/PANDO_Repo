'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Radio, Sparkles } from 'lucide-react';
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
  const [muted, setMuted] = useState(!enableVoice);
  const [internalSpeaking, setInternalSpeaking] = useState(false);
  const isSpeaking = externalIsSpeaking ?? internalSpeaking;
  const [mascotMove, setMascotMove] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  // Web Speech API synthesis with strict single-playback cancellation
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // CRITICAL: Stop previous speech immediately
    window.speechSynthesis.cancel();

    if (muted || !text) {
      setInternalSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1.08;

    utterance.onstart = () => {
      setInternalSpeaking(true);
    };
    utterance.onend = () => {
      setInternalSpeaking(false);
    };
    utterance.onerror = () => {
      setInternalSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Trigger speech whenever message updates
  useEffect(() => {
    if (message) {
      speakText(message);
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [message]);

  const toggleMute = () => {
    const nextMuted = !muted;
    if (nextMuted && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setInternalSpeaking(false);
    setMuted(nextMuted);
    onVoiceToggle?.(nextMuted);
    if (!nextMuted && message) {
      speakText(message);
    }
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


