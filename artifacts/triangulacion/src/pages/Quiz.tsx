import { useState } from "react";
import { CheckCircle, XCircle, RotateCcw, ChevronRight, Trophy, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  category: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "Fundamentos",
    question: "¿Qué es la triangulación en topografía?",
    options: [
      "Un método para medir alturas usando tres niveles",
      "Una técnica que divide un terreno en triángulos para calcular su superficie a partir de coordenadas conocidas",
      "El proceso de tomar tres fotografías aéreas de un terreno",
      "Un sistema de coordenadas basado en tres ejes perpendiculares"
    ],
    correct: 1,
    explanation: "La triangulación es una técnica topográfica que descompone un terreno en triángulos. Conociendo las coordenadas de los vértices, se pueden calcular áreas, ángulos y perímetros con gran precisión."
  },
  {
    id: 2,
    category: "Fórmulas",
    question: "¿Qué fórmula se usa para calcular la distancia entre dos puntos A(x₁, y₁) y B(x₂, y₂)?",
    options: [
      "d = (x₂ - x₁) + (y₂ - y₁)",
      "d = |x₂ - x₁| × |y₂ - y₁|",
      "d = √((x₂ - x₁)² + (y₂ - y₁)²)",
      "d = (x₂ + y₂) - (x₁ + y₁)"
    ],
    correct: 2,
    explanation: "La distancia euclidiana entre dos puntos se calcula con el Teorema de Pitágoras: d = √((x₂ - x₁)² + (y₂ - y₁)²). Es la base para medir todos los lados de un triángulo en el plano cartesiano."
  },
  {
    id: 3,
    category: "Área",
    question: "La Fórmula de Gauss (Shoelace) para el área de un triángulo con vértices A, B, C es:",
    options: [
      "A = base × altura / 2",
      "A = ½ |x_A(y_B − y_C) + x_B(y_C − y_A) + x_C(y_A − y_B)|",
      "A = √(s(s−a)(s−b)(s−c)) donde s es el semiperímetro",
      "A = (a × b × sin C) / 2"
    ],
    correct: 1,
    explanation: "La Fórmula de Gauss (o Shoelace) calcula el área directamente desde las coordenadas: A = ½|x_A(y_B−y_C) + x_B(y_C−y_A) + x_C(y_A−y_B)|. Es muy útil en topografía porque no requiere medir alturas físicamente."
  },
  {
    id: 4,
    category: "Ángulos",
    question: "¿Qué teorema se usa para calcular los ángulos internos de un triángulo conociendo solo la longitud de sus tres lados?",
    options: [
      "Teorema de Tales",
      "Teorema de Thales",
      "Teorema del Coseno",
      "Teorema del Seno"
    ],
    correct: 2,
    explanation: "El Teorema del Coseno (cos A = (b² + c² − a²) / 2bc) permite calcular cualquier ángulo conociendo los tres lados. Es esencial en triangulación porque los lados se miden en campo y los ángulos se calculan después."
  },
  {
    id: 5,
    category: "Tipos de triángulo",
    question: "Un triángulo donde los tres lados son iguales se llama:",
    options: [
      "Escaleno",
      "Isósceles",
      "Equilátero",
      "Obtusángulo"
    ],
    correct: 2,
    explanation: "Equilátero = tres lados iguales, tres ángulos de 60°. Isósceles = dos lados iguales. Escaleno = todos los lados distintos. La clasificación por ángulos (acutángulo, rectángulo, obtusángulo) es independiente de la clasificación por lados."
  },
  {
    id: 6,
    category: "Propiedades",
    question: "¿Cuánto suman los ángulos internos de cualquier triángulo?",
    options: [
      "90°",
      "180°",
      "270°",
      "360°"
    ],
    correct: 1,
    explanation: "La suma de los ángulos internos de todo triángulo es exactamente 180°. Esta propiedad se usa como verificación en topografía: si la suma no da 180°, hay un error de medición."
  },
  {
    id: 7,
    category: "Centroide",
    question: "¿Cómo se calcula el centroide (baricentro) de un triángulo con vértices A, B, C?",
    options: [
      "Es el punto más cercano al lado más largo",
      "Se calcula como la media aritmética de las coordenadas: G = ((x_A+x_B+x_C)/3, (y_A+y_B+y_C)/3)",
      "Es el punto equidistante de los tres lados",
      "Se ubica a ¾ de la altura desde la base"
    ],
    correct: 1,
    explanation: "El centroide o baricentro es el punto de intersección de las medianas. Sus coordenadas son simplemente el promedio de los vértices: G = ((x_A+x_B+x_C)/3, (y_A+y_B+y_C)/3). En topografía representa el 'centro de masa' del terreno."
  },
  {
    id: 8,
    category: "Circunradio e Inradio",
    question: "El inradio (r) de un triángulo se calcula con:",
    options: [
      "r = (a × b × c) / (4 × A)",
      "r = A / s, donde s es el semiperímetro y A el área",
      "r = √(A / π)",
      "r = (a + b + c) / (2 × A)"
    ],
    correct: 1,
    explanation: "El inradio es el radio del círculo inscrito en el triángulo. Se calcula como r = A/s, donde A es el área y s = (a+b+c)/2 es el semiperímetro. El circunradio (R = abc/4A) es el radio del círculo circunscrito."
  },
  {
    id: 9,
    category: "Aplicaciones",
    question: "Si tres puntos son colineales (están en línea recta), ¿qué ocurre con el área del triángulo que forman?",
    options: [
      "El área es igual al doble de la distancia entre los extremos",
      "El área es igual a 1",
      "El área es igual a 0, el triángulo es degenerado",
      "El área es indefinida"
    ],
    correct: 2,
    explanation: "Cuando los tres puntos son colineales, el 'triángulo' degenerado tiene área = 0. En topografía esto indica un error en la toma de puntos, ya que no se puede delimitar una superficie real con puntos alineados."
  },
  {
    id: 10,
    category: "Semiperímetro",
    question: "El semiperímetro de un triángulo con lados a = 6 m, b = 8 m, c = 10 m es:",
    options: [
      "24 m",
      "12 m",
      "48 m",
      "6 m"
    ],
    correct: 1,
    explanation: "El semiperímetro s = (a + b + c) / 2 = (6 + 8 + 10) / 2 = 12 m. Este triángulo es rectángulo (6² + 8² = 10²), y con la fórmula de Herón: A = √(12×6×4×2) = √576 = 24 m²."
  },
  {
    id: 11,
    category: "Plano cartesiano",
    question: "En un plano cartesiano, ¿qué representan los ejes X e Y en un levantamiento topográfico?",
    options: [
      "X representa la altitud y Y la profundidad del terreno",
      "X representa la distancia horizontal (Este) y Y la distancia vertical (Norte)",
      "X representa el tiempo de medición y Y la precisión del instrumento",
      "X y Y representan los ángulos de inclinación del terreno"
    ],
    correct: 1,
    explanation: "En topografía, el eje X equivale a la distancia hacia el Este (coordenada Este o Easting) y el eje Y a la distancia hacia el Norte (coordenada Norte o Northing). Las coordenadas cartesianas locales son la base de todo levantamiento."
  },
  {
    id: 12,
    category: "Herramientas",
    question: "¿Qué instrumento de campo se usa tradicionalmente para medir ángulos horizontales en triangulación?",
    options: [
      "Nivel de burbuja",
      "Teodolito o Estación Total",
      "Cinta métrica",
      "GPS diferencial"
    ],
    correct: 1,
    explanation: "El teodolito (y su versión moderna, la Estación Total) mide ángulos horizontales y verticales con gran precisión. En triangulación clásica, se miden los ángulos desde puntos de control y se calculan las posiciones por trigonometría."
  },
];

type AnswerState = Record<number, number | null>;

export default function Quiz() {
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  const answered = Object.values(answers).filter((v) => v !== null).length;
  const correct = submitted
    ? QUESTIONS.filter((q) => answers[q.id] === q.correct).length
    : 0;
  const score = submitted ? Math.round((correct / QUESTIONS.length) * 100) : 0;

  const handleAnswer = (questionId: number, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (answered < QUESTIONS.length) return;
    setSubmitted(true);
    setCurrentQ(0);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setCurrentQ(0);
    setShowExplanation({});
  };

  const toggleExplanation = (id: number) => {
    setShowExplanation((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const q = QUESTIONS[currentQ];
  const userAnswer = answers[q.id] ?? null;
  const isCorrect = submitted && userAnswer === q.correct;
  const isWrong = submitted && userAnswer !== null && userAnswer !== q.correct;

  const categoryColors: Record<string, string> = {
    "Fundamentos": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "Fórmulas": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "Área": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    "Ángulos": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    "Tipos de triángulo": "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    "Propiedades": "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    "Centroide": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    "Circunradio e Inradio": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    "Aplicaciones": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    "Semiperímetro": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    "Plano cartesiano": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    "Herramientas": "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 max-w-4xl mx-auto flex flex-col gap-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b">
        <div>
          <h2 className="text-xl font-bold text-foreground">Preguntas de Práctica</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Triangulación y geometría topográfica — {QUESTIONS.length} preguntas</p>
        </div>
        <div className="flex items-center gap-3">
          {submitted && (
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className={score >= 70 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {correct}/{QUESTIONS.length} correctas ({score}%)
              </span>
            </div>
          )}
          {submitted && (
            <Button variant="outline" size="sm" onClick={handleReset} data-testid="button-reset-quiz">
              <RotateCcw className="w-4 h-4 mr-1.5" /> Reiniciar
            </Button>
          )}
        </div>
      </div>

      {submitted && (
        <Card className={`border-2 ${score >= 70 ? "border-green-400 bg-green-50 dark:bg-green-950/30" : "border-orange-400 bg-orange-50 dark:bg-orange-950/30"}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`text-5xl font-bold tabular-nums ${score >= 70 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
              {score}%
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">
                {score === 100 ? "¡Perfecto! Dominás el tema." : score >= 70 ? "¡Buen trabajo! Seguí practicando." : "Repasá el material e intentá de nuevo."}
              </p>
              <p className="text-muted-foreground text-sm">{correct} correctas de {QUESTIONS.length} preguntas</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        {QUESTIONS.map((question, i) => {
          const ua = answers[question.id] ?? null;
          let dotClass = "w-8 h-8 rounded-full border-2 text-xs font-bold transition-all cursor-pointer flex items-center justify-center ";
          if (submitted) {
            dotClass += ua === question.correct
              ? "border-green-500 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
              : "border-red-500 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
          } else if (i === currentQ) {
            dotClass += "border-primary bg-primary text-primary-foreground";
          } else if (ua !== null) {
            dotClass += "border-primary/60 bg-primary/10 text-primary";
          } else {
            dotClass += "border-border bg-background text-muted-foreground hover:border-primary/50";
          }
          return (
            <button
              key={question.id}
              className={dotClass}
              onClick={() => setCurrentQ(i)}
              data-testid={`button-question-nav-${i}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <Card className="flex-1">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${categoryColors[q.category] ?? "bg-muted text-muted-foreground"}`}>
              {q.category}
            </span>
            <span className="text-sm text-muted-foreground font-mono">{currentQ + 1} / {QUESTIONS.length}</span>
          </div>
          <CardTitle className="text-base font-semibold leading-snug mt-3" data-testid={`text-question-${q.id}`}>
            {q.question}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 flex flex-col gap-3">
          {q.options.map((option, i) => {
            let optClass = "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ";
            if (submitted) {
              if (i === q.correct) {
                optClass += "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 font-medium";
              } else if (i === userAnswer && i !== q.correct) {
                optClass += "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300";
              } else {
                optClass += "border-border bg-background text-muted-foreground opacity-60";
              }
            } else if (userAnswer === i) {
              optClass += "border-primary bg-primary/10 text-foreground font-medium";
            } else {
              optClass += "border-border bg-background text-foreground hover:border-primary/50 hover:bg-secondary/50 cursor-pointer";
            }

            return (
              <button
                key={i}
                className={optClass}
                onClick={() => handleAnswer(q.id, i)}
                disabled={submitted}
                data-testid={`button-option-${q.id}-${i}`}
              >
                <span className="flex items-center gap-3">
                  <span className="font-mono font-bold text-muted-foreground w-5 shrink-0">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span>{option}</span>
                  {submitted && i === q.correct && (
                    <CheckCircle className="w-4 h-4 ml-auto shrink-0 text-green-600" />
                  )}
                  {submitted && i === userAnswer && i !== q.correct && (
                    <XCircle className="w-4 h-4 ml-auto shrink-0 text-red-600" />
                  )}
                </span>
              </button>
            );
          })}

          {submitted && (
            <div className="mt-2">
              <button
                className="flex items-center gap-2 text-sm text-primary hover:underline"
                onClick={() => toggleExplanation(q.id)}
                data-testid={`button-explanation-${q.id}`}
              >
                <BookOpen className="w-4 h-4" />
                {showExplanation[q.id] ? "Ocultar explicación" : "Ver explicación"}
              </button>
              {showExplanation[q.id] && (
                <div className="mt-2 p-3 rounded-lg bg-muted/50 border text-sm text-foreground leading-relaxed">
                  {q.explanation}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
              disabled={currentQ === 0}
              data-testid="button-prev-question"
            >
              Anterior
            </Button>

            {currentQ < QUESTIONS.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setCurrentQ((p) => p + 1)}
                data-testid="button-next-question"
              >
                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : !submitted ? (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={answered < QUESTIONS.length}
                data-testid="button-submit-quiz"
                className="bg-primary"
              >
                Finalizar ({answered}/{QUESTIONS.length})
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={handleReset} data-testid="button-retry-quiz">
                <RotateCcw className="w-4 h-4 mr-1.5" /> Intentar de nuevo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
