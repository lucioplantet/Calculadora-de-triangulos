import { useState, useCallback, useRef } from "react";
import { RefreshCw, CheckCircle2, XCircle, ChevronRight, Trophy, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Math helpers ────────────────────────────────────────────────────────────

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function toDeg(r: number) { return r * RAD; }
function toRad(d: number) { return d * DEG; }

function lawOfCosines_side(a: number, b: number, C_deg: number) {
  return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(toRad(C_deg)));
}
function lawOfCosines_angle(a: number, b: number, c: number) {
  return toDeg(Math.acos((b * b + c * c - a * a) / (2 * b * c)));
}
function triangleArea(a: number, b: number, c: number) {
  const s = (a + b + c) / 2;
  return Math.sqrt(s * (s - a) * (s - b) * (s - c));
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ExerciseType = "SSS" | "SAS" | "AAS" | "ASA";
type Difficulty = "facil" | "medio" | "dificil";

interface FullTriangle {
  A: number; B: number; C: number;   // angles in degrees
  a: number; b: number; c: number;   // sides (a opp A, b opp B, c opp C)
  area: number; perimeter: number;
}

interface Field {
  key: keyof FullTriangle;
  label: string;
  unit: string;
  given: boolean;
  value: number;
}

interface Exercise {
  type: ExerciseType;
  triangle: FullTriangle;
  fields: Field[];
  title: string;
  description: string;
}

// ─── Triangle generation ─────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function round2(n: number) { return Math.round(n * 100) / 100; }

function buildTriangle(A: number, B: number, a: number): FullTriangle {
  const C = 180 - A - B;
  const b = round2(a * Math.sin(toRad(B)) / Math.sin(toRad(A)));
  const c = round2(a * Math.sin(toRad(C)) / Math.sin(toRad(A)));
  const area = round2(triangleArea(a, b, c));
  return { A: round2(A), B: round2(B), C: round2(C), a, b, c, area, perimeter: round2(a + b + c) };
}

function generateTriangle(diff: Difficulty): FullTriangle {
  const [minSide, maxSide, minAngle, maxAngle] =
    diff === "facil"  ? [5, 15, 30, 90] :
    diff === "medio"  ? [3, 25, 20, 120] :
                        [2, 40, 10, 140];
  let t: FullTriangle | null = null;
  while (!t) {
    const A = Math.round(randomBetween(minAngle, maxAngle));
    const B = Math.round(randomBetween(minAngle, Math.min(maxAngle, 179 - A)));
    if (A + B >= 175) continue;
    const a = Math.round(randomBetween(minSide, maxSide));
    t = buildTriangle(A, B, a);
    if (t.b <= 0 || t.c <= 0 || t.area <= 0) t = null;
  }
  return t!;
}

// ─── Exercise builders ────────────────────────────────────────────────────────

function makeSSS(tri: FullTriangle): Exercise {
  return {
    type: "SSS",
    triangle: tri,
    title: "Datos: tres lados (LLL)",
    description: "Conocés los tres lados del triángulo. Calculá los tres ángulos internos y el área.",
    fields: [
      { key: "a", label: "Lado a", unit: "m", given: true, value: tri.a },
      { key: "b", label: "Lado b", unit: "m", given: true, value: tri.b },
      { key: "c", label: "Lado c", unit: "m", given: true, value: tri.c },
      { key: "A", label: "Ángulo A", unit: "°", given: false, value: tri.A },
      { key: "B", label: "Ángulo B", unit: "°", given: false, value: tri.B },
      { key: "C", label: "Ángulo C", unit: "°", given: false, value: tri.C },
      { key: "area", label: "Área", unit: "m²", given: false, value: tri.area },
    ],
  };
}

function makeSAS(tri: FullTriangle): Exercise {
  return {
    type: "SAS",
    triangle: tri,
    title: "Datos: dos lados y el ángulo entre ellos (LAL)",
    description: "Conocés dos lados y el ángulo que forman. Calculá el tercer lado, los ángulos restantes y el área.",
    fields: [
      { key: "a", label: "Lado a", unit: "m", given: true, value: tri.a },
      { key: "b", label: "Lado b", unit: "m", given: true, value: tri.b },
      { key: "C", label: "Ángulo C (entre a y b)", unit: "°", given: true, value: tri.C },
      { key: "c", label: "Lado c", unit: "m", given: false, value: tri.c },
      { key: "A", label: "Ángulo A", unit: "°", given: false, value: tri.A },
      { key: "B", label: "Ángulo B", unit: "°", given: false, value: tri.B },
      { key: "area", label: "Área", unit: "m²", given: false, value: tri.area },
    ],
  };
}

function makeAAS(tri: FullTriangle): Exercise {
  return {
    type: "AAS",
    triangle: tri,
    title: "Datos: dos ángulos y un lado (ALA)",
    description: "Conocés dos ángulos y el lado opuesto a uno de ellos. Calculá el tercer ángulo, los lados restantes y el área.",
    fields: [
      { key: "A", label: "Ángulo A", unit: "°", given: true, value: tri.A },
      { key: "B", label: "Ángulo B", unit: "°", given: true, value: tri.B },
      { key: "a", label: "Lado a (opuesto a A)", unit: "m", given: true, value: tri.a },
      { key: "C", label: "Ángulo C", unit: "°", given: false, value: tri.C },
      { key: "b", label: "Lado b", unit: "m", given: false, value: tri.b },
      { key: "c", label: "Lado c", unit: "m", given: false, value: tri.c },
      { key: "area", label: "Área", unit: "m²", given: false, value: tri.area },
    ],
  };
}

function makeASA(tri: FullTriangle): Exercise {
  return {
    type: "ASA",
    triangle: tri,
    title: "Datos: dos ángulos y el lado entre ellos (ALA)",
    description: "Conocés dos ángulos y el lado comprendido entre ellos. Calculá el tercer ángulo y los lados restantes.",
    fields: [
      { key: "A", label: "Ángulo A", unit: "°", given: true, value: tri.A },
      { key: "c", label: "Lado c (entre A y B)", unit: "m", given: true, value: tri.c },
      { key: "B", label: "Ángulo B", unit: "°", given: true, value: tri.B },
      { key: "C", label: "Ángulo C", unit: "°", given: false, value: tri.C },
      { key: "a", label: "Lado a", unit: "m", given: false, value: tri.a },
      { key: "b", label: "Lado b", unit: "m", given: false, value: tri.b },
      { key: "area", label: "Área", unit: "m²", given: false, value: tri.area },
    ],
  };
}

const EXERCISE_TYPES: ExerciseType[] = ["SSS", "SAS", "AAS", "ASA"];

function generateExercise(diff: Difficulty): Exercise {
  const tri = generateTriangle(diff);
  const type = EXERCISE_TYPES[Math.floor(Math.random() * EXERCISE_TYPES.length)];
  switch (type) {
    case "SSS": return makeSSS(tri);
    case "SAS": return makeSAS(tri);
    case "AAS": return makeAAS(tri);
    case "ASA": return makeASA(tri);
  }
}

// ─── Triangle SVG diagram ─────────────────────────────────────────────────────

function TriangleDiagram({ exercise }: { exercise: Exercise }) {
  const W = 320, H = 220, PAD = 44;
  const tri = exercise.triangle;

  // Place triangle: A at bottom-left, B at bottom-right, C at top
  const ax = PAD, ay = H - PAD;
  const bx = W - PAD, by = H - PAD;
  // C position via law of cosines relative placement
  const sinA = Math.sin(toRad(tri.A));
  const cosA = Math.cos(toRad(tri.A));
  const base = bx - ax;
  const scale = base / tri.c;
  const cx = ax + tri.b * scale * cosA;
  const cy = ay - tri.b * scale * sinA;

  const midAB = { x: (ax + bx) / 2, y: ay + 16 };
  const midBC = { x: (bx + cx) / 2 + 12, y: (by + cy) / 2 };
  const midCA = { x: (cx + ax) / 2 - 14, y: (cy + ay) / 2 };

  const fieldMap = Object.fromEntries(exercise.fields.map(f => [f.key, f]));
  const isGiven = (key: keyof FullTriangle) => fieldMap[key]?.given ?? false;

  const givenStyle = "fill-primary stroke-primary";
  const unknownStyle = "fill-muted-foreground stroke-muted-foreground";
  const givenText = "fill-primary font-bold";
  const unknownText = "fill-muted-foreground";

  const arcRadius = 18;
  function angleArc(vx: number, vy: number, p1x: number, p1y: number, p2x: number, p2y: number) {
    const a1 = Math.atan2(p1y - vy, p1x - vx);
    const a2 = Math.atan2(p2y - vy, p2x - vx);
    const sx = vx + arcRadius * Math.cos(a1);
    const sy = vy + arcRadius * Math.sin(a1);
    const ex = vx + arcRadius * Math.cos(a2);
    const ey = vy + arcRadius * Math.sin(a2);
    let diff = a2 - a1;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const large = Math.abs(diff) > Math.PI ? 1 : 0;
    const sweep = diff > 0 ? 1 : 0;
    return `M ${sx} ${sy} A ${arcRadius} ${arcRadius} 0 ${large} ${sweep} ${ex} ${ey}`;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs mx-auto select-none">
      {/* Triangle fill */}
      <polygon
        points={`${ax},${ay} ${bx},${by} ${cx},${cy}`}
        className="fill-primary/10 stroke-primary stroke-2"
      />

      {/* Angle arcs */}
      <path d={angleArc(ax, ay, bx, by, cx, cy)}
        className={`fill-none stroke-2 ${isGiven("A") ? givenStyle : unknownStyle}`} strokeDasharray={isGiven("A") ? undefined : "4 2"} />
      <path d={angleArc(bx, by, ax, ay, cx, cy)}
        className={`fill-none stroke-2 ${isGiven("B") ? givenStyle : unknownStyle}`} strokeDasharray={isGiven("B") ? undefined : "4 2"} />
      <path d={angleArc(cx, cy, ax, ay, bx, by)}
        className={`fill-none stroke-2 ${isGiven("C") ? givenStyle : unknownStyle}`} strokeDasharray={isGiven("C") ? undefined : "4 2"} />

      {/* Vertex labels */}
      <text x={ax - 12} y={ay + 5} className="text-[13px] font-bold fill-foreground" textAnchor="middle">A</text>
      <text x={bx + 12} y={by + 5} className="text-[13px] font-bold fill-foreground" textAnchor="middle">B</text>
      <text x={cx} y={cy - 10} className="text-[13px] font-bold fill-foreground" textAnchor="middle">C</text>

      {/* Side labels */}
      <text x={midAB.x} y={midAB.y} textAnchor="middle"
        className={`text-[11px] font-semibold ${isGiven("c") ? givenText : unknownText}`}>
        c = {isGiven("c") ? `${tri.c} m` : "?"}
      </text>
      <text x={midBC.x} y={midBC.y} textAnchor="middle"
        className={`text-[11px] font-semibold ${isGiven("a") ? givenText : unknownText}`}>
        a = {isGiven("a") ? `${tri.a} m` : "?"}
      </text>
      <text x={midCA.x} y={midCA.y} textAnchor="middle"
        className={`text-[11px] font-semibold ${isGiven("b") ? givenText : unknownText}`}>
        b = {isGiven("b") ? `${tri.b} m` : "?"}
      </text>

      {/* Angle value labels */}
      <text x={ax + 26} y={ay - 8} textAnchor="middle"
        className={`text-[10px] ${isGiven("A") ? givenText : unknownText}`}>
        {isGiven("A") ? `${tri.A}°` : "A=?"}
      </text>
      <text x={bx - 26} y={by - 8} textAnchor="middle"
        className={`text-[10px] ${isGiven("B") ? givenText : unknownText}`}>
        {isGiven("B") ? `${tri.B}°` : "B=?"}
      </text>
      <text x={cx + (cx > W / 2 ? 6 : -6)} y={cy + 22} textAnchor="middle"
        className={`text-[10px] ${isGiven("C") ? givenText : unknownText}`}>
        {isGiven("C") ? `${tri.C}°` : "C=?"}
      </text>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type AnswerMap = Record<string, string>;
type ResultMap = Record<string, boolean>;

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: "Fácil",
  medio: "Medio",
  dificil: "Difícil",
};

const TOLERANCE = 0.015; // 1.5% relative tolerance

function isClose(userVal: number, correct: number): boolean {
  if (correct === 0) return Math.abs(userVal) < 0.05;
  return Math.abs(userVal - correct) / Math.abs(correct) <= TOLERANCE;
}

export default function Quiz() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [exercise, setExercise] = useState<Exercise>(() => generateExercise("medio"));
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [results, setResults] = useState<ResultMap | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const firstInputRef = useRef<HTMLInputElement>(null);

  const unknowns = exercise.fields.filter(f => !f.given);

  const newExercise = useCallback((diff: Difficulty = difficulty) => {
    setExercise(generateExercise(diff));
    setAnswers({});
    setResults(null);
    setShowHint(false);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }, [difficulty]);

  const handleDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    newExercise(d);
  };

  const handleCheck = () => {
    const res: ResultMap = {};
    let allCorrect = true;
    for (const f of unknowns) {
      const raw = answers[f.key] ?? "";
      const parsed = parseFloat(raw.replace(",", "."));
      const ok = !isNaN(parsed) && isClose(parsed, f.value);
      res[f.key] = ok;
      if (!ok) allCorrect = false;
    }
    setResults(res);
    const correct = Object.values(res).filter(Boolean).length;
    const total = unknowns.length;
    setScore(prev => ({
      correct: prev.correct + correct,
      total: prev.total + total,
    }));
  };

  const allFilled = unknowns.every(f => (answers[f.key] ?? "").trim() !== "");

  const typeColors: Record<ExerciseType, string> = {
    SSS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    SAS: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    AAS: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    ASA: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  };

  const hintMap: Record<ExerciseType, string[]> = {
    SSS: [
      "Usá el Teorema del Coseno para encontrar cada ángulo:",
      "cos(A) = (b² + c² − a²) / (2·b·c)",
      "cos(B) = (a² + c² − b²) / (2·a·c)",
      "C = 180° − A − B",
      "Área = √(s·(s−a)·(s−b)·(s−c))  con  s = (a+b+c)/2",
    ],
    SAS: [
      "Usá el Teorema del Coseno para el lado desconocido:",
      "c = √(a² + b² − 2·a·b·cos C)",
      "Luego aplicá el Teorema del Coseno para los ángulos:",
      "cos(A) = (b² + c² − a²) / (2·b·c)",
      "B = 180° − A − C",
    ],
    AAS: [
      "C = 180° − A − B",
      "Aplicá la Ley de Senos: a/sin A = b/sin B = c/sin C",
      "b = a · sin(B) / sin(A)",
      "c = a · sin(C) / sin(A)",
      "Área = (a · b · sin C) / 2",
    ],
    ASA: [
      "C = 180° − A − B",
      "Aplicá la Ley de Senos: a/sin A = b/sin B = c/sin C",
      "a = c · sin(A) / sin(C)",
      "b = c · sin(B) / sin(C)",
      "Área = (a · b · sin C) / 2",
    ],
  };

  const scorePercent = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
        <div>
          <h2 className="text-xl font-bold text-foreground">Ejercicios de Triángulos</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Calculá los valores desconocidos a partir de los datos dados.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {scorePercent !== null && (
            <div className="flex items-center gap-1.5 text-sm font-semibold mr-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-muted-foreground">{score.correct}/{score.total}</span>
              <span className={scorePercent >= 70 ? "text-green-600 dark:text-green-400" : "text-orange-500"}>({scorePercent}%)</span>
            </div>
          )}
          {(["facil", "medio", "dificil"] as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => handleDifficulty(d)}
              data-testid={`button-difficulty-${d}`}
              className={[
                "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                difficulty === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50",
              ].join(" ")}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

        {/* Left: diagram + given data */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeColors[exercise.type]}`}>
                {exercise.type}
              </span>
              <span className="text-xs text-muted-foreground">{DIFFICULTY_LABELS[difficulty]}</span>
            </div>
            <CardTitle className="text-sm font-semibold mt-2 leading-snug">{exercise.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-4">
            <TriangleDiagram exercise={exercise} />

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Datos conocidos</p>
              <div className="flex flex-col gap-1.5">
                {exercise.fields.filter(f => f.given).map(f => (
                  <div key={f.key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-mono font-semibold text-primary">{f.value} {f.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{exercise.description}</p>
          </CardContent>
        </Card>

        {/* Right: answer inputs */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold">Completá los valores desconocidos</CardTitle>
            <p className="text-xs text-muted-foreground">Ingresá tus respuestas con hasta 2 decimales. Tolerancia: ±1.5%</p>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-4">

            <div className="flex flex-col gap-3">
              {unknowns.map((f, i) => {
                const res = results?.[f.key] ?? null;
                return (
                  <div key={f.key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      {f.label} <span className="text-muted-foreground font-normal">({f.unit})</span>
                      {res === true && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                      {res === false && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        ref={i === 0 ? firstInputRef : undefined}
                        type="number"
                        step="0.01"
                        placeholder={`Calculá ${f.label}...`}
                        value={answers[f.key] ?? ""}
                        onChange={e => setAnswers(prev => ({ ...prev, [f.key]: e.target.value }))}
                        disabled={results !== null}
                        data-testid={`input-answer-${f.key}`}
                        className={[
                          "font-mono",
                          res === true ? "border-green-500 bg-green-50 dark:bg-green-950/20" :
                          res === false ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "",
                        ].join(" ")}
                      />
                      <span className="text-sm text-muted-foreground w-6 shrink-0">{f.unit}</span>
                    </div>
                    {res === false && results !== null && (
                      <p className="text-xs text-red-600 dark:text-red-400 ml-7">
                        Respuesta correcta: <span className="font-mono font-semibold">{f.value} {f.unit}</span>
                      </p>
                    )}
                    {res === true && results !== null && (
                      <p className="text-xs text-green-600 dark:text-green-400 ml-7">¡Correcto!</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hint */}
            <div className="border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
                onClick={() => setShowHint(h => !h)}
                data-testid="button-toggle-hint"
              >
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                {showHint ? "Ocultar pista" : "Ver pista de resolución"}
              </button>
              {showHint && (
                <div className="px-3 pb-3 pt-0 bg-yellow-50 dark:bg-yellow-950/20 border-t text-xs leading-relaxed text-foreground font-mono">
                  {hintMap[exercise.type].map((line, i) => (
                    <p key={i} className={i === 0 ? "font-sans font-semibold text-yellow-700 dark:text-yellow-400 mb-1 mt-1" : "mb-0.5"}>{line}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-auto pt-2">
              {results === null ? (
                <Button
                  className="flex-1"
                  onClick={handleCheck}
                  disabled={!allFilled}
                  data-testid="button-check-answers"
                >
                  Verificar respuestas
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={() => newExercise()}
                  data-testid="button-next-exercise"
                >
                  <ChevronRight className="w-4 h-4 mr-1.5" /> Siguiente ejercicio
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => newExercise()}
                data-testid="button-skip-exercise"
                title="Generar nuevo ejercicio"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {results !== null && (
              <div className={[
                "rounded-lg p-3 text-sm font-semibold text-center",
                Object.values(results).every(Boolean)
                  ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                  : "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400"
              ].join(" ")}>
                {Object.values(results).every(Boolean)
                  ? "¡Excelente! Todas las respuestas son correctas."
                  : `${Object.values(results).filter(Boolean).length} de ${unknowns.length} correctas. Revisá los marcados en rojo.`}
              </div>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
