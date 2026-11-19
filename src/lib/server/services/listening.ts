import "server-only";
import { withOwner, withUser } from "../db";
import { offlineKey } from "./exercises";

export async function listeningList(userId: string) {
  return withUser(userId, async (db) => {
    const { rows } = await db.query(
      `select m.slug, m.level, m.format, m.title_en, m.title_he, m.accent,
         (select count(*)::int from exercises e where e.listening_material_id = m.id and e.status = 'approved') as questions,
         (select count(distinct a.exercise_id)::int from exercise_attempts a join exercises e on e.id = a.exercise_id
            where e.listening_material_id = m.id and a.user_id = private.uid()) as answered
       from listening_materials m where m.status = 'approved' and m.slug not like 'pt-%' order by m.level, m.slug`);
    return rows as { slug: string; level: string; format: string; title_en: string; title_he: string; accent: string; questions: number; answered: number }[];
  });
}

/** Placement clips (pt-*) are excluded so the test items can't be previewed. */
export async function listeningDetail(userId: string, slug: string) {
  const data = await withUser(userId, async (db) => {
    const { rows: [m] } = await db.query(
      `select id, slug, level, format, title_en, title_he, context_he, segments, glossary, accent from listening_materials
       where slug = $1 and status = 'approved' and slug not like 'pt-%'`, [slug]);
    if (!m) return null;
    const { rows: exercises } = await db.query(
      `select e.id, e.type, e.skill, e.prompt from exercises e join lessons l on l.id = e.lesson_id
       where e.listening_material_id = $1 and e.status = 'approved' order by l.sort, e.sort`, [m.id]);
    const { rows: [prefs] } = await db.query("select accent, voice_rate::float as voice_rate from user_preferences where user_id = private.uid()");
    return { material: m, exercises, prefs };
  });
  if (!data) return null;
  const keys = await withOwner(async (db) => {
    const { rows } = await db.query("select exercise_id, answer from exercise_keys where exercise_id = any($1)", [data.exercises.map((e) => e.id)]);
    return new Map(rows.map((r) => [r.exercise_id, r.answer]));
  });
  return { ...data, exercises: data.exercises.map((e) => ({ ...e, offlineKey: keys.has(e.id) ? offlineKey(e.id, e.type, keys.get(e.id)) : null })) };
}
