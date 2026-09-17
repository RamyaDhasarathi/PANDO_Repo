'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, ArrowUp } from 'lucide-react';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import { PandoMascot } from './PandoMascot';
import { PandoService } from '@/services/pandoService';
import styles from './pando-properties.module.css';

export const RecommendedProperties = ({
  properties = [],
  onToggleSave,
  savedIds = [],
  selectedLocation,
  onSelectLocation,
  selectedPrice,
  onSelectPrice,
  selectedType,
  onSelectType,
  selectedSort,
  onSelectSort,
  searchQuery,
  onSearchChange,
}) => {
  const router = useRouter();

  // Selection & AI Assistant States
  const [selectedPropertyId, setSelectedPropertyId] = useState('prop-1');
  const [pandoMessage, setPandoMessage] = useState(
    'Palm Jumeirah is a premier beachfront sanctuary with 6 bedrooms, 8,400 sq.ft and private mooring. Current valuation is AED 85 million and available off-market.'
  );
  const [aiInput, setAiInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [statusState, setStatusState] = useState('IDLE');

  // Handle Property Card Click - Navigate directly to separate property screen
  const handleOpenPropertyScreen = (property) => {
    setSelectedPropertyId(property.id);
    const explanation = PandoService.getPropertyExplanation(property);
    setPandoMessage(explanation);
    router.push(`/property/${property.id}`);
  };

  // Handle AI Input Command Submission
  const handleAiSubmit = (e) => {
    e?.preventDefault();
    if (!aiInput.trim()) return;

    const queryText = aiInput.trim();
    setAiInput('');
    setStatusState('THINKING');

    setTimeout(() => {
      const res = PandoService.processQuery(queryText, properties);
      setPandoMessage(res.reply);
      if (res.selectedId) {
        setSelectedPropertyId(res.selectedId);
      }
      setStatusState('SPEAKING');
    }, 250);
  };

  // Handle Mic Dictation Toggle with SpeechRecognition
  const handleMicToggle = () => {
    const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRec) {
      const next = !isListening;
      setIsListening(next);
      if (next) {
        setPandoMessage('Listening to your query... Speak now or type below.');
      }
      return;
    }

    if (isListening) {
      setIsListening(false);
      setStatusState('IDLE');
    } else {
      try {
        const recognition = new SpeechRec();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setStatusState('LISTENING');
          setPandoMessage('Listening to your query... Speak now.');
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setAiInput(transcript);
            const res = PandoService.processQuery(transcript, properties);
            setPandoMessage(res.reply);
            if (res.selectedId) setSelectedPropertyId(res.selectedId);
            setStatusState('SPEAKING');
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
          setStatusState('IDLE');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  return (
    <section className={styles.workspaceCard}>
      {/* Quiet system-status line — one sentence, not a strip of colored pills */}
      <div className={styles.sectorHeader}>
        <div className={styles.sectorRight}>
          <span>Session synced — {properties.length} residences ready, voice on standby</span>
        </div>
      </div>

      {/* Header: serif headline + subtext, quiet refine control */}
      <div className={styles.titleRow}>
        <div className={styles.titleLeftBlock}>
          <h1 className={styles.mainTitle}>Recommended for you</h1>
          <p className={styles.subTitle}>Three residences matched to your brief, ranked by fit.</p>
        </div>

        <PropertyFilters
          selectedLocation={selectedLocation}
          onSelectLocation={onSelectLocation}
          selectedPrice={selectedPrice}
          onSelectPrice={onSelectPrice}
          selectedType={selectedType}
          onSelectType={onSelectType}
          selectedSort={selectedSort}
          onSelectSort={onSelectSort}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          totalMatches={properties.length}
        />
      </div>

      {/* 2x2 quadrant grid of exactly 3 residences, same shape, ranked by fit.
          The 4th (bottom-right) quadrant is deliberately left empty — Pando
          floats there independently, outside this grid entirely. */}
      <div className={styles.propertyAreaWrapper}>
        <div className={styles.quadrantGrid}>
          {properties.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                gridRow: '1 / -1',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid var(--p-hairline)',
                padding: '32px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--p-ink)', margin: '0 0 10px 0' }}>
                No residences match your current brief
              </p>
              <button
                onClick={() => {
                  onSelectLocation('all');
                  onSelectPrice('all');
                  onSelectType('all');
                  onSearchChange('');
                }}
                style={{
                  backgroundColor: 'var(--p-ink)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  padding: '9px 20px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              {/* Exactly 3 property cards, always visible — no pagination, no carousel */}
              {properties.slice(0, 3).map((property) => (
                <div key={property.id} className={styles.quadrantCard}>
                  <PropertyCard
                    property={property}
                    onOpenDetails={() => handleOpenPropertyScreen(property)}
                    onToggleSave={onToggleSave}
                    isSaved={savedIds.includes(property.id)}
                    onSelect={() => handleOpenPropertyScreen(property)}
                  />
                </div>
              ))}

              {/* Filler slots if fewer than 3 matches, keeps the grid's rhythm intact */}
              {Array.from({ length: Math.max(0, 3 - Math.min(properties.length, 3)) }).map((_, i) => (
                <div key={`filler-${i}`} className={styles.quadrantEmpty} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Pando — floats free in the bottom-right, outside the grid/card
          container entirely, matching the mascot + speech-bubble pattern
          used on Home and Explore */}
      <PandoMascot
        message={pandoMessage}
        enableVoice={true}
        isListening={isListening}
        statusState={statusState}
        onClick={() => {
          const currentProp = properties.find((p) => p.id === selectedPropertyId) || properties[0];
          if (currentProp) {
            const explanation = PandoService.getPropertyExplanation(currentProp);
            setPandoMessage(explanation);
            setStatusState('SPEAKING');
          }
        }}
      >
        {/* The single ask bar — the primary way to talk to Pando */}
        <form onSubmit={handleAiSubmit} className="pando-ask-row">
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Ask Pando…"
            className="pando-ask-input"
            aria-label="Ask Pando about these residences"
          />

          <div className="pando-ask-actions">
            <button
              type="button"
              onClick={handleMicToggle}
              aria-label="Voice microphone input"
              className={`pando-ask-mic ${isListening ? 'is-listening' : ''}`}
              title={isListening ? 'Listening...' : 'Voice input'}
            >
              <Mic size={15} />
            </button>

            <button
              type="submit"
              aria-label="Send query to Pando"
              className="pando-ask-send"
              title="Ask Pando"
            >
              <ArrowUp size={15} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </PandoMascot>
    </section>
  );
};
