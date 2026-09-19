'use client';

import React from 'react';
import './property-dna.css';

// Small stat chips shown inside Pando's speech bubble, between the quote
// and the ask row. Shows the top-ranked residence by default, and
// switches live to whichever card the mouse is hovering.
export const PropertyDNA = ({ property, isHovering = false }) => {
  if (!property) return null;

  const areaNum = Number(property.area) || 0;
  const priceNum = Number(property.price) || 0;
  const pricePerSqft = property.priceSqFt || (areaNum > 0 ? Math.round(priceNum / areaNum) : 1250);
  const yieldVal = property.yield || property.expectedYield || '4.8';

  const chips = [
    { icon: '✨', label: 'Lifestyle', value: property.tags?.[0] || property.lifestyle || property.propertyType || 'Waterfront' },
    { icon: '🌱', label: 'Yield', value: `${yieldVal}%` },
    { icon: '🏷️', label: 'Price/sq ft', value: `AED ${pricePerSqft.toLocaleString('en-US')}` },
  ];

  return (
    <div
      className={`dna-chip-row ${isHovering ? 'is-hovering' : ''}`}
      aria-label={`Property DNA for ${property.name || property.title || 'Residence'}`}
    >
      {chips.map((chip) => (
        <div className="dna-chip" key={chip.label}>
          <span className="dna-chip-heading">
            <span className="dna-chip-icon" aria-hidden="true">{chip.icon}</span>
            <span className="dna-chip-label">{chip.label}</span>
          </span>
          <span className="dna-chip-value" key={`${property.id || 'dna'}-${chip.label}`}>
            {chip.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PropertyDNA;
