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

  const formatAed = (val) => 'AED ' + val.toLocaleString('en-US');
  const formatUsd = (val) => '~$' + val.toLocaleString('en-US');

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
      </div>

      <div className={styles.cardBody}>
        <p className={styles.cardLocation}>{property.location}</p>
        <h3 className={styles.cardTitle}>{property.propertyType}</h3>

        <div className={styles.cardPriceRow}>
          <span className={styles.cardPrice}>{formatAed(property.price)}</span>
          <span className={styles.cardPriceUsd}>{formatUsd(property.priceUsd)}</span>
        </div>

        {differentiator && (
          <p className={styles.cardDifferentiator}>— {differentiator}</p>
        )}

        <div className={styles.cardFootRow}>
          <span className={styles.cardSpecs}>
            {property.bedrooms}-bed residence, {property.area.toLocaleString('en-US')} sq ft
          </span>
          <button
            type="button"
            className={styles.cardLink}
            onClick={(e) => {
              e.stopPropagation();
              handleActivate();
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <span>View residence</span>
            <span className={styles.cardArrow} aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
