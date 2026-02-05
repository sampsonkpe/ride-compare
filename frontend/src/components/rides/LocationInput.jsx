import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Cache the library load so multiple inputs don't reload it
let placesLibPromise = null;

async function loadPlacesLibrary() {
  if (placesLibPromise) return placesLibPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY');

  setOptions({
    apiKey,
    version: 'weekly',
  });

  // Loads Google Maps + Places library (new API)
  placesLibPromise = importLibrary('places');
  return placesLibPromise;
}

export default function LocationInput({ value, onChange, placeholder, icon }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const listenerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const placesLib = await loadPlacesLibrary();
        if (!isMounted || !inputRef.current) return;

        // In the new API, the class is provided from the imported library
        const { Autocomplete } = placesLib;

        // Bias results towards Ghana (not restricted)
        const ghanaBounds = {
          north: 11.2,
          south: 4.5,
          west: -3.3,
          east: 1.3,
        };

        autocompleteRef.current = new Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'name'],
          bounds: ghanaBounds,
          strictBounds: false, // bias, not restrict
        });

        listenerRef.current = autocompleteRef.current.addListener(
          'place_changed',
          () => {
            const place = autocompleteRef.current.getPlace();

            if (place?.geometry?.location) {
              onChange({
                address: place.formatted_address || place.name || '',
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });
            }
          }
        );

        setIsLoading(false);
      } catch (err) {
        console.error('Google Places Autocomplete failed:', err);
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      // Remove listener cleanly (no need for google.maps.event here)
      if (listenerRef.current) listenerRef.current.remove();
      listenerRef.current = null;
      autocompleteRef.current = null;
    };
  }, [onChange]);

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value.address}
        onChange={(e) =>
          onChange({
            address: e.target.value,
            lat: null,
            lng: null,
          })
        }
        placeholder={isLoading ? 'Loading...' : placeholder}
        disabled={isLoading}
        className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
      />
    </div>
  );
}