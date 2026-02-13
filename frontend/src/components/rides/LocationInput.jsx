import { useEffect, useMemo, useRef, useState } from "react";
import { CircleDot, MapPin, Crosshair, X } from "lucide-react";

function loadGoogleMapsScript() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY in .env");

  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) return resolve();

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      const onLoad = () => resolve();
      const onErr = () => reject(new Error("Failed to load Google Maps"));

      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onErr, { once: true });
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

function looksLikePlusCode(text = "") {
  return /^[A-Z0-9]{3,}\+[A-Z0-9]{2,}/i.test(text.trim());
}

function getArea(result) {
  const comps = result?.address_components || [];
  const sublocality = comps.find(
    (c) => c.types.includes("sublocality") || c.types.includes("sublocality_level_1")
  )?.long_name;
  const locality = comps.find((c) => c.types.includes("locality"))?.long_name;
  const admin = comps.find((c) => c.types.includes("administrative_area_level_1"))?.long_name;

  return sublocality || locality || admin || "Accra";
}

function getPlaceName(result) {
  const comps = result?.address_components || [];
  const poi = comps.find((c) => c.types.includes("point_of_interest"))?.long_name;
  const premise = comps.find(
    (c) => c.types.includes("premise") || c.types.includes("establishment")
  )?.long_name;

  const first = (result?.formatted_address || "").split(",")[0]?.trim();
  if (first && looksLikePlusCode(first)) return poi || premise || "";

  return poi || premise || "";
}

function getShortAddress(result) {
  const comps = result?.address_components || [];
  const route = comps.find((c) => c.types.includes("route"))?.long_name;
  const area = getArea(result);
  const placeName = getPlaceName(result);

  const isUnnamed = !route || route === "Unnamed Road";

  if (placeName) {
    return isUnnamed ? `${placeName}, Unnamed Road, ${area}` : `${placeName}, ${route}, ${area}`;
  }

  return `Unnamed Road, ${area}`;
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

  const [biasCenter, setBiasCenter] = useState({ lat: 5.6037, lng: -0.187 });
  const biasRadiusMeters = 500000;

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

  useEffect(() => {
    if (!isLoaded) return;

    const input = value?.address || "";
    if (!input || input.length < 2) {
      setPredictions([]);
      return;
    }

    const t = setTimeout(() => {
      const location =
        window.google?.maps?.LatLng
          ? new window.google.maps.LatLng(biasCenter.lat, biasCenter.lng)
          : undefined;

      autocompleteServiceRef.current?.getPlacePredictions(
        {
          input,
          ...(location
            ? {
                location,
                radius: biasRadiusMeters,
              }
            : {}),
        },
        (preds) => {
          setPredictions(preds || []);
        }
      );
    }, 220);

    return () => clearTimeout(t);
  }, [value?.address, isLoaded, biasCenter.lat, biasCenter.lng]);

  const pickIcon = useMemo(() => {
    if (icon === "pickup") return <CircleDot className="w-5 h-5 text-primary" />;
    return <MapPin className="w-5 h-5 text-destructive" />;
  }, [icon]);

  const commitSelection = (prediction) => {
    if (!prediction?.place_id) return;

    onChange({ address: prediction.description, lat: null, lng: null });
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setPredictions([]);

    placesServiceRef.current?.getDetails(
      { placeId: prediction.place_id, fields: ["geometry"] },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place?.geometry) {
          console.error("Places details failed:", status);
          onLocationError?.();
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        onChange({ address: prediction.description, lat, lng });
        setBiasCenter({ lat, lng });

        geocoderRef.current?.geocode({ location: { lat, lng } }, (results, geoStatus) => {
          const r0 = results?.[0];

          if (geoStatus !== "OK" || !r0) {
            const firstChunk = (prediction.description.split(",")[0] || "").trim();
            const safe = looksLikePlusCode(firstChunk) ? "Unnamed Road, Accra" : prediction.description;
            onChange({ address: safe, lat, lng });
            return;
          }

          const normalized = getShortAddress(r0);
          const normalizedFirst = (normalized.split(",")[0] || "").trim();
          const finalLabel = looksLikePlusCode(normalizedFirst) ? `Unnamed Road, ${getArea(r0)}` : normalized;

          onChange({ address: finalLabel, lat, lng });
        });
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
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setBiasCenter({ lat: latitude, lng: longitude });
        onChange({ address: "Unnamed Road, Accra", lat: latitude, lng: longitude });

        geocoderRef.current?.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          const r0 = results?.[0];

          if (status !== "OK" || !r0) {
            onChange({ address: "Unnamed Road, Accra", lat: latitude, lng: longitude });
            setIsLocating(false);
            return;
          }

          const shortAddress = getShortAddress(r0);
          onChange({ address: shortAddress, lat: latitude, lng: longitude });
          setIsLocating(false);
        });
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
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-90 transition disabled:opacity-50"
          >
            <Crosshair className="w-4 h-4" />
            {isLocating ? "Locating..." : "Use current location"}
          </button>
        </div>
      )}

      <div
        className={[
          "relative flex items-center rounded-xl border bg-card transition",
          isFocused ? "border-ring" : "border-border hover:border-border",
        ].join(" ")}
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
          className="flex-1 h-11 px-2 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
          type="text"
          autoComplete="off"
        />

        {!!value?.address && (
          <button
            type="button"
            onClick={clearValue}
            className="h-11 px-3 inline-flex items-center text-muted-foreground hover:text-foreground transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showSuggestions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-2xl overflow-hidden shadow-card">
          {predictions.slice(0, 5).map((p, idx) => (
            <button
              key={p.place_id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commitSelection(p)}
              className={[
                "w-full text-left px-4 py-3 text-sm transition",
                selectedIndex === idx ? "bg-accent" : "hover:bg-accent",
              ].join(" ")}
            >
              <div className="text-foreground truncate font-semibold">
                {p.structured_formatting?.main_text || p.description}
              </div>
              <div className="text-muted-foreground text-xs truncate">
                {p.structured_formatting?.secondary_text || ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}