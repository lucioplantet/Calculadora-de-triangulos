import React, { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3-geo";
import { feature } from "topojson-client";
import { getSubsolarPoint } from "@/lib/math";

interface MapProps {
  lat: number;
  lng: number;
  date: Date;
  onChange: (lat: number, lng: number) => void;
}

export default function Map({ lat, lng, date, onChange }: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [worldData, setWorldData] = useState<any>(null);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((res) => res.json())
      .then((data) => {
        setWorldData(feature(data, data.objects.countries));
      });
  }, []);

  const width = 800;
  const height = 400;

  const projection = d3.geoEquirectangular().scale(127).translate([width / 2, height / 2]);
  const pathGenerator = d3.geoPath().projection(projection);
  
  const graticule = d3.geoGraticule().step([30, 30]);

  // Terminator logic: antisolar point with radius 90 creates the night polygon
  const subsolar = getSubsolarPoint(date);
  const antisolarPoint = [-subsolar.lng, -subsolar.lat] as [number, number];
  
  const nightCircle = d3.geoCircle()
    .center(antisolarPoint)
    .radius(90)();

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    updateCoords(e);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 1) {
      updateCoords(e);
    }
  };

  const updateCoords = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    // Calculate aspect ratio scaling
    const viewBoxWidth = width;
    const viewBoxHeight = height;
    
    const scaleX = viewBoxWidth / rect.width;
    const scaleY = viewBoxHeight / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const coords = projection.invert?.([x, y]);
    if (coords) {
      let [newLng, newLat] = coords;
      newLat = Math.max(-90, Math.min(90, newLat));
      newLng = Math.max(-180, Math.min(180, newLng));
      onChange(newLat, newLng);
    }
  }, [onChange, projection]);

  const pinCoords = projection([lng, lat]) || [0, 0];

  return (
    <div className="w-full relative rounded-lg overflow-hidden border border-border bg-[#050B14] shadow-2xl shadow-primary/10 select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        {/* Graticule */}
        <path
          d={pathGenerator(graticule()) || ""}
          className="stroke-primary/20 fill-none"
          strokeWidth="0.5"
        />

        {/* World Map */}
        {worldData && (
          <path
            d={pathGenerator(worldData) || ""}
            className="fill-secondary/50 stroke-primary/30"
            strokeWidth="0.5"
          />
        )}

        {/* Terminator (Night area) */}
        <path
          d={pathGenerator(nightCircle) || ""}
          className="fill-black/60 pointer-events-none mix-blend-multiply"
        />
        
        {/* Equator */}
        <line x1="0" y1={height/2} x2={width} y2={height/2} className="stroke-primary/40 stroke-1 border-dashed" strokeDasharray="4 4"/>

        {/* Pin */}
        <g transform={`translate(${pinCoords[0]}, ${pinCoords[1]})`} className="pointer-events-none">
          <circle r="6" className="fill-primary animate-pulse" />
          <circle r="2" className="fill-white" />
          <line x1="-15" y1="0" x2="15" y2="0" className="stroke-primary" strokeWidth="1" />
          <line x1="0" y1="-15" x2="0" y2="15" className="stroke-primary" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
