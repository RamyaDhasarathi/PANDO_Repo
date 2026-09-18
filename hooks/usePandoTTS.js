'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { primePandoVoices, speakPando, stopPandoSpeech } from '@/lib/ttsService';

/**
 * Unified Pando text-to-speech hook. Wraps lib/ttsService so every page shares
 * the same voice, rate, pitch, and volume, plus mute state and speaking status.
 */
export function usePandoTTS({ enabled = true } = {}) {
  const [muted, setMuted] = useState(!enabled);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  // Lets callers (e.g. a first-interaction handler registered once on mount)
  // check "are we already speaking right now" without a stale closure over
  // the isSpeaking state value.
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    primePandoVoices();
    return () => {
      stopPandoSpeech();
    };
  }, []);

  const speak = useCallback((text, { force = false } = {}) => {
    if (!text) return;
    if (force) {
      mutedRef.current = false;
      setMuted(false);
    } else if (mutedRef.current) {
      return;
    }
    isSpeakingRef.current = true;
    speakPando(text, {
      onStart: () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      },
      onEnd: () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      },
      onError: () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      },
    });
  }, []);

  const stop = useCallback(() => {
    stopPandoSpeech();
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback((textToResumeWith) => {
    setMuted((prevMuted) => {
      const next = !prevMuted;
      if (next) {
        stopPandoSpeech();
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      } else if (textToResumeWith) {
        speak(textToResumeWith);
      }
      return next;
    });
  }, [speak]);

  return { muted, setMuted, isSpeaking, isSpeakingRef, speak, stop, toggleMute };
}

export default usePandoTTS;
