'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, VolumeX } from 'lucide-react';
import { properties as rawDatasetProperties } from '@/data/properties';
import { useAuth } from '@/providers/AuthProvider';
import AuthForm from '@/components/AuthForm';
import { usePandoTTS } from '@/hooks/usePandoTTS';

const UNIFIED_PROPERTIES = rawDatasetProperties;

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

const CATEGORIES = ['All', 'Apartments', 'Villas', 'Off-Plan', 'Penthouses', 'Townhouses'];
const NAV_TABS = ['Buy', 'Rent', 'Off-Plan', 'Explore'];

const formatAedShort = (value) => {
  if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `AED ${Math.round(value / 1_000)}K`;
  return `AED ${value.toLocaleString()}`;
};

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
  const { user } = useAuth();
  
  // Auth modal states for protecting detail view
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingPropertyId, setPendingPropertyId] = useState(null);
  const [authMode, setAuthMode] = useState('sign-in');

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeNavTab, setActiveNavTab] = useState('Buy');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Unified Text-to-Speech
  const { muted: isMuted, isSpeaking, isSpeakingRef, speak, stop, toggleMute: toggleTTSMute } = usePandoTTS();
  const [speechText, setSpeechText] = useState(
    'Loading Dubai map properties & intelligence...'
  );
  
  // Live properties from MongoDB — used for map pins
  const [liveProperties, setLiveProperties] = useState([]);
  const [apiSearchResults, setApiSearchResults] = useState(null);

  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [filterZoomKey, setFilterZoomKey] = useState(0);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Fetch all properties from MongoDB on mount for map pins
  useEffect(() => {
    fetch('/api/properties')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          const normalized = data.data.map((p) => ({
            ...p,
            lat: p.coordinates?.lat ?? COMMUNITY_COORDS[p.community]?.lat ?? null,
            lng: p.coordinates?.lng ?? COMMUNITY_COORDS[p.community]?.lng ?? null,
            image: p.image || (p.images && p.images[0]) || null,
          }));
          setLiveProperties(normalized);
        }
      })
      .catch((err) => console.error('Map properties fetch error:', err));
  }, []);

  const hasSpokenRef = useRef(false);

  const overviewTextRef = useRef('');

  // Overview Analytics Speech when live properties land on Map page
  useEffect(() => {
    if (liveProperties && liveProperties.length > 0 && !hasSpokenRef.current) {
      const total = liveProperties.length;
      const villas = liveProperties.filter((p) =>
        (p.category || p.propertyType || '').toLowerCase().includes('villa')
      ).length;
      const apartments = liveProperties.filter((p) =>
        (p.category || p.propertyType || '').toLowerCase().includes('apartment')
      ).length;
      const penthouses = liveProperties.filter((p) =>
        (p.category || p.propertyType || '').toLowerCase().includes('penthouse')
      ).length;

      const commCounts = liveProperties.reduce((acc, p) => {
        const comm = p.community || p.location;
        if (comm) acc[comm] = (acc[comm] || 0) + 1;
        return acc;
      }, {});
      const topCommunities = Object.keys(commCounts).slice(0, 3).join(', ');

      const overviewText = `Welcome to Dubai Property Explorer! I am currently tracking ${total} premium residences across ${topCommunities || 'prime Dubai locations'} — featuring ${villas} luxury villas, ${apartments} apartments, and ${penthouses} sky penthouses. Click on any property pin on the map to explore full details!`;

      overviewTextRef.current = overviewText;
      setSpeechText(overviewText);
      speak(overviewText, {
        onStart: () => {
          hasSpokenRef.current = true;
        },
      });

      const handleFirstGesture = () => {
        if (!hasSpokenRef.current) {
          hasSpokenRef.current = true;
          speak(overviewText, { force: true });
        }
      };

      window.addEventListener('pointerdown', handleFirstGesture, { once: true });
      window.addEventListener('keydown', handleFirstGesture, { once: true });

      return () => {
        window.removeEventListener('pointerdown', handleFirstGesture);
        window.removeEventListener('keydown', handleFirstGesture);
      };
    }
  }, [liveProperties]);

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
    }
  }, [searchParams]);

  const getPropertySpeechText = (prop) => {
    if (!prop) return '';
    const rawPriceVal = prop.rawPrice || prop.price || 0;
    let spokenPrice = `${rawPriceVal.toLocaleString()} dirhams`;
    if (rawPriceVal >= 1000000) {
      spokenPrice = `${(rawPriceVal / 1000000).toFixed(1).replace('.0', '')} million dirhams`;
    } else if (rawPriceVal >= 1000) {
      spokenPrice = `${(rawPriceVal / 1000).toFixed(1).replace('.0', '')} thousand dirhams`;
    }

    const titleText = prop.title || prop.name || 'this property';
    const locText = prop.community || prop.location || 'Dubai';
    const metaText = prop.meta || (prop.bedrooms ? `${prop.bedrooms} Bed` : '');
    const descText = prop.description || '';

    return `Here are the details for ${titleText} in ${locText}: ${spokenPrice}${metaText ? ' (' + metaText + ')' : ''}. ${descText}`;
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    let textToSpeak = speechText;
    if (selectedProperty) {
      textToSpeak = getPropertySpeechText(selectedProperty);
    } else if (!textToSpeak || textToSpeak.startsWith('Loading')) {
      textToSpeak = overviewTextRef.current || 'Welcome to Dubai Property Explorer!';
    }
    toggleTTSMute(textToSpeak);
  };

  const handleSelectProperty = (prop) => {
    setHasUserInteracted(true);
    setSelectedProperty(prop);
    
    const text = getPropertySpeechText(prop);
    setSpeechText(text);
    speak(text);
  };

  // 3) TASK 3: Protect viewing full property details without login
  const handleViewFullPropertyDetails = (e, propId) => {
    e.preventDefault();
    if (!user) {
      setPendingPropertyId(propId);
      setAuthModalOpen(true);
    } else {
      router.push(`/property/${propId}`);
    }
  };

  const handlePandoClick = () => {
    setHasUserInteracted(true);
    if (selectedProperty) {
      const text = getPropertySpeechText(selectedProperty);
      setSpeechText(text);
      speak(text, { force: true });
    } else {
      const tip = PANDO_TIPS[Math.floor(Math.random() * PANDO_TIPS.length)];
      setSpeechText(tip);
      speak(tip, { force: true });
    }
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
        // Find the first match in liveProperties or fall back to raw API data
        const match = liveProperties.find(p => p.id === data.data[0].id) || data.data[0];
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

  // Filter properties using live DB data (has coordinates for map pins)
  const filteredProperties = useMemo(() => {
    // Use apiSearchResults IDs if a text search was submitted
    const pool = apiSearchResults !== null
      ? liveProperties.filter((p) => apiSearchResults.includes(p.id))
      : liveProperties;

    return pool.filter((p) => {
      // 1. Search Query Filter (client-side refinement)
      if (searchQuery.trim() && apiSearchResults === null) {
        const q = searchQuery.toLowerCase().trim();
        const title = (p.title || '').toLowerCase();
        const community = (p.community || p.location || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.category || p.propertyType || '').toLowerCase();
        const matchesQuery =
          title.includes(q) ||
          community.includes(q) ||
          desc.includes(q) ||
          cat.includes(q) ||
          (p.id || '').toLowerCase() === q;
        if (!matchesQuery) return false;
      }

      // 2. Category Filter
      if (activeCategory !== 'All') {
        const cat = (p.category || p.propertyType || '').toLowerCase();
        const target = activeCategory.toLowerCase();
        if (!cat.includes(target.replace(/s$/, ''))) return false;
      }

      // 3. Header Tab (Buy / Rent / Off-Plan)
      if (activeNavTab === 'Buy') return p.purpose === 'sale';
      if (activeNavTab === 'Rent') return p.purpose === 'rent';
      if (activeNavTab === 'Off-Plan') {
        const cat = (p.category || '').toLowerCase();
        return cat.includes('off-plan') || cat.includes('plot');
      }

      return true;
    });
  }, [searchQuery, activeCategory, activeNavTab, liveProperties, apiSearchResults]);

  return (
    <div className="pando-app">
      {/* ── HEADER BAR ─────────────────────────────────────────── */}
      <header className="pando-header">
        <Link
          href="/"
          className="brand"
          onClick={() => {
            setSelectedProperty(null);
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
                setHasUserInteracted(true);
                setSelectedProperty(null);
                setActiveNavTab(tab);
                setFilterZoomKey((k) => k + 1);
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
        <div className="pando-explore-property-card">
          <div className="pando-explore-drag-handle" />
          {/* Property Image Hero */}
          <div className="pando-card-hero">
            <img
              src={selectedProperty.image}
              alt={selectedProperty.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80';
              }}
            />
            {/* Badges */}
            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5 }}>
              <span style={{
                background: selectedProperty.purpose === 'rent' ? '#4e7d63' : '#d22c23',
                color: '#fff', fontSize: 9, fontWeight: 900, letterSpacing: '0.08em',
                padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase',
              }}>
                {selectedProperty.purpose === 'rent' ? 'FOR RENT' : 'FOR SALE'}
              </span>
              <span style={{
                background: 'rgba(0,0,0,0.65)', color: '#fff',
                fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 999,
              }}>
                {selectedProperty.category}
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedProperty(null)}
              style={{
                position: 'absolute', top: 10, right: 10, width: 28, height: 28,
                borderRadius: '50%', background: 'rgba(0,0,0,0.65)', color: '#fff',
                display: 'grid', placeItems: 'center', border: 0, cursor: 'pointer',
                fontWeight: 800, fontSize: 13,
              }}
              title="Close Details"
            >
              ✕
            </button>
          </div>

          {/* Property Content Details */}
          <div className="pando-card-body">
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#d22c23', letterSpacing: '-0.02em' }}>
                {selectedProperty.price}
              </div>
              <h3 style={{ margin: '2px 0 2px', fontSize: 14, fontWeight: 800, color: '#1e1e22', lineHeight: 1.25 }}>
                {selectedProperty.title}
              </h3>
              <div style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                <span>📍 {selectedProperty.location}, {selectedProperty.city}</span>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="pando-card-specs">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Bedrooms</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1e1e22' }}>{selectedProperty.bedrooms ?? '-'} Beds</div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 9, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Bathrooms</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1e1e22' }}>{selectedProperty.bathrooms ?? '-'} Baths</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Area</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1e1e22' }}>{selectedProperty.areaSqft ? `${selectedProperty.areaSqft} sqft` : '-'}</div>
              </div>
            </div>

            {/* Description */}
            <p className="pando-card-desc">
              {selectedProperty.description}
            </p>

            {/* Amenities Chips */}
            {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
              <div className="pando-card-amenities">
                {selectedProperty.amenities.slice(0, 3).map((am) => (
                  <span
                    key={am}
                    style={{
                      background: '#f1f5f9', color: '#475569', fontSize: 9,
                      fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                    }}
                  >
                    ✓ {am}
                  </span>
                ))}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              onClick={(e) => handleViewFullPropertyDetails(e, selectedProperty.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: '#d22c23',
                color: '#fff',
                border: 'none',
                width: '100%',
                cursor: 'pointer',
                padding: '10px 14px',
                borderRadius: 10,
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: '0.03em',
                boxShadow: '0 4px 12px rgba(210, 44, 35, 0.3)',
                transition: 'all 0.2s ease',
                marginTop: 2,
              }}
            >
              View Full Property Details
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING PANDO AI CHARACTER OVER MAP (RIGHT SIDE) ── */}
      <div className={`pando-ai ${selectedProperty ? 'has-card' : ''}`}>
        {/* Speech Bubble Attached Directly Above Pando's Extended Hand */}
        <div className={`pando-speech-container ${isCategoryOpen ? 'dimmed' : ''}`}>
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
                  toggleMute(e);
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
        className="pando-category-filter-wrap"
        onMouseEnter={() => setIsCategoryOpen(true)}
        onMouseLeave={() => setIsCategoryOpen(false)}
      >
        <button
          onClick={() => setIsCategoryOpen((prev) => !prev)}
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
          className={`filter-flyout ${isCategoryOpen ? 'open' : ''}`}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setHasUserInteracted(true);
                setSelectedProperty(null);
                setActiveCategory(cat);
                setIsCategoryOpen(false);
                setFilterZoomKey((k) => k + 1);
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

      {/* Auth Modal Popup for Guest Users attempting to view details */}
      {authModalOpen && (
        <AuthForm
          mode={authMode}
          onSwitchMode={setAuthMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            if (pendingPropertyId) {
              router.push(`/property/${pendingPropertyId}`);
            }
          }}
        />
      )}
    </div>
  );
}
