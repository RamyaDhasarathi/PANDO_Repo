'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, VolumeX } from 'lucide-react';
import { properties as rawDatasetProperties } from '@/data/properties';
import { usePandoTTS } from '@/hooks/usePandoTTS';

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

// Build unified property dataset
const UNIFIED_PROPERTIES = [
  // Flagship UI3 projects
  {
    id: 'hp-1007',
    title: 'Royal Atlantis Sky Penthouse',
    location: 'Palm Jumeirah',
    community: 'Palm Jumeirah',
    city: 'Dubai',
    price: 'AED 45,000,000',
    rawPrice: 45000000,
    meta: '5 BR · Villa & Penthouse',
    bedrooms: 5,
    bathrooms: 6,
    areaSqft: 6200,
    furnishing: 'Furnished',
    amenities: ['Pool', 'Private Beach', 'Parking', 'Garden', 'Concierge'],
    lat: 25.1124,
    lng: 55.1390,
    category: 'Penthouses',
    type: 'Buy',
    purpose: 'sale',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    description: 'Ultra-luxurious beachfront residence on Palm Jumeirah with private beach access and panoramic resort views.',
  },
  {
    id: 'hp-1002',
    title: 'Burj Khalifa Residences',
    location: 'Downtown Dubai',
    community: 'Downtown Dubai',
    city: 'Dubai',
    price: 'AED 400,000/yr',
    rawPrice: 400000,
    meta: '1 BR · Apartment',
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: 780,
    furnishing: 'Furnished',
    amenities: ['Pool', 'Gym', 'Parking', 'Burj View'],
    lat: 25.1972,
    lng: 55.2744,
    category: 'Apartments',
    type: 'Rent',
    purpose: 'rent',
    image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
    description: 'Luxury high-rise suites in Downtown Dubai with views of the Burj Khalifa and Dubai Fountains.',
  },
  {
    id: 'hp-1001',
    title: '2 BHK Apartment in Dubai Marina',
    location: 'Dubai Marina',
    community: 'Dubai Marina',
    city: 'Dubai',
    price: 'AED 1,850,000',
    rawPrice: 1850000,
    meta: '2 BR · Apartment',
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1250,
    furnishing: 'Semi-Furnished',
    amenities: ['Pool', 'Gym', 'Parking', 'Balcony'],
    lat: 25.0772,
    lng: 55.1332,
    category: 'Apartments',
    type: 'Buy',
    purpose: 'sale',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80&auto=format&fit=crop',
    description: 'A bright 2-bedroom apartment with unobstructed marina views, floor-to-ceiling windows and a spacious balcony.',
  },
  // Map remaining raw properties
  ...rawDatasetProperties
    .filter((p) => !['hp-1001', 'hp-1002', 'hp-1007'].includes(p.id))
    .map((p, index) => {
      const baseCoords = COMMUNITY_COORDS[p.community] || { lat: 25.12, lng: 55.22 };
      const offsetLat = ((index % 5) - 2) * 0.0045;
      const offsetLng = (Math.floor(index / 5) - 2) * 0.0045;
      const formattedPrice =
        p.purpose === 'rent'
          ? `AED ${p.price.toLocaleString()}/yr`
          : `AED ${p.price.toLocaleString()}`;

      let cat = 'Apartments';
      if (p.type === 'Villa') cat = 'Villas';
      else if (p.type === 'Townhouse') cat = 'Townhouses';
      else if (p.type === 'Plot') cat = 'Plots';
      else if (p.type === 'Commercial') cat = 'Commercial';

      return {
        id: p.id,
        title: p.title,
        location: p.community,
        community: p.community,
        city: p.city || 'Dubai',
        price: formattedPrice,
        rawPrice: p.price,
        meta: `${p.bedrooms || 0} BR · ${p.type}`,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqft: p.areaSqft,
        furnishing: p.furnishing,
        amenities: p.amenities || [],
        lat: baseCoords.lat + offsetLat,
        lng: baseCoords.lng + offsetLng,
        category: cat,
        type: p.purpose === 'sale' ? 'Buy' : 'Rent',
        purpose: p.purpose,
        image: p.images?.[0] || 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
        description: p.description,
      };
    }),
];

const CATEGORIES = ['All', 'Apartments', 'Villas', 'Off-Plan', 'Penthouses', 'Townhouses'];
const NAV_TABS = ['Buy', 'Rent', 'Off-Plan', 'Explore'];

const formatAedShort = (value) => {
  if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `AED ${Math.round(value / 1_000)}K`;
  return `AED ${value.toLocaleString()}`;
};

// Builds a live stats summary of whatever properties are currently on screen,
// so Pando's bubble always reflects the active filters instead of a static hint.
function buildResultsSummary(results, { activeCategory, activeNavTab, searchQuery }) {
  const verb = activeNavTab === 'Rent' ? 'to rent' : activeNavTab === 'Off-Plan' ? 'off-plan' : 'for sale';
  const categoryLabel = activeCategory !== 'All' ? ` ${activeCategory.toLowerCase()}` : '';
  const queryLabel = searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : '';

  if (results.length === 0) {
    return `No${categoryLabel} properties${queryLabel} found ${verb} right now. Try a different filter or search term.`;
  }

  const prices = results.map((p) => p.rawPrice).filter((v) => typeof v === 'number');
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange =
    minPrice === maxPrice
      ? formatAedShort(minPrice)
      : `${formatAedShort(minPrice)} to ${formatAedShort(maxPrice)}`;

  const communityCounts = results.reduce((acc, p) => {
    acc[p.community] = (acc[p.community] || 0) + 1;
    return acc;
  }, {});
  const topCommunity = Object.entries(communityCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const propertyWord = categoryLabel ? '' : results.length === 1 ? ' property' : ' properties';
  const communityNote = topCommunity ? `, mostly around ${topCommunity}` : '';

  return `I found ${results.length}${categoryLabel}${propertyWord}${queryLabel} ${verb}${communityNote}, ranging from ${priceRange}. Click any pin to explore.`;
}

const PANDO_TIPS = [
  'Did you know Palm Jumeirah properties have seen a 14% ROI increase this year?',
  'Downtown Dubai units offer strong capital appreciation and high tourist rental demand!',
  'Dubai Marina remains the top choice for beachfront luxury rental yields.',
  'Dubai Hills Estate offers championship golf courses and great family communities.',
  'Ask me anything or click any property pin to inspect live listings!',
];

export default function PandoMapExplore() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeNavTab, setActiveNavTab] = useState('Buy');
  const [searchQuery, setSearchQuery] = useState('');
  const { muted: isMuted, isSpeaking, isSpeakingRef, speak, toggleMute } = usePandoTTS();
  const [speechText, setSpeechText] = useState('');
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  // Increments each time a filter/tab is clicked — signals PandoMapInner to fly to Dubai
  const [filterZoomKey, setFilterZoomKey] = useState(0);
  const hasSpokenRef = useRef(false);
  const speechTextRef = useRef('');
  speechTextRef.current = speechText;

  // Filter properties
  const filteredProperties = useMemo(() => {
    return UNIFIED_PROPERTIES.filter((p) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
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
  }, [searchQuery, activeCategory, activeNavTab]);

  // Keep Pando's bubble in sync with whatever is currently on screen —
  // recomputes any time the category, tab, or search filters change.
  // A specific property selection (pin click / search match) takes priority
  // and is left alone here.
  useEffect(() => {
    if (selectedProperty) return;
    const summary = buildResultsSummary(filteredProperties, { activeCategory, activeNavTab, searchQuery });
    setSpeechText(summary);
  }, [filteredProperties, activeCategory, activeNavTab, searchQuery, selectedProperty]);

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

  useEffect(() => {
    if (hasUserInteracted) {
      speak(speechText);
    }
  }, [speechText, isMuted, hasUserInteracted, speak]);

  // Speak the initial summary immediately on landing. Browsers may block audio
  // before any user gesture on the page, so we also retry on the first
  // click/keydown/touch.
  useEffect(() => {
    if (!speechText || hasSpokenRef.current) return;
    hasSpokenRef.current = true;
    speak(speechText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechText]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasUserInteracted(true);
      if (!isSpeakingRef.current) {
        speak(speechTextRef.current);
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectProperty = (prop) => {
    setHasUserInteracted(true);
    setSelectedProperty(prop);
    const text = `Here are the details for ${prop.title} in ${prop.location}: ${prop.price} (${prop.meta}). ${prop.description}`;
    setSpeechText(text);
    speak(text);
  };

  const handlePandoClick = () => {
    setHasUserInteracted(true);
    const tip = PANDO_TIPS[Math.floor(Math.random() * PANDO_TIPS.length)];
    setSpeechText(tip);
    speak(tip);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setHasUserInteracted(true);
    if (!searchQuery.trim()) return;

    const q = searchQuery.toLowerCase().trim();
    const matches = UNIFIED_PROPERTIES.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.community.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.id.toLowerCase() === q
    );

    if (matches.length > 0) {
      const match = matches[0];
      setSelectedProperty(match);
      const msg = `Found ${matches.length} matching properties in Dubai! Displaying ${match.title} in ${match.location}: ${match.price}.`;
      setSpeechText(msg);
      speak(msg);
    } else {
      const notFoundMsg = `No exact match found for "${searchQuery}". Showing available Dubai properties.`;
      setSpeechText(notFoundMsg);
      speak(notFoundMsg);
    }
  };

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
                  toggleMute(speechText);
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
                setHasUserInteracted(true);
                setSelectedProperty(null);
                setActiveCategory(cat);
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
    </div>
  );
}
