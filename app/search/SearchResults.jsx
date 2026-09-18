'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/pando/Header';
import { RecommendedProperties } from '@/components/pando/RecommendedProperties';
import { Toast } from '@/components/pando/Toast';
import { PropertyService } from '@/services/propertyService'; // Fallback for local favorites
import { useAuth } from '@/providers/AuthProvider';
import PandoLoader from '@/components/PandoLoader';

export default function SearchResults() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Filter and Search States
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSort, setSelectedSort] = useState('ai-recommended');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive and Toast States
  const [savedPropertyIds, setSavedPropertyIds] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync with searchParams from URL
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('location') || '';
    const type = searchParams.get('type') || 'all';
    const maxPrice = searchParams.get('maxPrice') || 'all';

    if (q) setSearchQuery(q);
    if (type && type !== 'all') setSelectedType(type);
    if (maxPrice && maxPrice !== 'all') setSelectedPrice(maxPrice);
  }, [searchParams]);

  // TanStack Query for Properties
  const { data: propertiesResponse, isLoading: loading } = useQuery({
    queryKey: ['properties', searchQuery, selectedLocation, selectedType, selectedPrice, selectedSort],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        q: searchQuery,
        location: selectedLocation,
        type: selectedType,
        priceRange: selectedPrice,
        sort: selectedSort
      });
      const res = await fetch(`/api/properties?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const properties = propertiesResponse?.data || [];

  // Load saved properties
  useEffect(() => {
    async function loadFavorites() {
      if (user) {
        try {
          const res = await fetch('/api/favorites');
          const data = await res.json();
          if (data.success) {
            setSavedPropertyIds(data.savedIds || []);
          }
        } catch (err) {
          console.error("Failed to fetch favorites", err);
        }
      } else {
        // Fallback to local storage for guests
        const saved = PropertyService.getSavedPropertyIds();
        setSavedPropertyIds(saved);
      }
    }
    loadFavorites();
  }, [user]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Lifted selection state
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  // Toggle Save Property
  const handleToggleSave = async (id) => {
    const targetProp = properties.find(p => p.id === id);
    
    if (user) {
      try {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: id })
        });
        const data = await res.json();
        if (data.success) {
          setSavedPropertyIds(data.savedIds);
          showToast(
            data.isSaved
              ? `Saved "${targetProp?.name || 'Property'}" to your Portfolio`
              : `Removed from saved residences`
          );
        }
      } catch (err) {
        showToast("Error saving property");
      }
    } else {
      // Guest mode
      const isNowSaved = PropertyService.toggleSavedProperty(id);
      setSavedPropertyIds(PropertyService.getSavedPropertyIds());
      showToast(
        isNowSaved
          ? `Saved "${targetProp?.name || 'Property'}" locally. Sign in to sync across devices.`
          : `Removed from saved residences`
      );
    }
  };

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] flex flex-col bg-[#f1eef2] text-[#1e1e22] overflow-hidden font-sans box-border">
      {/* Top Quantum Header */}
      <Header syncedAssetsCount={properties.length} />

      {/* Main Single Primary Container Canvas */}
      <main className="flex-1 min-h-0 w-full p-[12px_18px_18px] overflow-hidden flex flex-col box-border">
        {loading ? (
          <PandoLoader />
        ) : (
          <RecommendedProperties
            properties={properties}
            user={user}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={setSelectedPropertyId}
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
        )}
      </main>

      {/* Real-time Toast Notifications */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
