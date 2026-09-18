'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, ArrowUp, ChevronRight } from 'lucide-react';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import { PandoMascot } from './PandoMascot';
import { PropertyDNA } from './PropertyDNA';
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
  const PAGE_SIZE = 3;

  // Selection & AI Assistant States
  const [selectedPropertyId, setSelectedPropertyId] = useState('prop-1');
  const [pandoMessage, setPandoMessage] = useState(() => PandoService.getSummaryMessage(properties.slice(0, PAGE_SIZE)));
  const [hasInteracted, setHasInteracted] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [statusState, setStatusState] = useState('IDLE');
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);
  const [lastHoveredPropertyId, setLastHoveredPropertyId] = useState(null);
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(properties.length / PAGE_SIZE));
  // Clamp so a filter change that shrinks the result set never leaves the
  // page pointing past the end.
  const currentPage = Math.min(page, pageCount - 1);
  const pageProperties = properties.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  // Whenever the underlying result set changes shape (new search/filter),
  // jump back to page 1 rather than stranding the user on a stale page.
  useEffect(() => {
    setPage(0);
  }, [properties]);

  // Keep the greeting in sync with the visible page (e.g. after filters
  // change or the user pages through results) until the user has actually
  // asked something or opened a card — at that point their conversation
  // takes priority over the summary.
  useEffect(() => {
    if (!hasInteracted) {
      setPandoMessage(PandoService.getSummaryMessage(pageProperties));
    }
  }, [pageProperties, hasInteracted]);

  const goToPage = (next) => {
    setPage(next);
    setHasInteracted(false);
    setHoveredPropertyId(null);
    setLastHoveredPropertyId(null);
  };

  const hoveredProperty = pageProperties.find((p) => p.id === hoveredPropertyId);
  const lastHoveredProperty = pageProperties.find((p) => p.id === lastHoveredPropertyId);
  // While hovering, show that card's details. Once the mouse leaves, keep
  // showing the last-hovered card rather than snapping back to the
  // generic message — only the fresh-load default falls through.
  const dnaProperty = hoveredProperty || lastHoveredProperty || pageProperties[0];
  const displayedMessage = hoveredProperty
    ? PandoService.getPropertyExplanation(hoveredProperty)
    : lastHoveredProperty
    ? PandoService.getPropertyExplanation(lastHoveredProperty)
    : pandoMessage;

  // Handle Property Card Click - Navigate directly to separate property screen
  const handleOpenPropertyScreen = (property) => {
    setSelectedPropertyId(property.id);
    const explanation = PandoService.getPropertyExplanation(property);
    setPandoMessage(explanation);
    setHasInteracted(true);
    setLastHoveredPropertyId(null);
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
      setHasInteracted(true);
      setLastHoveredPropertyId(null);
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
        setHasInteracted(true);
        setLastHoveredPropertyId(null);
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
          setHasInteracted(true);
          setLastHoveredPropertyId(null);
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setAiInput(transcript);
            const res = PandoService.processQuery(transcript, properties);
            setPandoMessage(res.reply);
            setHasInteracted(true);
            setLastHoveredPropertyId(null);
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
          <p className={styles.subTitle}>Residences matched to your brief, ranked by fit.</p>
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
              {/* Exactly 3 property cards per page — paginated when there are more matches */}
              {pageProperties.map((property) => (
                <div
                  key={property.id}
                  className={styles.quadrantCard}
                  onMouseEnter={() => {
                    setHoveredPropertyId(property.id);
                    setLastHoveredPropertyId(property.id);
                  }}
                  onMouseLeave={() => setHoveredPropertyId(null)}
                >
                  <PropertyCard
                    property={property}
                    onOpenDetails={() => handleOpenPropertyScreen(property)}
                    onToggleSave={onToggleSave}
                    isSaved={savedIds.includes(property.id)}
                    onSelect={() => handleOpenPropertyScreen(property)}
                  />
                </div>
              ))}

              {/* Filler slots if fewer than 3 matches on this page, keeps the grid's
                  rhythm intact. The 4th (bottom-right) quadrant itself stays empty
                  — Pando and its Property DNA chips float independently above it,
                  outside the grid entirely; page navigation lives in Pando's
                  speech bubble instead of this grid. */}
              {Array.from({ length: Math.max(0, PAGE_SIZE - pageProperties.length) }).map((_, i) => (
                <div key={`filler-${i}`} className={styles.quadrantEmpty} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Pando — floats free in the bottom-right, outside the grid/card
          container entirely, matching the mascot + speech-bubble pattern
          used on Home and Explore. The bubble's message and its Property
          DNA chips both switch live to whichever card is hovered. */}
      <PandoMascot
        message={displayedMessage}
        enableVoice={true}
        isListening={isListening}
        statusState={statusState}
        onClick={() => {
          const currentProp = lastHoveredProperty || pageProperties.find((p) => p.id === selectedPropertyId) || pageProperties[0];
          if (currentProp) {
            const explanation = PandoService.getPropertyExplanation(currentProp);
            setPandoMessage(explanation);
            setStatusState('SPEAKING');
          }
        }}
      >
        {/* Property DNA — sits inside the bubble, between the quote and
            the ask row, showing the hovered (or top-ranked) residence */}
        <PropertyDNA property={dnaProperty} isHovering={!!hoveredProperty} />

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

        {/* Next-page nudge — only appears when there are more residences
            beyond the 3 currently on screen. Keeps paging inside Pando's
            conversation rather than a separate grid control. */}
        {pageCount > 1 && (
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1 >= pageCount ? 0 : currentPage + 1)}
            style={{
              marginTop: '10px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '999px',
              border: '1px solid var(--p-hairline)',
              background: 'var(--p-surface, #fff)',
              color: 'var(--p-ink)',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <span>{currentPage + 1 >= pageCount ? 'Back to first residences' : 'Show me more residences'}</span>
            <ChevronRight size={14} />
          </button>
        )}
      </PandoMascot>
    </section>
  );
};
