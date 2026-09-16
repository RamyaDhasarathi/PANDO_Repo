'use client';

import React, { useEffect, useState } from 'react';
import { X, Bookmark, Calendar, Check, ShieldCheck, Sparkles, MapPin, Bed, Bath, Maximize2 } from 'lucide-react';
import { Property } from '@/types/property';
import { StatusBadge } from './StatusBadge';

interface PropertyDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onRequestViewing: (property: Property) => void;
}

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onRequestViewing,
}) => {
  const [viewingSubmitted, setViewingSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'hidden';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !property) return null;

  const formatAed = (val: number) => 'AED ' + val.toLocaleString('en-US');
  const formatUsd = (val: number) => '~$' + val.toLocaleString('en-US') + ' USD';

  const handleViewingClick = () => {
    setViewingSubmitted(true);
    onRequestViewing(property);
    setTimeout(() => {
      setViewingSubmitted(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl sm:rounded-[24px] border border-[#E5DDD2] shadow-2xl overflow-hidden animate-slide-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Hero Image */}
        <div className="relative h-64 sm:h-80 w-full bg-[#EAE2D5] overflow-hidden">
          <img
            src={property.image}
            alt={property.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Top Left Badges */}
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="bg-white/95 backdrop-blur-md rounded-full px-3 py-1 text-[11px] font-bold text-[#111111] flex items-center space-x-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#D92828] animate-pulse" />
              <span>{property.indexLabel}</span>
            </div>
            <StatusBadge
              label={property.statusBadge.label}
              variant={property.statusBadge.variant}
            />
          </div>

          {/* Bottom Title Overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center space-x-1.5 text-xs text-white/80 font-medium mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#D92828]" />
              <span>{property.location}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {property.name}
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[60vh] overflow-y-auto">
          {/* Key Specs Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF6EE] p-4 rounded-2xl border border-[#EAE3D6] mb-6">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8A847C]">
                Valuation
              </span>
              <span className="text-base font-extrabold text-[#111111]">
                {formatAed(property.price)}
              </span>
              <span className="block text-[11px] text-[#706B64]">
                {formatUsd(property.priceUsd)}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8A847C]">
                Net Yield
              </span>
              <span className="text-base font-extrabold text-[#2E9B73]">
                {property.yield}%
              </span>
              <span className="block text-[11px] text-[#706B64]">
                Benchmark Est.
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8A847C]">
                Bedrooms
              </span>
              <span className="text-base font-extrabold text-[#111111] flex items-center space-x-1">
                <Bed className="w-4 h-4 text-[#8A847C]" />
                <span>{property.bedrooms} Beds</span>
              </span>
              <span className="block text-[11px] text-[#706B64]">
                {property.bathrooms} Baths
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8A847C]">
                Built-up Area
              </span>
              <span className="text-base font-extrabold text-[#111111] flex items-center space-x-1">
                <Maximize2 className="w-4 h-4 text-[#8A847C]" />
                <span>{property.area.toLocaleString()}</span>
              </span>
              <span className="block text-[11px] text-[#706B64]">
                SQ.FT
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-2">
              Architectural Overview
            </h4>
            <p className="text-xs sm:text-sm text-[#55524E] leading-relaxed">
              {property.description}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-2.5">
              Curated Amenities &amp; Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {property.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center space-x-2 text-xs text-[#33312E] bg-[#FAF8F5] border border-[#ECE5DB] p-2.5 rounded-xl"
                >
                  <Check className="w-3.5 h-3.5 text-[#2E9B73] flex-shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Neural Investment Insight */}
          <div className="p-4 bg-[#FDEBEC] border border-[#F9CED3] rounded-2xl">
            <div className="flex items-center space-x-2 mb-1 text-[#D92828] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pando Neural Investment Intelligence</span>
            </div>
            <p className="text-xs text-[#522327] leading-relaxed">
              {property.investmentInsight}
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#FAF6EE] border-t border-[#EAE3D6] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleSave(property.id)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
                isSaved
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#DDD4C7] text-[#333333] hover:bg-[#F2ECE1]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
              <span>{isSaved ? 'Saved to Portfolio' : 'Save Property'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-[#66625C] hover:text-[#111111] hover:bg-[#ECE6DA] transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleViewingClick}
              disabled={viewingSubmitted}
              className="bg-[#D92828] hover:bg-[#BE1F1F] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{viewingSubmitted ? 'VIP Viewing Requested ✓' : 'Request VIP Viewing'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
