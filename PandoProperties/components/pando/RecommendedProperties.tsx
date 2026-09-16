'use client';

import React, { useState } from 'react';
import { Mic, Send, Sparkles, MessageSquare, Compass, ArrowUp } from 'lucide-react';



import { Property, SortOption } from '@/types/property';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import { PandoMascot } from './PandoMascot';
import { PandoService } from '@/services/pandoService';

interface RecommendedPropertiesProps {
  properties: Property[];
  onOpenDetails: (property: Property) => void;
  onToggleSave: (propertyId: string) => void;
  savedIds: string[];
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
  selectedPrice: string;
  onSelectPrice: (price: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const RecommendedProperties: React.FC<RecommendedPropertiesProps> = ({
  properties,
  onOpenDetails,
  onToggleSave,
  savedIds,
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
  // Selection & AI Assistant States
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('prop-1');
  const [matchingPropertyIds, setMatchingPropertyIds] = useState<string[]>(['prop-1']);
  const [pandoMessage, setPandoMessage] = useState<string>(
    'Palm Jumeirah is a premier beachfront sanctuary with 6 bedrooms, 8,400 sq.ft and private mooring. Current valuation is AED 85 million and available off-market.'
  );
  const [aiInput, setAiInput] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [statusState, setStatusState] = useState<'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'>('IDLE');

  // Handle Property Card Click
  const handleSelectProperty = (property: Property) => {
    setSelectedPropertyId(property.id);
    setMatchingPropertyIds([property.id]);
    const explanation = PandoService.getPropertyExplanation(property);
    setPandoMessage(explanation);
    setStatusState('SPEAKING');
  };

  // Handle AI Input Command Submission
  const handleAiSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!aiInput.trim()) return;

    const queryText = aiInput.trim();
    setAiInput('');
    setStatusState('THINKING');

    setTimeout(() => {
      const res = PandoService.processQuery(queryText, properties);
      setPandoMessage(res.reply);
      setMatchingPropertyIds(res.matchingIds);
      if (res.selectedId) {
        setSelectedPropertyId(res.selectedId);
      }
      setStatusState('SPEAKING');
    }, 300);
  };

  // Handle Mic Dictation Toggle
  const handleMicToggle = () => {
    const nextListening = !isListening;
    setIsListening(nextListening);
    if (nextListening) {
      setStatusState('LISTENING');
      setPandoMessage('Listening to your query... Speak now or type below.');
    } else {
      setStatusState('IDLE');
    }
  };

  // Quick suggestion clicks
  const handleQuickCommand = (cmd: string) => {
    setAiInput(cmd);
    const res = PandoService.processQuery(cmd, properties);
    setPandoMessage(res.reply);
    setMatchingPropertyIds(res.matchingIds);
    if (res.selectedId) setSelectedPropertyId(res.selectedId);
    setStatusState('SPEAKING');
  };

  return (
    <section className="h-full flex flex-col min-h-0 relative overflow-hidden bg-[#FAF5EC] border border-[#E8E1D8] rounded-2xl p-2.5 sm:p-3.5 lg:p-4 shadow-xs">
      {/* Top Metadata Header Line */}
      <div className="flex items-center justify-between text-[9.5px] sm:text-[10px] font-black text-[#D92828] uppercase tracking-wider mb-1 flex-shrink-0">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D92828] inline-block animate-pulse" />
          <span>SECTOR: DUBAI PRIME // AI CONCIERGE WORKSPACE</span>
        </div>
        <div className="hidden md:flex items-center space-x-2 text-[#7A756F]">
          <span>4 PORTFOLIOS ONLINE</span>
          <span>•</span>
          <span>VOICE ENGINE READY</span>
        </div>
      </div>

      {/* Main Header & Filter Controls Row */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5 flex-shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-black text-[#111111] tracking-tight whitespace-nowrap leading-none">
            Recommended Properties
          </h1>

          {/* CURATION 02 Badge */}
          <div className="bg-[#FDEBEC] border border-[#FAD0D4] rounded-lg px-2 py-0.5 flex items-center space-x-1 select-none flex-shrink-0">
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#D92828] leading-none">
              CURATION
            </span>
            <span className="text-[11px] font-black text-[#D92828] leading-none">
              02
            </span>
          </div>
        </div>

        {/* Filter Area (Location, Typology, Valuation dropdowns + Refine button) */}
        <div className="flex-shrink-0">
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
            totalMatches={Math.min(properties.length, 2)}
          />
        </div>
      </div>

      {/* Primary Workspace Box (Grid + Integrated Pando) */}
      <div className="flex-1 min-h-0 relative flex flex-col justify-between overflow-hidden mb-2">
        {/* 2-Column Property Grid (Only 2 Properties Side-by-Side) */}
        {properties.length === 0 ? (
          <div className="flex-1 bg-white rounded-2xl border border-[#E8E1D8] p-6 text-center flex flex-col items-center justify-center">
            <p className="text-sm font-bold text-[#111111] mb-1">
              No residences match your current criteria
            </p>
            <button
              onClick={() => {
                onSelectLocation('all');
                onSelectPrice('all');
                onSelectType('all');
                onSearchChange('');
              }}
              className="bg-[#111111] text-white text-xs font-bold px-4 py-1.5 rounded-full mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 overflow-hidden pr-1 pb-1">
            {properties.slice(0, 2).map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onOpenDetails={onOpenDetails}
                onToggleSave={onToggleSave}
                isSaved={savedIds.includes(property.id)}
                isSelected={selectedPropertyId === property.id}
                isHighlighted={matchingPropertyIds.includes(property.id)}
                onSelect={handleSelectProperty}
              />
            ))}
          </div>
        )}


        {/* INTEGRATED PANDO MASCOT & SPEECH BUBBLE (Bottom Right Corner inside Workspace) */}
        <div className="absolute bottom-1 right-1 pointer-events-none z-30 max-w-[90%] sm:max-w-[80%] lg:max-w-[70%] flex justify-end">
          <PandoMascot
            message={pandoMessage}
            enableVoice={true}
            isListening={isListening}
            statusState={statusState}
            onClick={() => {
              const currentProp = properties.find((p) => p.id === selectedPropertyId) || properties[0];
              if (currentProp) handleSelectProperty(currentProp);
            }}
          />
        </div>
      </div>

      {/* Quick Suggestion Pills */}
      <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-1 mb-1.5 text-[9px] font-bold flex-shrink-0 scrollbar-none">
        <span className="text-[#88827A] uppercase flex items-center gap-1 mr-1">
          <Compass className="w-3 h-3 text-[#D92828]" />
          <span>SUGGESTIONS:</span>
        </span>
        <button
          onClick={() => handleQuickCommand('Show me properties under AED 50M')}
          className="bg-white hover:bg-[#F3ECE1] border border-[#E2DAD0] text-[#333333] px-2.5 py-0.5 rounded-full transition-colors whitespace-nowrap"
        >
          Under AED 50M
        </button>
        <button
          onClick={() => handleQuickCommand('Which property has the most bedrooms?')}
          className="bg-white hover:bg-[#F3ECE1] border border-[#E2DAD0] text-[#333333] px-2.5 py-0.5 rounded-full transition-colors whitespace-nowrap"
        >
          Most Bedrooms
        </button>
        <button
          onClick={() => handleQuickCommand('Compare Palm Jumeirah and Dubai Hills Estate')}
          className="bg-white hover:bg-[#F3ECE1] border border-[#E2DAD0] text-[#333333] px-2.5 py-0.5 rounded-full transition-colors whitespace-nowrap"
        >
          Compare Palm vs Dubai Hills
        </button>
        <button
          onClick={() => handleQuickCommand('Show me waterfront properties')}
          className="bg-white hover:bg-[#F3ECE1] border border-[#E2DAD0] text-[#333333] px-2.5 py-0.5 rounded-full transition-colors whitespace-nowrap"
        >
          Waterfront Only
        </button>
      </div>

      {/* BOTTOM PROPERTY AI COMMAND BAR (White Pill Luxury Design matching Reference) */}
      <form
        onSubmit={handleAiSubmit}
        className="w-full bg-white border border-[#E2DDD5] rounded-full p-1.5 pl-4 sm:pl-5 flex items-center justify-between gap-3 shadow-md transition-all focus-within:border-[#D92828] focus-within:ring-2 focus-within:ring-[#D92828]/20 flex-shrink-0 z-40"
      >
        {/* Text Input */}
        <input
          type="text"
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          placeholder="Ask Pando anything about this estate..."
          className="flex-1 bg-transparent text-[#111111] placeholder-[#A09A92] text-xs sm:text-sm font-medium focus:outline-none"
        />

        {/* Right Actions: Microphone + Red Up-Arrow Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Microphone Toggle Button */}
          <button
            type="button"
            onClick={handleMicToggle}
            aria-label="Voice microphone input"
            className={`p-1.5 sm:p-2 rounded-full transition-all flex items-center justify-center ${
              isListening
                ? 'bg-[#D92828] text-white animate-pulse'
                : 'text-[#99938B] hover:text-[#111111] hover:bg-[#F5F0E6]'
            }`}
          >
            <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Vibrant Red Circle Send Button */}
          <button
            type="submit"
            aria-label="Send query to Pando AI"
            className="bg-[#D92828] hover:bg-[#B81E1E] text-white p-2 sm:p-2.5 rounded-full transition-all flex items-center justify-center shadow-sm active:scale-95 flex-shrink-0"
          >
            <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </button>
        </div>
      </form>
    </section>
  );
};


