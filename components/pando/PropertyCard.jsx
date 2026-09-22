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

  const handleCardClick = () => {
    onSelect?.(property);
  };

  const handleViewResidenceClick = (e) => {
    e?.stopPropagation();
    onOpenDetails?.(property);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenDetails?.(property);
    }
  };

  // The one standout differentiator, told as a plain line rather than a tag cluster
  const differentiator = property.tags?.[0];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={styles.card}
      aria-label={`View ${property.name || property.title}, ${property.propertyType || property.type}, ${formatAed(property.price)}`}
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
          aria-label={isSaved ? `Remove ${property.name || property.title} from saved` : `Save ${property.name || property.title}`}
          aria-pressed={isSaved}
          className={styles.saveBtn}
        >
          <Bookmark size={15} color="#FFFFFF" fill={isSaved ? '#FFFFFF' : 'none'} />
        </button>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHeaderRow}>
          <div className={styles.cardTitleWrap}>
            <div className={styles.cardLocation}>
              {property.location || property.community || 'Dubai'}
            </div>
            <h3 className={styles.cardTitle}>
              {property.name || property.title}
            </h3>
          </div>
          <div className={styles.cardPriceWrap}>
            <div className={styles.cardPrice}>
              {formatAed(property.price)}
            </div>
            <div className={styles.cardPriceUsd}>
              {formatUsd(property.priceUsd || (property.price * 0.27))}
            </div>
          </div>
        </div>
        
        <div className={styles.cardDifferentiator}>
          — {differentiator || property.propertyType || property.type}
        </div>

        <div className={styles.cardFootRow}>
          <div className={styles.cardSpecs}>
            {`${property.bedrooms || 0}-bed residence, ${(property.area || property.areaSqft || 0).toLocaleString('en-US')} sq ft`}
          </div>
          <button className={styles.cardLink} onClick={handleViewResidenceClick}>
            <span>View residence</span>
            <span className={styles.cardArrow} aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
