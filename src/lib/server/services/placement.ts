import "server-only";
import { withOwner, withUser, type Db } from "../db";
import { HttpError } from "../http";
import { gradeExercise, type ExerciseKey, type Response as GradeResponse } from "@/lib/learning/grading";
import { guessRate, nextItem, summarize, type PlacementItem, type PlacementResponse, type PlacementSkill, type Level } from "@/lib/learning/placement";

export interface PublicPlacementItem { id: string; skill: PlacementSkill; level: Level; type: string; prompt: Record<string, unknown>; listening?: { segments: { speaker: string; text: string }[]; accent: string } }

async function loadBank(db: Db): Promise<(PlacementItem & { prompt: Record<string, unknown> })[]> {
  const { rows } = await db.query("select id, skill, level, type, prompt from assessment_items where status = 'approved'");
  return rows.map((r) => ({ id: r.id, skill: r.skill, level: r.level, type: r.type, prompt: r.prompt, optionCount: Array.isArray(r.prompt.options) ? r.prompt.options.length : undefined }));
}

async function loadResponses(db: Db, assessmentId: string): Promise<PlacementResponse[]> {
  const { rows } = await db.query(
    `select a.item_id, i.skill, i.level, i.type, i.prompt, a.is_correct from assessment_answers a join assessment_items i on i.id = a.item_id
     where a.assessment_id = $1 order by a.answered_at`, [assessmentId]);
  return rows.map((r) => ({ itemId: r.item_id, skill: r.skill, level: r.level, correct: r.is_correct, guess: guessRate(r.type, r.prompt.options?.length) }));
}

async function toPublic(db: Db, item: PlacementItem & { prompt: Record<string, unknown> }): Promise<PublicPlacementItem> {
  const out: PublicPlacementItem = { id: item.id, skill: item.skill, level: item.level, type: item.type, prompt: { ...item.prompt } };
  if (typeof item.prompt.listening === "string") {
    const { rows } = await db.query("select segments, accent from listening_materials where slug = $1", [item.prompt.listening]);
    if (rows[0]) out.listening = { segments: rows[0].segments, accent: rows[0].accent };
    delete out.prompt.listening;
  }
  return out;
}

export async function startPlacement(userId: string) {
  return withUser(userId, async (db) => {
    let { rows } = await db.query("select id from assessments where user_id = private.uid() and status = 'in_progress' order by started_at desc limit 1");
    if (!rows[0]) ({ rows } = await db.query("insert into assessments (user_id, kind) values (private.uid(), 'placement') returning id"));
    const assessmentId = rows[0].id as string;
    const bank = await loadBank(db);
    const responses = await loadResponses(db, assessmentId);
    const next = nextItem(bank, responses);
    return { assessmentId, answered: responses.length, next: next ? await toPublic(db, bank.find((b) => b.id === next.id)!) : null };
  });
}

export async function answerPlacement(userId: string, assessmentId: string, itemId: string, response: GradeResponse) {
  const key = await withOwner(async (db) => {
    const { rows } = await db.query("select k.answer, i.type from assessment_item_keys k join assessment_items i on i.id = k.item_id where k.item_id = $1", [itemId]);
    return rows[0] as { answer: ExerciseKey; type: string } | undefined;
  });
  if (!key) throw new HttpError(404, "item_not_found");
  let result;
  try { result = gradeExercise(key.type, key.answer, response); } catch { throw new HttpError(400, "invalid_response"); }

  return withUser(userId, async (db) => {
    const { rows: [a] } = await db.query("select id, status from assessments where id = $1 for update", [assessmentId]);
    if (!a) throw new HttpError(404, "assessment_not_found");
    if (a.status !== "in_progress") throw new HttpError(409, "assessment_closed");
    await db.query(
      `insert into assessment_answers (assessment_id, user_id, item_id, response, is_correct, score) values ($1, private.uid(), $2, $3, $4, $5)
       on conflict (assessment_id, item_id) do nothing`, [assessmentId, itemId, response, result.isCorrect, result.score]);
    const bank = await loadBank(db);
    const responses = await loadResponses(db, assessmentId);
    const next = nextItem(bank, responses);
    if (next) return { done: false as const, answered: responses.length, next: await toPublic(db, bank.find((b) => b.id === next.id)!) };

    const summary = summarize(responses);
    await db.query(
      `update assessments set status = 'completed', completed_at = now(), overall_level = $2, overall_confidence = $3, skill_results = $4, state = $5 where id = $1`,
      [assessmentId, summary.overall.level, summary.overall.confidence, summary.skills, { overall: summary.overall }]);
    await db.query("update profiles set current_level = $1, level_source = 'placement' where id = private.uid()", [summary.overall.level]);
    return { done: true as const, answered: responses.length, result: summary };
  });
}

export async function listAssessments(userId: string) {
  return withUser(userId, async (db) => {
    const { rows } = await db.query(
      `select id, status, overall_level, overall_confidence, skill_results, state, started_at, completed_at,
        (select count(*)::int from assessment_answers x where x.assessment_id = a.id) as answered
       from assessments a where user_id = private.uid() order by started_at desc limit 20`);
    return rows;
  });
}
