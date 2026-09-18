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

    function speakCurrentLine() {
      if (mutedRef.current) return;
      speakPando(SCRIPT_LINES[lineIndexRef.current], {
        onEnd: () => {
          lineIndexRef.current = (lineIndexRef.current + 1) % SCRIPT_LINES.length;
          setLineIndex(lineIndexRef.current);
          speakCurrentLine();
        },
      });
    }

    speakCurrentLineRef.current = speakCurrentLine;

    const timeout = setTimeout(speakCurrentLine, 200);

    return () => {
      clearTimeout(timeout);
      stopPandoSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    if (next) {
      stopPandoSpeech();
    } else {
      speakCurrentLineRef.current();
    }
  }

  return (
    <div className="relative flex items-center justify-center gap-hp-4 h-full min-h-0 pt-[46px] max-lg:h-auto max-lg:flex-col max-lg:pt-[44px]">
      <span className="absolute top-0 left-1/2 -translate-x-1/2 inline-flex items-center gap-[6px] bg-white border border-hp-line-soft rounded-hp-pill px-[14px] py-[6px] text-[0.7rem] font-bold tracking-[0.04em] text-hp-charcoal shadow-hp-sm z-[2]">
        <span className="w-[6px] h-[6px] rounded-full bg-[#2fb463]" /> LIVE 3D AGENT
      </span>

      {speechSupported && (
        <button
          type="button"
          className="absolute top-0 right-0 w-[34px] h-[34px] rounded-full border border-hp-line-soft bg-white text-hp-charcoal flex items-center justify-center cursor-pointer shadow-hp-sm z-[2] hover:text-hp-primary transition-colors"
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

      <div className="relative z-[3] shrink-0 self-center bg-white rounded-hp-md shadow-hp-lg p-hp-3 w-[min(170px,32%)] max-lg:w-[min(240px,70%)]">
        <div className="flex items-center gap-[5px] text-[0.66rem] font-extrabold text-hp-primary tracking-[0.02em] mb-[5px]">
          <span className="text-[0.75rem]">✨</span> PANDO 
          <span className="ml-[3px] bg-hp-mint-100 text-[#2f9c5f] text-[0.6rem] font-bold px-[7px] py-[2px] rounded-hp-pill">Live</span>
        </div>
        <p className="text-[0.76rem] leading-[1.4] text-hp-charcoal m-0">&ldquo;{SCRIPT_LINES[lineIndex]}&rdquo;</p>
      </div>

      <video
        ref={videoRef}
        className="w-[min(380px,66%)] max-lg:w-[min(300px,78vw)] aspect-[3/4] object-cover object-center z-[1] shrink-0 drop-shadow-[0_24px_20px_rgba(16,35,29,0.18)] [mask-image:radial-gradient(ellipse_62%_66%_at_50%_46%,#000_68%,transparent_98%)] [-webkit-mask-image:radial-gradient(ellipse_62%_66%_at_50%_46%,#000_68%,transparent_98%)]"
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
      />
    </div>
  );
}
