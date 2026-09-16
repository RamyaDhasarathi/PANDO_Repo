'use client';

import React, { useState } from 'react';
import { ArrowRight, Bookmark, Sparkles } from 'lucide-react';
import { Property } from '@/types/property';
import { StatusBadge } from './StatusBadge';

interface PropertyCardProps {
  property: Property;
  onOpenDetails: (property: Property) => void;
  onToggleSave?: (propertyId: string) => void;
  isSaved?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onSelect?: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onOpenDetails,
  onToggleSave,
  isSaved = false,
  isSelected = false,
  isHighlighted = false,
  onSelect,
}) => {
  const [imageError, setImageError] = useState(false);

  // Format currency
  const formatAed = (val: number) => {
    return 'AED ' + val.toLocaleString('en-US');
  };

  const formatUsd = (val: number) => {
    return '~$' + val.toLocaleString('en-US') + ' USD';
  };

  const isActive = isSelected || isHighlighted;

  return (
    <div
      onClick={() => onSelect?.(property)}
      className={`group cursor-pointer rounded-xl sm:rounded-2xl border p-2 sm:p-2.5 flex flex-col h-full transition-all duration-300 relative overflow-hidden select-none ${
        isActive
          ? 'bg-[#FFFDF9] border-[#D92828] ring-2 ring-[#D92828]/90 shadow-md shadow-[#D92828]/10'
          : 'bg-white border-[#E8E1D8] hover:shadow-lg hover:shadow-black/[0.04] hover:border-[#D8CFBF]'
      }`}
    >

      {/* Active Selection / Match Badge */}
      {isActive && (
        <div className="absolute top-0 right-0 bg-[#D92828] text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg shadow-xs z-10 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 animate-spin" />
          <span>{isSelected ? 'SELECTED' : 'MATCH'}</span>
        </div>
      )}

      {/* Property Image & Top Overlays (Expands to fill available vertical card height cleanly) */}
      <div className="relative w-full flex-1 min-h-[160px] sm:min-h-[200px] lg:min-h-[220px] rounded-lg sm:rounded-xl overflow-hidden bg-[#ECE6DC] mb-2">
        <img
          src={imageError ? '/images/properties/fallback.jpg' : property.image}
          alt={property.name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Top Left: Index Overlay Pill */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-white/95 backdrop-blur-sm border border-white/60 rounded-full px-1.5 sm:px-2 py-0.5 flex items-center space-x-1 shadow-xs z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D92828] animate-pulse" />
          <span className="text-[8.5px] sm:text-[9.5px] font-bold text-[#111111] tracking-wider uppercase">
            {property.indexLabel}
          </span>
        </div>

        {/* Top Right: Save Bookmark Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(property.id);
          }}
          aria-label={isSaved ? 'Remove from saved' : 'Save property'}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-10"
        >
          <Bookmark
            className={`w-3 h-3 ${isSaved ? 'fill-white text-white' : 'text-white'}`}
          />
        </button>

        {/* Bottom Right: Sector Badge */}
        <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-black/75 backdrop-blur-sm border border-white/10 rounded px-1.5 py-0.5 text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider text-white z-10">
          {property.sectorBadge}
        </div>
      </div>

      {/* Title, Status Badge, Metadata & Tags (Compact without unwanted blank space) */}
      <div className="flex-shrink-0 space-y-1.5 mb-2">
        <div>
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <h3 className="text-xs sm:text-sm lg:text-[14px] font-black text-[#111111] tracking-tight truncate">
              {property.name}
            </h3>
            <div className="flex-shrink-0 scale-85 sm:scale-95 origin-right">
              <StatusBadge
                label={property.statusBadge.label}
                variant={property.statusBadge.variant}
              />
            </div>
          </div>

          <p className="text-[8.5px] sm:text-[9px] font-extrabold uppercase text-[#7A756F] tracking-wider truncate">
            {property.propertyType} • {property.bedrooms} BEDS //{' '}
            {property.area.toLocaleString('en-US')} SQ.FT
          </p>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-1">
          {property.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="bg-[#F8F5F0] border border-[#E9E4DC] text-[#4A4744] text-[8.5px] font-semibold px-1.5 py-0.5 rounded transition-colors hover:bg-[#F0EBE2] truncate max-w-[125px]"
            >
              {tag}
            </span>
          ))}
          {property.tags.length > 2 && (
            <span className="text-[8px] font-bold text-[#8C867E] self-center">
              +{property.tags.length - 2}
            </span>
          )}
        </div>
      </div>


      {/* Valuation & Action CTA */}
      <div className="pt-1.5 border-t border-[#F2ECE3] flex items-center justify-between gap-1 flex-shrink-0">
        <div>
          <span className="block text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-[#A09A92] leading-none mb-0.5">
            VALUATION
          </span>
          <div className="text-xs sm:text-sm lg:text-[14.5px] font-black text-[#111111] tracking-tight leading-none">
            {formatAed(property.price)}
          </div>
          <span className="hidden sm:block text-[8.5px] font-medium text-[#7E7A75] mt-0.5 leading-none">
            {formatUsd(property.priceUsd)}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(property);
          }}
          className="bg-[#181818] hover:bg-[#2C2C2C] active:scale-95 text-white text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase px-2.5 sm:px-3 py-1.5 rounded-full flex items-center space-x-1 transition-all shadow-2xs group-hover:shadow-xs flex-shrink-0"
        >
          <span>DETAILS</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};

