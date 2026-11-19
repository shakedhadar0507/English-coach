import "server-only";
import { withUser, type Db } from "../db";
import { HttpError } from "../http";
import { normalizeAnswer, levenshtein } from "@/lib/learning/normalize";
import { gradeFromOutcome, newCardState, review, type CardState } from "@/lib/learning/srs";
import { candidateLessons } from "./plan";

export interface ReviewCard {
  vocabulary_id: string; lemma: string; part_of_speech: string; level: string | null; ipa_us: string | null;
  meanings: { definition_en: string; translations_he: string[] }[]; examples: { sentence_en: string; translation_he: string | null }[];
  status: string; fsrs_state: number; version: number; mode: "flashcard" | "recognition" | "production";
  options?: string[]; // Hebrew options for recognition mode
}

const CARD_SQL = `select v.id as vocabulary_id, v.lemma, v.part_of_speech, v.level, v.ipa_us,
  coalesce((select json_agg(json_build_object('definition_en', m.definition_en, 'translations_he', m.translations_he) order by m.sense_order) from vocabulary_meanings m where m.vocabulary_id = v.id), '[]') as meanings,
  coalesce((select json_agg(json_build_object('sentence_en', e.sentence_en, 'translation_he', e.translation_he)) from vocabulary_examples e where e.vocabulary_id = v.id), '[]') as examples`;

/** Chooses a practice mode per card: production for strong cards, recognition for young cards, flashcards otherwise. */
function modeFor(uv: { fsrs_state: number; reps: number; stability: number }, i: number): ReviewCard["mode"] {
  if (uv.reps === 0) return "flashcard";
  if (uv.stability >= 4 || uv.fsrs_state === 2) return i % 3 === 2 ? "recognition" : "production";
  return i % 2 === 0 ? "recognition" : "flashcard";
}

export async function reviewQueue(userId: string, limit = 20): Promise<ReviewCard[]> {
  return withUser(userId, async (db) => {
    const { rows } = await db.query(
      `${CARD_SQL}, uv.status, uv.fsrs_state, uv.version, uv.reps, uv.stability from user_vocabulary uv join vocabulary v on v.id = uv.vocabulary_id
       where uv.user_id = private.uid() and uv.status not in ('suspended','new') and uv.due <= now() order by uv.due limit $1`, [limit]);
    return attachOptions(db, rows.map((r, i) => ({ ...r, mode: modeFor(r, i) })));
  });
}

/** Introduces new words from the learner's current path into their library and returns them as cards. */
export async function newWords(userId: string, count: number): Promise<ReviewCard[]> {
  return withUser(userId, async (db) => {
    const { rows: [p] } = await db.query("select current_level from profiles where id = private.uid()");
    const lessons = await candidateLessons(db, p?.current_level ?? "A1");
    const units = [...new Set(lessons.filter((l) => !l.completed).map((l) => l.unitSlug))].slice(0, 6);
    // Words introduced earlier but never studied come first.
    const { rows: pendingNew } = await db.query(
      `${CARD_SQL}, uv.status, uv.fsrs_state, uv.version, uv.reps, uv.stability from user_vocabulary uv join vocabulary v on v.id = uv.vocabulary_id
       where uv.user_id = private.uid() and uv.status = 'new' order by uv.first_seen_at limit $1`, [count]);
    if (pendingNew.length >= count) return pendingNew.map((r) => ({ ...r, mode: "flashcard" as const }));
    count -= pendingNew.length;
    const { rows } = await db.query(
      `${CARD_SQL}, 'new' as status, 0 as fsrs_state, 0 as version, 0 as reps, 0 as stability
       from unit_vocabulary uvoc join curriculum_units u on u.id = uvoc.unit_id join vocabulary v on v.id = uvoc.vocabulary_id
       where u.slug = any($1) and not exists (select 1 from user_vocabulary x where x.user_id = private.uid() and x.vocabulary_id = v.id)
       order by array_position($1, u.slug), v.lemma limit $2`, [units, count]);
    for (const r of rows) {
      await db.query("insert into user_vocabulary (user_id, vocabulary_id, status) values (private.uid(), $1, 'new') on conflict do nothing", [r.vocabulary_id]);
    }
    return [...pendingNew, ...rows].map((r) => ({ ...r, mode: "flashcard" as const }));
  });
}

async function attachOptions(db: Db, cards: ReviewCard[]): Promise<ReviewCard[]> {
  const needs = cards.filter((c) => c.mode === "recognition");
  if (!needs.length) return cards;
  const { rows } = await db.query("select translations_he[1] as he from vocabulary_meanings where sense_order = 1 order by random() limit 60");
  const pool = rows.map((r) => r.he as string);
  return cards.map((c) => {
    if (c.mode !== "recognition") return c;
    const right = c.meanings[0]?.translations_he[0];
    const distractors = pool.filter((h) => h !== right && !c.meanings.some((m) => m.translations_he.includes(h))).slice(0, 3);
    pool.push(...pool.splice(0, 3)); // rotate so cards get different distractors
    return { ...c, options: [right, ...distractors] };
  });
}

export type ReviewAnswer =
  | { mode: "flashcard"; rating: 1 | 2 | 3 | 4 }
  | { mode: "recognition"; choice: string }
  | { mode: "production"; typed: string };

export async function submitReview(userId: string, vocabularyId: string, clientReviewId: string, expectedVersion: number, answer: ReviewAnswer) {
  return withUser(userId, async (db) => {
    await db.query("insert into user_vocabulary (user_id, vocabulary_id, status) values (private.uid(), $1, 'new') on conflict do nothing", [vocabularyId]);
    const { rows: [uv] } = await db.query("select * from user_vocabulary where user_id = private.uid() and vocabulary_id = $1", [vocabularyId]);
    const { rows: [word] } = await db.query(
      `select v.lemma, (select json_agg(m.translations_he) from vocabulary_meanings m where m.vocabulary_id = v.id) as he from vocabulary v where v.id = $1`, [vocabularyId]);
    if (!word) throw new HttpError(404, "word_not_found");

    let correct: boolean, direction: "recognition" | "production", typo = false, grade: 1 | 2 | 3 | 4;
    const state: CardState = uv.reps === 0 && !uv.last_review ? newCardState(new Date()) : {
      due: uv.due.toISOString(), stability: uv.stability, difficulty: uv.difficulty, scheduled_days: uv.scheduled_days,
      learning_steps: uv.learning_steps, reps: uv.reps, lapses: uv.lapses, fsrs_state: uv.fsrs_state, last_review: uv.last_review?.toISOString() ?? null,
    };
    if (answer.mode === "flashcard") {
      // Self-rated flashcards count as recognition evidence only.
      correct = answer.rating >= 2; direction = "recognition"; grade = answer.rating;
    } else if (answer.mode === "recognition") {
      const allHe: string[] = (word.he ?? []).flat();
      correct = allHe.includes(answer.choice); direction = "recognition";
      grade = gradeFromOutcome({ correct, direction, fsrsState: state.fsrs_state }) as 1 | 2 | 3 | 4;
    } else {
      const typed = normalizeAnswer(answer.typed), target = normalizeAnswer(word.lemma);
      correct = typed === target; direction = "production";
      if (!correct && target.length >= 5 && levenshtein(typed, target) === 1) { correct = true; typo = true; }
      grade = gradeFromOutcome({ correct, direction, typo, fsrsState: state.fsrs_state }) as 1 | 2 | 3 | 4;
    }
    const next = review(state, grade, new Date());
    const { rows: [res] } = await db.query("select * from apply_vocabulary_review($1, $2, $3, $4, $5::smallint, $6, $7, $8)",
      [vocabularyId, clientReviewId, answer.mode, direction, grade, correct, expectedVersion, next]);
    return { correct, typo, lemma: word.lemma, applied: res.applied, duplicate: res.duplicate, version: res.new_version, nextDue: next.due };
  });
}

export interface LibraryFilter { q?: string; filter?: "all" | "saved" | "difficult" | "recent" | "due" | "mastered"; sort?: "due" | "alpha" | "recent"; page?: number }

export async function library(userId: string, f: LibraryFilter) {
  const page = Math.max(0, f.page ?? 0), size = 30;
  const where: string[] = ["uv.user_id = private.uid()"];
  const params: unknown[] = [];
  if (f.q) { params.push(`%${f.q.toLowerCase()}%`); where.push(`(lower(v.lemma) like $${params.length} or exists (select 1 from vocabulary_meanings m where m.vocabulary_id = v.id and array_to_string(m.translations_he, ' ') like $${params.length}))`); }
  if (f.filter === "saved") where.push("uv.saved");
  if (f.filter === "difficult") where.push("(uv.difficult or uv.lapses >= 2)");
  if (f.filter === "recent") where.push("uv.first_seen_at > now() - interval '7 days'");
  if (f.filter === "due") where.push("uv.due <= now() and uv.status not in ('new','suspended')");
  if (f.filter === "mastered") where.push("uv.status = 'mastered'");
  const order = f.sort === "alpha" ? "lower(v.lemma)" : f.sort === "recent" ? "uv.first_seen_at desc" : "uv.due";
  return withUser(userId, async (db) => {
    const { rows } = await db.query(
      `select v.id, v.lemma, v.part_of_speech, v.level, v.owner_id is not null as personal, uv.status, uv.saved, uv.difficult, uv.due, uv.last_review,
         (select translations_he from vocabulary_meanings m where m.vocabulary_id = v.id order by sense_order limit 1) as he
       from user_vocabulary uv join vocabulary v on v.id = uv.vocabulary_id where ${where.join(" and ")} order by ${order} limit ${size + 1} offset ${page * size}`, params);
    return { items: rows.slice(0, size), hasMore: rows.length > size };
  });
}

export async function wordDetail(userId: string, id: string) {
  return withUser(userId, async (db) => {
    const { rows: [w] } = await db.query(
      `${CARD_SQL}, v.synonyms, v.antonyms, v.related, v.tags, v.owner_id is not null as personal,
         (select json_agg(json_build_object('usage_note_he', m.usage_note_he, 'register', m.register) order by m.sense_order) from vocabulary_meanings m where m.vocabulary_id = v.id) as notes
       from vocabulary v where v.id = $1`, [id]);
    if (!w) return null;
    const { rows: [uv] } = await db.query("select status, saved, difficult, due, last_review, reps, lapses, recognition_correct, production_correct from user_vocabulary where user_id = private.uid() and vocabulary_id = $1", [id]);
    const { rows: history } = await db.query("select mode, direction, rating, correct, reviewed_at from vocabulary_reviews where user_id = private.uid() and vocabulary_id = $1 order by reviewed_at desc limit 10", [id]);
    return { word: w, progress: uv ?? null, history };
  });
}

export async function setWordFlags(userId: string, id: string, flags: { saved?: boolean; difficult?: boolean; suspended?: boolean }) {
  await withUser(userId, async (db) => {
    await db.query("insert into user_vocabulary (user_id, vocabulary_id, status) values (private.uid(), $1, 'new') on conflict do nothing", [id]);
    if (flags.saved !== undefined) await db.query("update user_vocabulary set saved = $2 where user_id = private.uid() and vocabulary_id = $1", [id, flags.saved]);
    if (flags.difficult !== undefined) await db.query("update user_vocabulary set difficult = $2 where user_id = private.uid() and vocabulary_id = $1", [id, flags.difficult]);
    if (flags.suspended !== undefined) await db.query("update user_vocabulary set status = case when $2 then 'suspended' else 'learning' end where user_id = private.uid() and vocabulary_id = $1", [id, flags.suspended]);
  });
}

/** Saves a word by its lemma (e.g. from a listening glossary). Finds a global entry or creates a personal one. */
export async function saveByTerm(userId: string, term: string, he?: string) {
  return withUser(userId, async (db) => {
    const { rows } = await db.query("select id from vocabulary where lower(lemma) = lower($1) and (owner_id is null or owner_id = private.uid()) limit 1", [term]);
    let id = rows[0]?.id as string | undefined;
    if (!id) {
      const ins = await db.query("insert into vocabulary (owner_id, lemma, part_of_speech, tags) values (private.uid(), $1, 'phrase', '{saved}') returning id", [term]);
      id = ins.rows[0].id;
      await db.query("insert into vocabulary_meanings (vocabulary_id, sense_order, definition_en, translations_he) values ($1, 1, $2, $3)", [id, term, [he ?? term]]);
      await db.query("insert into vocabulary_examples (vocabulary_id, sentence_en) values ($1, $2)", [id, term]);
    }
    await db.query("insert into user_vocabulary (user_id, vocabulary_id, status, saved) values (private.uid(), $1, 'learning', true) on conflict (user_id, vocabulary_id) do update set saved = true", [id]);
    return { id };
  });
}

export async function addPersonalWord(userId: string, w: { lemma: string; part_of_speech: string; meaning_he: string; definition_en?: string; example?: string }) {
  return withUser(userId, async (db) => {
    const exists = await db.query("select id from vocabulary where owner_id = private.uid() and lower(lemma) = lower($1) and part_of_speech = $2", [w.lemma, w.part_of_speech]);
    if (exists.rows[0]) throw new HttpError(409, "word_exists");
    const { rows: [v] } = await db.query("insert into vocabulary (owner_id, lemma, part_of_speech, tags) values (private.uid(), $1, $2, '{personal}') returning id", [w.lemma.trim(), w.part_of_speech]);
    await db.query("insert into vocabulary_meanings (vocabulary_id, sense_order, definition_en, translations_he) values ($1, 1, $2, $3)",
      [v.id, w.definition_en?.trim() || w.lemma.trim(), w.meaning_he.split(/[,|]/).map((s) => s.trim()).filter(Boolean)]);
    if (w.example?.trim()) await db.query("insert into vocabulary_examples (vocabulary_id, sentence_en) values ($1, $2)", [v.id, w.example.trim()]);
    await db.query("insert into user_vocabulary (user_id, vocabulary_id, status, saved) values (private.uid(), $1, 'learning', true)", [v.id]);
    return { id: v.id as string };
  });
}

export async function vocabCounts(userId: string) {
  return withUser(userId, async (db) => {
    const { rows: [r] } = await db.query(
      `select count(*) filter (where status not in ('new','suspended') and due <= now())::int as due,
              count(*)::int as total, count(*) filter (where status = 'mastered')::int as mastered,
              count(*) filter (where stability >= 21)::int as retained
       from user_vocabulary where user_id = private.uid()`);
    return r as { due: number; total: number; mastered: number; retained: number };
  });
}
