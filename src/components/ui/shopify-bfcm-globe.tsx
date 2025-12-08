"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import * as topojson from "topojson-client";
import { cn } from "@/lib/utils";

interface ShopifyBfcmGlobeProps {
  className?: string;
  width?: number;
  height?: number;
  visitorCount?: number;
}

// Generate random locations for points
const generateRandomLocations = (count: number) => {
  const locations: { lat: number; lng: number; size: number }[] = [];
  for (let i = 0; i < count; i++) {
    locations.push({
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360,
      size: Math.random() * 0.5 + 0.1,
    });
  }
  return locations;
};

// Generate arcs between random points
const generateArcs = (points: { lat: number; lng: number }[], count: number) => {
  const arcs: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string[];
    time: number;
  }[] = [];
  
  for (let i = 0; i < count; i++) {
    const startPoint = points[Math.floor(Math.random() * points.length)];
    const endPoint = points[Math.floor(Math.random() * points.length)];
    
    arcs.push({
      startLat: startPoint.lat,
      startLng: startPoint.lng,
      endLat: endPoint.lat,
      endLng: endPoint.lng,
      color: ['#ffffff00', '#faf7e6', '#ffffff00'],
      time: Math.random() * 5000 + 2000,
    });
  }
  return arcs;
};

// Generate star/particle data for custom layer
const generateStars = (count: number) => {
  const stars: { lat: number; lng: number; altitude: number; size: number; color: string }[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360,
      altitude: Math.random() * 1.5 + 0.5,
      size: Math.random() * 0.8 + 0.2,
      color: "#faadfd",
    });
  }
  return stars;
};

// Colombia highlight points
const colombiaPoints = [
  { lat: 4.7110, lng: -74.0721, size: 0.8 },   // Bogotá
  { lat: 6.2442, lng: -75.5636, size: 0.6 },   // Medellín
  { lat: 3.4516, lng: -76.5320, size: 0.5 },   // Cali
  { lat: 10.9685, lng: -74.7813, size: 0.5 },  // Barranquilla
  { lat: 10.3910, lng: -75.5144, size: 0.5 },  // Cartagena
  { lat: 7.1254, lng: -73.1198, size: 0.4 },   // Bucaramanga
  { lat: 4.5339, lng: -75.6906, size: 0.4 },   // Pereira
  { lat: 7.8939, lng: -72.5078, size: 0.4 },   // Cúcuta
  { lat: 5.0689, lng: -75.5012, size: 0.4 },   // Manizales
];

// Simple land topology (simplified world boundaries)
const simpleLandTopology = {
  type: "Topology" as const,
  objects: {
    land: {
      type: "GeometryCollection" as const,
      geometries: [
        {
          type: "Polygon" as const,
          arcs: [[0]],
          properties: { name: "World" }
        }
      ]
    }
  },
  arcs: [
    // Simplified world polygon coordinates
    [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]].map(([lng, lat]) => [lng, lat])
  ]
};

export default function ShopifyBfcmGlobe({ 
  className, 
  width, 
  height,
  visitorCount = 0 
}: ShopifyBfcmGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: width || 600, height: height || 600 });

  // Generate data
  const pointsData = useMemo(() => {
    const randomPoints = generateRandomLocations(150);
    // Add Colombia highlight points with special properties
    const colombiaHighlights = colombiaPoints.map(p => ({
      ...p,
      isHighlight: true,
    }));
    return [...randomPoints, ...colombiaHighlights];
  }, []);

  const arcsData = useMemo(() => generateArcs(pointsData, 50), [pointsData]);
  const starsData = useMemo(() => generateStars(400), []);

  // Globe material
  const globeMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: "#1a2033",
      opacity: 0.95,
      transparent: true,
    });
  }, []);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height) || 600;
        setDimensions({ width: size, height: size });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Configure globe on ready
  const handleGlobeReady = useCallback(() => {
    setGlobeReady(true);
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = false;
      }
      // Point of view near South America (Colombia)
      globeRef.current.pointOfView({ lat: 4.5, lng: -74, altitude: 2.5 }, 1000);
    }
  }, []);

  // Custom three object for stars/particles
  const customThreeObject = useCallback((d: any) => {
    const geometry = new THREE.SphereGeometry(d.size * 0.5, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: d.color,
      transparent: true,
      opacity: 0.7,
    });
    return new THREE.Mesh(geometry, material);
  }, []);

  // Update star positions
  const customThreeObjectUpdate = useCallback((obj: THREE.Object3D, d: any) => {
    if (globeRef.current) {
      const coords = globeRef.current.getCoords(d.lat, d.lng, d.altitude);
      if (coords) {
        Object.assign(obj.position, coords);
      }
    }
  }, []);

  // Point color function - highlights Colombia points
  const getPointColor = useCallback((point: any) => {
    if (point.isHighlight) {
      return "#40c8e0"; // Cyan for Colombia
    }
    return "#eed31f"; // Yellow for regular points
  }, []);

  // Point altitude - make Colombia points slightly higher
  const getPointAltitude = useCallback((point: any) => {
    if (point.isHighlight) {
      return 0.02;
    }
    return 0.01;
  }, []);

  // Point radius - make Colombia points larger
  const getPointRadius = useCallback((point: any) => {
    if (point.isHighlight) {
      return point.size * 0.5;
    }
    return 0.15;
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full aspect-square cursor-move overflow-hidden",
        className
      )}
      style={{ backgroundColor: '#08070e' }}
    >
      {/* Globe */}
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#08070e"
        globeMaterial={globeMaterial}
        atmosphereColor="#5784a7"
        atmosphereAltitude={0.5}
        onGlobeReady={handleGlobeReady}
        
        // Points configuration
        pointsData={pointsData}
        pointsMerge={true}
        pointAltitude={getPointAltitude}
        pointRadius={getPointRadius}
        pointResolution={5}
        pointColor={getPointColor}
        
        // Arcs configuration
        arcsData={arcsData}
        arcAltitudeAutoScale={0.3}
        arcColor="color"
        arcStroke={0.5}
        arcDashGap={2}
        arcDashAnimateTime="time"
        
        // Custom layer for particles/stars
        customLayerData={starsData}
        customThreeObject={customThreeObject}
        customThreeObjectUpdate={customThreeObjectUpdate}
      />

      {/* Colombia Label */}
      {globeReady && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative">
            <div 
              className="absolute whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium
                         bg-white/10 backdrop-blur-md border border-white/20 text-white/90
                         shadow-lg"
              style={{
                transform: 'translate(-50%, -80px)',
                left: '50%',
              }}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Colômbia
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Visitor count overlay */}
      {visitorCount > 0 && (
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="text-xs text-white/80">Pedidos</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs text-white/80">{visitorCount} visitantes</span>
          </div>
        </div>
      )}

      {/* Glow effect overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(8,7,14,0.8) 70%)',
        }}
      />
    </div>
  );
}
