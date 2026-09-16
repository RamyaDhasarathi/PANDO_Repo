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
}) {
  const finalMascotUrl = mascotUrl || src || DEFAULT_MASCOT_URL;
  const [muted, setMuted] = useState(!enableVoice);
  const [internalSpeaking, setInternalSpeaking] = useState(false);
  const isSpeaking = externalIsSpeaking ?? internalSpeaking;
  const [mascotMove, setMascotMove] = useState('');
  const utteranceRef = useRef(null);

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
    <div className={`pando-embedded-container ${className}`}>
      {/* PANDO RESPONSE SPEECH BUBBLE */}
      <div
        className={`pando-speech-bubble ${isSpeaking ? 'is-speaking' : ''}`}
        role="status"
        aria-live="polite"
      >
        {/* Header Row with PANDO SAYS on Left & VOICE ON button on Top-Right */}
        <div className="bubble-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="red-dot" />
            <span className="header-text">PANDO SAYS</span>
          </div>

          {/* Top Right Controls: Speaking Waveform + Voice Toggle Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSpeaking && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '3px',
                  backgroundColor: '#D92828',
                  padding: '2px 5px',
                  borderRadius: '9999px',
                  height: '14px',
                }}
              >
                <span style={{ width: '2px', height: '6px', backgroundColor: '#FFFFFF', borderRadius: '2px', animation: 'bounceSoft 0.8s infinite' }} />
                <span style={{ width: '2px', height: '10px', backgroundColor: '#FFFFFF', borderRadius: '2px', animation: 'bounceSoft 0.8s infinite 0.15s' }} />
                <span style={{ width: '2px', height: '7px', backgroundColor: '#FFFFFF', borderRadius: '2px', animation: 'bounceSoft 0.8s infinite 0.3s' }} />
              </div>
            )}

            {/* Voice Mute / Unmute Button on Top-Right of Speech Note */}
            <button
              type="button"
              className={`pando-voice-header-btn ${muted ? 'is-muted' : 'is-active'}`}
              onClick={toggleMute}
              aria-label={muted ? 'Unmute Pando voice' : 'Mute Pando voice'}
              title={muted ? 'Voice is Muted (Click to Unmute)' : 'Voice is Active (Click to Mute)'}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
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
          onError={(e) => {
            e.target.src = '/images/pando-agent.png';
          }}
        />
      </div>
    </div>
  );
}

export default PandoMascot;
