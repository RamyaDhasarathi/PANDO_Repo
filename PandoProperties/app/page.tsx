'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/pando/Header';
import { RecommendedProperties } from '@/components/pando/RecommendedProperties';
import { PropertyDetailsModal } from '@/components/pando/PropertyDetailsModal';
import { Toast } from '@/components/pando/Toast';
import { PropertyService } from '@/services/propertyService';
import { Property, SortOption } from '@/types/property';

export default function PandoIntelligencePage() {
  // Filter and Search States
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('ai-recommended');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive and Modal States
  const [selectedPropertyForModal, setSelectedPropertyForModal] =
    useState<Property | null>(null);
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Toggle Save Property
  const handleToggleSave = (id: string) => {
    const isNowSaved = PropertyService.toggleSavedProperty(id);
    setSavedPropertyIds(PropertyService.getSavedPropertyIds());
    const prop = PropertyService.getById(id);
    showToast(
      isNowSaved
        ? `Saved "${prop?.name || 'Property'}" to your Portfolio`
        : `Removed from saved residences`
    );
  };

  // Request Viewing Action
  const handleRequestViewing = (property: Property) => {
    showToast(`VIP Viewing requested for ${property.name}. Concierge will reach out shortly.`);
  };

  return (
    <div className="h-full h-[100dvh] max-h-[100dvh] flex flex-col bg-[#FBF6EE] text-[#111111] overflow-hidden">
      {/* Top Header */}
      <Header syncedAssetsCount={filteredProperties.length} />

      {/* Main Single Primary Container Canvas (Full Window Width) */}
      <main className="flex-1 min-h-0 w-full p-2 sm:p-3 lg:p-4 overflow-hidden flex flex-col">
        <div className="w-full h-full min-h-0 flex flex-col overflow-hidden">

          <RecommendedProperties
            properties={filteredProperties}
            onOpenDetails={(property) => setSelectedPropertyForModal(property)}
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
        </div>
      </main>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedPropertyForModal}
        isOpen={!!selectedPropertyForModal}
        onClose={() => setSelectedPropertyForModal(null)}
        isSaved={
          selectedPropertyForModal
            ? savedPropertyIds.includes(selectedPropertyForModal.id)
            : false
        }
        onToggleSave={handleToggleSave}
        onRequestViewing={handleRequestViewing}
      />

      {/* Real-time Toast Notifications */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}

