'use client';

import React, { useState } from 'react';
import { Bookmark, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const PropertyCard = ({
  property,
  onOpenDetails,
  onToggleSave,
  isSaved = false,
  onSelect,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Format currency
  const formatAed = (val) => 'AED ' + (val?.toLocaleString('en-US') ?? '');
  const formatUsd = (val) => '~$' + (val?.toLocaleString('en-US') ?? '') + ' USD';

  const handleClick = () => {
    onSelect?.(property);
    onOpenDetails?.(property);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: 'pointer',
        borderRadius: '16px',
        border: isHovered ? '1px solid #D1D5DB' : '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        boxShadow: isHovered
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)'
          : '0 1px 3px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease',
      }}
      className="pando-property-card-item"
    >
      {/* Property Image & Overlays */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '210px',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#F3F4F6',
          marginBottom: '12px',
        }}
      >
        <img
          src={imageError ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' : property.image}
          alt={property.name}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isHovered ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.4s ease',
          }}
          className="pando-card-img"
        />

        {/* Top Left: Index Overlay Pill matching Image 1 */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '9999px',
            padding: '3px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#DC2626',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#111827',
              letterSpacing: '-0.01em',
            }}
          >
            {property.indexLabel || property.category || 'Prime'}
          </span>
        </div>

        {/* Top Right: Save Bookmark Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(property.id);
          }}
          aria-label={isSaved ? 'Remove from saved' : 'Save property'}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(6px)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'transform 0.2s ease',
          }}
          title={isSaved ? 'Saved in Portfolio' : 'Save Property'}
        >
          <Bookmark
            size={13}
            color="#FFFFFF"
            fill={isSaved ? '#FFFFFF' : 'none'}
          />
        </button>

        {/* Bottom Right: Sector Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(4px)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '9.5px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: '#FFFFFF',
            zIndex: 10,
          }}
        >
          {property.sectorBadge || 'Sector 01'}
        </div>
      </div>

      {/* Title, Status Badge, Specs & Feature Tags */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Title & Badge Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '4px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: 500, // Non-bold property names per user instruction
                color: '#111827',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              {property.name}
            </h3>
            <div style={{ flexShrink: 0 }}>
              {property.statusBadge ? (
                <StatusBadge
                  label={property.statusBadge.label}
                  variant={property.statusBadge.variant}
                />
              ) : (
                <StatusBadge
                  label={property.purpose === 'rent' ? 'For Rent' : 'For Sale'}
                  variant="exclusive"
                />
              )}
            </div>
          </div>

          {/* Specs Text Line */}
          <p
            style={{
              margin: '0 0 8px 0',
              fontSize: '12px',
              fontWeight: 400,
              color: '#6B7280',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {`${property.propertyType || property.category} • ${property.bedrooms || 0} Beds • ${(property.area || property.areaSqft || 0).toLocaleString('en-US')} sq.ft`}
          </p>

          {/* Feature Tags Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {(property.tags || property.amenities || []).slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  fontSize: '11px',
                  fontWeight: 400,
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  whiteSpace: 'nowrap',
                }}
              >
                {tag}
              </span>
            ))}
            {(property.tags || property.amenities || []).length > 2 && (
              <span
                style={{
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  color: '#6B7280',
                  fontSize: '11px',
                  fontWeight: 400,
                  padding: '3px 8px',
                  borderRadius: '9999px',
                }}
              >
                +{(property.tags || property.amenities || []).length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Valuation & Action Arrow Row */}
        <div
          style={{
            paddingTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 600, // Medium font weight for budget per user instruction
                color: '#111827',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {formatAed(property.price)}
            </div>
            <span
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 400,
                color: '#6B7280',
                marginTop: '2px',
                lineHeight: 1.1,
              }}
            >
              {formatUsd(property.priceUsd || (property.price * 0.27))}
            </span>
          </div>

          {/* Arrow Button */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#374151',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            <ArrowRight size={15} />
          </div>
        </div>
      </div>
    </div>
  );
};
