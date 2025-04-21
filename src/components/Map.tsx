import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCurrentPosition } from '@/lib/geolocation';

// Fix for Leaflet marker icons in Next.js
useEffect(() => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/marker-icon-2x.png',
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
  });
}, []);

interface MapPosition {
  latitude: number;
  longitude: number;
}

interface MapProps {
  height?: string;
  width?: string;
  markers?: Array<{
    position: MapPosition;
    popup?: string;
  }>;
  onLocationSelect?: (position: MapPosition) => void;
  interactive?: boolean;
  zoom?: number;
  center?: MapPosition;
}

function MapEvents({ onLocationSelect }: { onLocationSelect?: (position: MapPosition) => void }) {
  const map = useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      }
    },
  });
  return null;
}

export default function Map({
  height = '400px',
  width = '100%',
  markers = [],
  onLocationSelect,
  interactive = true,
  zoom = 13,
  center,
}: MapProps) {
  const [defaultCenter, setDefaultCenter] = useState<MapPosition>({
    latitude: 40.7128, // Default to NYC
    longitude: -74.006,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<MapPosition | null>(null);

  useEffect(() => {
    // If center is provided, use it as the default
    if (center) {
      setDefaultCenter(center);
      setLoading(false);
      return;
    }

    // Otherwise try to get the user's current position
    const getUserLocation = async () => {
      try {
        const position = await getCurrentPosition();
        setDefaultCenter({
          latitude: position.latitude,
          longitude: position.longitude,
        });
      } catch (error) {
        console.error('Failed to get user location:', error);
        // Keep the default location
      } finally {
        setLoading(false);
      }
    };

    getUserLocation();
  }, [center]);

  const handleLocationSelect = (position: MapPosition) => {
    if (!interactive) return;
    
    setSelectedPosition(position);
    if (onLocationSelect) {
      onLocationSelect(position);
    }
  };

  if (loading) {
    return (
      <div 
        style={{ height, width }} 
        className="flex items-center justify-center bg-gray-200"
      >
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[defaultCenter.latitude, defaultCenter.longitude]}
      zoom={zoom}
      style={{ height, width }}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      zoomControl={interactive}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Display existing markers */}
      {markers.map((marker, index) => (
        <Marker 
          key={index} 
          position={[marker.position.latitude, marker.position.longitude]}
        >
          {marker.popup && <Popup>{marker.popup}</Popup>}
        </Marker>
      ))}
      
      {/* Display selected position */}
      {selectedPosition && (
        <Marker 
          position={[selectedPosition.latitude, selectedPosition.longitude]}
        >
          <Popup>Selected location</Popup>
        </Marker>
      )}
      
      {/* Map click event handler */}
      {interactive && <MapEvents onLocationSelect={handleLocationSelect} />}
    </MapContainer>
  );
}