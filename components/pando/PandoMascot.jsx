import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, History, X } from 'lucide-react';
import { usePandoTTS } from '@/hooks/usePandoTTS';
import { fetchPropertyHistory } from '@/lib/historyService';
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
  onSpeechEnd,
  className = '',
  children,
}) {
  const finalMascotUrl = mascotUrl || src || DEFAULT_MASCOT_URL;
  const { muted, isSpeaking: internalSpeaking, speak, toggleMute: toggleTTSMute } = usePandoTTS({ enabled: enableVoice });
  const isSpeaking = externalIsSpeaking ?? internalSpeaking;
  const [mascotMove, setMascotMove] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);

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

  // Trigger speech whenever message updates
  useEffect(() => {
    if (message) {
      speak(message, {
        onEnd: () => {
          onSpeechEnd?.();
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const toggleMute = (e) => {
    e?.stopPropagation();
    toggleTTSMute(message || DEFAULT_MESSAGE);
    onVoiceToggle?.(!muted);
  };

  const toggleHistoryPopover = async (e) => {
    e?.stopPropagation();
    if (!historyOpen) {
      const items = await fetchPropertyHistory();
      setHistoryItems(items);
    }
    setHistoryOpen((prev) => !prev);
  };

  const handleCharacterClick = (e) => {
    onClick?.(e);
    speak(message || DEFAULT_MESSAGE, { force: true });
  };

  return (
    <div className={`pando-floating-agent ${className}`}>
      {/* Bubble — same gold "Pando says" speech-bubble pattern used on Home/Explore */}
      <div className="pando-bubble-col">
        <div className={`pando-bubble ${isSpeaking ? 'is-speaking' : ''}`}>
          <div className="pando-bubble-header">
            <span className="pando-bubble-dot" aria-hidden="true" />
            <span className="pando-bubble-label">Pando says</span>
            <div className="pando-bubble-actions">
              <button
                type="button"
                className={`pando-bubble-history-btn ${historyOpen ? 'is-active' : ''}`}
                onClick={toggleHistoryPopover}
                aria-label="View recent property history"
                title={historyOpen ? 'Show Pando message' : 'Recent property history'}
              >
                <History size={13} />
              </button>
              <button
                type="button"
                className={`pando-bubble-mute-btn ${muted ? 'is-muted' : ''}`}
                onClick={toggleMute}
                aria-label={muted ? 'Unmute Pando voice' : 'Mute Pando voice'}
                title={muted ? 'Voice is muted' : 'Voice is active'}
              >
                {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
            </div>
          </div>

          {historyOpen ? (
            <div className="pando-history-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="pando-history-header">
                <span className="pando-history-title">RECENT ACTIVITY</span>
                <button
                  type="button"
                  className="pando-history-close-btn"
                  onClick={() => setHistoryOpen(false)}
                  aria-label="Close history"
                >
                  <X size={13} />
                </button>
              </div>

              {historyItems.length === 0 ? (
                <p className="pando-history-empty">No recent property views yet</p>
              ) : (
                <div className="pando-history-list">
                  {historyItems.map((item, idx) => (
                    <a
                      key={item.propertyId || idx}
                      href={`/property/${item.propertyId}`}
                      className="pando-history-item"
                      onClick={() => setHistoryOpen(false)}
                    >
                      <img
                        src={item.image || '/images/pando-agent.png'}
                        alt={item.title}
                        className="pando-history-thumb"
                        onError={(e) => {
                          e.target.src = '/images/pando-agent.png';
                        }}
                      />
                      <div className="pando-history-info">
                        <p className="pando-history-item-title">{item.title}</p>
                        <p className="pando-history-item-meta">
                          {item.price ? `AED ${(item.price).toLocaleString()}` : item.location}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <blockquote key={message} className="pando-bubble-quote" role="status" aria-live="polite">
                {message}
              </blockquote>
              {children}
            </>
          )}

          {children}

          <span className="pando-bubble-tail" aria-hidden="true" />
        </div>
      </div>

      {/* Character — the virtual agent, made to shine: glow halo + twinkle accents */}
      <div
        className={`pando-character-wrap ${isSpeaking ? 'is-talking-anim' : ''}`}
        onClick={handleCharacterClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCharacterClick(e);
          }
        }}
        aria-label="Speak with Pando"
      >
        <span className="pando-sparkle pando-sparkle-1" aria-hidden="true" />
        <span className="pando-sparkle pando-sparkle-2" aria-hidden="true" />
        <img
          src={finalMascotUrl}
          alt="Pando, your residential concierge"
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
