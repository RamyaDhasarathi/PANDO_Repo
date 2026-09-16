'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/pando/Header';
import { RecommendedProperties } from '@/components/pando/RecommendedProperties';
import { Toast } from '@/components/pando/Toast';
import { PropertyService } from '@/services/propertyService';
import styles from '@/components/pando/pando-properties.module.css';

export default function SearchResults() {
  const searchParams = useSearchParams();

  // Filter and Search States
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSort, setSelectedSort] = useState('ai-recommended');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive and Toast States
  const [savedPropertyIds, setSavedPropertyIds] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync with searchParams from URL if user navigated with query params
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('location') || '';
    const type = searchParams.get('type') || 'all';
    const maxPrice = searchParams.get('maxPrice') || 'all';

    if (q) setSearchQuery(q);
    if (type && type !== 'all') setSelectedType(type);
    if (maxPrice && maxPrice !== 'all') setSelectedPrice(maxPrice);
  }, [searchParams]);

  // Load saved properties on mount
  useEffect(() => {
    const saved = PropertyService.getSavedPropertyIds();
    setSavedPropertyIds(saved);
  }, []);

  // Filtered & Sorted Properties List
  const filteredProperties = useMemo(() => {
    return PropertyService.filterAndSort({
      searchQuery,
      location: selectedLocation,
      propertyType: selectedType,
      priceRange: selectedPrice,
      sortOption: selectedSort,
    });
  }, [searchQuery, selectedLocation, selectedType, selectedPrice, selectedSort]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Toggle Save Property
  const handleToggleSave = (id) => {
    const isNowSaved = PropertyService.toggleSavedProperty(id);
    setSavedPropertyIds(PropertyService.getSavedPropertyIds());
    const prop = PropertyService.getById(id);
    showToast(
      isNowSaved
        ? `Saved "${prop?.name || 'Property'}" to your Portfolio`
        : `Removed from saved residences`
    );
  };

  return (
    <div className={styles.container}>
      {/* Top Quantum Header */}
      <Header syncedAssetsCount={filteredProperties.length} />

      {/* Main Single Primary Container Canvas */}
      <main className={styles.mainCanvas}>
        <RecommendedProperties
          properties={filteredProperties}
          onToggleSave={handleToggleSave}
          savedIds={savedPropertyIds}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            showToast(`Filter updated: ${loc === 'all' ? 'All Locations' : loc}`);
          }}
          selectedPrice={selectedPrice}
          onSelectPrice={(p) => {
            setSelectedPrice(p);
            showToast('Valuation filter updated');
          }}
          selectedType={selectedType}
          onSelectType={(t) => {
            setSelectedType(t);
            showToast('Typology filter updated');
          }}
          selectedSort={selectedSort}
          onSelectSort={(s) => {
            setSelectedSort(s);
            showToast('Matrix sorting recalibrated');
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </main>

      {/* Real-time Toast Notifications */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
