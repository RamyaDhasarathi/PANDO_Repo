'use client';

import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import styles from './pando-properties.module.css';

export const PropertyCard = ({
  property,
  onOpenDetails,
  onToggleSave,
  isSaved = false,
  onSelect,
}) => {
  const [imageError, setImageError] = useState(false);

  // Format currency
  const formatAed = (val) => 'AED ' + (val?.toLocaleString('en-US') ?? '');
  const formatUsd = (val) => '~$' + (val?.toLocaleString('en-US') ?? '') + ' USD';

  const handleActivate = () => {
    onSelect?.(property);
    onOpenDetails?.(property);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  // The one standout differentiator, told as a plain line rather than a tag cluster
  const differentiator = property.tags?.[0];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={styles.card}
      aria-label={`View ${property.name}, ${property.propertyType}, ${formatAed(property.price)}`}
    >
      <div className={styles.cardImageWrap}>
        <img
          src={imageError ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' : property.image}
          alt=""
          onError={() => setImageError(true)}
          className={styles.cardImage}
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(property.id);
          }}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label={isSaved ? `Remove ${property.name} from saved` : `Save ${property.name}`}
          aria-pressed={isSaved}
          className={styles.saveBtn}
        >
          <Bookmark size={15} color="#FFFFFF" fill={isSaved ? '#FFFFFF' : 'none'} />
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
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
                fontWeight: 500,
                color: '#111827',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              {property.name || property.title}
            </h3>
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
                fontWeight: 600,
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

          <button
            type="button"
            style={{
              backgroundColor: '#d22c23',
              color: '#fff',
              border: 'none',
              borderRadius: '9999px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleActivate();
            }}
          >
            <span>View</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
