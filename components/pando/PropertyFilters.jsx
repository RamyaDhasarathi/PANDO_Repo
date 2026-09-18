'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsRefineOpen(false);
        setIsLocationDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const locations = [
    { label: 'All locations', value: 'all' },
    { label: 'Waterfront & skyline', value: 'waterfront' },
    { label: 'Palm Jumeirah', value: 'Palm Jumeirah' },
    { label: 'Dubai Hills Estate', value: 'Dubai Hills Estate' },
    { label: 'Dubai Marina', value: 'Dubai Marina' },
    { label: 'Downtown Dubai', value: 'Downtown Dubai' },
  ];

  const propertyTypes = [
    { label: 'All residences', value: 'all' },
    { label: 'Beachfront sanctuary', value: 'Beachfront' },
    { label: 'Mansion district', value: 'Mansion' },
    { label: 'Waterfront penthouse', value: 'Penthouse' },
    { label: 'Burj Khalifa view', value: 'Burj' },
  ];

  const priceRanges = [
    { label: 'All valuations', value: 'all' },
    { label: 'Under AED 50M', value: 'under-50m' },
    { label: 'AED 50M – 80M', value: '50m-80m' },
    { label: 'AED 80M+', value: '80m-plus' },
  ];

  const sortOptions = [
    { label: 'Best fit', value: 'ai-recommended' },
    { label: 'Price: high to low', value: 'price-desc' },
    { label: 'Price: low to high', value: 'price-asc' },
    { label: 'Highest net yield', value: 'yield' },
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

  const listButtonStyle = (active) => ({
    width: '100%',
    textAlign: 'left',
    padding: '6px 4px',
    borderRadius: 0,
    fontSize: '12.5px',
    border: 'none',
    borderBottom: '1px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    color: active ? 'var(--p-ink)' : 'var(--p-stone)',
    fontWeight: active ? 500 : 400,
  });

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
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
              background: 'none',
              border: 'none',
              borderBottom: '1px solid var(--p-hairline)',
              color: 'var(--p-ink)',
              padding: '0 0 6px',
              fontSize: '13px',
              fontWeight: 400,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>{getActiveLocationLabel()}</span>
            <ChevronDown size={13} color="var(--p-stone)" />
          </button>

          {isLocationDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '220px',
                backgroundColor: 'var(--p-surface)',
                border: '1px solid var(--p-hairline)',
                borderRadius: '6px',
                boxShadow: '0 12px 28px rgba(30,30,34,0.10)',
                zIndex: 60,
                padding: '10px 12px',
              }}
            >
              {locations.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => {
                    onSelectLocation(loc.value);
                    setIsLocationDropdownOpen(false);
                  }}
                  style={listButtonStyle(selectedLocation === loc.value)}
                >
                  <span>{loc.label}</span>
                  {selectedLocation === loc.value && <Check size={13} color="var(--p-bronze)" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refine — quiet ghost text button, not a filled pill */}
        <button
          onClick={() => {
            setIsRefineOpen(!isRefineOpen);
            setIsLocationDropdownOpen(false);
          }}
          style={{
            padding: '0',
            fontSize: '13px',
            fontWeight: 400,
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: 'var(--p-ink)',
          }}
        >
          <SlidersHorizontal size={13} />
          <span>Refine</span>
          {hasActiveFilters && (
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: 'var(--p-bronze)',
              }}
            />
          )}
        </button>
      </div>

      {/* Expanded refine panel */}
      {isRefineOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 14px)',
            right: 0,
            width: 'min(92vw, 480px)',
            backgroundColor: 'var(--p-surface)',
            border: '1px solid var(--p-hairline)',
            borderRadius: '8px',
            boxShadow: '0 20px 44px rgba(30,30,34,0.12)',
            zIndex: 60,
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--p-hairline)',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--p-serif)',
                fontSize: '16px',
                fontWeight: 500,
                color: 'var(--p-ink)',
              }}
            >
              Refine your brief
            </span>
            <span style={{ fontSize: '12px', color: 'var(--p-stone)' }}>{totalMatches} matched</span>
          </div>

          <div style={{ position: 'relative', marginBottom: '18px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '2px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--p-stone)',
              }}
            />
            <input
              type="text"
              placeholder="Palm, Marina, Burj, 5-bed, superyacht…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--p-hairline)',
                padding: '4px 4px 8px 22px',
                fontSize: '13px',
                color: 'var(--p-ink)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '20px',
            }}
          >
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--p-stone)' }}>Typology</p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {propertyTypes.map((t) => (
                  <button key={t.value} onClick={() => onSelectType(t.value)} style={listButtonStyle(selectedType === t.value)}>
                    <span>{t.label}</span>
                    {selectedType === t.value && <Check size={12} color="var(--p-bronze)" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--p-stone)' }}>Valuation</p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {priceRanges.map((p) => (
                  <button key={p.value} onClick={() => onSelectPrice(p.value)} style={listButtonStyle(selectedPrice === p.value)}>
                    <span>{p.label}</span>
                    {selectedPrice === p.value && <Check size={12} color="var(--p-bronze)" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--p-stone)' }}>Sort</p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {sortOptions.map((s) => (
                  <button key={s.value} onClick={() => onSelectSort(s.value)} style={listButtonStyle(selectedSort === s.value)}>
                    <span>{s.label}</span>
                    {selectedSort === s.value && <Check size={12} color="var(--p-bronze)" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                marginTop: '18px',
                fontSize: '12px',
                color: 'var(--p-stone)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: 0,
              }}
            >
              <X size={12} />
              <span>Reset all</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
