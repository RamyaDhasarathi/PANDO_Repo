'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, Check, Search, X } from 'lucide-react';
import { SortOption } from '@/types/property';

interface PropertyFiltersProps {
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
  totalMatches: number;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
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
  const [isWaterfrontDropdownOpen, setIsWaterfrontDropdownOpen] = useState(false);

  const locations = [
    { label: 'All Locations', value: 'all' },
    { label: 'Waterfront & Marina', value: 'waterfront' },
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

  const sortOptions: { label: string; value: SortOption }[] = [
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

  return (
    <div className="relative">
      {/* Primary Pill Filter Buttons */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5">
        {/* Waterfront & Skyline Pill Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => {
              setIsWaterfrontDropdownOpen(!isWaterfrontDropdownOpen);
              setIsRefineOpen(false);
            }}
            className="bg-white hover:bg-[#FAF6EE] border border-[#E2DAD0] text-[#111111] px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-[10.5px] sm:text-[12px] font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <span className="text-[#A49D94] text-[10px]">◇</span>
            <span className="whitespace-nowrap">
              {selectedLocation === 'all' ? (
                <>
                  <span className="hidden sm:inline">Waterfront &amp; Skyline</span>
                  <span className="sm:hidden">Waterfront</span>
                </>
              ) : (
                locations.find((l) => l.value === selectedLocation)?.label || 'Location'
              )}
            </span>
            <ChevronDown className="w-3 h-3 text-[#777777]" />
          </button>

          {/* Quick Location Dropdown */}
          {isWaterfrontDropdownOpen && (
            <div className="absolute top-full right-0 sm:left-0 mt-1.5 w-52 sm:w-56 bg-white border border-[#E8E1D8] rounded-xl sm:rounded-2xl shadow-xl z-50 p-1.5 animate-fade-in">
              <div className="text-[9.5px] uppercase font-bold text-[#99948D] px-2.5 py-1">
                Select Corridor
              </div>
              {locations.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => {
                    onSelectLocation(loc.value);
                    setIsWaterfrontDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-medium flex items-center justify-between transition-colors ${
                    selectedLocation === loc.value
                      ? 'bg-[#FBF4EC] text-[#D92828] font-bold'
                      : 'hover:bg-[#F9F6F0] text-[#222222]'
                  }`}
                >
                  <span>{loc.label}</span>
                  {selectedLocation === loc.value && (
                    <Check className="w-3.5 h-3.5 text-[#D92828]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refine Button */}
        <button
          onClick={() => {
            setIsRefineOpen(!isRefineOpen);
            setIsWaterfrontDropdownOpen(false);
          }}
          className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-[10.5px] sm:text-[12px] font-bold tracking-wider uppercase flex items-center space-x-1.5 transition-all shadow-xs ${
            isRefineOpen || hasActiveFilters
              ? 'bg-[#111111] text-white ring-2 ring-[#111111]/20'
              : 'bg-[#181818] hover:bg-[#2C2C2C] text-white'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3 text-[#E5D7C2]" />
          <span className="hidden sm:inline">REFINE</span>
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#D92828]" />
          )}
        </button>
      </div>

      {/* Expanded Refine Tray Modal / Drawer */}
      {isRefineOpen && (
        <div className="mt-3 p-4 bg-white border border-[#E8E1D8] rounded-2xl shadow-xl z-40 animate-slide-up">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1] mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Neural Filter Engine
              </span>
              <span className="text-[11px] font-medium text-[#7E7A75] bg-[#F7F2E9] px-2 py-0.5 rounded-full">
                {totalMatches} matched
              </span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] font-bold text-[#D92828] hover:underline flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative mb-4">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#99948D]" />
            <input
              type="text"
              placeholder="Search Palm, Marina, Burj, 5-bed, superyacht..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#FAF6EE] border border-[#E5DDD2] rounded-xl pl-8 pr-4 py-1.5 text-xs text-[#111111] placeholder:text-[#99948D] focus:outline-none focus:ring-1 focus:ring-[#D92828]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Property Type */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#88837D] tracking-wider mb-2">
                Property Typology
              </label>
              <div className="space-y-1">
                {propertyTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => onSelectType(t.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedType === t.value
                        ? 'bg-[#111111] text-white font-bold'
                        : 'text-[#444444] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <span>{t.label}</span>
                    {selectedType === t.value && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#88837D] tracking-wider mb-2">
                Valuation Bracket
              </label>
              <div className="space-y-1">
                {priceRanges.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => onSelectPrice(p.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedPrice === p.value
                        ? 'bg-[#111111] text-white font-bold'
                        : 'text-[#444444] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <span>{p.label}</span>
                    {selectedPrice === p.value && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Strategy */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#88837D] tracking-wider mb-2">
                Curation Sort Matrix
              </label>
              <div className="space-y-1">
                {sortOptions.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => onSelectSort(s.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedSort === s.value
                        ? 'bg-[#111111] text-white font-bold'
                        : 'text-[#444444] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <span>{s.label}</span>
                    {selectedSort === s.value && (
                      <Check className="w-3 h-3 text-white" />
                    )}
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
