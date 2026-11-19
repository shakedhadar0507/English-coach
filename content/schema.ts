import { z } from "zod";

/**
 * Curriculum authoring schema. Every content file is validated against these
 * schemas (plus semantic checks in validate.ts) before it can be seeded.
 */

export const Level = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type Level = z.infer<typeof Level>;
export const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const Skill = z.enum(["vocabulary", "grammar", "listening", "reading", "writing", "speaking"]);
export type Skill = z.infer<typeof Skill>;

const Bilingual = z.object({ en: z.string().min(1), he: z.string().min(1) });
const Option = z.object({ id: z.string().min(1), text: z.string().min(1) });

export const VocabEntry = z.object({
  lemma: z.string().min(1),
  pos: z.enum(["noun", "verb", "adjective", "adverb", "phrase", "phrasal verb", "idiom", "preposition", "conjunction", "pronoun", "determiner", "interjection", "collocation"]),
  level: Level,
  ipa: z.string().optional(),
  tags: z.array(z.string()).default([]),
  meanings: z.array(z.object({
    en: z.string().min(3),
    he: z.array(z.string().min(1)).min(1),
    note_he: z.string().optional(),
    register: z.enum(["formal", "informal", "neutral", "business", "academic", "slang"]).optional(),
  })).min(1),
  examples: z.array(z.object({ en: z.string().min(3), he: z.string().optional() })).min(1),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
});
export type VocabEntry = z.infer<typeof VocabEntry>;

export const GrammarTopic = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  level: Level,
  title_en: z.string(),
  title_he: z.string(),
  summary_en: z.string(),
  summary_he: z.string(),
  rules: z.array(Bilingual).min(1),
  examples: z.array(z.object({ en: z.string(), he: z.string(), note: z.string().optional() })).min(2),
  mistakes: z.array(z.object({ wrong: z.string(), right: z.string(), he: z.string() })).default([]),
});
export type GrammarTopic = z.infer<typeof GrammarTopic>;

export const ListeningMaterial = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  level: Level,
  format: z.enum(["sentence", "dialogue", "conversation", "workplace", "academic", "story", "passage"]),
  title_en: z.string(),
  title_he: z.string(),
  context_he: z.string().optional(),
  accent: z.enum(["american", "british", "australian"]).default("american"),
  segments: z.array(z.object({ speaker: z.string(), text: z.string().min(1) })).min(1),
  glossary: z.array(z.object({ term: z.string(), he: z.string(), en: z.string().optional() })).default([]),
});
export type ListeningMaterial = z.infer<typeof ListeningMaterial>;

// ---- Exercises: discriminated by type; prompt is public, answer is secret ----
const ChoiceAnswer = z.object({ correct: z.array(z.string()).min(1) });
const TextAnswer = z.object({ accepted: z.array(z.string().min(1)).min(1) });

const base = {
  skill: Skill,
  explanation_en: z.string().min(1),
  explanation_he: z.string().min(1),
  grammar: z.string().optional(),     // grammar topic slug
  vocab: z.string().optional(),       // vocabulary lemma
};

export const Exercise = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("multiple_choice"), prompt: z.object({ question: z.string(), question_he: z.string().optional(), options: z.array(Option).min(2).max(6) }), answer: ChoiceAnswer }),
  z.object({ ...base, type: z.literal("identify_error"), prompt: z.object({ question: z.string(), options: z.array(Option).min(2).max(6) }), answer: ChoiceAnswer }),
  z.object({ ...base, type: z.literal("reading_mc"), prompt: z.object({ passage: z.string().min(20), question: z.string(), options: z.array(Option).min(2).max(6) }), answer: ChoiceAnswer }),
  z.object({ ...base, type: z.literal("listening_mc"), listening: z.string(), prompt: z.object({ question: z.string(), options: z.array(Option).min(2).max(6) }), answer: ChoiceAnswer }),
  z.object({ ...base, type: z.literal("fill_blank"), prompt: z.object({ text: z.string().includes("___"), hint: z.string().optional(), word_bank: z.array(z.string()).optional() }), answer: z.object({ blanks: z.array(z.array(z.string().min(1)).min(1)).min(1) }) }),
  z.object({ ...base, type: z.literal("reorder"), prompt: z.object({ tokens: z.array(z.string().min(1)).min(3) }), answer: TextAnswer }),
  z.object({ ...base, type: z.literal("correct_sentence"), prompt: z.object({ sentence: z.string() }), answer: TextAnswer }),
  z.object({ ...base, type: z.literal("rewrite"), prompt: z.object({ sentence: z.string(), instruction_en: z.string(), instruction_he: z.string() }), answer: TextAnswer }),
  z.object({ ...base, type: z.literal("translate_he_en"), prompt: z.object({ source: z.string() }), answer: TextAnswer }),
  z.object({ ...base, type: z.literal("write_sentence"), prompt: z.object({ instruction_en: z.string(), instruction_he: z.string(), required_words: z.array(z.string()).min(1) }), answer: z.object({ accepted: z.array(z.string()).default([]), required_words: z.array(z.string()).min(1), sample: z.string() }) }),
  z.object({ ...base, type: z.literal("dictation"), listening: z.string(), segment: z.number().int().min(0), prompt: z.object({ instruction_he: z.string().optional() }), answer: TextAnswer }),
  z.object({ ...base, type: z.literal("speaking_prompt"), prompt: z.object({ task_en: z.string(), task_he: z.string(), target_words: z.array(z.string()).default([]) }), answer: z.object({ sample: z.string() }) }),
  z.object({ ...base, type: z.literal("free_writing"), prompt: z.object({ task_en: z.string(), task_he: z.string(), min_words: z.number().int().min(5), max_words: z.number().int().max(600) }), answer: z.object({ sample: z.string() }) }),
]);
export type Exercise = z.infer<typeof Exercise>;

export const Lesson = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(["vocabulary", "grammar", "listening", "reading", "writing", "speaking", "review", "mixed"]),
  title_en: z.string(),
  title_he: z.string(),
  intro_en: z.string().default(""),
  intro_he: z.string().default(""),
  minutes: z.number().int().min(1).max(30),
  exercises: z.array(Exercise).min(1),
});
export type Lesson = z.infer<typeof Lesson>;

export const Unit = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  level: Level,
  title_en: z.string(),
  title_he: z.string(),
  objectives: z.array(Bilingual).min(1),
  prerequisites: z.array(z.string()).default([]),
  grammar: z.array(z.string()).default([]),
  vocabulary: z.array(z.string()).default([]),
  completion: z.object({ min_accuracy: z.number().min(0).max(1).default(0.7) }).default({ min_accuracy: 0.7 }),
  lessons: z.array(Lesson).min(1),
});
export type Unit = z.infer<typeof Unit>;

export const Course = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.string(),
  level: Level,
  title_en: z.string(),
  title_he: z.string(),
  description_en: z.string().default(""),
  description_he: z.string().default(""),
  goals: z.array(z.enum(["everyday", "business", "academic", "travel", "job_interviews", "presentations", "general_fluency"])).default([]),
  modules: z.array(z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title_en: z.string(),
    title_he: z.string(),
    units: z.array(Unit).min(1),
  })).min(1),
});
export type Course = z.infer<typeof Course>;

export const AssessmentItem = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  skill: z.enum(["vocabulary", "grammar", "listening", "reading"]),
  level: Level,
  exercise: Exercise,
});
export type AssessmentItem = z.infer<typeof AssessmentItem>;

export const Category = z.object({ slug: z.string(), title_en: z.string(), title_he: z.string() });
