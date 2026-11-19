import { createHash } from "node:crypto";
import { z } from "zod";
import { AssessmentItem, Course, Exercise, GrammarTopic, LEVELS, ListeningMaterial, VocabEntry, type Level, type AssessmentInput, type CourseInput, type GrammarInput, type ListeningInput, type VocabInput } from "./schema";
import { normalizeAnswer } from "../src/lib/learning/normalize";

export interface Issue { severity: "error" | "warning"; entity: string; slug: string; code: string; message: string }

export interface ContentBundle {
  grammar: GrammarTopic[];
  vocabulary: VocabEntry[];
  listening: ListeningMaterial[];
  courses: Course[];
  assessment: AssessmentItem[];
}

export interface ContentBundleInput {
  grammar: GrammarInput[];
  vocabulary: VocabInput[];
  listening: ListeningInput[];
  courses: CourseInput[];
  assessment: AssessmentInput[];
}

const lvl = (l: Level) => LEVELS.indexOf(l);
const HEBREW = /[֐-׿]/;

export function validateBundle(input: ContentBundleInput): { issues: Issue[]; checksum: string; counts: Record<string, number>; parsed: ContentBundle } {
  const issues: Issue[] = [];
  const add = (severity: Issue["severity"], entity: string, slug: string, code: string, message: string) =>
    issues.push({ severity, entity, slug, code, message });

  // 1. Schema validation
  const parse = <T>(schema: z.ZodType<T>, items: unknown[], entity: string, key: (x: any) => string): T[] =>
    items.map((it) => {
      const r = schema.safeParse(it);
      if (!r.success) {
        add("error", entity, key(it) ?? "?", "schema", r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
        return it as T;
      }
      return r.data;
    });
  const checksum = createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 16);
  const raw: ContentBundle = {
    grammar: parse(GrammarTopic, input.grammar, "grammar", (x) => x.slug),
    vocabulary: parse(VocabEntry, input.vocabulary, "vocabulary", (x) => x.lemma),
    listening: parse(ListeningMaterial, input.listening, "listening", (x) => x.slug),
    courses: parse(Course, input.courses, "course", (x) => x.slug),
    assessment: parse(AssessmentItem, input.assessment, "assessment", (x) => x.slug),
  };

  // 2. Uniqueness
  const dup = (entity: string, keys: string[]) => {
    const seen = new Set<string>();
    for (const k of keys) { if (seen.has(k)) add("error", entity, k, "duplicate", `Duplicate ${entity} key ${k}`); seen.add(k); }
  };
  const units = raw.courses.flatMap((c) => c.modules.flatMap((m) => m.units));
  const lessons = units.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u })));
  dup("grammar", raw.grammar.map((g) => g.slug));
  dup("vocabulary", raw.vocabulary.map((v) => `${v.lemma.toLowerCase()}|${v.pos}`));
  dup("listening", raw.listening.map((l) => l.slug));
  dup("course", raw.courses.map((c) => c.slug));
  dup("module", raw.courses.flatMap((c) => c.modules.map((m) => m.slug)));
  dup("unit", units.map((u) => u.slug));
  dup("lesson", lessons.map((l) => l.slug));
  dup("assessment", raw.assessment.map((a) => a.slug));

  const grammar = new Map(raw.grammar.map((g) => [g.slug, g]));
  const vocab = new Map(raw.vocabulary.map((v) => [v.lemma.toLowerCase(), v]));
  const listening = new Map(raw.listening.map((l) => [l.slug, l]));
  const unitSlugs = new Set(units.map((u) => u.slug));

  // 3. Vocabulary sanity
  for (const v of raw.vocabulary) {
    for (const m of v.meanings) if (!m.he.every((h) => HEBREW.test(h))) add("error", "vocabulary", v.lemma, "hebrew_missing", "Hebrew translation without Hebrew characters");
    const lemmaRoot = v.lemma.toLowerCase().split(" ")[0].slice(0, 4);
    if (!v.examples.some((e) => e.en.toLowerCase().includes(lemmaRoot))) add("warning", "vocabulary", v.lemma, "example_missing_lemma", "No example sentence visibly contains the word");
  }

  // 4. Units: references, prerequisites, cycles
  for (const u of units) {
    for (const g of u.grammar) if (!grammar.has(g)) add("error", "unit", u.slug, "unknown_grammar", `Unknown grammar topic ${g}`);
    for (const w of u.vocabulary) {
      const v = vocab.get(w.toLowerCase());
      if (!v) add("error", "unit", u.slug, "unknown_vocab", `Unknown vocabulary ${w}`);
      else if (lvl(v.level) > lvl(u.level) + 1) add("warning", "unit", u.slug, "vocab_level", `${w} (${v.level}) is far above unit level ${u.level}`);
    }
    for (const p of u.prerequisites) if (!unitSlugs.has(p)) add("error", "unit", u.slug, "unknown_prerequisite", `Unknown prerequisite ${p}`);
  }
  const prereq = new Map(units.map((u) => [u.slug, u.prerequisites]));
  const visiting = new Set<string>(); const done = new Set<string>();
  const dfs = (s: string): boolean => {
    if (done.has(s)) return false; if (visiting.has(s)) return true;
    visiting.add(s); const cyc = (prereq.get(s) ?? []).some(dfs); visiting.delete(s); done.add(s); return cyc;
  };
  for (const u of units) if (dfs(u.slug)) add("error", "unit", u.slug, "prerequisite_cycle", "Prerequisite cycle detected");

  // 5. Exercises
  const promptSeen = new Map<string, string>();
  const checkExercise = (ex: Exercise, where: string, level: Level) => {
    if (!HEBREW.test(ex.explanation_he)) add("error", "exercise", where, "hebrew_missing", "Hebrew explanation missing");
    if (ex.grammar && !grammar.has(ex.grammar)) add("error", "exercise", where, "unknown_grammar", `Unknown grammar ${ex.grammar}`);
    if (ex.grammar && grammar.has(ex.grammar) && lvl(grammar.get(ex.grammar)!.level) > lvl(level))
      add("warning", "exercise", where, "grammar_level", `Grammar topic ${ex.grammar} is above ${level}`);
    if (ex.vocab && !vocab.has(ex.vocab.toLowerCase())) add("error", "exercise", where, "unknown_vocab", `Unknown vocab ${ex.vocab}`);

    const key = normalizeAnswer(JSON.stringify(ex.prompt)) + "|" + ex.type + (ex.type === "dictation" ? `|${ex.listening}|${ex.segment}` : "");
    if (promptSeen.has(key)) add("error", "exercise", where, "duplicate_prompt", `Same prompt as ${promptSeen.get(key)}`);
    promptSeen.set(key, where);

    switch (ex.type) {
      case "multiple_choice": case "identify_error": case "reading_mc": case "listening_mc": {
        const ids = new Set(ex.prompt.options.map((o) => o.id));
        for (const c of ex.answer.correct) if (!ids.has(c)) add("error", "exercise", where, "bad_key", `Answer ${c} is not an option`);
        const texts = ex.prompt.options.map((o) => normalizeAnswer(o.text));
        if (new Set(texts).size !== texts.length && ex.type !== "identify_error") add("error", "exercise", where, "ambiguous_options", "Two options are identical after normalization");
        if (ex.type === "listening_mc" && !listening.has(ex.listening)) add("error", "exercise", where, "unknown_listening", ex.listening);
        if (ex.type === "multiple_choice" && ex.answer.correct.length > 1) add("warning", "exercise", where, "multi_answer", "Multiple correct answers; UI must allow multi-select");
        break;
      }
      case "fill_blank": {
        const n = ex.prompt.text.split("___").length - 1;
        if (n !== ex.answer.blanks.length) add("error", "exercise", where, "blank_count", `${n} blanks in text, ${ex.answer.blanks.length} answer sets`);
        if (ex.prompt.word_bank) for (const b of ex.answer.blanks) if (!b.some((a) => ex.prompt.word_bank!.includes(a))) add("error", "exercise", where, "bank_missing_answer", "Word bank lacks the answer");
        break;
      }
      case "reorder": {
        const want = normalizeAnswer(ex.answer.accepted[0]).split(" ").sort().join(" ");
        const got = normalizeAnswer(ex.prompt.tokens.join(" ")).split(" ").sort().join(" ");
        if (want !== got) add("error", "exercise", where, "reorder_tokens", "Tokens do not match the canonical answer");
        if (normalizeAnswer(ex.prompt.tokens.join(" ")) === normalizeAnswer(ex.answer.accepted[0])) add("error", "exercise", where, "reorder_unscrambled", "Tokens are already in the correct order");
        break;
      }
      case "correct_sentence": {
        if (ex.answer.accepted.some((a) => normalizeAnswer(a) === normalizeAnswer(ex.prompt.sentence))) add("error", "exercise", where, "correction_equals_prompt", "Accepted answer equals the incorrect sentence");
        break;
      }
      case "dictation": {
        const l = listening.get(ex.listening);
        if (!l) add("error", "exercise", where, "unknown_listening", ex.listening);
        else if (!l.segments[ex.segment]) add("error", "exercise", where, "bad_segment", `Segment ${ex.segment} does not exist`);
        else if (normalizeAnswer(l.segments[ex.segment].text) !== normalizeAnswer(ex.answer.accepted[0])) add("error", "exercise", where, "dictation_mismatch", "First accepted answer differs from the audio transcript");
        break;
      }
      case "write_sentence": {
        for (const w of ex.answer.required_words) if (!normalizeAnswer(ex.answer.sample).includes(normalizeAnswer(w))) add("error", "exercise", where, "sample_missing_word", `Sample answer lacks required word ${w}`);
        break;
      }
    }
  };

  for (const l of lessons) {
    l.exercises.forEach((ex, i) => checkExercise(ex, `${l.slug}#${i + 1}`, l.unit.level));
    if (l.exercises.length < 2 && !["speaking", "writing"].includes(l.kind)) add("warning", "lesson", l.slug, "few_exercises", "Lesson has fewer than 2 exercises");
  }
  for (const a of raw.assessment) {
    checkExercise(a.exercise, `assessment:${a.slug}`, a.level);
    if (!["multiple_choice", "fill_blank", "listening_mc", "reading_mc", "identify_error"].includes(a.exercise.type))
      add("error", "assessment", a.slug, "assessment_type", "Placement items must be deterministically gradable");
  }
  // Placement coverage: need at least 3 items per skill per level A1–C1 for adaptive selection.
  for (const skill of ["vocabulary", "grammar", "listening", "reading"] as const) {
    for (const level of LEVELS.slice(0, 5)) {
      const n = raw.assessment.filter((a) => a.skill === skill && a.level === level).length;
      if (n < 2) add("warning", "assessment", `${skill}-${level}`, "assessment_coverage", `Only ${n} placement items for ${skill} ${level}`);
    }
  }

  const counts = {
    courses: raw.courses.length, units: units.length, lessons: lessons.length,
    exercises: lessons.reduce((n, l) => n + l.exercises.length, 0),
    grammar: raw.grammar.length, vocabulary: raw.vocabulary.length, listening: raw.listening.length,
    assessment_items: raw.assessment.length,
  };
  return { issues, checksum, counts, parsed: raw };
}
