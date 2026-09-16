"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./PropertyAiPanel.module.css";
import { answerPropertyQuestion, explainProperty } from "@/lib/propertyAssistant";

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `pchat-${idCounter}`;
}

export default function PropertyAiPanel({ property }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  const mutedRef = useRef(false);
  const logRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => recognition.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
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

    function speakIntro() {
      if (mutedRef.current) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(explainProperty(property));
      utterance.lang = "en-US";
      utterance.rate = 0.98;
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speakIntro;
    }
    const timeout = setTimeout(speakIntro, 300);

    return () => {
      clearTimeout(timeout);
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  function speak(text) {
    if (mutedRef.current || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.98;
    window.speechSynthesis.speak(utterance);
  }

  function toggleSpeaker() {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    if (next) {
      window.speechSynthesis?.cancel();
    } else {
      speak(explainProperty(property));
    }
  }

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const answer = answerPropertyQuestion(property, trimmed);
    setMessages((prev) => [
      ...prev,
      { id: nextId(), sender: "user", text: trimmed },
      { id: nextId(), sender: "pando", text: answer },
    ]);
    speak(answer);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }

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

  return (
    <div className={styles.panel}>
      <div className={styles.hero}>
        <span className={styles.liveBadge}>
          <span className={styles.liveDot} /> LIVE AI AGENT
        </span>

        <div className={styles.introRow}>
          <div className={styles.introBubble}>
            <p className={styles.introLead}>
              <span className={styles.pandoDot} /> Pando says
            </p>
            <p className={styles.introBody}>{explainProperty(property)}</p>
          </div>
          <div className={styles.avatarWrap}>
            <Image
              src="/images/pando-agent.png"
              alt="Pando, the Hi Pando AI concierge"
              width={170}
              height={191}
              className={styles.avatar}
              priority
            />
          </div>
        </div>

        {speechSupported && (
          <button
            type="button"
            className={styles.voicePill}
            onClick={toggleSpeaker}
            aria-label={muted ? "Turn Pando's voice on" : "Turn Pando's voice off"}
            title={muted ? "Voice off" : "Voice on"}
          >
            {muted ? (
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 6h2.5L8 3v10L4.5 10H2V6Z" fill="currentColor" />
                <path d="M10.5 5.5l4 5M14.5 5.5l-4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 6h2.5L8 3v10L4.5 10H2V6Z" fill="currentColor" />
                <path d="M10.8 5.3a3.6 3.6 0 0 1 0 5.4M12.7 3.6a6.3 6.3 0 0 1 0 8.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            )}
            {muted ? "Voice off" : "Voice on"}
          </button>
        )}
      </div>

      <div className={styles.chatSection}>
        <div className={styles.chatTitle}>Ask Pando about this property</div>

        <div className={styles.chatLog} ref={logRef}>
          {messages.length === 0 && (
            <div className={styles.chatEmpty}>
              Try “What are the main features of this property?”
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.chatBubble} ${
                message.sender === "user" ? styles.chatBubbleUser : styles.chatBubblePando
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>

        <form className={styles.chatInputBar} onSubmit={handleSubmit}>
          <input
            className={styles.chatInput}
            placeholder="Ask Pando anything about this property…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {voiceSupported && (
            <button
              type="button"
              className={`${styles.micBtn} ${isListening ? styles.micActive : ""}`}
              onClick={toggleVoiceInput}
              aria-label={isListening ? "Stop voice input" : "Ask by voice"}
              title={isListening ? "Listening…" : "Ask by voice"}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="5.5" y="1" width="5" height="8" rx="2.5" fill="currentColor" />
                <path d="M3 8a5 5 0 0 0 10 0M8 13v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <button type="submit" className={styles.sendBtn} aria-label="Send">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M1 8l14-6-6 14-2-6-6-2Z" fill="#ffffff" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
