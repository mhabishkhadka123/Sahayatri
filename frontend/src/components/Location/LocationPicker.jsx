import React, { useCallback, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DEFAULT_CENTER = [27.7172, 85.324];
const DEFAULT_ZOOM = 7;
const SELECTED_ZOOM = 13;

const locationIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const roundCoordinate = (value) => Number.parseFloat(Number(value).toFixed(6));

const parseAddress = (address = {}) => ({
  city:
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.hamlet ||
    address.county ||
    '',
  district:
    address.state_district ||
    address.county ||
    address.city_district ||
    address.suburb ||
    '',
  region: address.state || address.region || address.province || '',
  country: address.country || '',
});

const buildLocationPayload = ({ lat, lng, displayName = '', address = {} }) => {
  const parsed = parseAddress(address);
  return {
    latitude: roundCoordinate(lat),
    longitude: roundCoordinate(lng),
    city: parsed.city,
    district: parsed.district,
    region: parsed.region,
    country: parsed.country,
    formattedAddress: displayName,
    birthPlace: displayName || parsed.city || '',
  };
};

const reverseGeocode = async (lat, lng) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Reverse geocoding is currently unavailable');
  }

  return response.json();
};

const searchLocation = async (query) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Location search is currently unavailable');
  }

  return response.json();
};

const MapInteraction = ({ disabled, onSelect }) => {
  useMapEvents({
    click(event) {
      if (!disabled) {
        onSelect(event.latlng.lat, event.latlng.lng);
      }
    },
  });

  return null;
};

const MapViewport = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [map, center, zoom]);

  return null;
};

const LocationPicker = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Search location...',
  mapHeight = '280px',
  allowCurrentLocation = false,
}) => {
  const [searchText, setSearchText] = useState(
    value?.formattedAddress || value?.birthPlace || value?.city || ''
  );
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');

  useEffect(() => {
    setSearchText(value?.formattedAddress || value?.birthPlace || value?.city || '');
  }, [value?.formattedAddress, value?.birthPlace, value?.city]);

  const markerPosition = useMemo(() => {
    if (value?.latitude === '' || value?.longitude === '' || value?.latitude == null || value?.longitude == null) {
      return null;
    }

    const lat = Number(value.latitude);
    const lng = Number(value.longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return [lat, lng];
  }, [value?.latitude, value?.longitude]);

  const center = markerPosition || DEFAULT_CENTER;
  const zoom = markerPosition ? SELECTED_ZOOM : DEFAULT_ZOOM;

  const emitChange = useCallback((nextValue) => {
    onChange?.(nextValue);
  }, [onChange]);

  const setStatus = useCallback((message, type = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  }, []);

  const handleCoordinateSelection = useCallback(async (lat, lng) => {
    setIsBusy(true);
    setStatus('');

    try {
      const result = await reverseGeocode(lat, lng);
      const nextValue = buildLocationPayload({
        lat,
        lng,
        displayName: result.display_name || '',
        address: result.address || {},
      });

      setSearchText(nextValue.formattedAddress || nextValue.birthPlace || '');
      emitChange({
        ...value,
        ...nextValue,
      });
      setStatus('Location updated from the map.', 'success');
    } catch (error) {
      emitChange({
        ...value,
        latitude: roundCoordinate(lat),
        longitude: roundCoordinate(lng),
      });
      setStatus(error.message || 'Coordinates updated. You can edit the location fields manually.', 'warning');
    } finally {
      setIsBusy(false);
    }
  }, [emitChange, setStatus, value]);

  const handleSearchSubmit = useCallback(async (event) => {
    event.preventDefault();

    const query = searchText.trim();
    if (!query) {
      setStatus('Enter a place name to search.', 'warning');
      return;
    }

    setIsBusy(true);
    setStatus('');

    try {
      const results = await searchLocation(query);
      const match = results?.[0];

      if (!match) {
        setStatus('No matching location was found.', 'warning');
        return;
      }

      const nextValue = buildLocationPayload({
        lat: match.lat,
        lng: match.lon,
        displayName: match.display_name || query,
        address: match.address || {},
      });

      setSearchText(nextValue.formattedAddress || query);
      emitChange({
        ...value,
        ...nextValue,
      });
      setStatus('Location found successfully.', 'success');
    } catch (error) {
      setStatus(error.message || 'Search failed. You can still pick a location from the map.', 'error');
    } finally {
      setIsBusy(false);
    }
  }, [emitChange, searchText, setStatus, value]);

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('Browser geolocation is not available on this device.', 'error');
      return;
    }

    setIsBusy(true);
    setStatus('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await handleCoordinateSelection(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setIsBusy(false);
        setStatus(error.message || 'Unable to access your current location.', 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [handleCoordinateSelection, setStatus]);

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          disabled={disabled || isBusy}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={disabled || isBusy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
          >
            {isBusy ? 'Finding...' : 'Search'}
          </button>
          {allowCurrentLocation && (
            <button
              type="button"
              onClick={handleCurrentLocation}
              disabled={disabled || isBusy}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition"
            >
              Use My Current Location
            </button>
          )}
        </div>
      </form>

      <div
        className="overflow-hidden rounded-lg border border-gray-200"
        style={{ height: mapHeight }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={!disabled}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport center={center} zoom={zoom} />
          <MapInteraction disabled={disabled} onSelect={handleCoordinateSelection} />
          {markerPosition && (
            <Marker
              position={markerPosition}
              icon={locationIcon}
              draggable={!disabled}
              eventHandlers={{
                dragend: (event) => {
                  const { lat, lng } = event.target.getLatLng();
                  handleCoordinateSelection(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-500">
        Click the map, drag the marker, or search for a place to update the location.
      </p>

      {statusMessage && (
        <div
          className={`rounded-lg p-3 text-sm ${
            statusType === 'success'
              ? 'bg-green-100 text-green-700'
              : statusType === 'warning'
                ? 'bg-amber-100 text-amber-800'
                : statusType === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
          }`}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
