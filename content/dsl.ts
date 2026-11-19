/**
 * Compact authoring helpers. They only build plain objects; validation is done
 * by content/schema.ts + content/validate.ts. Option ids are a..f in authoring
 * order; the UI shuffles display order per attempt.
 */
import type { Exercise, Skill } from "./schema";

type Expl = { he: string; en: string; grammar?: string; vocab?: string; skill?: Skill };
const ids = ["a", "b", "c", "d", "e", "f"];

function meta(e: Expl, fallbackSkill: Skill) {
  return {
    skill: e.skill ?? fallbackSkill,
    explanation_he: e.he,
    explanation_en: e.en,
    ...(e.grammar ? { grammar: e.grammar } : {}),
    ...(e.vocab ? { vocab: e.vocab } : {}),
  };
}

/** Multiple choice. `correct` is the index (or indices) of the right option(s). */
export function mc(question: string, options: string[], correct: number | number[], e: Expl & { question_he?: string }): Exercise {
  const c = Array.isArray(correct) ? correct : [correct];
  return {
    type: "multiple_choice",
    ...meta(e, e.grammar ? "grammar" : "vocabulary"),
    prompt: { question, ...(e.question_he ? { question_he: e.question_he } : {}), options: options.map((text, i) => ({ id: ids[i], text })) },
    answer: { correct: c.map((i) => ids[i]) },
  } as Exercise;
}

/** Identify the incorrect segment of a sentence. */
export function err(segments: string[], wrongIndex: number, e: Expl): Exercise {
  return {
    type: "identify_error",
    ...meta(e, "grammar"),
    prompt: { question: segments.join(" "), options: segments.map((text, i) => ({ id: ids[i], text })) },
    answer: { correct: [ids[wrongIndex]] },
  } as Exercise;
}

export function reading(passage: string, question: string, options: string[], correct: number, e: Expl): Exercise {
  return {
    type: "reading_mc",
    ...meta(e, "reading"),
    prompt: { passage, question, options: options.map((text, i) => ({ id: ids[i], text })) },
    answer: { correct: [ids[correct]] },
  } as Exercise;
}

export function listen(listening: string, question: string, options: string[], correct: number, e: Expl): Exercise {
  return {
    type: "listening_mc",
    listening,
    ...meta(e, "listening"),
    prompt: { question, options: options.map((text, i) => ({ id: ids[i], text })) },
    answer: { correct: [ids[correct]] },
  } as Exercise;
}

export function dictation(listening: string, segment: number, accepted: string[], e: Expl): Exercise {
  return { type: "dictation", listening, segment, ...meta(e, "listening"), prompt: {}, answer: { accepted } } as Exercise;
}

/** Fill in the blank(s). Each "___" in text maps to one array of accepted answers. */
export function fill(text: string, blanks: string[][] | string[], e: Expl & { hint?: string; bank?: string[] }): Exercise {
  const b = (blanks as unknown[]).every(Array.isArray) ? (blanks as string[][]) : [blanks as string[]];
  return {
    type: "fill_blank",
    ...meta(e, e.grammar ? "grammar" : "vocabulary"),
    prompt: { text, ...(e.hint ? { hint: e.hint } : {}), ...(e.bank ? { word_bank: e.bank } : {}) },
    answer: { blanks: b },
  } as Exercise;
}

/** Reorder words. `sentence` is the canonical answer; tokens are scrambled deterministically. */
export function order(sentence: string, e: Expl & { alt?: string[] }): Exercise {
  const tokens = sentence.replace(/[.?!]$/, "").split(" ");
  // deterministic scramble: reverse-interleave so it is never the original order
  const scrambled = tokens.map((_, i) => tokens[(i * 3 + 1) % tokens.length]);
  const unique = new Set(scrambled).size === tokens.length && scrambled.join(" ") !== tokens.join(" ") ? scrambled : [...tokens].reverse();
  return {
    type: "reorder",
    ...meta(e, "grammar"),
    prompt: { tokens: unique },
    answer: { accepted: [sentence, ...(e.alt ?? [])] },
  } as Exercise;
}

export function fix(sentence: string, accepted: string[], e: Expl): Exercise {
  return { type: "correct_sentence", ...meta(e, "grammar"), prompt: { sentence }, answer: { accepted } } as Exercise;
}

export function rewrite(sentence: string, instruction_en: string, instruction_he: string, accepted: string[], e: Expl): Exercise {
  return { type: "rewrite", ...meta(e, "grammar"), prompt: { sentence, instruction_en, instruction_he }, answer: { accepted } } as Exercise;
}

export function tr(source: string, accepted: string[], e: Expl): Exercise {
  return { type: "translate_he_en", ...meta(e, "writing"), prompt: { source }, answer: { accepted } } as Exercise;
}

export function write(instruction_en: string, instruction_he: string, required_words: string[], sample: string, e: Expl): Exercise {
  return {
    type: "write_sentence", ...meta(e, "writing"),
    prompt: { instruction_en, instruction_he, required_words },
    answer: { accepted: [], required_words, sample },
  } as Exercise;
}

export function speak(task_en: string, task_he: string, target_words: string[], sample: string, e: Expl): Exercise {
  return { type: "speaking_prompt", ...meta(e, "speaking"), prompt: { task_en, task_he, target_words }, answer: { sample } } as Exercise;
}

export function essay(task_en: string, task_he: string, min_words: number, max_words: number, sample: string, e: Expl): Exercise {
  return { type: "free_writing", ...meta(e, "writing"), prompt: { task_en, task_he, min_words, max_words }, answer: { sample } } as Exercise;
}
