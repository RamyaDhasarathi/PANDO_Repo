'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, Check, Search, X } from 'lucide-react';

export const PropertyFilters = ({
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
  totalMatches,
}) => {
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

  const locations = [
    { label: 'All Locations', value: 'all' },
    { label: 'Waterfront & Skyline', value: 'waterfront' },
    { label: 'Palm Jumeirah', value: 'Palm Jumeirah' },
    { label: 'Dubai Hills Estate', value: 'Dubai Hills Estate' },
    { label: 'Dubai Marina', value: 'Dubai Marina' },
    { label: 'Downtown Dubai', value: 'Downtown Dubai' },
  ];

  const propertyTypes = [
    { label: 'All Residences', value: 'all' },
    { label: 'Beachfront Sanctuary', value: 'Beachfront' },
    { label: 'Mansion District', value: 'Mansion' },
    { label: 'Waterfront Penthouse', value: 'Penthouse' },
    { label: 'Burj Khalifa View', value: 'Burj' },
  ];

  const priceRanges = [
    { label: 'All Valuations', value: 'all' },
    { label: 'Under AED 50M', value: 'under-50m' },
    { label: 'AED 50M – 80M', value: '50m-80m' },
    { label: 'AED 80M+', value: '80m-plus' },
  ];

  const sortOptions = [
    { label: 'AI Recommended', value: 'ai-recommended' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Highest Net Yield', value: 'yield' },
  ];

  const hasActiveFilters =
    selectedLocation !== 'all' ||
    selectedPrice !== 'all' ||
    selectedType !== 'all' ||
    searchQuery.trim() !== '';

  const resetFilters = () => {
    onSelectLocation('all');
    onSelectPrice('all');
    onSelectType('all');
    onSearchChange('');
    onSelectSort('ai-recommended');
  };

  const getActiveLocationLabel = () => {
    if (selectedLocation === 'all') return 'Waterfront & Skyline';
    const found = locations.find((l) => l.value === selectedLocation);
    return found ? found.label : 'Location';
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Primary Pill Filter Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Waterfront & Skyline Pill Dropdown Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsLocationDropdownOpen(!isLocationDropdownOpen);
              setIsRefineOpen(false);
            }}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              color: '#111827',
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <span style={{ color: '#6B7280', fontSize: '14px' }}>📍</span>
            <span style={{ whiteSpace: 'nowrap' }}>{getActiveLocationLabel()}</span>
            <ChevronDown size={14} color="#6B7280" />
          </button>

          {/* Quick Location Dropdown */}
          {isLocationDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '220px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                zIndex: 60,
                padding: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: '#9CA3AF',
                  padding: '6px 10px 4px',
                }}
              >
                Select Corridor
              </div>
              {locations.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => {
                    onSelectLocation(loc.value);
                    setIsLocationDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: selectedLocation === loc.value ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedLocation === loc.value ? '#FEF2F2' : 'transparent',
                    color: selectedLocation === loc.value ? '#DC2626' : '#111827',
                  }}
                >
                  <span>{loc.label}</span>
                  {selectedLocation === loc.value && <Check size={14} color="#DC2626" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refine Button matching Image 1 */}
        <button
          onClick={() => {
            setIsRefineOpen(!isRefineOpen);
            setIsLocationDropdownOpen(false);
          }}
          style={{
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            border: 'none',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <SlidersHorizontal size={14} color="#FFFFFF" />
          <span>Refine</span>
          {hasActiveFilters && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
              }}
            />
          )}
        </button>
      </div>

      {/* Expanded Refine Tray Modal / Drawer */}
      {isRefineOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 'min(92vw, 540px)',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8E1D8',
            borderRadius: '18px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.14)',
            zIndex: 60,
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '12px',
              borderBottom: '1px solid #F0EAE1',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#111111',
                }}
              >
                Neural Filter Engine
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#7E7A75',
                  backgroundColor: '#F7F2E9',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                {totalMatches} matched
              </span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#D92828',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={12} />
                <span>Reset All</span>
              </button>
            )}
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#99948D',
              }}
            />
            <input
              type="text"
              placeholder="Search Palm, Marina, Burj, 5-bed, superyacht..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#FAF6EE',
                border: '1px solid #E5DDD2',
                borderRadius: '10px',
                padding: '8px 12px 8px 32px',
                fontSize: '11px',
                color: '#111111',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Property Type */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#88837D',
                  letterSpacing: '0.06em',
                  marginBottom: '6px',
                }}
              >
                Property Typology
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {propertyTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => onSelectType(t.value)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: selectedType === t.value ? '#111111' : '#FAF6EE',
                      color: selectedType === t.value ? '#FFFFFF' : '#444444',
                      fontWeight: selectedType === t.value ? 700 : 500,
                    }}
                  >
                    <span>{t.label}</span>
                    {selectedType === t.value && <Check size={12} color="#FFFFFF" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#88837D',
                  letterSpacing: '0.06em',
                  marginBottom: '6px',
                }}
              >
                Valuation Bracket
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {priceRanges.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => onSelectPrice(p.value)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: selectedPrice === p.value ? '#111111' : '#FAF6EE',
                      color: selectedPrice === p.value ? '#FFFFFF' : '#444444',
                      fontWeight: selectedPrice === p.value ? 700 : 500,
                    }}
                  >
                    <span>{p.label}</span>
                    {selectedPrice === p.value && <Check size={12} color="#FFFFFF" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Strategy */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#88837D',
                  letterSpacing: '0.06em',
                  marginBottom: '6px',
                }}
              >
                Curation Sort
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sortOptions.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => onSelectSort(s.value)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: selectedSort === s.value ? '#111111' : '#FAF6EE',
                      color: selectedSort === s.value ? '#FFFFFF' : '#444444',
                      fontWeight: selectedSort === s.value ? 700 : 500,
                    }}
                  >
                    <span>{s.label}</span>
                    {selectedSort === s.value && <Check size={12} color="#FFFFFF" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
