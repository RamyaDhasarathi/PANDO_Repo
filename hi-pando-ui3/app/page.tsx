'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Mic, Volume2, VolumeX } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePandoTTS } from '@/hooks/usePandoTTS'

const mascotUrl =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hf_20260623_061342_344d0b5a-9b73-4799-b66d-cb78af38510c-Photoroom-8tRuDAVe4O0Gxxg6amlBrVSCOL6ouf.png'

const replies = [
  'I can help you find a place that feels like home. Tell me your city, budget, and one non-negotiable.',
  'Let’s make the numbers feel simple. Share a budget and I’ll map out neighborhoods worth your time.',
  'Smart move. I’ll compare the real monthly cost, flexibility, and upside so you can choose with confidence.',
]

export default function Page() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [reply, setReply] = useState(replies[0])
  const { muted, isSpeaking, isSpeakingRef, speak, toggleMute: toggleTTSMute } = usePandoTTS()
  const [mascotMove, setMascotMove] = useState('')
  const hasSpokenRef = useRef(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const moves = ['mascot-twist', 'mascot-jump', 'mascot-dance']

    const scheduleMove = () => {
      const move = moves[Math.floor(Math.random() * moves.length)]
      setMascotMove(move)
      timeoutId = setTimeout(() => {
        setMascotMove('')
        scheduleMove()
      }, 2200)
    }

    timeoutId = setTimeout(scheduleMove, 3000 + Math.random() * 2000)
    return () => clearTimeout(timeoutId)
  }, [])

  // Speak immediately on landing. Browsers may block audio before any user
  // gesture on the page, so we also retry on the first click/keydown/touch.
  useEffect(() => {
    if (!muted && !hasSpokenRef.current) {
      hasSpokenRef.current = true
      speak(reply)
    }

    const handleFirstInteraction = () => {
      if (!muted && !isSpeakingRef.current) {
        speak(reply)
      }
    }

    window.addEventListener('click', handleFirstInteraction, { once: true })
    window.addEventListener('keydown', handleFirstInteraction, { once: true })
    window.addEventListener('touchstart', handleFirstInteraction, { once: true })

    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submitPrompt = (event?: FormEvent) => {
    event?.preventDefault()
    const query = prompt.trim()
    router.push(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
    const nextReply = prompt.trim()
      ? `${replies[Math.floor(Math.random() * replies.length)]} I’m ready when you are.`
      : replies[0]
    setReply(nextReply)
    speak(nextReply)
  }

  const toggleMute = () => toggleTTSMute()

  return (
    <main className="pando-shell">
      <div className="architecture-grid" aria-hidden="true" />
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="Hi Pando home">
          <span className="brand-avatar"><img src={mascotUrl} alt="" /></span>
          <span className="brand-name">Hi Pando!</span>
        </a>
        <div className="nav-actions">
          <a className="nav-action nav-action-soft" href="#sign-in">SIGN IN / SIGN UP</a>
          <a className="nav-action nav-action-primary" href="#post-property">POST YOUR PROPERTY <ArrowUpRight size={15} /></a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <h1>Find your <em>next place.</em></h1>

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
              <button type="button" className="mic-button" aria-label="Use voice input">
                <Mic size={19} />
              </button>
              <button type="submit" className="send-button" aria-label="Ask Pando"><ArrowUpRight size={22} /></button>
            </div>
          </form>

        </div>

        <div className="mascot-stage" aria-label="Pando the real estate advisor">
          <div className={`speech-bubble ${isSpeaking ? 'speaking' : ''}`} role="status">
            <div className="bubble-label"><span className="bubble-pulse" /> PANDO SAYS</div>
            <p>{reply}</p>
            <div className="bubble-tail" />
          </div>
          <div className="mascot-orbit orbit-one" />
          <div className="mascot-orbit orbit-two" />
          <div className={`mascot-character ${mascotMove}`}>
            <img className="mascot-image" src={mascotUrl} alt="Pando, a friendly red real estate advisor mascot" />
          </div>
          <button className="mute-button" type="button" onClick={toggleMute} aria-label={muted ? 'Unmute Pando' : 'Mute Pando'} aria-pressed={muted}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span>{muted ? 'MUTED' : 'VOICE ON'}</span>
          </button>
        </div>
      </section>

      <footer className="footer-bar" aria-label="Hi Pando footer" />
    </main>
  )
}
