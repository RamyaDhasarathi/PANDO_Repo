'use client';

import React from 'react';
import './property-dna.css';

// Small stat chips shown inside Pando's speech bubble, between the quote
// and the ask row. Shows the top-ranked residence by default, and
// switches live to whichever card the mouse is hovering.
export const PropertyDNA = ({ property, isHovering = false }) => {
  if (!property) return null;

  const pricePerSqft = Math.round(property.price / property.area);

  const chips = [
    { icon: '✨', label: 'Lifestyle', value: property.tags?.[0] || property.propertyType },
    { icon: '🌱', label: 'Yield', value: `${property.yield}%` },
    { icon: '🏷️', label: 'Price/sq ft', value: `AED ${pricePerSqft.toLocaleString('en-US')}` },
  ];

  return (
    <div
      className={`dna-chip-row ${isHovering ? 'is-hovering' : ''}`}
      aria-label={`Property DNA for ${property.name}`}
    >
      {chips.map((chip) => (
        <div className="dna-chip" key={chip.label}>
          <span className="dna-chip-heading">
            <span className="dna-chip-icon" aria-hidden="true">{chip.icon}</span>
            <span className="dna-chip-label">{chip.label}</span>
          </span>
          <span className="dna-chip-value" key={`${property.id}-${chip.label}`}>
            {chip.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PropertyDNA;
