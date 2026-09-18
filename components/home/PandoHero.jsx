'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import AuthForm from '@/components/AuthForm';
import ProfilePopup from '@/components/ProfilePopup';
import { getPandoVoice, PANDO_VOICE_SETTINGS } from '@/lib/pandoVoice';

const mascotUrl =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hf_20260623_061342_344d0b5a-9b73-4799-b66d-cb78af38510c-Photoroom-8tRuDAVe4O0Gxxg6amlBrVSCOL6ouf.png';

const replies = [
  'I can help you find a place that feels like home. Tell me your city, budget, and one non-negotiable.',
  'Let’s make the numbers feel simple. Share a budget and I’ll map out neighborhoods worth your time.',
  'Smart move. I’ll compare the real monthly cost, flexibility, and upside so you can choose with confidence.',
];

export default function PandoHero() {
  const router = useRouter();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState(replies[0]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mascotMove, setMascotMove] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [authMode, setAuthMode] = useState('sign-in');
  const hasSpokenRef = useRef(false);

  // Random mascot animations
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

    timeoutId = setTimeout(scheduleMove, 3000 + Math.random() * 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Fetch AI preferences to personalize greeting
  useEffect(() => {
    async function loadPreferences() {
      if (!user) {
        setReply(replies[0]);
        setIsPersonalized(false);
        return;
      }
      try {
        const res = await fetch('/api/buyer/profile');
        const data = await res.json();
        if (data.success && data.profile) {
          const { purchasingGoal, budgetRange, preferredTypology, preferredLocations } = data.profile;
          
          let greeting = `Welcome back, ${user.name || 'friend'}. `;
          if (purchasingGoal === 'Investor') {
            greeting += `I've prepared the latest high-yield investment data `;
            if (budgetRange) greeting += `for the ${budgetRange} bracket.`;
            else greeting += `for you today.`;
          } else if (purchasingGoal === 'End-User') {
            greeting += `Ready to find your perfect home? `;
            if (preferredTypology && preferredLocations?.length > 0) {
              greeting += `I've shortlisted some incredible ${preferredTypology.toLowerCase()}s in ${preferredLocations[0]}.`;
            } else if (preferredTypology) {
              greeting += `I have some amazing ${preferredTypology.toLowerCase()}s to show you.`;
            }
          } else {
            greeting += `I'm ready to help you find your next place.`;
          }
          
          setReply(greeting);
          setIsPersonalized(true);
        }
      } catch (err) {
        console.error("Failed to fetch preferences for hero", err);
      }
    }
    loadPreferences();
  }, [user]);

  const speak = (text) => {
    if (muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getPandoVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = PANDO_VOICE_SETTINGS.rate;
      utterance.pitch = PANDO_VOICE_SETTINGS.pitch;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    }
  };

  // Pre-load voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-speak on first user interaction (click, touch, keydown)
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!muted && !hasSpokenRef.current) {
        hasSpokenRef.current = true;
        speak(reply);
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [reply, muted]);

  const submitPrompt = (event) => {
    event?.preventDefault();
    const query = prompt.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
    const nextReply = query
      ? `Analyzing options for "${query}"... I’m ready when you are.`
      : (isPersonalized ? reply : replies[0]);
    setReply(nextReply);
    speak(nextReply);
  };

  const toggleMute = () => {
    if (!muted) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setMuted(true);
    } else {
      setMuted(false);
      speak(reply);
    }
  };

  const handleMascotOrBubbleClick = () => {
    if (muted) setMuted(false);
    speak(reply);
  };

  return (
    <main className="pando-shell">
      <div className="architecture-grid" aria-hidden="true" />
      <nav className="topbar">
        <a className="brand" href="/" aria-label="Hi Pando home">
          <span className="brand-avatar">
            <img src={mascotUrl} alt="" />
          </span>
          <span className="brand-name">Hi Pando!</span>
        </a>
        <div className="nav-actions">
          {user ? (
            <button 
              onClick={() => setIsProfileOpen(true)} 
              className="nav-action nav-action-soft" 
              style={{ cursor: 'pointer', background: 'rgba(255, 250, 243, 0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: '600', padding: '0 18px', minHeight: '34px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e11d48', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              Hi, {user.name || 'User'}
            </button>
          ) : (
            <button 
              className="nav-action nav-action-soft" 
              style={{cursor: 'pointer', background: 'rgba(255, 250, 243, 0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,0,0,0.08)', fontSize: '9px', fontWeight: '800', letterSpacing: '0.1em', padding: '0 18px', minHeight: '34px'}}
              onClick={() => {
                setAuthMode('sign-in');
                setIsAuthOpen(true);
              }}
            >
              SIGN IN / SIGN UP
            </button>
          )}
          <a className="nav-action nav-action-primary" href="/explore">
            EXPLORE MAP{' '}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <h1>
            Find your <em>next place.</em>
          </h1>

          <form className="prompt-form" onSubmit={submitPrompt}>
            <label htmlFor="pando-prompt">What are you looking for?</label>
            <div className="prompt-input-wrap">
              <input
                id="pando-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="A home, a neighborhood, a plan..."
                autoComplete="off"
              />
              <button type="submit" className="send-button" aria-label="Ask Pando">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        <div className="mascot-stage" aria-label="Pando the real estate advisor">
          <div
            className={`speech-bubble ${isSpeaking ? 'speaking' : ''}`}
            role="status"
            onClick={handleMascotOrBubbleClick}
            style={{ cursor: 'pointer' }}
            title="Click to hear Pando speak"
          >
            <div className="bubble-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span className="bubble-pulse" /> PANDO SAYS
              </div>
              <button
                type="button"
                className={`bubble-mute-btn ${muted ? 'is-muted' : 'is-active'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                aria-label={muted ? 'Unmute Pando' : 'Mute Pando'}
                aria-pressed={muted}
                title={muted ? 'Unmute Pando' : 'Mute Pando'}
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
            <p>{reply}</p>
            <div className="bubble-tail" />
          </div>
          <div className="mascot-orbit orbit-one" />
          <div className="mascot-orbit orbit-two" />
          <div
            className={`mascot-character ${mascotMove}`}
            onClick={handleMascotOrBubbleClick}
            style={{ cursor: 'pointer' }}
            title="Click to hear Pando speak"
          >
            <img
              className="mascot-image"
              src={mascotUrl}
              alt="Pando, a friendly red real estate advisor mascot"
            />
          </div>
        </div>
      </section>

      <footer className="footer-bar" aria-label="Hi Pando footer" />

      {isAuthOpen && (
        <AuthForm 
          mode={authMode} 
          onSwitchMode={setAuthMode} 
          onClose={() => setIsAuthOpen(false)} 
        />
      )}
      
      {isProfileOpen && (
        <ProfilePopup onClose={() => setIsProfileOpen(false)} />
      )}
    </main>
  );
}
