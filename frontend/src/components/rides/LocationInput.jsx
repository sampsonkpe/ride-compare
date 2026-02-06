import { useEffect, useMemo, useRef, useState } from "react";

function loadGoogleMapsScript() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY in .env");
  }

  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) return resolve();

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

function getShortAddress(geocodeResult) {
  const comps = geocodeResult?.address_components || [];
  const route = comps.find((c) => c.types.includes("route"))?.long_name;
  const streetNumber = comps.find((c) => c.types.includes("street_number"))?.long_name;
  const neighborhood = comps.find((c) => c.types.includes("neighborhood"))?.long_name;
  const sublocality =
    comps.find((c) => c.types.includes("sublocality") || c.types.includes("sublocality_level_1"))
      ?.long_name;
  const locality = comps.find((c) => c.types.includes("locality"))?.long_name;
  const premise =
    comps.find((c) => c.types.includes("premise") || c.types.includes("establishment"))?.long_name;

  const parts = [];
  if (premise) parts.push(premise);
  if (streetNumber && route) parts.push(`${streetNumber} ${route}`);
  else if (route && route !== "Unnamed Road") parts.push(route);
  else if (neighborhood) parts.push(neighborhood);

  if (sublocality) parts.push(sublocality);
  else if (locality) parts.push(locality);

  if (parts.length) return parts.slice(0, 2).join(", ");

  const formatted = geocodeResult?.formatted_address;
  if (formatted) return formatted.split(",").slice(0, 2).join(",").trim();

  return "Unknown location";
}

export default function LocationInput({
  value,
  onChange,
  placeholder,
  icon,
  showCurrentLocation = false,
  onLocationError,
  inputRef: externalInputRef,
}) {
  const internalRef = useRef(null);
  const inputRef = externalInputRef || internalRef;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLocating, setIsLocating] = useState(false);

  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const geocoderRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    loadGoogleMapsScript()
      .then(() => {
        if (!mounted) return;
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          placesServiceRef.current = new window.google.maps.places.PlacesService(
            document.createElement("div")
          );
          geocoderRef.current = new window.google.maps.Geocoder();
          setIsLoaded(true);
        }
      })
      .catch((err) => {
        console.error(err);
        onLocationError?.();
      });

    return () => {
      mounted = false;
    };
  }, [onLocationError]);

  // Fetch suggestions
  useEffect(() => {
    if (!isLoaded) return;
    const input = value?.address || "";
    if (!input || input.length < 2) {
      setPredictions([]);
      return;
    }

    const t = setTimeout(() => {
      autocompleteServiceRef.current?.getPlacePredictions(
        { input },
        (preds) => setPredictions(preds || [])
      );
    }, 250);

    return () => clearTimeout(t);
  }, [value?.address, isLoaded]);

  const pickIcon = useMemo(() => {
    if (icon === "pickup") return <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />;
    return <span className="text-red-400">📍</span>;
  }, [icon]);

  const commitSelection = (prediction) => {
    if (!prediction?.place_id) return;

    // First: set address immediately
    onChange({ address: prediction.description, lat: null, lng: null });
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setPredictions([]);

    // Then: resolve lat/lng using Places Details
    placesServiceRef.current?.getDetails(
      { placeId: prediction.place_id, fields: ["geometry", "formatted_address", "name"] },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place?.geometry) {
          console.error("Places details failed:", status);
          onLocationError?.();
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        const niceAddress = place.formatted_address || prediction.description;
        onChange({ address: niceAddress, lat, lng });
      }
    );
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || predictions.length === 0) return;

    const visible = predictions.slice(0, 5);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < visible.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && visible[selectedIndex]) {
        commitSelection(visible[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const clearValue = () => {
    onChange({ address: "", lat: null, lng: null });
    setPredictions([]);
    setSelectedIndex(-1);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      onLocationError?.();
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          geocoderRef.current?.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              const r0 = results?.[0];
              if (status !== "OK" || !r0) {
                onChange({ address: "Current location", lat: latitude, lng: longitude });
                setIsLocating(false);
                return;
              }

              const shortAddress = getShortAddress(r0);
              onChange({ address: shortAddress, lat: latitude, lng: longitude });
              setIsLocating(false);
            }
          );
        } catch (err) {
          console.error(err);
          onLocationError?.();
          setIsLocating(false);
        }
      },
      (err) => {
        console.error(err);
        onLocationError?.();
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative">
      {showCurrentLocation && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={isLocating}
            className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            {isLocating ? "Locating..." : "Use current location"}
          </button>
        </div>
      )}

      <div
        className={`relative flex items-center rounded-lg border bg-black/40 transition ${
          isFocused ? "border-blue-600" : "border-white/10 hover:border-white/20"
        }`}
      >
        <div className="pl-4 pr-2">{pickIcon}</div>

        <input
          ref={inputRef}
          value={value?.address || ""}
          onChange={(e) => {
            onChange({ address: e.target.value, lat: null, lng: null });
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            setTimeout(() => {
              setShowSuggestions(false);
              setSelectedIndex(-1);
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-2 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none"
          type="text"
        />

        {!!(value?.address) && (
          <button
            type="button"
            onClick={clearValue}
            className="px-3 text-gray-300 hover:text-white"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {showSuggestions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-950 border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          {predictions.slice(0, 5).map((p, idx) => (
            <button
              key={p.place_id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commitSelection(p)}
              className={`w-full text-left px-4 py-3 text-sm transition ${
                selectedIndex === idx ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <div className="text-white truncate">{p.structured_formatting?.main_text || p.description}</div>
              <div className="text-gray-400 text-xs truncate">
                {p.structured_formatting?.secondary_text || ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}