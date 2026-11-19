import { levenshtein, normalizeAnswer } from "./normalize";

/**
 * Deterministic grading for objective exercise types.
 * Open-ended tasks (free writing, speaking) are evaluated by the AI layer;
 * this module never calls AI.
 */

export type ChoiceAnswer = { correct: string[] };
export type BlankAnswer = { blanks: string[][] };
export type TextAnswer = { accepted: string[]; required_words?: string[] };

export type ExerciseKey = ChoiceAnswer | BlankAnswer | TextAnswer;

export type GradeVerdict = "correct" | "almost" | "incorrect" | "needs_review";

export interface GradeResult {
  verdict: GradeVerdict;
  isCorrect: boolean;
  score: number; // 0..1
  /** Index-aligned blank verdicts for fill-in-the-blank. */
  blanks?: boolean[];
  /** The canonical correct answer to show after submission. */
  correctAnswer: string;
  /** The specific accepted alternative the learner matched, if any. */
  matched?: string;
  note?: "typo" | "alternative" | "missing_required_words";
  missingWords?: string[];
}

export type Response =
  | { kind: "choice"; selected: string[] }
  | { kind: "blanks"; values: string[] }
  | { kind: "text"; value: string }
  | { kind: "tokens"; order: string[] };

const CHOICE_TYPES = new Set(["multiple_choice", "listening_mc", "reading_mc", "identify_error"]);
const TEXT_TYPES = new Set([
  "correct_sentence", "rewrite", "translate_he_en", "translate_en_he", "write_sentence", "dictation",
]);

export function gradeExercise(type: string, key: ExerciseKey, response: Response, opts: { allowTypos?: boolean } = {}): GradeResult {
  if (CHOICE_TYPES.has(type)) return gradeChoice(key as ChoiceAnswer, response);
  if (type === "fill_blank") return gradeBlanks(key as BlankAnswer, response);
  if (type === "reorder") return gradeReorder(key as TextAnswer, response);
  if (TEXT_TYPES.has(type)) return gradeText(key as TextAnswer, response, opts.allowTypos ?? false);
  throw new Error(`Exercise type ${type} is not deterministically gradable`);
}

export function gradeChoice(key: ChoiceAnswer, response: Response): GradeResult {
  if (response.kind !== "choice") throw new Error("Expected choice response");
  const want = new Set(key.correct);
  const got = new Set(response.selected);
  const isCorrect = want.size === got.size && [...want].every((id) => got.has(id));
  return { verdict: isCorrect ? "correct" : "incorrect", isCorrect, score: isCorrect ? 1 : 0, correctAnswer: key.correct.join(",") };
}

export function gradeBlanks(key: BlankAnswer, response: Response): GradeResult {
  if (response.kind !== "blanks") throw new Error("Expected blanks response");
  if (response.values.length !== key.blanks.length) throw new Error("Blank count mismatch");
  const blanks = key.blanks.map((accepted, i) => {
    const v = normalizeAnswer(response.values[i] ?? "");
    return v.length > 0 && accepted.some((a) => normalizeAnswer(a) === v);
  });
  const right = blanks.filter(Boolean).length;
  const isCorrect = right === blanks.length;
  return {
    verdict: isCorrect ? "correct" : "incorrect",
    isCorrect,
    score: blanks.length ? right / blanks.length : 0,
    blanks,
    correctAnswer: key.blanks.map((b) => b[0]).join(" | "),
  };
}

export function gradeReorder(key: TextAnswer, response: Response): GradeResult {
  if (response.kind !== "tokens") throw new Error("Expected tokens response");
  return gradeText(key, { kind: "text", value: response.order.join(" ") }, false);
}

export function gradeText(key: TextAnswer, response: Response, allowTypos: boolean): GradeResult {
  if (response.kind !== "text") throw new Error("Expected text response");
  const value = normalizeAnswer(response.value);
  const canonical = key.accepted[0] ?? "";
  if (!value) return { verdict: "incorrect", isCorrect: false, score: 0, correctAnswer: canonical };

  const idx = key.accepted.findIndex((a) => normalizeAnswer(a) === value);
  if (idx >= 0) {
    return {
      verdict: "correct", isCorrect: true, score: 1, correctAnswer: canonical,
      matched: key.accepted[idx], note: idx > 0 ? "alternative" : undefined,
    };
  }

  // Open production (e.g. "write a sentence using X"): require target words.
  if (key.required_words?.length && key.accepted.length === 0) {
    const words = new Set(value.split(" "));
    const missing = key.required_words.filter((w) => !normalizeAnswer(w).split(" ").every((p) => words.has(p)));
    if (missing.length) {
      return { verdict: "incorrect", isCorrect: false, score: 0, correctAnswer: "", note: "missing_required_words", missingWords: missing };
    }
    // Words are present, but grammaticality cannot be verified deterministically.
    return { verdict: "needs_review", isCorrect: false, score: 0.5, correctAnswer: "" };
  }

  if (allowTypos) {
    for (const a of key.accepted) {
      const n = normalizeAnswer(a);
      if (n.length >= 5 && levenshtein(n, value) === 1) {
        return { verdict: "almost", isCorrect: true, score: 0.8, correctAnswer: a, matched: a, note: "typo" };
      }
    }
  }
  return { verdict: "incorrect", isCorrect: false, score: 0, correctAnswer: canonical };
}
