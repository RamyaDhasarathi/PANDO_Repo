'use client';

import React, { useState, useEffect } from 'react';
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
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [pandoMessage, setPandoMessage] = useState('Loading your premium property recommendations...');
  const [aiInput, setAiInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [statusState, setStatusState] = useState('IDLE');

  // Synchronize Pando's message with the loaded properties
  useEffect(() => {
    if (properties && properties.length > 0) {
      const firstProp = properties[0];
      setSelectedPropertyId(firstProp.id);
      
      if (searchQuery) {
        let spokenPrice = '';
        if (firstProp.price) {
          if (firstProp.price >= 1000000) {
            spokenPrice = `${(firstProp.price / 1000000).toFixed(1).replace('.0', '')} million dirhams`;
          } else if (firstProp.price >= 1000) {
            spokenPrice = `${(firstProp.price / 1000).toFixed(1).replace('.0', '')} thousand dirhams`;
          } else {
            spokenPrice = `${firstProp.price} dirhams`;
          }
        }
        setPandoMessage(`I found ${properties.length} properties matching "${searchQuery}". Here is a great option: ${firstProp.name || firstProp.title} ${spokenPrice ? 'for ' + spokenPrice : ''}.`);
      } else {
        setPandoMessage(PandoService.getPropertyExplanation(firstProp));
      }
    } else if (properties && properties.length === 0) {
      setPandoMessage(searchQuery ? `I couldn't find any properties matching "${searchQuery}". Try adjusting your filters.` : 'Welcome to the AI Concierge Workspace.');
    }
  }, [properties, searchQuery]);

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
      {/* Top Metadata Header Line matching Image 1 */}
      <div className={styles.sectorHeader}>
        <div className={styles.sectorLeft}>
          <span className={styles.locationPin}>📍</span>
          <span>DUBAI PRIME  /  AI CONCIERGE WORKSPACE</span>
        </div>
        <div className={styles.sectorRight}>
          <span>4 portfolios online</span>
          <span>•</span>
          <span>Voice engine ready</span>
        </div>
      </div>

      {/* Main Header & Filter Controls Row */}
      <div className={styles.titleRow}>
        <div className={styles.titleLeftBlock}>
          <div className={styles.titleBadgeContainer}>
            <h1 className={styles.mainTitle}>Recommended Properties</h1>

            {/* CURATION 02 Badge */}
            <div className={styles.curationBadge}>
              <span className={styles.curationText}>CURATION</span>
              <span className={styles.curationNumber}>02</span>
            </div>
          </div>
          <p className={styles.subTitle}>Handpicked homes that match your preferences</p>
        </div>

        {/* Filter Area (Location dropdown + Refine button) */}
        <div>
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
      </div>

      {/* Primary Workspace Box (2x2 Grid + Integrated Pando Unit matching Image 1) */}
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
                backgroundColor: '#111827',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                padding: '8px 18px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Smooth 2x2 Grid */
          <div className={styles.propertyVerticalScroll}>
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onOpenDetails={() => handleOpenPropertyScreen(property)}
                onToggleSave={onToggleSave}
                isSaved={savedIds.includes(property.id)}
                onSelect={() => handleOpenPropertyScreen(property)}
              />
            ))}
          </div>
        )}

        {/* INTEGRATED PANDO OVERLAY UNIT MATCHING IMAGE 1 */}
        <div className={styles.pandoFloatingUnit}>
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
          />

          {/* Compact Input Bar directly inside/below Speech Bubble */}
          <form onSubmit={handleAiSubmit} className={styles.compactAiBar}>
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask Pando anything about the property..."
              className={styles.compactAiInput}
            />

            <div className={styles.compactAiActions}>
              <button
                type="button"
                onClick={handleMicToggle}
                aria-label="Voice microphone input"
                className={`${styles.compactMicBtn} ${isListening ? styles.listening : ''}`}
                title={isListening ? 'Listening...' : 'Voice Input'}
              >
                <Mic size={15} />
              </button>

              <button
                type="submit"
                aria-label="Send query to Pando AI"
                className={styles.compactSendBtn}
                title="Ask Pando"
              >
                <ArrowUp size={14} strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
