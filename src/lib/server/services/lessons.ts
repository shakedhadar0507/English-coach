import "server-only";
import { withOwner, withUser } from "../db";
import { HttpError } from "../http";
import { offlineKey } from "./exercises";
import { completePlanItem } from "./plan";

export async function getLessonForPlayer(userId: string, slug: string) {
  const data = await withUser(userId, async (db) => {
    const { rows: [lesson] } = await db.query(
      `select l.id, l.slug, l.kind, l.title_en, l.title_he, l.intro_en, l.intro_he, l.estimated_minutes, u.slug as unit_slug, u.title_en as unit_title_en, u.title_he as unit_title_he, u.level
       from lessons l join curriculum_units u on u.id = l.unit_id where l.slug = $1 and l.status = 'approved'`, [slug]);
    if (!lesson) return null;
    const { rows: exercises } = await db.query(
      `select e.id, e.type, e.skill, e.prompt, e.listening_material_id from exercises e where e.lesson_id = $1 and e.status = 'approved' order by e.sort`, [lesson.id]);
    const lmIds = [...new Set(exercises.map((e) => e.listening_material_id).filter(Boolean))];
    const { rows: materials } = lmIds.length
      ? await db.query("select id, segments, accent, glossary from listening_materials where id = any($1)", [lmIds])
      : { rows: [] as any[] };
    const { rows: [session] } = await db.query(
      `select id, position, active_seconds, items_completed, items_correct from learning_sessions
       where user_id = private.uid() and lesson_id = $1 and status in ('active','paused') order by last_activity_at desc limit 1`, [lesson.id]);
    const { rows: [prefs] } = await db.query("select accent, voice_rate::float as voice_rate from user_preferences where user_id = private.uid()");
    return { lesson, exercises, materials, session: session ?? null, prefs };
  });
  if (!data) return null;
  const keys = await withOwner(async (db) => {
    const { rows } = await db.query("select exercise_id, answer from exercise_keys where exercise_id = any($1)", [data.exercises.map((e) => e.id)]);
    return new Map(rows.map((r) => [r.exercise_id, r.answer]));
  });
  const mats = new Map(data.materials.map((m) => [m.id, { segments: m.segments, accent: m.accent, glossary: m.glossary }]));
  return {
    ...data,
    exercises: data.exercises.map((e) => ({
      id: e.id, type: e.type, skill: e.skill, prompt: e.prompt,
      listening: e.listening_material_id ? mats.get(e.listening_material_id) : undefined,
      offlineKey: keys.has(e.id) ? offlineKey(e.id, e.type, keys.get(e.id)) : null,
    })),
  };
}

export async function startOrResumeSession(userId: string, lessonId: string, planItemId?: string | null) {
  return withUser(userId, async (db) => {
    const ok = await db.query("select 1 from lessons where id = $1 and status = 'approved'", [lessonId]);
    if (!ok.rowCount) throw new HttpError(404, "lesson_not_found");
    const { rows: [existing] } = await db.query(
      `select id, position from learning_sessions where user_id = private.uid() and lesson_id = $1 and status in ('active','paused') order by last_activity_at desc limit 1`, [lessonId]);
    if (existing) {
      await db.query("update learning_sessions set status = 'active', last_activity_at = now() where id = $1", [existing.id]);
      return { sessionId: existing.id as string, position: existing.position as number };
    }
    const { rows: [s] } = await db.query(
      `insert into learning_sessions (user_id, lesson_id, kind, daily_plan_item_id) values (private.uid(), $1, 'lesson', $2) returning id`, [lessonId, planItemId ?? null]);
    await db.query(
      `insert into lesson_progress (user_id, lesson_id, status, attempts) values (private.uid(), $1, 'in_progress', 1)
       on conflict (user_id, lesson_id) do update set attempts = lesson_progress.attempts + 1, last_activity_at = now()`, [lessonId]);
    if (planItemId) await db.query("update daily_plan_items set status = 'in_progress' where id = $1 and status = 'pending'", [planItemId]);
    return { sessionId: s.id as string, position: 0 };
  });
}

export async function saveSessionProgress(userId: string, sessionId: string, position: number, activeSecondsDelta: number, pause: boolean) {
  await withUser(userId, (db) => db.query(
    `update learning_sessions set position = greatest(position, $2), active_seconds = active_seconds + least(greatest($3, 0), 600),
       status = case when $4 then 'paused' else status end, last_activity_at = now()
     where id = $1 and status in ('active','paused')`, [sessionId, position, Math.round(activeSecondsDelta), pause]));
}

export async function completeSession(userId: string, sessionId: string, activeSecondsDelta: number) {
  const result = await withUser(userId, async (db) => {
    const { rows: [s] } = await db.query("select * from learning_sessions where id = $1 for update", [sessionId]);
    if (!s) throw new HttpError(404, "session_not_found");
    const totalEx = await db.query("select count(*)::int as n from exercises where lesson_id = $1 and status = 'approved'", [s.lesson_id]);
    // Meaningful completion: every exercise of the lesson must have at least one recorded attempt in this session.
    const { rows: [att] } = await db.query(
      `select count(distinct exercise_id)::int as done, avg(case when first_correct then 1 else 0 end)::float as accuracy from (
         select distinct on (exercise_id) exercise_id, is_correct as first_correct from exercise_attempts
         where session_id = $1 order by exercise_id, created_at) x`, [sessionId]);
    const complete = att.done >= totalEx.rows[0].n;
    await db.query(
      `update learning_sessions set active_seconds = active_seconds + least(greatest($2, 0), 600), last_activity_at = now(),
         status = case when $3 then 'completed' else 'paused' end, ended_at = case when $3 then now() else ended_at end where id = $1`,
      [sessionId, Math.round(activeSecondsDelta), complete]);
    if (complete) {
      await db.query(
        `update lesson_progress set status = 'completed', first_completed_at = coalesce(first_completed_at, now()),
           best_accuracy = greatest(coalesce(best_accuracy, 0), $2), last_activity_at = now() where user_id = private.uid() and lesson_id = $1`,
        [s.lesson_id, att.accuracy ?? 0]);
    }
    const { rows: [fresh] } = await db.query("select active_seconds, items_completed, items_correct, daily_plan_item_id from learning_sessions where id = $1", [sessionId]);
    return { complete, accuracy: att.accuracy ?? 0, exercises: att.done, total: totalEx.rows[0].n, activeSeconds: fresh.active_seconds, planItemId: fresh.daily_plan_item_id };
  });
  if (result.complete && result.planItemId) await completePlanItem(userId, result.planItemId);
  return result;
}
