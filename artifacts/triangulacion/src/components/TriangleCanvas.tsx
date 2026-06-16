import React, { useState, useRef, useEffect, useMemo, useImperativeHandle, forwardRef, useCallback } from 'react';
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

export interface TriangleCanvasHandle {
  exportPNG: (filename?: string) => void;
}

interface ThemeColors {
  bg: string;
  grid: string;
  gridStrong: string;
  axis: string;
  label: string;
  vertexFill: string;
  primary: string;
  destructive: string;
  foreground: string;
  fillOpacity: number;
}

const FALLBACK: ThemeColors = {
  bg: '#ffffff',
  grid: '#f1f5f9',
  gridStrong: '#cbd5e1',
  axis: '#334155',
  label: '#64748b',
  vertexFill: '#ffffff',
  primary: '#0e9bb0',
  destructive: '#dc2626',
  foreground: '#1e293b',
  fillOpacity: 0.12,
};

const TriangleCanvas = forwardRef<TriangleCanvasHandle, TriangleCanvasProps>(function TriangleCanvas({
  pointA, pointB, pointC,
  onChangeA, onChangeB, onChangeC,
  metrics
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [draggingPoint, setDraggingPoint] = useState<'A' | 'B' | 'C' | null>(null);
  const [colors, setColors] = useState<ThemeColors>(FALLBACK);

  // Read theme colors from CSS variables so the SVG renders (and serializes) with real values.
  const readColors = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const hsl = (name: string, fallback: string) => {
      const v = cs.getPropertyValue(name).trim();
      return v ? `hsl(${v})` : fallback;
    };
    setColors({
      bg: hsl('--canvas-bg', FALLBACK.bg),
      grid: hsl('--canvas-grid', FALLBACK.grid),
      gridStrong: hsl('--canvas-grid-strong', FALLBACK.gridStrong),
      axis: hsl('--canvas-axis', FALLBACK.axis),
      label: hsl('--canvas-label', FALLBACK.label),
      vertexFill: hsl('--canvas-vertex-fill', FALLBACK.vertexFill),
      primary: hsl('--primary', FALLBACK.primary),
      destructive: hsl('--destructive', FALLBACK.destructive),
      foreground: hsl('--foreground', FALLBACK.foreground),
      fillOpacity: parseFloat(cs.getPropertyValue('--triangle-fill-opacity')) || FALLBACK.fillOpacity,
    });
  }, []);

  useEffect(() => {
    readColors();
    // Re-read when the .dark class on <html> toggles.
    const observer = new MutationObserver(readColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [readColors]);

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

  // Export the current SVG view as a PNG.
  const exportPNG = useCallback((filename = 'triangulo.png') => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = dimensions;
    const scaleFactor = 2; // higher-res export

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));
    // Solid background rect so the PNG isn't transparent.
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', String(width));
    bgRect.setAttribute('height', String(height));
    bgRect.setAttribute('fill', colors.bg);
    clone.insertBefore(bgRect, clone.firstChild);

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scaleFactor;
      canvas.height = height * scaleFactor;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scaleFactor, scaleFactor);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [dimensions, colors]);

  useImperativeHandle(ref, () => ({ exportPNG }), [exportPNG]);

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
              stroke={isAxis ? colors.axis : isBold ? colors.gridStrong : colors.grid}
              strokeWidth={isAxis ? 2 : 1} />
      );
      if (isBold && !isAxis) {
        lines.push(<text key={`tl-x-${x}`} x={px + 4} y={toPx({x: 0, y: 0}).y + 14} fontSize={10} fill={colors.label}>{x}</text>);
      }
    }
    for (let y = minY; y <= maxY; y++) {
      const isAxis = y === 0;
      const isBold = y % 5 === 0;
      const py = toPx({ x: 0, y }).y;
      lines.push(
        <line key={`vy-${y}`} x1={0} y1={py} x2={dimensions.width} y2={py}
              stroke={isAxis ? colors.axis : isBold ? colors.gridStrong : colors.grid}
              strokeWidth={isAxis ? 2 : 1} />
      );
      if (isBold && !isAxis) {
        lines.push(<text key={`tl-y-${y}`} x={toPx({x: 0, y: 0}).x + 4} y={py - 4} fontSize={10} fill={colors.label}>{y}</text>);
      }
    }
    return lines;
  }, [transform, dimensions, colors]);

  const pA = toPx(pointA);
  const pB = toPx(pointB);
  const pC = toPx(pointC);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden rounded-lg border shadow-sm select-none touch-none"
      style={{ backgroundColor: colors.bg }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="absolute inset-0" fontFamily="'JetBrains Mono', monospace">
        {gridLines}

        {metrics.isValid && (
          <>
            <polygon
              points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}`}
              fill={colors.primary}
              fillOpacity={colors.fillOpacity}
              stroke={colors.primary}
              strokeWidth={2}
              strokeLinejoin="round"
            />

            {/* Labels for side lengths */}
            <text x={(pA.x + pB.x)/2} y={(pA.y + pB.y)/2 - 8} textAnchor="middle" fontSize={12} fill={colors.foreground} fontWeight="600">{metrics.sideAB.toFixed(2)}</text>
            <text x={(pB.x + pC.x)/2} y={(pB.y + pC.y)/2 - 8} textAnchor="middle" fontSize={12} fill={colors.foreground} fontWeight="600">{metrics.sideBC.toFixed(2)}</text>
            <text x={(pC.x + pA.x)/2} y={(pC.y + pA.y)/2 - 8} textAnchor="middle" fontSize={12} fill={colors.foreground} fontWeight="600">{metrics.sideCA.toFixed(2)}</text>
          </>
        )}

        <g>
          {[{p: pA, id: 'A', orig: pointA}, {p: pB, id: 'B', orig: pointB}, {p: pC, id: 'C', orig: pointC}].map(({p, id, orig}) => (
            <g key={id} transform={`translate(${p.x},${p.y})`}>
              <circle
                r={16}
                fill="transparent"
                stroke="transparent"
                className="cursor-grab"
                onPointerDown={(e) => handlePointerDown(id as any, e)}
              />
              <circle
                r={6}
                fill={colors.vertexFill}
                stroke={colors.primary}
                strokeWidth={3}
                className="pointer-events-none"
              />
              <text
                x={12} y={-12}
                fontSize={13}
                fontWeight="700"
                fill={colors.foreground}
                className="pointer-events-none select-none"
              >{id} ({orig.x}, {orig.y})</text>
            </g>
          ))}
        </g>

        {/* Centroid */}
        {metrics.isValid && (
          <g transform={`translate(${toPx(metrics.centroid).x},${toPx(metrics.centroid).y})`}>
            <line x1="-5" y1="0" x2="5" y2="0" stroke={colors.destructive} strokeWidth={2} />
            <line x1="0" y1="-5" x2="0" y2="5" stroke={colors.destructive} strokeWidth={2} />
          </g>
        )}
      </svg>
    </div>
  );
});

export default TriangleCanvas;
