export function degToDMS(deg: number, isLng: boolean = false): string {
  const dir = isLng ? (deg >= 0 ? "E" : "W") : (deg >= 0 ? "N" : "S");
  const absDeg = Math.abs(deg);
  const d = Math.floor(absDeg);
  const minFloat = (absDeg - d) * 60;
  const m = Math.floor(minFloat);
  const s = ((minFloat - m) * 60).toFixed(1);
  return `${d}° ${m}' ${s}" ${dir}`;
}

export function getUTCOffset(lng: number): number {
  return Math.round(lng / 15);
}

export function getDayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function getSolarDeclination(dayOfYear: number): number {
  return 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180));
}

export function getSolarCalculations(lat: number, lng: number, date: Date) {
  const dayOfYear = getDayOfYear(date);
  const decDeg = getSolarDeclination(dayOfYear);
  const decRad = decDeg * (Math.PI / 180);
  const latRad = lat * (Math.PI / 180);

  // Approximate Equation of Time
  const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180);
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // UTC time in hours
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  
  const localSolarTime = (utcHours + lng / 15 + eot / 60) % 24;
  const hourAngleDeg = (localSolarTime - 12) * 15;
  const hourAngleRad = hourAngleDeg * (Math.PI / 180);

  const elevationRad = Math.asin(
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngleRad)
  );
  
  const elevationDeg = elevationRad * (180 / Math.PI);

  return {
    declination: decDeg,
    elevation: elevationDeg,
    isDay: elevationDeg > 0
  };
}

export function getSubsolarPoint(date: Date) {
  const dayOfYear = getDayOfYear(date);
  const dec = getSolarDeclination(dayOfYear);
  
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  
  // The equation of time can be skipped for a rough subsolar longitude, 
  // but let's include it for precision
  const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180);
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  
  const trueSolarTimeUTC = utcHours + eot / 60;
  let subsolarLng = (12 - trueSolarTimeUTC) * 15;
  if (subsolarLng > 180) subsolarLng -= 360;
  if (subsolarLng < -180) subsolarLng += 360;

  return { lat: dec, lng: subsolarLng };
}

export function formatOffset(offset: number): string {
  if (offset === 0) return "UTC±0";
  return `UTC${offset > 0 ? "+" : ""}${offset}`;
}
