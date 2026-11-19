import "server-only";
import { withUser } from "../db";

export interface UnitSummary {
  id: string; slug: string; level: string; title_en: string; title_he: string; course_title_en: string; course_title_he: string;
  lessons: number; completed: number; started: number; prerequisites: string[]; prereqsMet: boolean;
}

export async function learningPath(userId: string): Promise<UnitSummary[]> {
  return withUser(userId, async (db) => {
    const { rows } = await db.query(
      `select u.id, u.slug, u.level, u.title_en, u.title_he, u.prerequisites, c.title_en as course_title_en, c.title_he as course_title_he,
         count(l.id)::int as lessons,
         count(lp.lesson_id) filter (where lp.status = 'completed')::int as completed,
         count(lp.lesson_id)::int as started
       from curriculum_units u
       join curriculum_modules m on m.id = u.module_id
       join curriculum_courses c on c.id = m.course_id
       left join lessons l on l.unit_id = u.id and l.status = 'approved'
       left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = private.uid()
       where u.status = 'approved' and c.status = 'approved'
       group by u.id, c.id, m.id
       order by u.level, c.sort, m.sort, u.sort`);
    const done = new Set(rows.filter((r) => r.lessons > 0 && r.completed >= r.lessons).map((r) => r.slug));
    return rows.map((r) => ({ ...r, prereqsMet: (r.prerequisites as string[]).every((p) => done.has(p)) }));
  });
}

export async function unitDetail(userId: string, slug: string) {
  return withUser(userId, async (db) => {
    const { rows: [unit] } = await db.query(
      `select u.id, u.slug, u.level, u.title_en, u.title_he, u.objectives, u.prerequisites, c.title_en as course_title_en, c.title_he as course_title_he
       from curriculum_units u join curriculum_modules m on m.id = u.module_id join curriculum_courses c on c.id = m.course_id
       where u.slug = $1 and u.status = 'approved'`, [slug]);
    if (!unit) return null;
    const [lessons, grammar, vocab, prereqs] = await Promise.all([
      db.query(
        `select l.id, l.slug, l.kind, l.title_en, l.title_he, l.estimated_minutes, coalesce(lp.status, 'not_started') as status, lp.best_accuracy::float as best_accuracy
         from lessons l left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = private.uid()
         where l.unit_id = $1 and l.status = 'approved' order by l.sort`, [unit.id]),
      db.query(
        `select g.slug, g.level, g.title_en, g.title_he, g.summary_he, g.summary_en from unit_grammar_topics ug join grammar_topics g on g.id = ug.grammar_topic_id
         where ug.unit_id = $1 order by g.sort`, [unit.id]),
      db.query(
        `select v.id, v.lemma, (select array_agg(t order by m.sense_order) from vocabulary_meanings m, unnest(m.translations_he) t where m.vocabulary_id = v.id) as he,
           uv2.status
         from unit_vocabulary uv join vocabulary v on v.id = uv.vocabulary_id
         left join user_vocabulary uv2 on uv2.vocabulary_id = v.id and uv2.user_id = private.uid()
         where uv.unit_id = $1 order by v.lemma`, [unit.id]),
      db.query("select slug, title_en, title_he from curriculum_units where slug = any($1)", [unit.prerequisites]),
    ]);
    return { unit, lessons: lessons.rows, grammar: grammar.rows, vocab: vocab.rows, prereqs: prereqs.rows };
  });
}

export async function grammarTopic(userId: string, slug: string) {
  return withUser(userId, async (db) => {
    const { rows: [g] } = await db.query("select * from grammar_topics where slug = $1", [slug]);
    if (!g) return null;
    const { rows: [p] } = await db.query("select attempts, correct from user_grammar_progress where grammar_topic_id = $1 and user_id = private.uid()", [g.id]);
    const { rows: lessons } = await db.query(
      `select distinct l.slug, l.title_en, l.title_he, l.sort, u.sort as usort from unit_grammar_topics ug join lessons l on l.unit_id = ug.unit_id and l.kind = 'grammar' and l.status = 'approved'
       join curriculum_units u on u.id = ug.unit_id where ug.grammar_topic_id = $1 order by usort, l.sort`, [g.id]);
    return { topic: g, progress: p ?? null, lessons };
  });
}

export async function grammarTopics(userId: string) {
  return withUser(userId, async (db) => {
    const { rows } = await db.query(
      `select g.slug, g.level, g.title_en, g.title_he, g.summary_he, g.summary_en, coalesce(p.attempts, 0) as attempts, coalesce(p.correct, 0) as correct
       from grammar_topics g left join user_grammar_progress p on p.grammar_topic_id = g.id and p.user_id = private.uid()
       order by g.level, g.sort`);
    return rows as { slug: string; level: string; title_en: string; title_he: string; summary_he: string; summary_en: string; attempts: number; correct: number }[];
  });
}
