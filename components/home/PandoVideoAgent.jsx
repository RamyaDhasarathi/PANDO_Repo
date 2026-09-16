"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PandoVideoAgent.module.css";

// Bump this whenever /public/videos/pando-speaking.webm is replaced —
// browsers cache <video src> aggressively by URL, so the query string
// is what forces them to fetch the new file instead of the old one.
const VIDEO_SRC = "/videos/pando-speaking.webm?v=31043757";

const SCRIPT_LINES = [
  "Welcome to Hi Pando — I'm Pando, your AI real estate concierge for Dubai.",
  "Right here, you can tell me what you're looking for — a beachfront apartment, a family villa, or a high-yield investment.",
  "Just type in the search box, or tap the microphone and speak naturally in English.",
  "I'll search live listings across Dubai's top communities and bring back the best matches for you, instantly.",
];

export default function PandoVideoAgent() {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(false);
  const mutedRef = useRef(false);
  const lineIndexRef = useRef(0);
  const speakCurrentLineRef = useRef(() => {});

  useEffect(() => {
    videoRef.current?.play().catch(() => {});

    if (!("speechSynthesis" in window)) return;
    setSpeechSupported(true);

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      return (
        voices.find((v) => v.lang === "en-US") ||
        voices.find((v) => v.lang?.startsWith("en")) ||
        voices[0] ||
        null
      );
    }

    function speakCurrentLine() {
      if (mutedRef.current) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(SCRIPT_LINES[lineIndexRef.current]);
      utterance.lang = "en-US";
      utterance.rate = 0.98;
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        lineIndexRef.current = (lineIndexRef.current + 1) % SCRIPT_LINES.length;
        setLineIndex(lineIndexRef.current);
        speakCurrentLine();
      };
      window.speechSynthesis.speak(utterance);
    }

    speakCurrentLineRef.current = speakCurrentLine;

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speakCurrentLine;
    }
    const timeout = setTimeout(speakCurrentLine, 200);

    return () => {
      clearTimeout(timeout);
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    if (next) {
      window.speechSynthesis?.cancel();
    } else {
      speakCurrentLineRef.current();
    }
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.liveBadge}>
        <span className={styles.liveDot} /> LIVE 3D AGENT
      </span>

      {speechSupported && (
        <button
          type="button"
          className={styles.speakerBtn}
          onClick={toggleMute}
          aria-label={muted ? "Unmute Pando" : "Mute Pando"}
          title={muted ? "Unmute Pando" : "Mute Pando"}
        >
          {muted ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 6h2.5L8 3v10L4.5 10H2V6Z" fill="currentColor" />
              <path d="M10.5 5.5l4 5M14.5 5.5l-4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 6h2.5L8 3v10L4.5 10H2V6Z" fill="currentColor" />
              <path d="M10.8 5.3a3.6 3.6 0 0 1 0 5.4M12.7 3.6a6.3 6.3 0 0 1 0 8.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          )}
        </button>
      )}

      <div className={styles.speechBubble}>
        <div className={styles.speechHeader}>
          <span className={styles.sparkle}>✨</span> PANDO 
          <span className={styles.liveTag}>Live</span>
        </div>
        <p className={styles.speechText}>&ldquo;{SCRIPT_LINES[lineIndex]}&rdquo;</p>
      </div>

      <video
        ref={videoRef}
        className={styles.video}
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
      />
    </div>
  );
}
