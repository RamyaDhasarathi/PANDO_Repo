"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { localities } from "@/data/localities";
import { properties } from "@/data/properties";

const PROPERTY_TYPES = ["Apartment", "Villa", "Townhouse", "Plot", "Commercial"];
const BEDROOM_OPTIONS = ["Studio", "1", "2", "3", "4+"];

const ALL_LOCATIONS = Array.from(
  new Set([...localities.map((l) => l.name), ...properties.map((p) => p.community)])
);

export default function SearchBar({
  variant = "hero",
  initialLocation = "",
  initialPurpose = "sale",
  initialType = "",
  initialBedroom = "",
  showChips = true,
  onSearch,
}) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [purpose, setPurpose] = useState(initialPurpose);
  const [type, setType] = useState(initialType);
  const [bedroom, setBedroom] = useState(initialBedroom);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const blurTimeout = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setLocation(transcript);
      setShowSuggestions(false);
      runSearch({ location: transcript });
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => recognition.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleVoiceInput() {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    setIsListening(true);
    recognitionRef.current.start();
  }

  const suggestions = useMemo(() => {
    if (!location.trim()) return ALL_LOCATIONS.slice(0, 6);
    return ALL_LOCATIONS.filter((loc) =>
      loc.toLowerCase().includes(location.toLowerCase())
    ).slice(0, 6);
  }, [location]);

  function runSearch(overrides = {}) {
    const next = {
      location: overrides.location ?? location,
      purpose: overrides.purpose ?? purpose,
      type: overrides.type ?? type,
      bedroom: overrides.bedroom ?? bedroom,
    };

    if (onSearch) {
      onSearch(next);
      return;
    }

    const params = new URLSearchParams();
    if (next.location) params.set("location", next.location);
    if (next.purpose) params.set("purpose", next.purpose);
    if (next.type) params.set("type", next.type);
    if (next.bedroom) params.set("bedroom", next.bedroom);
    router.push(`/search?${params.toString()}`);
  }

  const isHero = variant === "hero";

  return (
    <div className={`bg-white rounded-hp-lg border border-hp-line-soft transition-all ${isHero ? 'p-hp-4 shadow-hp-lg' : 'p-hp-2 shadow-hp-md'}`}>
      <div className="flex gap-[6px] mb-hp-3">
        {["sale", "rent"].map((p) => (
          <button
            key={p}
            type="button"
            className={`border-none font-bold text-[0.85rem] px-5 py-2 rounded-hp-pill cursor-pointer transition-all duration-150 ease-out ${purpose === p ? 'bg-hp-primary text-white shadow-[0_6px_14px_rgba(193,39,45,0.3)]' : 'bg-hp-mint-50 text-hp-slate'}`}
            onClick={() => {
              setPurpose(p);
              runSearch({ purpose: p });
            }}
          >
            {p === "sale" ? "Buy" : "Rent"}
          </button>
        ))}
      </div>

      <div className={`grid gap-hp-2 items-stretch max-md:grid-cols-1 ${!isHero ? 'grid-cols-[1.4fr_0.9fr_auto]' : 'grid-cols-[1.6fr_1fr_auto]'}`}>
        <div className="relative flex items-center gap-[10px] border-[1.5px] border-hp-line rounded-hp-md px-hp-4 bg-[#f1eef2] focus-within:border-hp-primary focus-within:bg-white transition-colors">
          <span className="shrink-0 text-hp-primary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 15s5-4.4 5-8.5A5 5 0 0 0 3 6.5C3 10.6 8 15 8 15Z" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="8" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
          <input
            className={`border-none bg-transparent outline-none w-full text-ink placeholder:text-gray-500 ${!isHero ? 'py-[11px] text-[0.9rem]' : 'py-4 text-[0.95rem]'}`}
            placeholder="Search Dubai Marina, Downtown Dubai, Business Bay..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => { blurTimeout.current = setTimeout(() => setShowSuggestions(false), 120); }}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          {voiceSupported && (
            <button
              type="button"
              className={`shrink-0 w-[30px] h-[30px] rounded-full border-none flex items-center justify-center cursor-pointer transition-colors duration-150 ${isListening ? 'bg-hp-primary text-white shadow-[0_0_0_6px_rgba(193,39,45,0.15)] animate-pulse' : 'bg-hp-mint-100 text-hp-primary hover:bg-hp-mint-200'}`}
              onClick={toggleVoiceInput}
              aria-label={isListening ? "Stop voice search" : "Search by voice"}
              title={isListening ? "Listening…" : "Search by voice"}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="5.5" y="1" width="5" height="8" rx="2.5" fill="currentColor" />
                <path d="M3 8a5 5 0 0 0 10 0M8 13v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-hp-md shadow-hp-lg border border-hp-line-soft overflow-hidden z-30">
              {suggestions.map((s) => (
                <div
                  key={s}
                  className="px-hp-4 py-[12px] text-[0.9rem] cursor-pointer flex items-center gap-[10px] text-hp-charcoal hover:bg-hp-mint-50 transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setLocation(s);
                    setShowSuggestions(false);
                    runSearch({ location: s });
                  }}
                >
                  📍 {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex items-center gap-[10px] border-[1.5px] border-hp-line rounded-hp-md px-hp-4 bg-[#f1eef2] focus-within:border-hp-primary focus-within:bg-white transition-colors">
          <select
            className={`border-none bg-transparent outline-none w-full text-ink cursor-pointer ${!isHero ? 'py-[11px] text-[0.9rem]' : 'py-4 text-[0.95rem]'}`}
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              runSearch({ type: e.target.value });
            }}
          >
            <option value="">All property types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="border-none rounded-hp-md bg-gradient-to-br from-hp-primary-light to-hp-primary text-white font-bold px-hp-6 cursor-pointer flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(193,39,45,0.3)] hover:shadow-[0_14px_30px_rgba(193,39,45,0.36)] transition-all duration-150 max-md:p-[14px]" onClick={() => runSearch()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5.2" stroke="white" strokeWidth="1.6" />
            <path d="M11 11L15 15" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Search
        </button>
      </div>

      {isHero && showChips && (
        <div className="flex flex-wrap gap-2 mt-hp-3">
          {BEDROOM_OPTIONS.map((b) => (
            <button
              key={b}
              type="button"
              className={`border-[1.5px] rounded-hp-pill px-4 py-[7px] text-[0.82rem] font-semibold cursor-pointer transition-all duration-150 ${bedroom === b ? 'bg-hp-mint-100 border-hp-primary text-hp-primary-dark' : 'bg-white border-hp-line text-hp-charcoal'}`}
              onClick={() => {
                const next = bedroom === b ? "" : b;
                setBedroom(next);
                runSearch({ bedroom: next });
              }}
            >
              {b}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
