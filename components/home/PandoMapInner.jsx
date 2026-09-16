'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MASCOT_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hf_20260623_061342_344d0b5a-9b73-4799-b66d-cb78af38510c-Photoroom-8tRuDAVe4O0Gxxg6amlBrVSCOL6ouf.png';

// Fix Leaflet default icon paths
if (typeof window !== 'undefined' && L.Icon?.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Fly-to controller — flies to selected property OR to Dubai on filter trigger
function MapFlyToController({ center, zoom, filterZoomKey }) {
  const map = useMap();
  const lat = center ? center[0] : null;
  const lng = center ? center[1] : null;

  // Fly to selected property
  useEffect(() => {
    if (map && lat !== null && lng !== null) {
      map.flyTo([lat, lng], zoom || 13, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [map, lat, lng, zoom]);

  // Fly to Dubai center whenever a filter/tab is clicked (filterZoomKey increments)
  useEffect(() => {
    if (map && filterZoomKey > 0) {
      map.flyTo([25.14, 55.22], 13, { duration: 1.2, easeLinearity: 0.25 });
    }
  }, [map, filterZoomKey]);

  return null;
}

// Zoom-reactive pin scaling
function MapZoomListener() {
  const map = useMapEvents({
    zoom() {
      const zoom = map.getZoom();
      let scale = 1 + (zoom - 13) * 0.15;
      scale = Math.max(0.3, Math.min(2.5, scale));
      document.documentElement.style.setProperty('--map-pin-scale', scale);
    },
  });

  useEffect(() => {
    if (map) {
      const zoom = map.getZoom();
      let scale = 1 + (zoom - 13) * 0.15;
      scale = Math.max(0.3, Math.min(2.5, scale));
      document.documentElement.style.setProperty('--map-pin-scale', scale);
    }
  }, [map]);

  return null;
}

const MAP_LAYERS = {
  street: {
    name: 'Default',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    thumb: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=100&q=80',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    thumb: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=100&q=80',
  },
  terrain: {
    name: 'Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    thumb: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=100&q=80',
  },
};

export default function PandoMapInner({
  properties = [],
  selectedProperty = null,
  onSelectProperty = () => {},
  zoomLevel = 13,
  filterZoomKey = 0,
}) {
  const [mapLayer, setMapLayer] = useState('satellite');
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  const currentCenter =
    selectedProperty?.lat && selectedProperty?.lng
      ? [selectedProperty.lat, selectedProperty.lng]
      : [25.14, 55.22];

  const createPandoIcon = (prop, isSelected) => {
    const html = `
      <div class="pando-property-pin-wrap">
        <div class="pando-property-card ${isSelected ? 'selected' : ''}">
          <img src="${prop.image}" alt="${prop.title}" class="pando-property-image"
               onerror="this.src='https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80'" />
          <div class="pando-property-content">
            <div class="pando-property-title-row">
              <h4 class="pando-property-title">${prop.title}</h4>
            </div>
          </div>
        </div>
        <div class="pando-property-pin ${isSelected ? 'selected' : ''}">
          <img src="${MASCOT_URL}" alt="${prop.title} Pin" />
        </div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'custom-pando-leaflet-pin',
      iconSize: [52, 65],
      iconAnchor: [26, 65],
      popupAnchor: [0, -65],
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 0 }}>
      <style>{`
        .custom-pando-leaflet-pin { background: transparent !important; border: none !important; overflow: visible !important; }
        .leaflet-container { width: 100%; height: 100%; background-color: #0f172a; font-family: inherit; }
        .leaflet-control-zoom { display: none !important; }
        .leaflet-control-attribution { background: rgba(0,0,0,0.4) !important; color: rgba(255,255,255,0.7) !important; font-size: 10px !important; border-radius: 4px; }
        .leaflet-control-attribution a { color: rgba(255,255,255,0.9) !important; }
      `}</style>

      <MapContainer
        center={currentCenter}
        zoom={zoomLevel}
        minZoom={3}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          key={mapLayer}
          url={MAP_LAYERS[mapLayer].url}
          attribution={MAP_LAYERS[mapLayer].attribution}
          maxZoom={19}
          noWrap={true}
        />
        <MapFlyToController center={currentCenter} zoom={zoomLevel} filterZoomKey={filterZoomKey} />
        <MapZoomListener />

        {properties.map((prop) => {
          if (!prop.lat || !prop.lng) return null;
          const isSelected = selectedProperty?.id === prop.id;
          return (
            <Marker
              key={prop.id}
              position={[prop.lat, prop.lng]}
              icon={createPandoIcon(prop, isSelected)}
              eventHandlers={{ click: () => onSelectProperty(prop) }}
            />
          );
        })}
      </MapContainer>

      {/* Layer Switcher — using state for reliable hover */}
      <div
        style={{ position: 'absolute', left: 24, top: 80, zIndex: 1000 }}
        onMouseEnter={() => setIsLayersOpen(true)}
        onMouseLeave={() => setIsLayersOpen(false)}
      >
        <button style={{
          width: 50, height: 50, borderRadius: 12, overflow: 'hidden',
          position: 'relative', boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          border: '2px solid rgba(255,255,255,0.8)', cursor: 'pointer',
          background: 'transparent', padding: 0,
        }}>
          <img src={MAP_LAYERS[mapLayer].thumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Layers" />
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 12 12 17 22 12" />
              <polyline points="2 17 12 22 22 17" />
            </svg>
            <span style={{ color: 'white', fontSize: 9, fontWeight: 800 }}>Layers</span>
          </div>
        </button>

        {/* Bridge gap between button and flyout so hover doesn't break */}
        {isLayersOpen && (
          <div style={{
            position: 'absolute', left: '100%', top: 0,
            width: 12, height: 60,
            background: 'transparent',
          }} />
        )}

        {isLayersOpen && (
          <div style={{
            position: 'absolute', left: 'calc(100% + 12px)', top: 0,
            background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
            padding: 8, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 8,
          }}>
            {Object.entries(MAP_LAYERS).map(([key, layer]) => (
              <button key={key} onClick={() => setMapLayer(key)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 60, background: 'transparent', border: 0, cursor: 'pointer' }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 12, overflow: 'hidden',
                  border: `2px solid ${mapLayer === key ? '#3b82f6' : 'transparent'}`,
                  boxShadow: mapLayer === key ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
                  transform: mapLayer === key ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}>
                  <img src={layer.thumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={layer.name} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: mapLayer === key ? '#3b82f6' : '#555' }}>
                  {layer.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
