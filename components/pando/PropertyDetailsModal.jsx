'use client';

import React, { useEffect, useState } from 'react';
import { X, Bookmark, Calendar, Check, Sparkles, MapPin, Bed, Maximize2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const PropertyDetailsModal = ({
  property,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onRequestViewing,
}) => {
  const [viewingSubmitted, setViewingSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
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

  const formatAed = (val) => 'AED ' + val.toLocaleString('en-US');
  const formatUsd = (val) => '~$' + val.toLocaleString('en-US') + ' USD';

  const handleViewingClick = () => {
    setViewingSubmitted(true);
    onRequestViewing?.(property);
    setTimeout(() => {
      setViewingSubmitted(false);
    }, 3000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E5DDD2',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 20,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Hero Image */}
        <div
          style={{
            position: 'relative',
            height: '260px',
            width: '100%',
            backgroundColor: '#EAE2D5',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={property.image}
            alt={property.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
            }}
          />

          {/* Top Left Badges */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(6px)',
                borderRadius: '9999px',
                padding: '4px 10px',
                fontSize: '10px',
                fontWeight: 800,
                color: '#111111',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#D92828',
                }}
              />
              <span>{property.indexLabel}</span>
            </div>
            <StatusBadge
              label={property.statusBadge.label}
              variant={property.statusBadge.variant}
            />
          </div>

          {/* Bottom Title Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '20px',
              right: '20px',
              color: '#FFFFFF',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              <MapPin size={13} color="#D92828" />
              <span>{property.location}</span>
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: '26px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
              }}
            >
              {property.name}
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px 24px',
            maxHeight: '52vh',
            overflowY: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {/* Key Specs Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              backgroundColor: '#FAF6EE',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid #EAE3D6',
              marginBottom: '20px',
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#8A847C',
                  marginBottom: '2px',
                }}
              >
                Valuation
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#111111',
                }}
              >
                {formatAed(property.price)}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '10px',
                  color: '#706B64',
                  marginTop: '1px',
                }}
              >
                {formatUsd(property.priceUsd)}
              </span>
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#8A847C',
                  marginBottom: '2px',
                }}
              >
                Net Yield
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#2E9B73',
                }}
              >
                {property.yield}%
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '10px',
                  color: '#706B64',
                  marginTop: '1px',
                }}
              >
                Benchmark Est.
              </span>
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#8A847C',
                  marginBottom: '2px',
                }}
              >
                Bedrooms
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#111111',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Bed size={14} color="#8A847C" />
                <span>{property.bedrooms} Beds</span>
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '10px',
                  color: '#706B64',
                  marginTop: '1px',
                }}
              >
                {property.bathrooms} Baths
              </span>
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#8A847C',
                  marginBottom: '2px',
                }}
              >
                Built-up Area
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#111111',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Maximize2 size={13} color="#8A847C" />
                <span>{property.area.toLocaleString()}</span>
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '10px',
                  color: '#706B64',
                  marginTop: '1px',
                }}
              >
                SQ.FT
              </span>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '18px' }}>
            <h4
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#111111',
                margin: '0 0 6px 0',
              }}
            >
              Architectural Overview
            </h4>
            <p
              style={{
                fontSize: '13px',
                color: '#55524E',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {property.description}
            </p>
          </div>

          {/* Amenities Grid */}
          <div style={{ marginBottom: '18px' }}>
            <h4
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#111111',
                margin: '0 0 8px 0',
              }}
            >
              Curated Amenities &amp; Specifications
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
              }}
            >
              {property.amenities.map((amenity) => (
                <div
                  key={amenity}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11.5px',
                    color: '#33312E',
                    backgroundColor: '#FAF8F5',
                    border: '1px solid #ECE5DB',
                    padding: '8px 12px',
                    borderRadius: '10px',
                  }}
                >
                  <Check size={13} color="#2E9B73" style={{ flexShrink: 0 }} />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Neural Investment Insight */}
          <div
            style={{
              padding: '14px',
              backgroundColor: '#FDEBEC',
              border: '1px solid #F9CED3',
              borderRadius: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
                color: '#D92828',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <Sparkles size={13} />
              <span>Pando Neural Investment Intelligence</span>
            </div>
            <p
              style={{
                fontSize: '12px',
                color: '#522327',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {property.investmentInsight}
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#FAF6EE',
            borderTop: '1px solid #EAE3D6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => onToggleSave?.(property.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: isSaved ? 'none' : '1px solid #DDD4C7',
              backgroundColor: isSaved ? '#111111' : '#FFFFFF',
              color: isSaved ? '#FFFFFF' : '#333333',
            }}
          >
            <Bookmark
              size={13}
              color={isSaved ? '#FFFFFF' : '#333333'}
              fill={isSaved ? '#FFFFFF' : 'none'}
            />
            <span>{isSaved ? 'Saved to Portfolio' : 'Save Property'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#66625C',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              onClick={handleViewingClick}
              disabled={viewingSubmitted}
              style={{
                backgroundColor: '#D92828',
                color: '#FFFFFF',
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(217, 40, 40, 0.25)',
              }}
            >
              <Calendar size={13} />
              <span>{viewingSubmitted ? 'VIP Viewing Requested ✓' : 'Request VIP Viewing'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
