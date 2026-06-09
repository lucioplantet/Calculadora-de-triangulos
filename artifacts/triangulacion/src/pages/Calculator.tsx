import React, { useState, useMemo } from "react";
import TriangleCanvas from "@/components/TriangleCanvas";
import { Point, calculateMetrics } from "@/lib/geometry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, RotateCcw, Copy, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Calculator() {
  const [pointA, setPointA] = useState<Point>({ x: 0, y: 0 });
  const [pointB, setPointB] = useState<Point>({ x: 6, y: 0 });
  const [pointC, setPointC] = useState<Point>({ x: 3, y: 5 });
  const [unit, setUnit] = useState<"m" | "ft">("m");
  const [formulasOpen, setFormulasOpen] = useState(false);

  const { toast } = useToast();

  const metrics = useMemo(() => calculateMetrics(pointA, pointB, pointC), [pointA, pointB, pointC]);

  const handleReset = () => {
    setPointA({ x: 0, y: 0 });
    setPointB({ x: 6, y: 0 });
    setPointC({ x: 3, y: 5 });
  };

  const handleExport = () => {
    if (!metrics.isValid) {
      toast({ title: "No se puede exportar", description: "El triángulo es inválido." });
      return;
    }
    const text = `
Triángulo Estadístico
---------------------
Punto A: (${pointA.x}, ${pointA.y})
Punto B: (${pointB.x}, ${pointB.y})
Punto C: (${pointC.x}, ${pointC.y})

Medidas de Lados:
AB = ${metrics.sideAB.toFixed(4)} ${unit}
BC = ${metrics.sideBC.toFixed(4)} ${unit}
CA = ${metrics.sideCA.toFixed(4)} ${unit}
Perímetro = ${metrics.perimeter.toFixed(4)} ${unit}

Ángulos Internos:
A = ${metrics.angleA.toFixed(4)}° (${metrics.angleARad.toFixed(4)} rad)
B = ${metrics.angleB.toFixed(4)}° (${metrics.angleBRad.toFixed(4)} rad)
C = ${metrics.angleC.toFixed(4)}° (${metrics.angleCRad.toFixed(4)} rad)

Área: ${metrics.area.toFixed(4)} ${unit}²

Propiedades:
Por lados: ${metrics.typeBySides}
Por ángulos: ${metrics.typeByAngles}
Centroide: (${metrics.centroid.x.toFixed(4)}, ${metrics.centroid.y.toFixed(4)})
Circunradio: ${metrics.circumradius.toFixed(4)} ${unit}
Inradio: ${metrics.inradius.toFixed(4)} ${unit}
    `.trim();

    navigator.clipboard.writeText(text);
    toast({ title: "Exportado", description: "Datos copiados al portapapeles." });
  };

  const PointInput = ({ label, point, setPoint }: { label: string, point: Point, setPoint: (p: Point) => void }) => (
    <div className="flex flex-col gap-2 p-3 bg-secondary/30 rounded-lg border">
      <Label className="font-semibold text-primary">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">X</Label>
          <Input 
            type="number" 
            value={point.x} 
            onChange={(e) => setPoint({ ...point, x: parseFloat(e.target.value) || 0 })} 
            className="w-20 font-mono text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Y</Label>
          <Input 
            type="number" 
            value={point.y} 
            onChange={(e) => setPoint({ ...point, y: parseFloat(e.target.value) || 0 })} 
            className="w-20 font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 flex flex-col max-w-7xl mx-auto gap-6">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calculadora Estadística de Triangulación de Terrenos</h1>
          <p className="text-muted-foreground mt-1">Ingresa coordenadas o arrastra los vértices en el plano cartesiano.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Unidad:</Label>
            <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="m">Metros (m)</SelectItem>
                <SelectItem value="ft">Pies (ft)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleReset} size="sm">
            <RotateCcw className="w-4 h-4 mr-2" /> Restaurar
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          <div className="flex flex-wrap gap-4">
            <PointInput label="Punto A" point={pointA} setPoint={setPointA} />
            <PointInput label="Punto B" point={pointB} setPoint={setPointB} />
            <PointInput label="Punto C" point={pointC} setPoint={setPointC} />
          </div>

          {!metrics.isValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Triángulo inválido</AlertTitle>
              <AlertDescription>
                Los puntos son colineales o degenerados. Por favor, mueve los puntos para formar un triángulo.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex-1 min-h-[400px]">
            <TriangleCanvas 
              pointA={pointA} pointB={pointB} pointC={pointC}
              onChangeA={setPointA} onChangeB={setPointB} onChangeC={setPointC}
              metrics={metrics}
            />
          </div>

        </div>

        <div className="flex flex-col gap-6">
          <Card className={`flex-1 transition-opacity ${!metrics.isValid ? 'opacity-50 pointer-events-none' : ''}`}>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Resultados</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-6 font-mono text-sm">
              
              <div>
                <h4 className="font-semibold font-sans mb-2 text-primary border-b pb-1">Medidas de Lados</h4>
                <div className="grid grid-cols-2 gap-y-1">
                  <span>Lado AB:</span> <span>{metrics.sideAB.toFixed(4)} {unit}</span>
                  <span>Lado BC:</span> <span>{metrics.sideBC.toFixed(4)} {unit}</span>
                  <span>Lado CA:</span> <span>{metrics.sideCA.toFixed(4)} {unit}</span>
                  <span className="font-bold mt-1">Perímetro:</span> <span className="font-bold mt-1">{metrics.perimeter.toFixed(4)} {unit}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold font-sans mb-2 text-primary border-b pb-1">Ángulos Internos</h4>
                <div className="flex flex-col gap-y-1">
                  <div className="flex justify-between"><span>∠A:</span> <span>{metrics.angleA.toFixed(4)}° <span className="text-muted-foreground ml-1">({metrics.angleARad.toFixed(4)} rad)</span></span></div>
                  <div className="flex justify-between"><span>∠B:</span> <span>{metrics.angleB.toFixed(4)}° <span className="text-muted-foreground ml-1">({metrics.angleBRad.toFixed(4)} rad)</span></span></div>
                  <div className="flex justify-between"><span>∠C:</span> <span>{metrics.angleC.toFixed(4)}° <span className="text-muted-foreground ml-1">({metrics.angleCRad.toFixed(4)} rad)</span></span></div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Suma:</span> <span>{(metrics.angleA + metrics.angleB + metrics.angleC).toFixed(2)}°</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold font-sans mb-2 text-primary border-b pb-1">Área</h4>
                <div className="flex justify-between font-bold text-base">
                  <span>Área:</span> <span>{metrics.area.toFixed(4)} {unit}²</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Fórmula de Gauss / Shoelace</div>
              </div>

              <div>
                <h4 className="font-semibold font-sans mb-2 text-primary border-b pb-1">Propiedades</h4>
                <div className="grid grid-cols-2 gap-y-1">
                  <span>Lados:</span> <span>{metrics.typeBySides}</span>
                  <span>Ángulos:</span> <span>{metrics.typeByAngles}</span>
                  <span>Centroide:</span> <span>({metrics.centroid.x.toFixed(4)}, {metrics.centroid.y.toFixed(4)})</span>
                  <span>Circunradio:</span> <span>{metrics.circumradius.toFixed(4)} {unit}</span>
                  <span>Inradio:</span> <span>{metrics.inradius.toFixed(4)} {unit}</span>
                  <span>Semiperím:</span> <span>{metrics.semiperimeter.toFixed(4)} {unit}</span>
                </div>
              </div>

              <div className="pt-2 mt-auto">
                <Button className="w-full" onClick={handleExport} disabled={!metrics.isValid}>
                  <Copy className="w-4 h-4 mr-2" /> Exportar datos
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      <Collapsible open={formulasOpen} onOpenChange={setFormulasOpen} className="border rounded-lg bg-card">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full flex justify-between p-4 h-auto rounded-none rounded-t-lg">
            <span className="flex items-center font-semibold text-base"><Info className="w-5 h-5 mr-2 text-primary"/> Referencia de Fórmulas</span>
            <span className="text-muted-foreground">{formulasOpen ? 'Ocultar' : 'Mostrar'}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-0 text-sm font-mono leading-relaxed bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold font-sans mb-1 text-primary">Distancia entre puntos:</p>
              <p>d = √((x₂ - x₁)² + (y₂ - y₁)²)</p>
            </div>
            <div>
              <p className="font-semibold font-sans mb-1 text-primary">Área (Shoelace/Gauss):</p>
              <p>A = ½ |x_A(y_B - y_C) + x_B(y_C - y_A) + x_C(y_A - y_B)|</p>
            </div>
            <div>
              <p className="font-semibold font-sans mb-1 text-primary">Teorema del Coseno (Ángulos):</p>
              <p>cos(A) = (b² + c² - a²) / (2bc)</p>
            </div>
            <div>
              <p className="font-semibold font-sans mb-1 text-primary">Radios:</p>
              <p>Circunradio (R) = (a·b·c) / (4·A)</p>
              <p>Inradio (r) = A / s, donde s = (a+b+c)/2</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

    </div>
  );
}
