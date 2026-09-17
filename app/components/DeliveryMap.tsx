"use client";

import { useEffect, useRef, useState } from "react";
import type { Coordinates } from "../location";

type MapPosition = { lat: number; lng: number };
type MapMouseEvent = { latLng?: { lat(): number; lng(): number } | null };
type MapInstance = {
  addListener(event: string, callback: (event: MapMouseEvent) => void): void;
  panTo(position: MapPosition): void;
  setZoom(zoom: number): void;
};
type MarkerInstance = {
  addListener(event: string, callback: (event: MapMouseEvent) => void): void;
  setPosition(position: MapPosition): void;
};
type MapsApi = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => MapInstance;
  Marker: new (options: Record<string, unknown>) => MarkerInstance;
};

declare global {
  interface Window {
    google?: { maps?: MapsApi };
    __puffyGoogleMapsPromise?: Promise<MapsApi>;
    gm_authFailure?: () => void;
  }
}

const MAP_AUTH_EVENT = "puffy:maps-auth-failure";
const MAP_SETUP_MESSAGE = "Google rejected the map key. Enable billing and Maps JavaScript API, then allow this website under the key's HTTP referrers.";

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.__puffyGoogleMapsPromise) return window.__puffyGoogleMapsPromise;
  window.gm_authFailure = () => window.dispatchEvent(new Event(MAP_AUTH_EVENT));
  window.__puffyGoogleMapsPromise = new Promise<MapsApi>((resolve, reject) => {
    const callback = `puffyMapsReady_${Date.now()}`;
    (window as unknown as Record<string, unknown>)[callback] = () => {
      delete (window as unknown as Record<string, unknown>)[callback];
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps did not initialize."));
    };
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=${callback}&v=weekly&region=EG&language=en&auth_referrer_policy=origin`;
    script.onerror = () => {
      window.__puffyGoogleMapsPromise = undefined;
      reject(new Error("Google Maps could not load. Check the internet connection and map-key setup."));
    };
    document.head.appendChild(script);
  });
  return window.__puffyGoogleMapsPromise;
}

export default function DeliveryMap({ value, center, disabled = false, onPick }: {
  value: Coordinates | null;
  center: Coordinates;
  disabled?: boolean;
  onPick(coordinates: Coordinates): void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markerRef = useRef<MarkerInstance | null>(null);
  const onPickRef = useRef(onPick);
  const disabledRef = useRef(disabled);
  const [status, setStatus] = useState("Loading Google Maps…");
  const [mapError, setMapError] = useState("");

  useEffect(() => { onPickRef.current = onPick; }, [onPick]);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  useEffect(() => {
    let active = true;
    let validationTimer: ReturnType<typeof setTimeout> | undefined;
    const showAuthFailure = () => {
      if (!active) return;
      setMapError(MAP_SETUP_MESSAGE);
      setStatus("Use search or current location while the map key is corrected.");
    };
    window.addEventListener(MAP_AUTH_EVENT, showAuthFailure);
    fetch("/api/maps-config", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { apiKey?: string; error?: string };
        if (!response.ok || !data.apiKey) throw new Error(data.error || "Google Maps is not configured yet.");
        return loadGoogleMaps(data.apiKey);
      })
      .then((maps) => {
        if (!active || !containerRef.current) return;
        const initial = value ?? center;
        const position = { lat: initial.latitude, lng: initial.longitude };
        const map = new maps.Map(containerRef.current, {
          center: position,
          zoom: value ? 16 : 13,
          clickableIcons: false,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          gestureHandling: "greedy",
        });
        const marker = new maps.Marker({
          map,
          position,
          draggable: true,
          title: "Drag this pin to your delivery entrance",
        });
        const choose = (event: MapMouseEvent) => {
          if (disabledRef.current || !event.latLng) return;
          const next = { latitude: event.latLng.lat(), longitude: event.latLng.lng() };
          marker.setPosition({ lat: next.latitude, lng: next.longitude });
          onPickRef.current(next);
        };
        map.addListener("click", choose);
        marker.addListener("dragend", choose);
        mapRef.current = map;
        markerRef.current = marker;
        setStatus("Tap the map or drag the pin to your delivery entrance.");
        validationTimer = setTimeout(() => {
          if (containerRef.current?.querySelector(".gm-err-container,.gm-err-message")) showAuthFailure();
        }, 1400);
      })
      .catch((cause) => {
        if (!active) return;
        const message = cause instanceof Error ? cause.message : "Google Maps could not load.";
        setMapError(message);
        setStatus("Use search or current location while the map is unavailable.");
      });
    return () => {
      active = false;
      if (validationTimer) clearTimeout(validationTimer);
      window.removeEventListener(MAP_AUTH_EVENT, showAuthFailure);
    };
  }, []);

  useEffect(() => {
    if (!value || !mapRef.current || !markerRef.current) return;
    const position = { lat: value.latitude, lng: value.longitude };
    markerRef.current.setPosition(position);
    mapRef.current.panTo(position);
    mapRef.current.setZoom(16);
  }, [value]);

  return <div className={`delivery-map-shell ${disabled ? "disabled" : ""}`}>
    <div className="delivery-map" ref={containerRef} aria-label="Choose your delivery location on Google Maps" />
    {mapError && <div className="delivery-map-error" role="alert"><span aria-hidden="true">!</span><p><strong>The map needs one setup fix</strong><small>{mapError}</small></p></div>}
    <div className="delivery-map-hint"><span aria-hidden="true">⌖</span><p><strong>Drop your delivery pin</strong><small>{status}</small></p></div>
  </div>;
}
