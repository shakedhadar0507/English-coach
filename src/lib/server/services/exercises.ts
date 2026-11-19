import "server-only";
import { createHash } from "node:crypto";
import { withOwner, withUser, type Db } from "../db";
import { HttpError } from "../http";
import { gradeExercise, type ExerciseKey, type GradeResult, type Response as GradeResponse } from "@/lib/learning/grading";
import { normalizeAnswer } from "@/lib/learning/normalize";
import { gradeFromOutcome, newCardState, review, type CardState } from "@/lib/learning/srs";

const DETERMINISTIC = new Set(["multiple_choice", "listening_mc", "reading_mc", "identify_error", "fill_blank", "reorder", "correct_sentence", "rewrite", "translate_he_en", "write_sentence", "dictation"]);
const PRODUCTION_TYPES = new Set(["fill_blank", "translate_he_en", "write_sentence", "correct_sentence", "rewrite", "dictation", "reorder", "speaking_prompt"]);

export interface SubmitInput {
  exerciseId: string; sessionId?: string | null; clientAttemptId: string; response: GradeResponse; durationMs?: number; selfAssessed?: boolean;
}

async function loadExercise(exerciseId: string) {
  return withOwner(async (db) => {
    const { rows } = await db.query(
      `select e.id, e.slug, e.type, e.skill, e.explanation_en, e.explanation_he, e.vocabulary_id, e.grammar_topic_id, e.prompt,
              k.answer, g.slug as grammar_slug, g.title_en as g_title_en, g.title_he as g_title_he, g.rules, g.examples
       from exercises e left join exercise_keys k on k.exercise_id = e.id left join grammar_topics g on g.id = e.grammar_topic_id
       where e.id = $1 and e.status = 'approved'`, [exerciseId]);
    return rows[0];
  });
}

function pickExample(examples: { en: string; he: string }[] | null, seed: string) {
  if (!examples?.length) return null;
  const h = createHash("md5").update(seed).digest()[0];
  return examples[h % examples.length];
}

export async function submitExercise(userId: string, input: SubmitInput) {
  const ex = await loadExercise(input.exerciseId);
  if (!ex) throw new HttpError(404, "exercise_not_found");

  let result: GradeResult;
  if (DETERMINISTIC.has(ex.type)) {
    try {
      result = gradeExercise(ex.type, ex.answer as ExerciseKey, input.response, { allowTypos: ex.skill === "vocabulary" && ex.type === "translate_he_en" });
    } catch { throw new HttpError(400, "invalid_response"); }
  } else if (ex.type === "speaking_prompt") {
    result = { verdict: "needs_review", isCorrect: false, score: 0.5, correctAnswer: "" };
  } else {
    throw new HttpError(400, "not_gradable_here");
  }

  // Open answers need the learner's honest self-check (or AI review) before being recorded.
  if (result.verdict === "needs_review" && input.selfAssessed === undefined) {
    return { recorded: false, feedback: buildFeedback(ex, result, input) };
  }
  if (result.verdict === "needs_review") {
    result = { ...result, verdict: input.selfAssessed ? "correct" : "incorrect", isCorrect: !!input.selfAssessed, score: input.selfAssessed ? 1 : 0 };
  }

  const feedback = buildFeedback(ex, result, input);
  const recorded = await withUser(userId, async (db) => {
    const { rows: [rec] } = await db.query(
      "select * from record_exercise_attempt($1, $2, $3, $4, $5, $6, $7, $8)",
      [ex.id, input.sessionId ?? null, input.clientAttemptId, input.response, result.isCorrect, result.score,
        { verdict: result.verdict, self_assessed: input.selfAssessed ?? null, note: result.note ?? null }, input.durationMs ?? null]);
    if (rec.duplicate) return { duplicate: true };

    if (!result.isCorrect && ex.grammar_topic_id) {
      await db.query("select record_learning_error('exercise', $1, $2, $3, $4, $5, $6)", [
        `grammar:${ex.grammar_slug}`, ex.grammar_slug, responseText(input.response, ex.prompt), result.correctAnswer || null, ex.explanation_en, ex.grammar_topic_id]);
    }
    if (ex.vocabulary_id) {
      await applyVocabOutcome(db, ex.vocabulary_id, `ex-${input.clientAttemptId}`, ex.type, result);
    }
    return { duplicate: false };
  });
  return { recorded: true, duplicate: recorded.duplicate, feedback };
}

function responseText(r: GradeResponse, prompt: Record<string, any>): string {
  switch (r.kind) {
    case "text": return r.value;
    case "blanks": return r.values.join(" | ");
    case "tokens": return r.order.join(" ");
    case "choice": return (prompt.options ?? []).filter((o: { id: string }) => r.selected.includes(o.id)).map((o: { text: string }) => o.text).join(", ");
  }
}

async function applyVocabOutcome(db: Db, vocabularyId: string, reviewKey: string, type: string, result: GradeResult) {
  const now = new Date();
  await db.query(
    `insert into user_vocabulary (user_id, vocabulary_id, status, due) values (private.uid(), $1, 'learning', now()) on conflict do nothing`, [vocabularyId]);
  const { rows: [uv] } = await db.query("select * from user_vocabulary where user_id = private.uid() and vocabulary_id = $1", [vocabularyId]);
  const state: CardState = uv.reps === 0 && !uv.last_review ? newCardState(now) : {
    due: uv.due.toISOString(), stability: uv.stability, difficulty: uv.difficulty, scheduled_days: uv.scheduled_days, learning_steps: uv.learning_steps,
    reps: uv.reps, lapses: uv.lapses, fsrs_state: uv.fsrs_state, last_review: uv.last_review?.toISOString() ?? null,
  };
  // Lesson exposure only reschedules if the card is due or new; otherwise it is logged as practice without inflating intervals.
  if (uv.reps > 0 && new Date(uv.due) > now && result.isCorrect) return;
  const direction = PRODUCTION_TYPES.has(type) ? "production" : "recognition";
  const grade = gradeFromOutcome({ correct: result.isCorrect, direction, typo: result.note === "typo", fsrsState: state.fsrs_state });
  const next = review(state, grade, now);
  await db.query("select * from apply_vocabulary_review($1, $2, 'lesson', $3, $4::smallint, $5, $6, $7)",
    [vocabularyId, reviewKey, direction, grade, result.isCorrect, uv.version, next]);
}

function buildFeedback(ex: any, result: GradeResult, input: SubmitInput) {
  const isChoice = ["multiple_choice", "listening_mc", "reading_mc", "identify_error"].includes(ex.type);
  const answer = ex.answer ?? {};
  let correctAnswer = result.correctAnswer;
  if (isChoice) {
    const opts: { id: string; text: string }[] = ex.prompt.options ?? [];
    correctAnswer = opts.filter((o) => answer.correct?.includes(o.id)).map((o) => o.text).join(", ");
  }
  return {
    verdict: result.verdict,
    isCorrect: result.isCorrect,
    correctAnswer,
    correctOptionIds: isChoice ? answer.correct : undefined,
    matched: result.matched,
    note: result.note,
    blanks: result.blanks,
    missingWords: result.missingWords,
    accepted: result.verdict === "needs_review" ? (answer.accepted?.length ? answer.accepted : undefined) : undefined,
    sample: answer.sample,
    explanation_en: ex.explanation_en,
    explanation_he: ex.explanation_he,
    grammarTitle: ex.grammar_slug ? { en: ex.g_title_en, he: ex.g_title_he } : null,
    rule: !result.isCorrect && ex.rules?.length ? ex.rules[0] : null,
    example: !result.isCorrect ? pickExample(ex.examples, input.clientAttemptId) : null,
  };
}

/**
 * Hashed answer keys for offline grading. Hashes of normalized answers let the
 * client verify an answer without the answer text being present in the page.
 * The server re-grades every queued result on sync.
 */
export function offlineKey(exerciseId: string, type: string, answer: any): Record<string, unknown> | null {
  const h = (s: string) => createHash("sha256").update(`${exerciseId}|${s}`).digest("hex").slice(0, 24);
  if (["multiple_choice", "listening_mc", "reading_mc", "identify_error"].includes(type)) return { kind: "choice", hashes: [h([...answer.correct].sort().join(","))] };
  if (type === "fill_blank") return { kind: "blanks", hashes: answer.blanks.map((b: string[]) => b.map((a) => h(normalizeAnswer(a)))) };
  if (["reorder", "correct_sentence", "rewrite", "translate_he_en", "dictation"].includes(type)) return { kind: "text", hashes: answer.accepted.map((a: string) => h(normalizeAnswer(a))) };
  return null;
}
