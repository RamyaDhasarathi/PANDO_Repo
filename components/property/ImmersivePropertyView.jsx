"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import styles from "./ImmersivePropertyView.module.css";
import { formatAED, formatPrice, bedroomLabel } from "@/lib/format";
import { explainProperty, answerPropertyQuestion } from "@/lib/propertyAssistant";
import { usePandoTTS } from "@/hooks/usePandoTTS";

export default function ImmersivePropertyView({ property }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pandoMessage, setPandoMessage] = useState("");
  const [inputQuery, setInputQuery] = useState("");
  const { muted, isSpeaking, speak: speakText, stop: stopSpeaking, toggleMute: toggleTTSMute } = usePandoTTS();
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const recognitionRef = useRef(null);

  const images = useMemo(() => {
    return property.images && property.images.length > 0 ? property.images : ["/images/pando-agent.png"];
  }, [property]);

  // Generate initial summary dynamically based on current property
  useEffect(() => {
    const intro = explainProperty(property);
    setPandoMessage(intro);
  }, [property]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setSpeechSupported(true);

    const timer = setTimeout(() => {
      const intro = explainProperty(property);
      speakText(intro);
    }, 450);

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property]);

  const toggleVoiceAudio = () => {
    toggleTTSMute(pandoMessage || explainProperty(property));
  };

  const handleAskPando = useCallback((questionText) => {
    const trimmed = questionText?.trim();
    if (!trimmed) return;

    const answer = answerPropertyQuestion(property, trimmed);
    setPandoMessage(answer);
    setInputQuery("");

    speakText(answer);
  }, [property, speakText]);

  // Speech Recognition (Speech-to-Text) setup
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleAskPando(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setVoiceSupported(true);
    } catch (e) {
      console.error("Speech recognition error:", e);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [handleAskPando]);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    handleAskPando(inputQuery);
  };

  const toggleMicListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      try {
        stopSpeaking();
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Mic start failed", err);
      }
    }
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Price formatting
  const formattedPrice = formatAED(property.price);
  const priceDisplay = property.purpose === "rent" ? `${formattedPrice} / YEAR` : formattedPrice;

  // Format bedroom label
  const bdDisplay = property.bedrooms === 0 ? "STUDIO" : `${property.bedrooms} BEDROOM${property.bedrooms > 1 ? "S" : ""}`;
  const bathDisplay = `${property.bathrooms} BATHROOM${property.bathrooms > 1 ? "S" : ""}`;
  const areaDisplay = `${property.areaSqft.toLocaleString()} SQ.FT.`;
  const furnishDisplay = property.furnishing.toUpperCase();

  return (
    <div className={styles.container}>
      {/* IMMERSIVE PROPERTY HERO */}
      <div className={styles.heroCanvas}>
        {/* Background Property Image */}
        <div className={styles.imageWrapper}>
          <Image
            src={images[activeImageIndex]}
            alt={property.title}
            fill
            priority
            sizes="(max-width: 1366px) 100vw, 1200px"
            className={styles.heroImage}
          />
          {/* Dual subtle cinematic gradients for overlay readability */}
          <div className={styles.topGradient} />
          <div className={styles.bottomGradient} />
        </div>

        {/* Gallery Image Navigation */}
        {images.length > 1 && (
          <div className={styles.galleryNav}>
            <button
              type="button"
              className={styles.navArrow}
              onClick={prevImage}
              aria-label="Previous image"
              title="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <span className={styles.navCounter}>
              {activeImageIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              className={styles.navArrow}
              onClick={nextImage}
              aria-label="Next image"
              title="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* TOP-LEFT OVERLAY: Navigation, Verification, Title, Location */}
        <div className={styles.topLeftOverlay}>
          <Link href="/" className={styles.brandLink} aria-label="Hi Pando home">
            Hi Pando!
          </Link>

          <div className={styles.topActionRow}>
            <Link href="/search" className={styles.backLink}>
              <span className={styles.backArrow}>←</span> Back to Properties
            </Link>
            <span className={styles.verifiedBadge}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.485 1.929a1.5 1.5 0 0 1 2.121 2.122l-8.5 8.5a1.5 1.5 0 0 1-2.121 0l-4.25-4.25a1.5 1.5 0 0 1 2.121-2.122L6.043 9.364l7.442-7.435z" />
              </svg>
              VERIFIED PROPERTY
            </span>
          </div>

          <h1 className={styles.propertyTitle}>{property.title}</h1>

          <div className={styles.propertySubtitle}>
            <span className={styles.pinIcon}>📍</span>
            <span>
              {property.community}, {property.city} • {property.type}
            </span>
          </div>
        </div>

        {/* BOTTOM-LEFT OVERLAY: Price Tag & Compact Info Strip */}
        <div className={styles.bottomLeftOverlay}>
          <div className={styles.priceRow}>
            <div className={styles.priceTag}>{priceDisplay}</div>
          </div>

          {/* Compact Horizontal Information Strip */}
          <div className={styles.infoStrip}>
            <span className={styles.infoItem}>{bdDisplay}</span>
            <span className={styles.infoDivider}>|</span>
            <span className={styles.infoItem}>{areaDisplay}</span>
            <span className={styles.infoDivider}>|</span>
            <span className={styles.infoItem}>{bathDisplay}</span>
            <span className={styles.infoDivider}>|</span>
            <span className={styles.infoItem}>{furnishDisplay}</span>
          </div>
        </div>

        {/* PANDO & ASK INPUT UNIT INSIDE THE PROPERTY CANVAS (RIGHT / LOWER-RIGHT) */}
        <div className={styles.pandoInteractiveUnit}>
          <div className={styles.pandoRow}>
            {/* Connected Voice Note Bubble — matches the landing page's .speech-bubble */}
            <div className={`${styles.speechBubble} ${isSpeaking ? styles.bubbleSpeaking : ""}`}>
              <div className={styles.speechBubbleHeader}>
                <div className={styles.speechBubbleLabel}>
                  <span className={styles.bubblePulse} />
                  PANDO SAYS
                </div>
                {speechSupported && (
                  <button
                    type="button"
                    className={`${styles.bubbleSpeakerBtn} ${muted ? styles.isMuted : ""} ${!muted && isSpeaking ? styles.bubbleSpeakerActive : ""}`}
                    onClick={toggleVoiceAudio}
                    aria-label={muted ? "Turn Pando voice ON" : "Turn Pando voice OFF"}
                    title={muted ? "Turn voice ON" : "Turn voice OFF"}
                  >
                    {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                )}
              </div>
              <p className={styles.speechBubbleText}>{pandoMessage}</p>
            </div>

            {/* Physical Pando Character Inside Scene with Ground Shadow */}
            <div className={styles.pandoFigureWrapper}>
              <div className={styles.pandoShadow} />
              <Image
                src="/images/pando-agent.png"
                alt="Pando AI Concierge inside property"
                width={310}
                height={350}
                priority
                className={`${styles.pandoCharacter} ${isSpeaking ? styles.pandoSpeakingAnimation : ""}`}
              />
            </div>
          </div>

          {/* COMPACT ASK PANDO INPUT DIRECTLY BELOW PANDO */}
          <div className={styles.pandoInputWrap}>
            <form className={styles.inputContainer} onSubmit={handleInputSubmit}>
              <div className={styles.inputPrefix}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35"
                    stroke="var(--hp-slate)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <input
                type="text"
                className={styles.textInput}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask Pando anything about this property..."}
              />

              {isListening && <span className={styles.listeningTag}>●</span>}

              {voiceSupported && (
                <button
                  type="button"
                  className={`${styles.micButton} ${isListening ? styles.micActive : ""}`}
                  onClick={toggleMicListening}
                  aria-label={isListening ? "Stop listening" : "Ask by voice"}
                  title={isListening ? "Listening... click to stop" : "Ask by voice"}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="5.5" y="1" width="5" height="8" rx="2.5" fill="currentColor" />
                    <path d="M3 8a5 5 0 0 0 10 0M8 13v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}

              <button
                type="submit"
                className={styles.sendButton}
                aria-label="Send question to Pando"
                title="Send question"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1.5 8.5l13-6.5-6.5 13-2-5-4.5-1.5z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
