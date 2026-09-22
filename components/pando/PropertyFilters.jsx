import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, ChevronDown, Check, Search, X } from 'lucide-react';
import styles from './pando-properties.module.css';

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
    if (selectedLocation === 'all') return 'All locations';
    const found = locations.find((l) => l.value === selectedLocation);
    return found ? found.label : 'All locations';
  };

  const listButtonStyle = (active) => ({
    width: '100%',
    textAlign: 'left',
    padding: '7px 8px',
    borderRadius: '6px',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: active ? '#F6F1E8' : 'transparent',
    color: active ? 'var(--p-ink)' : 'var(--p-stone)',
    fontWeight: active ? 600 : 400,
    transition: 'background-color 0.15s ease',
  });

  return (
    <div ref={containerRef} className={styles.filtersContainer} style={{ zIndex: (isRefineOpen || isLocationDropdownOpen) ? 5000 : 1 }}>
      {/* Primary Filter Row */}
      <div className={styles.filterPrimaryRow}>
        {/* All locations Pill Dropdown Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsLocationDropdownOpen(!isLocationDropdownOpen);
              setIsRefineOpen(false);
            }}
            className={styles.filterPillBtn}
          >
            <span style={{ whiteSpace: 'nowrap' }}>{getActiveLocationLabel()}</span>
            <ChevronDown size={14} color="var(--p-stone)" />
          </button>

          {isLocationDropdownOpen && (
            <div className={styles.locationDropdown}>
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

        {/* Refine Button */}
        <button
          onClick={() => {
            setIsRefineOpen(!isRefineOpen);
            setIsLocationDropdownOpen(false);
          }}
          className={styles.refineBtn}
        >
          <SlidersHorizontal size={14} />
          <span>Refine</span>
          {hasActiveFilters && (
            <span className={styles.activeFilterDot} />
          )}
        </button>
      </div>

      {/* Expanded Refine Panel */}
      {isRefineOpen && (
        <div className={styles.refinePanel}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--p-hairline)',
              marginBottom: '18px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--p-serif)',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--p-ink)',
              }}
            >
              Refine your brief
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--p-stone)' }}>{totalMatches} matched</span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--p-stone)',
              }}
            />
            <input
              type="text"
              placeholder="Palm, Marina, Burj, 5-bed, villa..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                background: '#F9F8F5',
                border: '1px solid var(--p-hairline)',
                borderRadius: '8px',
                padding: '8px 12px 8px 32px',
                fontSize: '13px',
                color: 'var(--p-ink)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--p-stone)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 3-Column Filter Options */}
          <div className={styles.refineGrid}>
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--p-stone)' }}>Typology</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {propertyTypes.map((t) => (
                  <button key={t.value} onClick={() => onSelectType(t.value)} style={listButtonStyle(selectedType === t.value)}>
                    <span>{t.label}</span>
                    {selectedType === t.value && <Check size={13} color="var(--p-bronze)" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--p-stone)' }}>Valuation</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {priceRanges.map((p) => (
                  <button key={p.value} onClick={() => onSelectPrice(p.value)} style={listButtonStyle(selectedPrice === p.value)}>
                    <span>{p.label}</span>
                    {selectedPrice === p.value && <Check size={13} color="var(--p-bronze)" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--p-stone)' }}>Sort</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {sortOptions.map((s) => (
                  <button key={s.value} onClick={() => onSelectSort(s.value)} style={listButtonStyle(selectedSort === s.value)}>
                    <span>{s.label}</span>
                    {selectedSort === s.value && <Check size={13} color="var(--p-bronze)" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--p-hairline)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={resetFilters}
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#d22c23',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: 0,
                }}
              >
                <X size={13} />
                <span>Reset all filters</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
