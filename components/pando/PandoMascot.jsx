'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import './pando-mascot.css';

const DEFAULT_MASCOT_URL = '/images/pando/pando.png';
const DEFAULT_MESSAGE =
  'Palm Jumeirah is a premier beachfront sanctuary with 6 bedrooms, 8,400 sq.ft and private mooring. Current valuation is AED 85 million and available off-market.';

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
  children,
}) {
  const finalMascotUrl = mascotUrl || src || DEFAULT_MASCOT_URL;
  const [muted, setMuted] = useState(!enableVoice);
  const [internalSpeaking, setInternalSpeaking] = useState(false);
  const isSpeaking = externalIsSpeaking ?? internalSpeaking;
  const utteranceRef = useRef(null);

  // Web Speech API synthesis with strict single-playback cancellation
  const speakText = (text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (muted || !text) {
      setInternalSpeaking(false);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.96;
      utterance.pitch = 1.06;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Alex'))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];

      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => setInternalSpeaking(true);
      utterance.onend = () => setInternalSpeaking(false);
      utterance.onerror = () => setInternalSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      setInternalSpeaking(false);
    }
  };

  // Trigger speech whenever message updates
  useEffect(() => {
    if (message && !muted) {
      speakText(message);
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, muted]);

  const toggleMute = (e) => {
    e?.stopPropagation();
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
    <div className={`pando-floating-agent ${className}`}>
      {/* Bubble — same gold "Pando says" speech-bubble pattern used on Home/Explore */}
      <div className="pando-bubble-col">
        <div className={`pando-bubble ${isSpeaking ? 'is-speaking' : ''}`}>
          <div className="pando-bubble-header">
            <span className="pando-bubble-dot" aria-hidden="true" />
            <span className="pando-bubble-label">Pando says</span>
            <button
              type="button"
              className={`pando-bubble-mute-btn ${muted ? 'is-muted' : ''}`}
              onClick={toggleMute}
              aria-label={muted ? 'Unmute Pando voice' : 'Mute Pando voice'}
              title={muted ? 'Voice is muted' : 'Voice is active'}
            >
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
          </div>

          <blockquote key={message} className="pando-bubble-quote" role="status" aria-live="polite">
            {message}
          </blockquote>

          {children}

          <span className="pando-bubble-tail" aria-hidden="true" />
        </div>
      </div>

      {/* Character — the virtual agent, made to shine: glow halo + twinkle accents */}
      <div
        className={`pando-character-wrap ${isSpeaking ? 'is-talking-anim' : ''}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        aria-label="Speak with Pando"
      >
        <span className="pando-sparkle pando-sparkle-1" aria-hidden="true" />
        <span className="pando-sparkle pando-sparkle-2" aria-hidden="true" />
        <img
          src={finalMascotUrl}
          alt="Pando, your residential concierge"
          className="pando-mascot-img"
          onError={(e) => {
            e.target.src = '/images/pando-agent.png';
          }}
        />
      </div>
    </div>
  );
}

export default PandoMascot;
