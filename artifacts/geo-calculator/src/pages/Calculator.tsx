import React, { useState, useEffect } from "react";
import Map from "@/components/Map";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { 
  degToDMS, 
  getUTCOffset, 
  getDayOfYear, 
  getSolarCalculations,
  formatOffset
} from "@/lib/math";

export default function Calculator() {
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [dateOffsetDays, setDateOffsetDays] = useState<number>(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const simulatedDate = new Date(now.getTime() + dateOffsetDays * 24 * 60 * 60 * 1000);
  
  const utcOffset = getUTCOffset(lng);
  
  const localTime = new Date(simulatedDate.getTime() + utcOffset * 60 * 60 * 1000);
  const formattedLocalTime = localTime.toISOString().substring(11, 19);
  const formattedUTC = simulatedDate.toISOString().substring(11, 19);
  
  const solar = getSolarCalculations(lat, lng, simulatedDate);
  const dayOfYear = getDayOfYear(simulatedDate);

  const regionName = lng > 0 ? "Hemisferio Oriental" : "Hemisferio Occidental";
  const hemiName = lat > 0 ? "Hemisferio Norte" : "Hemisferio Sur";

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-mono p-4 md:p-8 flex flex-col">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          Calculadora de Coordenadas
        </h1>
        <p className="text-muted-foreground mt-2 uppercase text-sm tracking-widest">
          Sistema de Telemetría Orbital
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        <div className="flex-1 flex flex-col gap-6">
          <Map lat={lat} lng={lng} date={simulatedDate} onChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }} />

          <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold text-primary/80 uppercase tracking-widest">
                <span>Control de Tiempo</span>
                <span>{dateOffsetDays === 0 ? "TIEMPO REAL" : `T + ${dateOffsetDays} DÍAS`}</span>
              </div>
              <Slider 
                value={[dateOffsetDays]} 
                min={-180} 
                max={180} 
                step={1} 
                onValueChange={(v) => setDateOffsetDays(v[0])}
                className="[&>[data-orientation=horizontal]]:bg-primary"
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>-6 Meses</span>
                <span>{simulatedDate.toISOString().substring(0, 10)}</span>
                <span>+6 Meses</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="w-full lg:w-[400px] flex flex-col gap-4">
          <Card className="p-6 bg-card border-primary/30 shadow-[0_0_30px_-5px_rgba(34,211,238,0.15)] flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Latitud</span>
                <div className="text-2xl font-bold text-white">{Math.abs(lat).toFixed(4)}° {lat >= 0 ? 'N' : 'S'}</div>
                <div className="text-sm text-primary/80">{degToDMS(lat, false)}</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Longitud</span>
                <div className="text-2xl font-bold text-white">{Math.abs(lng).toFixed(4)}° {lng >= 0 ? 'E' : 'W'}</div>
                <div className="text-sm text-primary/80">{degToDMS(lng, true)}</div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-border" />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Hora Local</span>
                <div className="text-2xl font-bold text-white">{formattedLocalTime}</div>
                <div className="text-sm text-primary/80">{formatOffset(utcOffset)} ({regionName})</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Hora UTC</span>
                <div className="text-2xl font-bold text-white">{formattedUTC}</div>
                <div className="text-sm text-primary/80">UTC±0</div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-border" />

            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Incidencia Solar</span>
              <div className="text-3xl font-bold text-white mb-1">
                {solar.elevation.toFixed(2)}°
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${solar.isDay ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'bg-slate-600'}`} />
                <span className="text-sm text-primary/80 uppercase">
                  {solar.isDay ? "Sobre el horizonte (Día)" : "Bajo el horizonte (Noche)"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Declinación</span>
                <div className="text-lg font-bold text-white">{solar.declination.toFixed(2)}°</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Día del Año</span>
                <div className="text-lg font-bold text-white">{dayOfYear} / 365</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border flex justify-between text-xs text-muted-foreground uppercase tracking-widest">
              <span>{hemiName}</span>
              <span>{regionName}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
