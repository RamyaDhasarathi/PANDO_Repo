'use client';

// Single source of truth for Pando's text-to-speech voice, style, and playback
// in this app. Every page/component must speak through this module so the
// voice is identical everywhere and no component invents its own
// voice-selection logic.
//
// Primary voice: Microsoft Edge's free neural voice (via /api/tts), a natural,
// human-like female voice with no API key or quota. Falls back to the
// browser's built-in speechSynthesis if that's unavailable (network error,
// server down, etc.) so Pando never goes silent.

export const TTS_SETTINGS = {
  rate: 0.96,
  pitch: 1.06,
  volume: 1.0,
};

const FEMALE_NAME_HINTS = ['Natural', 'Google', 'Samantha', 'Jenny', 'Aria', 'Zira', 'Female', 'Victoria', 'Karen', 'Susan', 'Catherine', 'Hazel', 'Moira', 'Tessa', 'Fiona', 'Kate', 'Emma', 'Joanna', 'Salli', 'Kimberly'];
const MALE_NAME_HINTS = ['David', 'Mark', 'George', 'Guy', 'Alex', 'Daniel', 'James', 'Tom', 'Ryan', 'Oliver', 'Male', 'Fred'];

const nameMatchesAny = (name: string, hints: string[]) => {
  const lower = name.toLowerCase();
  return hints.some((hint) => lower.includes(hint.toLowerCase()));
};

const isFemaleNamed = (voice: SpeechSynthesisVoice) => nameMatchesAny(voice.name, FEMALE_NAME_HINTS);
const isMaleNamed = (voice: SpeechSynthesisVoice) => nameMatchesAny(voice.name, MALE_NAME_HINTS);
const isNaturalNamed = (voice: SpeechSynthesisVoice) => voice.name.toLowerCase().includes('natural');

let cachedVoice: SpeechSynthesisVoice | null = null;
let cachedVoiceKey: string | null = null;

/**
 * Ranks available browser voices toward a female, natural/human-like English voice.
 * Priority: natural female en-US -> other female en-US -> natural female English
 * -> other female English -> best available English voice. Never picks a
 * male-named voice on purpose. Used only for the browser-voice fallback path.
 */
export function selectPandoVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const voiceKey = voices.map((v) => v.voiceURI).join('|');
  if (cachedVoice && cachedVoiceKey === voiceKey) return cachedVoice;

  const isEnUS = (v: SpeechSynthesisVoice) => v.lang?.toLowerCase() === 'en-us';
  const isEnglish = (v: SpeechSynthesisVoice) => v.lang?.toLowerCase().startsWith('en');

  const femaleEnUS = voices.filter((v) => isEnUS(v) && isFemaleNamed(v));
  const femaleEnglish = voices.filter((v) => isEnglish(v) && isFemaleNamed(v));
  const nonMaleEnUS = voices.filter((v) => isEnUS(v) && !isMaleNamed(v));
  const nonMaleEnglish = voices.filter((v) => isEnglish(v) && !isMaleNamed(v));

  const chosen =
    femaleEnUS.find(isNaturalNamed) ||
    femaleEnUS[0] ||
    femaleEnglish.find(isNaturalNamed) ||
    femaleEnglish[0] ||
    nonMaleEnUS.find(isNaturalNamed) ||
    nonMaleEnUS[0] ||
    nonMaleEnglish.find(isNaturalNamed) ||
    nonMaleEnglish[0] ||
    voices.find(isEnUS) ||
    voices.find(isEnglish) ||
    voices[0];

  cachedVoice = chosen || null;
  cachedVoiceKey = voiceKey;
  return cachedVoice;
}

/** Pre-warms the browser voice list (Chrome loads voices asynchronously). */
export function primePandoVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    cachedVoiceKey = null;
    window.speechSynthesis.getVoices();
  };
}

let currentAudio: HTMLAudioElement | null = null;
// Bumped on every speak/stop call so a stale in-flight Edge TTS fetch can
// detect it's been superseded and avoid playing on top of newer speech —
// this is what was causing the "echo" of overlapping audio.
let speechGeneration = 0;

/** Immediately stops any in-flight or queued Pando speech (Edge TTS audio or browser voice). */
export function stopPandoSpeech() {
  speechGeneration += 1;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

interface SpeakPandoOptions {
  onStart?: () => void;
  onEnd?: (event?: unknown) => void;
  onError?: (event?: unknown) => void;
}

function speakWithBrowserVoice(text: string, { onStart, onEnd, onError }: SpeakPandoOptions = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = selectPandoVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'en-US';
    utterance.rate = TTS_SETTINGS.rate;
    utterance.pitch = TTS_SETTINGS.pitch;
    utterance.volume = TTS_SETTINGS.volume;

    if (onStart) utterance.onstart = onStart;
    utterance.onend = (event) => onEnd?.(event);
    utterance.onerror = (event) => onError?.(event);

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (e) {
    console.warn('Pando browser speech synthesis error:', e);
    onError?.(e);
    return null;
  }
}

async function speakWithEdgeTTS(text: string, generation: number, { onStart, onEnd, onError }: SpeakPandoOptions = {}) {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Edge TTS request failed (${response.status})`);
  }

  const blob = await response.blob();

  // A newer speak()/stop() call superseded this one while we were fetching —
  // discard the result instead of playing it on top of (or after) the
  // newer speech. This is what prevented the audio "echo."
  if (generation !== speechGeneration) return null;

  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = TTS_SETTINGS.volume;
  currentAudio = audio;

  audio.onplay = () => onStart?.();
  audio.onended = (event) => {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
    onEnd?.(event);
  };
  audio.onerror = (event) => {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
    onError?.(event);
  };

  await audio.play();
  return audio;
}

/**
 * Speaks `text` using Pando's unified voice. Tries Microsoft Edge's free
 * neural voice first for a natural, human-like voice; if that fails for any
 * reason (server down, network error), silently falls back to the browser's
 * built-in voice so Pando never goes silent. Always cancels any speech
 * already in progress first.
 */
export function speakPando(text: string, { onStart, onEnd, onError }: SpeakPandoOptions = {}) {
  if (typeof window === 'undefined') return null;
  if (!text) return null;

  stopPandoSpeech();
  const generation = speechGeneration;

  speakWithEdgeTTS(text, generation, { onStart, onEnd, onError }).catch((e) => {
    if (generation !== speechGeneration) return;
    console.warn('Edge TTS unavailable, falling back to browser voice:', e);
    speakWithBrowserVoice(text, { onStart, onEnd, onError });
  });

  return null;
}
