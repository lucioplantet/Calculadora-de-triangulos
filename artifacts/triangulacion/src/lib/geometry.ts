export interface Point {
  x: number;
  y: number;
}

export interface TriangleMetrics {
  isValid: boolean;
  sideAB: number;
  sideBC: number;
  sideCA: number;
  perimeter: number;
  angleA: number;
  angleB: number;
  angleC: number;
  angleARad: number;
  angleBRad: number;
  angleCRad: number;
  area: number;
  centroid: Point;
  circumradius: number;
  inradius: number;
  semiperimeter: number;
  typeBySides: "Equilátero" | "Isósceles" | "Escaleno" | "N/A";
  typeByAngles: "Acutángulo" | "Rectángulo" | "Obtusángulo" | "N/A";
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function calculateMetrics(A: Point, B: Point, C: Point): TriangleMetrics {
  const sideAB = distance(A, B);
  const sideBC = distance(B, C);
  const sideCA = distance(C, A);

  const perimeter = sideAB + sideBC + sideCA;
  const s = perimeter / 2;

  // Shoelace formula for area
  const area = Math.abs(0.5 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)));
  
  // A degenerate triangle has area effectively 0
  const isValid = area > 1e-8;

  if (!isValid) {
    return {
      isValid: false,
      sideAB, sideBC, sideCA, perimeter,
      angleA: 0, angleB: 0, angleC: 0,
      angleARad: 0, angleBRad: 0, angleCRad: 0,
      area: 0, centroid: { x: 0, y: 0 },
      circumradius: 0, inradius: 0, semiperimeter: s,
      typeBySides: "N/A", typeByAngles: "N/A"
    };
  }

  const getAngle = (a: number, b: number, c: number) => {
    return Math.acos((b * b + c * c - a * a) / (2 * b * c));
  };

  const angleARad = getAngle(sideBC, sideAB, sideCA);
  const angleBRad = getAngle(sideCA, sideAB, sideBC);
  const angleCRad = getAngle(sideAB, sideBC, sideCA);

  const angleA = (angleARad * 180) / Math.PI;
  const angleB = (angleBRad * 180) / Math.PI;
  const angleC = (angleCRad * 180) / Math.PI;

  const centroid = {
    x: (A.x + B.x + C.x) / 3,
    y: (A.y + B.y + C.y) / 3
  };

  const circumradius = (sideAB * sideBC * sideCA) / (4 * area);
  const inradius = area / s;

  let typeBySides: "Equilátero" | "Isósceles" | "Escaleno" = "Escaleno";
  const eps = 1e-4;
  if (Math.abs(sideAB - sideBC) < eps && Math.abs(sideBC - sideCA) < eps) {
    typeBySides = "Equilátero";
  } else if (Math.abs(sideAB - sideBC) < eps || Math.abs(sideBC - sideCA) < eps || Math.abs(sideCA - sideAB) < eps) {
    typeBySides = "Isósceles";
  }

  let typeByAngles: "Acutángulo" | "Rectángulo" | "Obtusángulo" = "Acutángulo";
  const angles = [angleA, angleB, angleC];
  if (angles.some(a => Math.abs(a - 90) < eps)) {
    typeByAngles = "Rectángulo";
  } else if (angles.some(a => a > 90 + eps)) {
    typeByAngles = "Obtusángulo";
  }

  return {
    isValid,
    sideAB, sideBC, sideCA, perimeter,
    angleA, angleB, angleC,
    angleARad, angleBRad, angleCRad,
    area, centroid, circumradius, inradius, semiperimeter: s,
    typeBySides, typeByAngles
  };
}
