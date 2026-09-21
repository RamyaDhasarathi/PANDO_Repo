'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, ArrowUp, ChevronRight } from 'lucide-react';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import { PandoMascot } from './PandoMascot';
import { PropertyDNA } from './PropertyDNA';
import { PandoService } from '@/services/pandoService';
import { stopPandoSpeech } from '@/lib/ttsService';
import AuthForm from '@/components/AuthForm';
import styles from './pando-properties.module.css';

export const RecommendedProperties = ({
  properties = [],
  user = null,
  selectedPropertyId,
  onSelectProperty,
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
  const [pandoMessage, setPandoMessage] = useState('Loading your premium property recommendations...');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedCardProperty, setSelectedCardProperty] = useState(null);
  const [aiInput, setAiInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [statusState, setStatusState] = useState('IDLE');
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);
  const [lastHoveredPropertyId, setLastHoveredPropertyId] = useState(null);
  const [page, setPage] = useState(0);

  // Auth Modal & Speech Sync States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingPropertyId, setPendingPropertyId] = useState(null);
  const [pendingAuthPropertyId, setPendingAuthPropertyId] = useState(null);
  const [authMode, setAuthMode] = useState('sign-in');

  const pageCount = Math.max(1, Math.ceil(properties.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageProperties = properties.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  // Whenever the underlying result set or search/filter options change:
  // reset page, reset selected property card speech context, and synthesize
  // dynamic summary speech based on active DB properties and search query.
  useEffect(() => {
    setPage(0);
    setSelectedCardProperty(null);
    setHasInteracted(false);
    setPendingAuthPropertyId(null);
    
    const summary = PandoService.getSummaryMessage(pageProperties, {
      searchQuery,
      selectedLocation,
      selectedPrice,
      selectedType,
    });
    setPandoMessage(summary);

    if (pageProperties.length > 0 && !selectedPropertyId) {
      onSelectProperty?.(pageProperties[0].id);
    }
  }, [properties, searchQuery, selectedLocation, selectedPrice, selectedType]);

  const goToPage = (next) => {
    setPage(next);
    setHasInteracted(false);
    setSelectedCardProperty(null);
    setHoveredPropertyId(null);
    setLastHoveredPropertyId(null);
    setPendingAuthPropertyId(null);
  };

  const hoveredProperty = pageProperties.find((p) => p.id === hoveredPropertyId);
  const lastHoveredProperty = pageProperties.find((p) => p.id === lastHoveredPropertyId);
  
  const displayedProperty = selectedCardProperty || hoveredProperty || lastHoveredProperty || pageProperties[0];

  // Callback when Mascot Pando finishes speaking out loud
  const handleSpeechEnd = () => {
    if (!user && pendingAuthPropertyId) {
      setPendingAuthPropertyId(null);
      setAuthModalOpen(true);
    }
  };

  // Handle Property Card Click - Mascot Pando speaks first, modal opens on speech end if not logged in
  const handleOpenPropertyScreen = (property) => {
    if (!property) return;

    setSelectedCardProperty(property);
    onSelectProperty?.(property.id);
    
    const explanation = PandoService.getPropertyExplanation(property);
    setPandoMessage(explanation);
    setHasInteracted(true);
    setStatusState('SPEAKING');

    if (!user) {
      setPendingPropertyId(property.id);
      setPendingAuthPropertyId(property.id);
    }
  };

  // Handle 'Show me more details >' button click — open modal/navigate IMMEDIATELY with zero delay
  const handleShowMoreDetails = (property) => {
    if (!property) return;
    stopPandoSpeech();
    setPendingAuthPropertyId(null);
    
    if (!user) {
      setPendingPropertyId(property.id);
      setAuthModalOpen(true);
    } else {
      router.push(`/property/${property.id}`);
    }
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
        onSelectProperty?.(res.selectedId);
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
            if (res.selectedId) onSelectProperty?.(res.selectedId);
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
      {/* Quiet top telemetry line (replaces colorful status pills) */}
      <div className={styles.sectorHeader}>
        <div className={styles.sectorLeft}></div>
        <div className={styles.sectorRight}>
          Session synced — {properties.length} residences ready, voice on standby
        </div>
      </div>

      {/* Header row: serif title + quiet refine control */}
      <div className={styles.titleRow}>
        <div className={styles.titleLeftBlock}>
          <div className={styles.titleBadgeContainer}>
            <h1 className={styles.mainTitle}>Recommended for you</h1>
          </div>
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

      {/* Primary Workspace Box (2x2 Grid) */}
      <div className={styles.propertyAreaWrapper}>
        {properties.length === 0 ? (
          <div
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              padding: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827', margin: '0 0 8px 0' }}>
              No residences match your current criteria
            </p>
            <button
              onClick={() => {
                onSelectLocation('all');
                onSelectPrice('all');
                onSelectType('all');
                onSearchChange('');
              }}
              style={{
                backgroundColor: '#d22c23',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Stage: 2x2 quadrant grid */
          <div className={styles.quadrantGrid}>
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
          </div>
        )}

        {/* INTEGRATED PANDO OVERLAY UNIT MATCHING IMAGE 2 */}
        <div className={styles.pandoMascotFixedWrapper}>
          <PandoMascot
            message={pandoMessage}
            enableVoice={true}
            isListening={isListening}
            statusState={statusState}
            onSpeechEnd={handleSpeechEnd}
            onClick={() => {
              const currentProp = properties.find((p) => p.id === selectedPropertyId) || properties[0];
              if (currentProp) {
                const explanation = PandoService.getPropertyExplanation(currentProp);
                setPandoMessage(explanation);
                setStatusState('SPEAKING');
              }
            }}
          >
            <PropertyDNA property={displayedProperty} />
            
            <form onSubmit={handleAiSubmit} className="pando-ask-row" style={{ marginTop: '12px' }}>
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask Pando..."
                className="pando-ask-input"
                style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
              />
              <div className="pando-ask-actions">
                <button type="button" onClick={handleMicToggle} className={`pando-ask-mic ${isListening ? 'is-listening' : ''}`}>
                  <Mic size={14} strokeWidth={2.5} />
                </button>
                <button type="submit" className="pando-ask-send">
                  <ArrowUp size={14} strokeWidth={3} />
                </button>
              </div>
            </form>
            
            {selectedCardProperty && (
              <button
                type="button"
                className="pando-show-more-btn"
                onClick={() => {
                  handleShowMoreDetails(selectedCardProperty);
                }}
              >
                Show me more details &gt;
              </button>
            )}
          </PandoMascot>
        </div>
      </div>

      {/* Auth Modal Popup for Guest Users */}
      {authModalOpen && (
        <AuthForm 
          mode={authMode} 
          onSwitchMode={setAuthMode} 
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            if (pendingPropertyId) {
              router.push(`/property/${pendingPropertyId}`);
            }
          }}
        />
      )}
    </section>
  );
};
