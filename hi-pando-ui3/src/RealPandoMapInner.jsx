'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import mascotImage from './mascot.png';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths in browser
if (typeof window !== 'undefined' && L.Icon?.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Map Camera Controller sub-component using useMap hook
function MapFlyToController({ center, zoom }) {
  const map = useMap();
  const lat = center ? center[0] : null;
  const lng = center ? center[1] : null;

  useEffect(() => {
    if (map && lat !== null && lng !== null) {
      map.flyTo([lat, lng], zoom || 13, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [map, lat, lng, zoom]);
  return null;
}

// Map Zoom Listener to scale pins dynamically
function MapZoomListener() {
  const map = useMapEvents({
    zoom() {
      const zoom = map.getZoom();
      // Calculate scale (base zoom 13 = scale 1)
      let scale = 1 + (zoom - 13) * 0.15;
      if (scale < 0.3) scale = 0.3;
      if (scale > 2.5) scale = 2.5;
      document.documentElement.style.setProperty('--map-pin-scale', scale);
    },
  });

  useEffect(() => {
    if (map) {
      const zoom = map.getZoom();
      let scale = 1 + (zoom - 13) * 0.15;
      if (scale < 0.3) scale = 0.3;
      if (scale > 2.5) scale = 2.5;
      document.documentElement.style.setProperty('--map-pin-scale', scale);
    }
  }, [map]);

  return null;
}

export default function RealPandoMapInner({
  properties = [],
  selectedProperty = null,
  onSelectProperty = () => {},
  zoomLevel = 13,
}) {
  const mapRef = useRef(null);
  const [mapLayer, setMapLayer] = useState('street');
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  const layers = {
    street: {
      name: 'Default',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      thumb: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=100&q=80'
    },
    satellite: {
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri',
      thumb: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=100&q=80'
    },
    terrain: {
      name: 'Terrain',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri',
      thumb: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=100&q=80'
    }
  };

  // Helper to create Pando property pin icon with 100% stable anchor point
  const createPandoPropertyIcon = (prop, isSelected) => {
    const htmlContent = `
      <div class="pando-property-pin-wrap">
        <!-- Floating Property Card attached above pin -->
        <div class="pando-property-card ${isSelected ? 'selected' : ''}">
          <img src="${prop.image}" alt="${prop.title}" class="pando-property-image" onerror="this.onerror=null;this.src='/cheerful-building.png';" />
          <div class="pando-property-content">
            <div class="pando-property-title-row">
              <h4 class="pando-property-title">${prop.title}</h4>
              <button class="pando-property-favorite" title="Favorite">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>
            <p class="pando-property-location">${prop.location}</p>
          </div>
        </div>

        <!-- Pando Mascot Red Pin -->
        <div class="pando-property-pin ${isSelected ? 'selected' : ''}">
          <img src="${mascotImage.src}" alt="${prop.title} Pin" />
        </div>
      </div>
    `;

    // Anchor point [26, 65] corresponds exactly to the tip of the 52x65 mascot pin!
    return L.divIcon({
      html: htmlContent,
      className: 'custom-pando-leaflet-pin',
      iconSize: [52, 65],
      iconAnchor: [26, 65],
      popupAnchor: [0, -65],
    });
  };

  // Default camera center over Dubai coastline
  const currentCenter = selectedProperty && selectedProperty.lat && selectedProperty.lng
    ? [selectedProperty.lat, selectedProperty.lng]
    : [25.1400, 55.2200];

  return (
    <div className="w-full h-full relative z-0">
      <style jsx global>{`
        .custom-pando-leaflet-pin {
          background: transparent !important;
          border: none !important;
          overflow: visible !important;
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          background-color: #0f172a;
          font-family: inherit;
        }
        .leaflet-control-zoom {
          display: none !important;
        }
        .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.4) !important;
          color: rgba(255, 255, 255, 0.7) !important;
          font-size: 10px !important;
          border-radius: 4px;
        }
        .leaflet-control-attribution a {
          color: rgba(255, 255, 255, 0.9) !important;
        }
      `}</style>

      <MapContainer
        ref={mapRef}
        center={currentCenter}
        zoom={zoomLevel}
        minZoom={3}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full min-h-screen"
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          key={mapLayer}
          url={layers[mapLayer].url}
          attribution={layers[mapLayer].attribution}
          maxZoom={19}
          noWrap={true}
        />

        <MapFlyToController center={currentCenter} zoom={zoomLevel} />
        <MapZoomListener />

        {properties.map((prop) => {
          if (!prop.lat || !prop.lng) return null;
          const isSelected = selectedProperty?.id === prop.id;
          const icon = createPandoPropertyIcon(prop, isSelected);
          if (!icon) return null;

          return (
            <Marker
              key={prop.id}
              position={[prop.lat, prop.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectProperty(prop),
              }}
            />
          );
        })}
      </MapContainer>

      {/* Map Layer Switcher (Google Maps Style, Top Left) */}
      <div className="absolute left-6 top-[80px] z-[1000] group">
        {/* The Trigger Button */}
        <button className="w-[50px] h-[50px] rounded-xl overflow-hidden relative shadow-lg border-2 border-white/80 transition-transform hover:scale-105">
          <img src={layers[mapLayer].thumb} className="w-full h-full object-cover" alt="Layers" />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 12 12 17 22 12"></polyline><polyline points="2 17 12 22 22 17"></polyline></svg>
            <span className="text-white text-[9px] font-bold mt-0.5">Layers</span>
          </div>
        </button>

        {/* Flyout Menu (Appears to the right) */}
        <div className="absolute left-full top-0 ml-3 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-xl border border-gray-100 flex gap-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-left">
          {Object.entries(layers).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => setMapLayer(key)}
              className="flex flex-col items-center gap-1 group/item w-[60px]"
            >
              <div className={`w-[50px] h-[50px] rounded-xl overflow-hidden relative border-2 transition-all ${
                mapLayer === key ? 'border-blue-500 shadow-md scale-105' : 'border-transparent group-hover/item:border-gray-300'
              }`}>
                <img src={layer.thumb} className="w-full h-full object-cover" alt={layer.name} />
              </div>
              <span className={`text-[11px] font-semibold ${mapLayer === key ? 'text-blue-600' : 'text-gray-600'}`}>
                {layer.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
