import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Point, TriangleMetrics } from '@/lib/geometry';

interface TriangleCanvasProps {
  pointA: Point;
  pointB: Point;
  pointC: Point;
  onChangeA: (p: Point) => void;
  onChangeB: (p: Point) => void;
  onChangeC: (p: Point) => void;
  metrics: TriangleMetrics;
}

export default function TriangleCanvas({
  pointA, pointB, pointC,
  onChangeA, onChangeB, onChangeC,
  metrics
}: TriangleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [draggingPoint, setDraggingPoint] = useState<'A' | 'B' | 'C' | null>(null);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute transform: find bounding box of points and add padding
  const transform = useMemo(() => {
    const pad = 2; // world units padding
    const minX = Math.min(pointA.x, pointB.x, pointC.x) - pad;
    const maxX = Math.max(pointA.x, pointB.x, pointC.x) + pad;
    const minY = Math.min(pointA.y, pointB.y, pointC.y) - pad;
    const maxY = Math.max(pointA.y, pointB.y, pointC.y) + pad;

    const spanX = Math.max(maxX - minX, 10);
    const spanY = Math.max(maxY - minY, 10);

    const scaleX = dimensions.width / spanX;
    const scaleY = dimensions.height / spanY;
    const scale = Math.min(scaleX, scaleY);

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const offsetX = dimensions.width / 2 - cx * scale;
    const offsetY = dimensions.height / 2 + cy * scale; // Y is inverted in SVG

    return { scale, offsetX, offsetY };
  }, [pointA, pointB, pointC, dimensions]);

  const toPx = (p: Point) => ({
    x: p.x * transform.scale + transform.offsetX,
    y: -p.y * transform.scale + transform.offsetY
  });

  const fromPx = (px: number, py: number): Point => ({
    x: (px - transform.offsetX) / transform.scale,
    y: -(py - transform.offsetY) / transform.scale
  });

  const handlePointerDown = (point: 'A' | 'B' | 'C', e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingPoint(point);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingPoint || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Snap to 0.1 for precision feel
    const p = fromPx(x, y);
    p.x = Math.round(p.x * 10) / 10;
    p.y = Math.round(p.y * 10) / 10;

    if (draggingPoint === 'A') onChangeA(p);
    if (draggingPoint === 'B') onChangeB(p);
    if (draggingPoint === 'C') onChangeC(p);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingPoint) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setDraggingPoint(null);
    }
  };

  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    const minX = Math.floor(fromPx(0, 0).x);
    const maxX = Math.ceil(fromPx(dimensions.width, 0).x);
    const minY = Math.floor(fromPx(0, dimensions.height).y);
    const maxY = Math.ceil(fromPx(0, 0).y);

    for (let x = minX; x <= maxX; x++) {
      const isAxis = x === 0;
      const isBold = x % 5 === 0;
      const px = toPx({ x, y: 0 }).x;
      lines.push(
        <line key={`vx-${x}`} x1={px} y1={0} x2={px} y2={dimensions.height} 
              stroke={isAxis ? "#1e293b" : isBold ? "#cbd5e1" : "#f1f5f9"} 
              strokeWidth={isAxis ? 2 : 1} />
      );
      if (isBold && !isAxis) {
        lines.push(<text key={`tl-x-${x}`} x={px + 4} y={toPx({x: 0, y: 0}).y + 14} fontSize={10} fill="#64748b">{x}</text>);
      }
    }
    for (let y = minY; y <= maxY; y++) {
      const isAxis = y === 0;
      const isBold = y % 5 === 0;
      const py = toPx({ x: 0, y }).y;
      lines.push(
        <line key={`vy-${y}`} x1={0} y1={py} x2={dimensions.width} y2={py} 
              stroke={isAxis ? "#1e293b" : isBold ? "#cbd5e1" : "#f1f5f9"} 
              strokeWidth={isAxis ? 2 : 1} />
      );
      if (isBold && !isAxis) {
        lines.push(<text key={`tl-y-${y}`} x={toPx({x: 0, y: 0}).x + 4} y={py - 4} fontSize={10} fill="#64748b">{y}</text>);
      }
    }
    return lines;
  }, [transform, dimensions]);

  const pA = toPx(pointA);
  const pB = toPx(pointB);
  const pC = toPx(pointC);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden bg-white rounded-lg border shadow-sm select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg width={dimensions.width} height={dimensions.height} className="absolute inset-0">
        {gridLines}

        {metrics.isValid && (
          <>
            <polygon 
              points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}`}
              fill="var(--color-primary)" 
              fillOpacity={0.1}
              stroke="var(--color-primary)"
              strokeWidth={2}
            />

            {/* Labels for side lengths */}
            <text x={(pA.x + pB.x)/2} y={(pA.y + pB.y)/2 - 8} textAnchor="middle" fontSize={12} fill="#334155" fontWeight="500">{metrics.sideAB.toFixed(2)}</text>
            <text x={(pB.x + pC.x)/2} y={(pB.y + pC.y)/2 - 8} textAnchor="middle" fontSize={12} fill="#334155" fontWeight="500">{metrics.sideBC.toFixed(2)}</text>
            <text x={(pC.x + pA.x)/2} y={(pC.y + pA.y)/2 - 8} textAnchor="middle" fontSize={12} fill="#334155" fontWeight="500">{metrics.sideCA.toFixed(2)}</text>
          </>
        )}

        <g>
          {[{p: pA, id: 'A', orig: pointA}, {p: pB, id: 'B', orig: pointB}, {p: pC, id: 'C', orig: pointC}].map(({p, id, orig}) => (
            <g key={id} transform={`translate(${p.x},${p.y})`}>
              <circle 
                r={16} 
                fill="transparent" 
                stroke="transparent" 
                className="cursor-grab hover:fill-primary/10 transition-colors"
                onPointerDown={(e) => handlePointerDown(id as any, e)}
              />
              <circle 
                r={6} 
                fill="white" 
                stroke="var(--color-primary)" 
                strokeWidth={3} 
                className="pointer-events-none"
              />
              <text 
                x={12} y={-12} 
                fontSize={14} 
                fontWeight="bold" 
                fill="var(--color-foreground)"
                className="pointer-events-none select-none"
              >{id} ({orig.x}, {orig.y})</text>
            </g>
          ))}
        </g>

        {/* Centroid */}
        {metrics.isValid && (
          <g transform={`translate(${toPx(metrics.centroid).x},${toPx(metrics.centroid).y})`}>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="var(--color-destructive)" strokeWidth={2} />
            <line x1="0" y1="-5" x2="0" y2="5" stroke="var(--color-destructive)" strokeWidth={2} />
          </g>
        )}
      </svg>
    </div>
  );
}
