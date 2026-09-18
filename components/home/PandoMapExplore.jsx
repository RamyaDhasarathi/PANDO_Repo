'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, VolumeX } from 'lucide-react';
import { getPandoVoice, PANDO_VOICE_SETTINGS } from '@/lib/pandoVoice';

const MASCOT_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hf_20260623_061342_344d0b5a-9b73-4799-b66d-cb78af38510c-Photoroom-8tRuDAVe4O0Gxxg6amlBrVSCOL6ouf.png';

// Dynamically import Leaflet map — SSR false
const PandoMapInner = dynamic(() => import('./PandoMapInner'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#c5a059', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 16, fontWeight: 700 }}>
        Loading Dubai Map...
      </div>
    </div>
  ),
});

// Community center coordinates in Dubai
const COMMUNITY_COORDS = {
  'Dubai Marina': { lat: 25.0772, lng: 55.1332 },
  'Downtown Dubai': { lat: 25.1972, lng: 55.2744 },
  'Palm Jumeirah': { lat: 25.1124, lng: 55.1390 },
  'Arabian Ranches': { lat: 25.0450, lng: 55.2750 },
  'Dubai Hills Estate': { lat: 25.1165, lng: 55.2505 },
  'Business Bay': { lat: 25.1852, lng: 55.2631 },
  'JVC': { lat: 25.0600, lng: 55.2080 },
  'Jumeirah': { lat: 25.1412, lng: 55.1852 },
  'Emirates Hills': { lat: 25.0680, lng: 55.1780 },
  'Dubai Creek Harbour': { lat: 25.1895, lng: 55.3370 },
  'Port de La Mer': { lat: 25.2340, lng: 55.2630 },
  'Water Canal': { lat: 25.1820, lng: 55.2500 },
};

// Empty, generated dynamically in component instead

const CATEGORIES = ['All', 'Apartments', 'Villas', 'Off-Plan', 'Penthouses', 'Townhouses'];
const NAV_TABS = ['Buy', 'Rent', 'Off-Plan', 'Explore'];

const PANDO_TIPS = [
  'Did you know Palm Jumeirah properties have seen a 14% ROI increase this year?',
  'Downtown Dubai units offer strong capital appreciation and high tourist rental demand!',
  'Dubai Marina remains the top choice for beachfront luxury rental yields.',
  'Dubai Hills Estate offers championship golf courses and great family communities.',
  'Ask me anything or click any property pin to inspect live listings!',
];

export default function PandoMapExplore({ dbProperties = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeNavTab, setActiveNavTab] = useState('Buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiSearchResults, setApiSearchResults] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const mutedRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechText, setSpeechText] = useState(
    'Click on any property pin to explore details, or search any area or project in Dubai!'
  );
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  // Increments each time a filter/tab is clicked — signals PandoMapInner to fly to Dubai
  const [filterZoomKey, setFilterZoomKey] = useState(0);

  // Map database properties to the expected map structure
  const UNIFIED_PROPERTIES = useMemo(() => {
    return dbProperties.map((p, index) => {
      const community = p.community || 'Dubai';
      
      const formattedPrice = p.purpose === 'rent'
        ? `AED ${p.price.toLocaleString()}/yr`
        : `AED ${p.price.toLocaleString()}`;

      return {
        id: p.originalId || p._id,
        title: p.title || p.name,
        location: community,
        community: community,
        city: p.city || 'Dubai',
        price: formattedPrice,
        rawPrice: p.price,
        meta: `${p.bedrooms || 0} BR · ${p.propertyType}`,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqft: p.areaSqft,
        furnishing: p.furnishing, 
        amenities: p.amenities || [],
        lat: p.coordinates?.lat || 25.12,
        lng: p.coordinates?.lng || 55.22,
        category: p.category,
        type: p.purpose === 'sale' ? 'Buy' : 'Rent',
        purpose: p.purpose, 
        image: p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
        description: p.description,
        source: p.source,
        listedBy: p.listedBy
      };
    });
  }, [dbProperties]);

  // Read URL query on mount
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('location') || '';
    const purpose = searchParams.get('purpose');
    const type = searchParams.get('type');

    if (purpose === 'rent') setActiveNavTab('Rent');
    else if (purpose === 'sale') setActiveNavTab('Buy');

    if (type) {
      if (type.toLowerCase().includes('villa')) setActiveCategory('Villas');
      else if (type.toLowerCase().includes('apartment')) setActiveCategory('Apartments');
      else if (type.toLowerCase().includes('townhouse')) setActiveCategory('Townhouses');
    }

    if (q) {
      setSearchQuery(q);
      const queryLower = q.toLowerCase();
      const match = UNIFIED_PROPERTIES.find(
        (p) =>
          p.title.toLowerCase().includes(queryLower) ||
          p.community.toLowerCase().includes(queryLower) ||
          p.location.toLowerCase().includes(queryLower) ||
          p.description.toLowerCase().includes(queryLower) ||
          p.id.toLowerCase() === queryLower
      );
      if (match) {
        setSelectedProperty(match);
        setSpeechText(`Found ${match.title} in ${match.location}: ${match.price}. ${match.description}`);
      }
    }
  }, [searchParams]);

  const speak = (text) => {
    if (mutedRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
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
      console.warn(e);
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (hasUserInteracted) {
      speak(speechText);
    }
  }, [speechText, isMuted, hasUserInteracted]);

  const handleSelectProperty = (prop) => {
    setHasUserInteracted(true);
    setSelectedProperty(prop);
    
    // Format price for natural speech instead of spelling out digits
    let spokenPrice = `${prop.rawPrice} dirhams`;
    if (prop.rawPrice >= 1000000) {
      spokenPrice = `${(prop.rawPrice / 1000000).toFixed(1).replace('.0', '')} million dirhams`;
    } else if (prop.rawPrice >= 1000) {
      spokenPrice = `${(prop.rawPrice / 1000).toFixed(1).replace('.0', '')} thousand dirhams`;
    }

    const text = `Here are the details for ${prop.title} in ${prop.location}: ${spokenPrice} (${prop.meta}). ${prop.description}`;
    setSpeechText(text);
    speak(text);
  };

  const handlePandoClick = () => {
    setHasUserInteracted(true);
    const tip = PANDO_TIPS[Math.floor(Math.random() * PANDO_TIPS.length)];
    setSpeechText(tip);
    speak(tip);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setHasUserInteracted(true);
    if (!searchQuery.trim()) {
      setApiSearchResults(null);
      return;
    }

    const q = searchQuery.trim();
    try {
      const res = await fetch(`/api/properties?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setApiSearchResults(data.data.map(d => d.id));
        const match = UNIFIED_PROPERTIES.find(p => p.id === data.data[0].id) || data.data[0];
        setSelectedProperty(match);
        const msg = `Found ${data.data.length} matching properties in Dubai! Displaying ${match.title || match.name} in ${match.location || match.community}.`;
        setSpeechText(msg);
        speak(msg);
      } else {
        setApiSearchResults([]);
        const notFoundMsg = `No exact match found for "${searchQuery}". Showing available Dubai properties.`;
        setSpeechText(notFoundMsg);
        speak(notFoundMsg);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  // Filter properties
  const filteredProperties = useMemo(() => {
    return UNIFIED_PROPERTIES.filter((p) => {
      // 1. Search Query Filter (via API if submitted)
      if (apiSearchResults !== null) {
        if (!apiSearchResults.includes(p.id)) return false;
      } else if (searchQuery.trim()) {
        // Fallback live-filter while typing if API hasn't run yet
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          p.title.toLowerCase().includes(q) ||
          p.community.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.id.toLowerCase() === q;
        if (!matchesQuery) return false;
      }

      // 2. Category Filter
      if (activeCategory !== 'All' && p.category !== activeCategory) {
        return false;
      }

      // 3. Header Tab (Buy / Rent / Off-Plan)
      if (activeNavTab === 'Buy') return p.type === 'Buy';
      if (activeNavTab === 'Rent') return p.type === 'Rent';
      if (activeNavTab === 'Off-Plan') return p.category === 'Off-Plan' || p.category === 'Plots';

      return true;
    });
  }, [searchQuery, apiSearchResults, activeCategory, activeNavTab, UNIFIED_PROPERTIES]);

  return (
    <div className="pando-app">
      {/* ── HEADER BAR ─────────────────────────────────────────── */}
      <header className="pando-header">
        <Link
          href="/"
          className="brand"
          onClick={() => {
            setSelectedProperty(null);
            setSpeechText('Click on any property pin to explore details, or search any area or project in Dubai!');
          }}
          style={{ textDecoration: 'none' }}
        >
          <span className="brand-avatar">
            <img src={MASCOT_URL} alt="Hi Pando" />
          </span>
          <span className="brand-name">Hi Pando!</span>
        </Link>

        <form className="pando-search" onSubmit={handleSearchSubmit}>
          <svg className="pando-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Marina, Downtown, Villa, Penthouse, hp-1001..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setApiSearchResults(null);
                setSelectedProperty(null);
              }}
              style={{
                background: 'transparent',
                border: 0,
                color: '#888',
                fontWeight: 700,
                cursor: 'pointer',
                marginRight: 10,
                fontSize: 14,
              }}
            >
              ✕
            </button>
          )}
        </form>

        <nav className="pando-navigation">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              className={activeNavTab === tab ? 'active' : ''}
              onClick={() => {
                setActiveNavTab(tab);
                setFilterZoomKey((k) => k + 1);
                setSpeechText(`Viewing top ${tab} properties in Dubai! Click any pin to inspect.`);
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* ── FULL-SCREEN MAP ─────────────────────────────────────── */}
      <main className="pando-map">
        <PandoMapInner
          properties={filteredProperties}
          selectedProperty={selectedProperty}
          onSelectProperty={handleSelectProperty}
          zoomLevel={13}
          filterZoomKey={filterZoomKey}
        />
      </main>

      {/* ── PROPERTY DETAILS MODAL / CARD ───────────────────────── */}
      {selectedProperty && (
        <div
          style={{
            position: 'absolute',
            left: 24,
            bottom: 24,
            width: 'min(420px, calc(100vw - 48px))',
            maxHeight: 'calc(100vh - 120px)',
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 20,
            boxShadow: '0 20px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06)',
            zIndex: 1000,
            overflowY: 'auto',
            animation: 'speechAppear 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Property Image Hero */}
          <div style={{ position: 'relative', width: '100%', height: 190, overflow: 'hidden', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <img
              src={selectedProperty.image}
              alt={selectedProperty.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80';
              }}
            />
            {/* Badges */}
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
              <span style={{
                background: selectedProperty.purpose === 'rent' ? '#4e7d63' : '#d22c23',
                color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: '0.08em',
                padding: '4px 9px', borderRadius: 999, textTransform: 'uppercase',
              }}>
                {selectedProperty.purpose === 'rent' ? 'FOR RENT' : 'FOR SALE'}
              </span>
              <span style={{
                background: 'rgba(0,0,0,0.65)', color: '#fff',
                fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 999,
              }}>
                {selectedProperty.category}
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedProperty(null)}
              style={{
                position: 'absolute', top: 12, right: 12, width: 30, height: 30,
                borderRadius: '50%', background: 'rgba(0,0,0,0.65)', color: '#fff',
                display: 'grid', placeItems: 'center', border: 0, cursor: 'pointer',
                fontWeight: 800, fontSize: 14,
              }}
              title="Close Details"
            >
              ✕
            </button>
          </div>

          {/* Property Content Details */}
          <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#d22c23', letterSpacing: '-0.02em' }}>
                {selectedProperty.price}
              </div>
              <h3 style={{ margin: '4px 0 2px', fontSize: 16, fontWeight: 800, color: '#1e1e22', lineHeight: 1.3 }}>
                {selectedProperty.title}
              </h3>
              <div style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                <span>📍 {selectedProperty.location}, {selectedProperty.city}</span>
              </div>
            </div>

            {/* Specs Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
              background: '#f8fafc', padding: '10px 12px', borderRadius: 12, border: '1px solid #eef0f4',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Bedrooms</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e1e22' }}>{selectedProperty.bedrooms ?? '-'} Beds</div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Bathrooms</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e1e22' }}>{selectedProperty.bathrooms ?? '-'} Baths</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Area</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e1e22' }}>{selectedProperty.areaSqft ? `${selectedProperty.areaSqft} sqft` : '-'}</div>
              </div>
            </div>

            {/* Description */}
            <p style={{ margin: 0, fontSize: 12, color: '#555', lineHeight: 1.5 }}>
              {selectedProperty.description}
            </p>

            {/* Amenities Chips */}
            {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {selectedProperty.amenities.map((am) => (
                  <span
                    key={am}
                    style={{
                      background: '#f1f5f9', color: '#475569', fontSize: 10,
                      fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                    }}
                  >
                    ✓ {am}
                  </span>
                ))}
              </div>
            )}

            {/* Primary Action Button */}
            <Link
              href={`/property/${selectedProperty.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: '#d22c23',
                color: '#fff',
                textDecoration: 'none',
                padding: '12px 18px',
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: '0.04em',
                boxShadow: '0 4px 14px rgba(210, 44, 35, 0.35)',
                transition: 'all 0.2s ease',
                marginTop: 4,
              }}
            >
              View Full Property Details
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* ── FLOATING PANDO AI CHARACTER OVER MAP (RIGHT SIDE) ── */}
      <div className="pando-ai">
        {/* Speech Bubble Attached Directly Above Pando's Extended Hand */}
        <div className="pando-speech-container">
          <div
            className={`speech-bubble ${isSpeaking ? 'speaking' : ''}`}
            role="status"
            onClick={handlePandoClick}
            style={{ cursor: 'pointer' }}
            title="Click to hear Pando speak"
          >
            <div className="bubble-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="bubble-pulse" /> PANDO SAYS
              </div>
              <button
                className={`bubble-mute-btn ${isMuted ? 'is-muted' : 'is-active'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setHasUserInteracted(true);
                  if (!isMuted) {
                    mutedRef.current = true;
                    window.speechSynthesis?.cancel();
                    setIsSpeaking(false);
                    setIsMuted(true);
                  } else {
                    mutedRef.current = false;
                    setIsMuted(false);
                    speak(speechText);
                  }
                }}
                title={isMuted ? 'Unmute Pando' : 'Mute Pando'}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
            <p>{speechText}</p>
            <div className="bubble-tail" />
          </div>


        </div>

        {/* 3D Mascot Character */}
        <img
          src={MASCOT_URL}
          alt="Pando AI Character"
          className="pando-ai-character"
          onClick={handlePandoClick}
        />
      </div>

      {/* ── CATEGORY FILTER (Top Left) ─────────────────────────── */}
      <div
        style={{ position: 'absolute', left: 24, top: 140, zIndex: 900 }}
        onMouseEnter={(e) => {
          const flyout = e.currentTarget.querySelector('.filter-flyout');
          if (flyout) flyout.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          const flyout = e.currentTarget.querySelector('.filter-flyout');
          if (flyout) flyout.style.opacity = '0';
        }}
      >
        <button
          style={{
            width: 50,
            height: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: 12,
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            border: '2px solid rgba(255,255,255,0.8)',
            color: '#444',
            cursor: 'pointer',
            gap: 2,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 800 }}>Filter</span>
        </button>

        <div
          className="filter-flyout"
          style={{
            position: 'absolute',
            left: '100%',
            top: 0,
            marginLeft: 12,
            width: 176,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(12px)',
            padding: 8,
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.06)',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'auto',
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setFilterZoomKey((k) => k + 1);
                const count = UNIFIED_PROPERTIES.filter((p) => {
                  if (cat !== 'All' && p.category !== cat) return false;
                  if (activeNavTab === 'Buy') return p.type === 'Buy';
                  if (activeNavTab === 'Rent') return p.type === 'Rent';
                  if (activeNavTab === 'Off-Plan') return p.category === 'Off-Plan' || p.category === 'Plots';
                  return true;
                }).length;
                const msg = `Showing ${count} ${cat} properties in Dubai. Click any pin to inspect.`;
                setSpeechText(msg);
                speak(msg);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                background: activeCategory === cat ? '#fff2f2' : 'transparent',
                color: activeCategory === cat ? '#d22c23' : '#444',
                border: 0,
                cursor: 'pointer',
                transition: 'all 0.15s',
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
