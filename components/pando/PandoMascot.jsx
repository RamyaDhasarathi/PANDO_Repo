'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { usePandoTTS } from '@/hooks/usePandoTTS';
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
  onSpeechEnd,
  className = '',
  children,
}) {
  const finalMascotUrl = mascotUrl || src || DEFAULT_MASCOT_URL;
  const { muted, isSpeaking: internalSpeaking, speak, toggleMute: toggleTTSMute } = usePandoTTS({ enabled: enableVoice });
  const isSpeaking = externalIsSpeaking ?? internalSpeaking;
  const [mascotMove, setMascotMove] = useState('');

  // Periodic subtle idle mascot animations (twist, jump, dance)
  useEffect(() => {
    let timeoutId;
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
      speak(message, {
        onEnd: () => {
          onSpeechEnd?.();
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const toggleMute = (e) => {
    e?.stopPropagation();
    toggleTTSMute(message);
    onVoiceToggle?.(!muted);
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
