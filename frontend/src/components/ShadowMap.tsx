"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

interface ShadowMapProps {
  bounds: { south: number; north: number; west: number; east: number } | null;
  groundUrlA: string | null;
  groundUrlB: string | null;
  facadeUrlA: string | null;
  facadeUrlB: string | null;
  blendFactor: number;
  showGround: boolean;
  showFacade: boolean;
  showBaseMap: boolean;
  darkMode: boolean;
}

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export default function ShadowMap({
  bounds,
  groundUrlA,
  groundUrlB,
  facadeUrlA,
  facadeUrlB,
  blendFactor,
  showGround,
  showFacade,
  showBaseMap,
  darkMode,
}: ShadowMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const groundARef = useRef<L.ImageOverlay | null>(null);
  const groundBRef = useRef<L.ImageOverlay | null>(null);
  const facadeARef = useRef<L.ImageOverlay | null>(null);
  const fadecaBRef = useRef<L.ImageOverlay | null>(null);

  const prevGroundA = useRef<string | null>(null);
  const prevGroundB = useRef<string | null>(null);
  const prevFacadeA = useRef<string | null>(null);
  const prevFacadeB = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [6.854, 79.863],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (showBaseMap) {
      tileLayerRef.current = L.tileLayer(darkMode ? DARK_TILES : LIGHT_TILES, {
        maxZoom: 20,
        subdomains: "abcd",
      }).addTo(map);
      tileLayerRef.current.setZIndex(0);
    }
  }, [showBaseMap, darkMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;
    map.fitBounds(
      [[bounds.south, bounds.west], [bounds.north, bounds.east]],
      { padding: [40, 40] }
    );
  }, [bounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;

    const lb: L.LatLngBoundsExpression = [
      [bounds.south, bounds.west],
      [bounds.north, bounds.east],
    ];

    if (prevGroundA.current !== groundUrlA) {
      if (groundARef.current) { map.removeLayer(groundARef.current); groundARef.current = null; }
      if (groundUrlA && showGround) {
        groundARef.current = L.imageOverlay(groundUrlA, lb, { opacity: 0, interactive: false, className: "shadow-overlay" }).addTo(map);
      }
      prevGroundA.current = groundUrlA;
    }

    if (prevGroundB.current !== groundUrlB) {
      if (groundBRef.current) { map.removeLayer(groundBRef.current); groundBRef.current = null; }
      if (groundUrlB && showGround) {
        groundBRef.current = L.imageOverlay(groundUrlB, lb, { opacity: 0, interactive: false, className: "shadow-overlay" }).addTo(map);
      }
      prevGroundB.current = groundUrlB;
    }

    if (prevFacadeA.current !== facadeUrlA) {
      if (facadeARef.current) { map.removeLayer(facadeARef.current); facadeARef.current = null; }
      if (facadeUrlA && showFacade) {
        facadeARef.current = L.imageOverlay(facadeUrlA, lb, { opacity: 0, interactive: false, className: "shadow-overlay" }).addTo(map);
      }
      prevFacadeA.current = facadeUrlA;
    }

    if (prevFacadeB.current !== facadeUrlB) {
      if (fadecaBRef.current) { map.removeLayer(fadecaBRef.current); fadecaBRef.current = null; }
      if (facadeUrlB && showFacade) {
        fadecaBRef.current = L.imageOverlay(facadeUrlB, lb, { opacity: 0, interactive: false, className: "shadow-overlay" }).addTo(map);
      }
      prevFacadeB.current = facadeUrlB;
    }
  }, [groundUrlA, groundUrlB, facadeUrlA, facadeUrlB, bounds, showGround, showFacade]);

  useEffect(() => {
    if (!showGround) {
      groundARef.current?.setOpacity(0);
      groundBRef.current?.setOpacity(0);
    } else {
      groundARef.current?.setOpacity(0.85 * (1 - blendFactor));
      groundBRef.current?.setOpacity(0.85 * blendFactor);
    }

    if (!showFacade) {
      facadeARef.current?.setOpacity(0);
      fadecaBRef.current?.setOpacity(0);
    } else {
      facadeARef.current?.setOpacity(0.9 * (1 - blendFactor));
      fadecaBRef.current?.setOpacity(0.9 * blendFactor);
    }
  }, [blendFactor, showGround, showFacade]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
