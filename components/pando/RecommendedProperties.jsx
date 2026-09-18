'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, ArrowUp, ChevronRight } from 'lucide-react';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import { PandoMascot } from './PandoMascot';
import { PropertyDNA } from './PropertyDNA';
import { PandoService } from '@/services/pandoService';
import AuthForm from '@/components/AuthForm';

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

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingPropertyId, setPendingPropertyId] = useState(null);
  const [authMode, setAuthMode] = useState('sign-in');

  // Synchronize Pando's message with the loaded properties
  useEffect(() => {
    if (properties && properties.length > 0) {
      const firstProp = properties[0];
      if (!selectedPropertyId) {
        onSelectProperty?.(firstProp.id);
      }
      
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

  // Handle Property Card Click - Navigate to property or login
  const handleOpenPropertyScreen = (property) => {
    onSelectProperty?.(property.id);
    const explanation = PandoService.getPropertyExplanation(property);
    setPandoMessage(explanation);
    setHasInteracted(true);
    setLastHoveredPropertyId(null);
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
    <section className="h-full flex flex-col min-h-0 relative overflow-hidden bg-white border border-[#E5E7EB] rounded-[20px] p-[18px_24px] box-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] max-sm:p-[12px_14px] max-sm:rounded-[16px]">
      {/* Top Metadata Header Line matching Image 1 */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#d22c23] uppercase tracking-[0.04em] mb-[8px] shrink-0">
        <div className="flex items-center gap-[6px]">
          <span className="text-[12px]">📍</span>
          <span>DUBAI PRIME  /  AI CONCIERGE WORKSPACE</span>
        </div>
        <div className="flex items-center gap-[8px] text-[#9CA3AF] font-normal text-[12px] normal-case max-sm:hidden">
          <span>4 portfolios online</span>
          <span>•</span>
          <span>Voice engine ready</span>
        </div>
      </div>

      {/* Main Header & Filter Controls Row */}
      <div className="flex items-start justify-between gap-[16px] mb-[16px] shrink-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-[10px]">
            <h1 className="m-0 text-[24px] font-bold text-[#1e1e22] tracking-[-0.02em] whitespace-nowrap leading-[1.2] max-sm:text-[18px]">Recommended Properties</h1>

            {/* CURATION 02 Badge */}
            <div className="bg-[#d22c23]/12 border border-[#d22c23]/35 rounded-full px-[10px] py-[3px] flex items-center gap-[4px] select-none shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#d22c23] leading-none">CURATION</span>
              <span className="text-[11px] font-bold text-[#d22c23] leading-none">02</span>
            </div>
          </div>
          <p className="m-[4px_0_0_0] text-[13.5px] font-normal text-[#6B7280] leading-[1.3]">Handpicked homes that match your preferences</p>
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

      {/* Primary Workspace Box (2x2 Grid + Integrated Pando Unit matching Image 1) */}
      <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
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
          /* Smooth 2x2 Grid */
          <div className="flex-1 min-h-0 grid grid-cols-2 content-start gap-[16px] overflow-y-auto overflow-x-hidden pr-[2px] pb-[20px] box-border scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-md:grid-cols-1 max-md:gap-[14px]">
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
        <div className="absolute bottom-[12px] right-[12px] z-[35] flex flex-col items-end gap-[4px] w-full max-w-[min(92%,420px)] pointer-events-auto">
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
          <form onSubmit={handleAiSubmit} className="w-full max-w-[380px] bg-white border border-[#E5E7EB] rounded-full p-[5px_8px_5px_16px] flex items-center justify-between gap-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] box-border z-[40] transition-all duration-200 focus-within:border-[#d22c23] focus-within:shadow-[0_4px_20px_rgba(210,44,35,0.12),0_0_0_2px_rgba(210,44,35,0.1)]">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask Pando anything about the property..."
              className="flex-1 bg-transparent border-none outline-none text-[#1e1e22] text-[12px] font-normal font-sans min-w-0 placeholder:text-[#9CA3AF]"
            />

            <div className="flex items-center gap-[6px] shrink-0">
              <button
                type="button"
                onClick={handleMicToggle}
                aria-label="Voice microphone input"
                className={`bg-transparent border-none w-[32px] h-[32px] p-0 rounded-full flex items-center justify-center text-[#6B7280] cursor-pointer transition-all duration-150 shrink-0 hover:text-[#1e1e22] hover:bg-[#F3F4F6] ${isListening ? "bg-[#d22c23] text-white animate-[pulseListening_1.2s_infinite] hover:bg-[#d22c23] hover:text-white" : ""}`}
                title={isListening ? 'Listening...' : 'Voice Input'}
              >
                <Mic size={15} />
              </button>

              <button
                type="submit"
                aria-label="Send query to Pando AI"
                className="bg-[#d22c23] text-white border-none w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer shadow-[0_2px_6px_rgba(210,44,35,0.25)] transition-all duration-150 shrink-0 hover:bg-[#1e1e22] hover:scale-105 active:scale-95"
                title="Ask Pando"
              >
                <ArrowUp size={14} strokeWidth={2.5} />
              </button>
            </div>
          </form>
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
