'use client';

import React, { useState } from 'react';
import RealPandoMap from './RealPandoMap';
import mascotImage from './mascot.png';
import './pando-map-experience.css';

// Multi-category dataset across Dubai real estate master developments
const PANDO_PROPERTIES = [
  // APARTMENTS
  {
    id: 'royal-atlantis',
    title: 'Royal Atlantis Sky Penthouse',
    location: 'Palm Jumeirah',
    price: 'AED 45.0M',
    meta: '4 BR · Apartment',
    lat: 25.1124,
    lng: 55.1390,
    category: 'Apartments',
    type: 'Buy',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
    description: 'Ultra-luxurious beachfront residence on Palm Jumeirah with private beach access and panoramic resort views.'
  },
  {
    id: 'jumeirah-living',
    title: 'Jumeirah Living',
    location: 'Jumeirah',
    price: 'AED 250K/yr',
    meta: '3 BR · Apartment',
    lat: 25.1412,
    lng: 55.1852,
    category: 'Apartments',
    type: 'Rent',
    image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80',
    description: 'Iconic coastal residence offering resort-style amenities along the pristine Jumeirah shoreline.'
  },
  {
    id: 'burj-khalifa-residences',
    title: 'Burj Khalifa Residences',
    location: 'Downtown Dubai',
    price: 'AED 400K/yr',
    meta: '2 BR · Apartment',
    lat: 25.1972,
    lng: 55.2744,
    category: 'Apartments',
    type: 'Rent',
    image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80',
    description: 'Luxury high-rise suites located in Downtown Dubai with views of the Burj Khalifa and Dubai Fountains.'
  },
  {
    id: 'marina-shores',
    title: 'Marina Shores',
    location: 'Dubai Marina',
    price: 'AED 4.9M',
    meta: '2 BR · Apartment',
    lat: 25.0772,
    lng: 55.1332,
    category: 'Apartments',
    type: 'Buy',
    image: 'https://images.unsplash.com/photo-1546412414-8035e1776c9a?auto=format&fit=crop&w=600&q=80',
    description: 'Premium waterfront tower offering direct canal access and vibrant marina promenade living.'
  },
  {
    id: 'peninsula-one',
    title: 'Peninsula One',
    location: 'Business Bay',
    price: 'AED 120K/yr',
    meta: '1 BR · Apartment',
    lat: 25.1852,
    lng: 55.2631,
    category: 'Apartments',
    type: 'Rent',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    description: 'Executive canal-side residence in Business Bay with strong rental yields and modern finishes.'
  },

  // VILLAS
  {
    id: 'emirates-hills-mansion',
    title: 'Emirates Hills Mansion',
    location: 'Emirates Hills',
    price: 'AED 45.0M',
    meta: '6 BR · Villa',
    lat: 25.0680,
    lng: 55.1780,
    category: 'Villas',
    type: 'Buy',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    description: 'Ultra-exclusive golf course estate mansion with private pool, basement cinema, and panoramic skyline views.'
  },
  {
    id: 'palm-frond-villa',
    title: 'Signature Frond Villa',
    location: 'Palm Jumeirah',
    price: 'AED 1.5M/yr',
    meta: '5 BR · Villa',
    lat: 25.1200,
    lng: 55.1300,
    category: 'Villas',
    type: 'Rent',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    description: 'Custom beachfront villa situated on a private frond with direct sea access and infinity pool.'
  },
  {
    id: 'dubai-hills-golf-villa',
    title: 'Golf Place Estate',
    location: 'Dubai Hills',
    price: 'AED 18.5M',
    meta: '5 BR · Villa',
    lat: 25.1165,
    lng: 55.2505,
    category: 'Villas',
    type: 'Buy',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    description: 'Serene golf course villa overlooking the 18-hole championship course in Dubai Hills Estate.'
  },

  // OFF-PLAN
  {
    id: 'como-residences',
    title: 'Como Residences',
    location: 'Palm Jumeirah',
    price: 'AED 21.0M',
    meta: '3 BR · Off-Plan',
    lat: 25.1050,
    lng: 55.1480,
    category: 'Off-Plan',
    type: 'Off-Plan',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
    description: 'Next-generation architectural landmark tower on Palm Jumeirah with 360-degree ocean views.'
  },
  {
    id: 'creek-waters',
    title: 'Creek Waters',
    location: 'Dubai Creek Harbour',
    price: 'AED 2.8M',
    meta: '2 BR · Off-Plan',
    lat: 25.1895,
    lng: 55.3370,
    category: 'Off-Plan',
    type: 'Off-Plan',
    image: 'https://images.unsplash.com/photo-1546412414-8035e1776c9a?auto=format&fit=crop&w=600&q=80',
    description: 'Waterfront sanctuary tower with high ROI projections in the heart of Dubai Creek Harbour.'
  },

  // PENTHOUSES
  {
    id: 'royal-atlantis-penthouse',
    title: 'Royal Atlantis Sky Penthouse',
    location: 'Palm Jumeirah',
    price: 'AED 3.5M/yr',
    meta: '5 BR · Penthouse',
    lat: 25.1320,
    lng: 55.1260,
    category: 'Penthouses',
    type: 'Rent',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
    description: 'Ultra-prime sky penthouse featuring private sky pool, resort services, and full ocean vistas.'
  },
  {
    id: 'one-canal-penthouse',
    title: 'One Canal Penthouse',
    location: 'Water Canal',
    price: 'AED 38.0M',
    meta: '4 BR · Penthouse',
    lat: 25.1820,
    lng: 55.2500,
    category: 'Penthouses',
    type: 'Buy',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    description: 'Bespoke luxury penthouse along the Dubai Water Canal with private elevator and rooftop pool.'
  },

  // TOWNHOUSES
  {
    id: 'sur-la-mer-townhouse',
    title: 'Sur La Mer Townhouse',
    location: 'Port de La Mer',
    price: 'AED 9.5M',
    meta: '3 BR · Townhouse',
    lat: 25.2340,
    lng: 55.2630,
    category: 'Townhouses',
    type: 'Buy',
    image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80',
    description: 'Italian Mediterranean-inspired waterfront townhouse with private rooftop terrace and marina access.'
  },
  {
    id: 'arabian-ranches-townhouse',
    title: 'Ranches III Townhouse',
    location: 'Arabian Ranches',
    price: 'AED 220K/yr',
    meta: '3 BR · Townhouse',
    lat: 25.0450,
    lng: 55.2750,
    category: 'Townhouses',
    type: 'Rent',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    description: 'Gated family townhouse community with lush parks, clubhouse, and swimming pools.'
  }
];

const CATEGORIES = ['All', 'Apartments', 'Villas', 'Off-Plan', 'Penthouses', 'Townhouses'];

export default function NewLandingPage() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeNavTab, setActiveNavTab] = useState('Buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(13);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState(
    'Click on any property pin to explore details, or ask me anything about properties in Dubai!'
  );

  React.useEffect(() => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [speechText, isMuted]);

  const handleSelectProperty = (prop) => {
    setSelectedProperty(prop);
    const text = `Here are the details for ${prop.title} in ${prop.location}: ${prop.price} (${prop.meta}). ${prop.description}`;
    setSpeechText(text);
  };

  const handleMicClick = (e) => {
    e.stopPropagation();
    if (isListening) return;
    
    setIsListening(true);
    setSpeechText("Listening to your request...");
    
    setTimeout(() => {
      setIsListening(false);
      const mockQueries = [
        { q: "Show me villas in Dubai Hills", propId: "dubai-hills-golf-villa", text: "I found this beautiful Golf Place Estate villa in Dubai Hills for you!" },
        { q: "Looking for an apartment in Business Bay", propId: "peninsula-one", text: "Here is Peninsula One, an excellent apartment in Business Bay." },
        { q: "Show me the Royal Atlantis", propId: "royal-atlantis", text: "Here is the ultra-luxurious Royal Atlantis Sky Penthouse!" }
      ];
      const selected = mockQueries[Math.floor(Math.random() * mockQueries.length)];
      
      setSearchQuery(selected.q);
      const match = PANDO_PROPERTIES.find(p => p.id === selected.propId);
      if (match) {
        setSelectedProperty(match);
        setActiveCategory('All');
        setSpeechText(selected.text);
      }
    }, 2500);
  };

  const handlePandoClick = () => {
    const tips = [
      "Did you know Palm Jumeirah properties have seen a 14% ROI increase this year?",
      "Downtown Dubai units offer strong capital appreciation and high tourist rental demand!",
      "Dubai Marina remains the top choice for beachfront luxury rental yields.",
      "Ask me anything or click any property pin to view live listings!"
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setSpeechText(randomTip);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const queryLower = searchQuery.toLowerCase();
    const match = PANDO_PROPERTIES.find(
      p => p.title.toLowerCase().includes(queryLower) || p.location.toLowerCase().includes(queryLower)
    );

    if (match) {
      handleSelectProperty(match);
    } else {
      setSpeechText(`Pando found top results matching "${searchQuery}" in Dubai! Click any pin to explore.`);
    }
  };

  const filteredProperties = PANDO_PROPERTIES.filter(p => {
    // 1. Filter by Property Category (Dropdown)
    if (activeCategory !== 'All' && p.category !== activeCategory) {
      return false;
    }
    
    // 2. Filter by Header Navigation (Buy/Rent)
    if (activeNavTab === 'Buy') {
      return p.type === 'Buy';
    } else if (activeNavTab === 'Rent') {
      return p.type === 'Rent';
    } else if (activeNavTab === 'Off-Plan') {
      return p.type === 'Off-Plan' || p.category === 'Off-Plan';
    }
    
    // If 'Explore', show all that passed the category filter
    return true;
  });

  return (
    <div className="pando-app">

      {/* TOP HEADER BAR */}
      <header className="pando-header">
        {/* Brand */}
        <div 
          className="brand" 
          onClick={() => {
            setSelectedProperty(null);
            setSpeechText('Click on any property pin to explore details, or ask me anything about properties in Dubai!');
          }}
        >
          <span className="brand-avatar">
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hf_20260623_061342_344d0b5a-9b73-4799-b66d-cb78af38510c-Photoroom-8tRuDAVe4O0Gxxg6amlBrVSCOL6ouf.png" alt="" />
          </span>
          <span className="brand-name">Hi Pando!</span>
        </div>

        {/* Search */}
        <form className="pando-search" onSubmit={handleSearchSubmit}>
          <svg className="pando-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search areas, projects, or anything in Dubai..."
          />
        </form>

        {/* Header Navigation */}
        <nav className="pando-navigation">
          {['Buy', 'Rent', 'Off-Plan', 'Explore'].map(tab => (
            <button
              key={tab}
              className={activeNavTab === tab ? 'active' : ''}
              onClick={() => {
                setActiveNavTab(tab);
                setSpeechText(`Viewing top ${tab} properties in Dubai! Click any pin to inspect.`);
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* FULL-SCREEN SATELLITE REAL MAP */}
      <main className="pando-map">
        <RealPandoMap
          properties={filteredProperties}
          selectedProperty={selectedProperty}
          onSelectProperty={handleSelectProperty}
          zoomLevel={zoomLevel}
        />
      </main>

      {/* FLOATING PANDO AI CHARACTER OVER MAP (RIGHT SIDE) */}
      <div className="pando-ai">
        {/* Speech Bubble Attached Directly Above Pando's Extended Hand */}
        <div className="pando-speech-container">
          <div
            className={`speech-bubble ${isSpeaking ? 'speaking' : ''}`}
            role="status"
            onClick={handlePandoClick}
            style={{ cursor: 'pointer' }}
          >
            <div className="bubble-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span className="bubble-pulse" /> PANDO SAYS
              </div>
              
              <div className="flex gap-2" style={{ marginRight: '-8px', marginTop: '-4px' }}>
                {/* Speaker Toggle Button */}
                <button
                  className="pando-bubble-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                    if (!isMuted) setIsSpeaking(false);
                  }}
                  title={isMuted ? "Unmute Pando" : "Mute Pando"}
                >
                  {isMuted ? (
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                  )}
                </button>
                {/* Mic Button */}
                <button
                  className="pando-bubble-action-btn"
                  onClick={handleMicClick}
                  title="Speak to Pando"
                  style={{ color: isListening ? '#d22c23' : '' }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                </button>
              </div>
            </div>
            <p>{speechText}</p>
            <div className="bubble-tail" />
          </div>
        </div>

        {/* 3D Mascot Character */}
        <img
          src={mascotImage.src}
          alt="Pando AI Character"
          className="pando-ai-character"
          onClick={handlePandoClick}
        />
      </div>

      {/* CATEGORY FILTER (Top Left, under layers) */}
      <div className="absolute left-6 top-[140px] z-[900] group">
        <button className="w-[50px] h-[50px] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md rounded-xl shadow-lg border-2 border-white/80 transition-transform hover:scale-105 hover:bg-white text-gray-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <span className="text-[9px] font-bold mt-0.5">Filter</span>
        </button>
        
        {/* Flyout Menu (Appears to the right) */}
        <div className="absolute left-full top-0 ml-3 w-44 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-left">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                activeCategory === cat ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => {
                setActiveCategory(cat);
                const count = PANDO_PROPERTIES.filter(p => {
                  if (cat !== 'All' && p.category !== cat) return false;
                  if (activeNavTab === 'Buy') return p.type === 'Buy';
                  if (activeNavTab === 'Rent') return p.type === 'Rent';
                  if (activeNavTab === 'Off-Plan') return p.type === 'Off-Plan' || p.category === 'Off-Plan';
                  return true;
                }).length;
                setSpeechText(`Showing ${count} ${cat} properties in Dubai. Click any pin to inspect.`);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
