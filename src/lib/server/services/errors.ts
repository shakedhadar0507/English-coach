import "server-only";
import { withOwner, withUser } from "../db";
import { offlineKey } from "./exercises";

/** Recurring mistakes plus up to `n` practice exercises on the grammar topics behind them (not yet answered correctly recently). */
export async function errorsWithPractice(userId: string, n = 8) {
  const data = await withUser(userId, async (db) => {
    const { rows: errors } = await db.query(
      `select e.id, e.source, e.category, e.pattern, e.example_wrong, e.example_right, e.explanation, e.occurrences, e.last_seen_at,
         g.slug as grammar_slug, g.title_en as grammar_title_en, g.title_he as grammar_title_he, e.grammar_topic_id
       from learning_errors e left join grammar_topics g on g.id = e.grammar_topic_id
       where e.user_id = private.uid() and not e.resolved order by e.occurrences desc, e.last_seen_at desc limit 30`);
    const topicIds = [...new Set(errors.filter((e) => e.occurrences >= 2 && e.grammar_topic_id).map((e) => e.grammar_topic_id))].slice(0, 4);
    const { rows: exercises } = topicIds.length ? await db.query(
      `select x.id, x.type, x.skill, x.prompt from exercises x
       where x.grammar_topic_id = any($1) and x.status = 'approved'
         and x.type in ('multiple_choice','fill_blank','identify_error','correct_sentence','reorder','rewrite')
         and not exists (select 1 from exercise_attempts a where a.exercise_id = x.id and a.user_id = private.uid() and a.is_correct and a.created_at > now() - interval '3 days')
       order by random() limit $2`, [topicIds, n]) : { rows: [] as any[] };
    return { errors, exercises };
  });
  const keys = await withOwner(async (db) => {
    const { rows } = await db.query("select exercise_id, answer from exercise_keys where exercise_id = any($1)", [data.exercises.map((e) => e.id)]);
    return new Map(rows.map((r) => [r.exercise_id, r.answer]));
  });
  return { ...data, exercises: data.exercises.map((e) => ({ ...e, offlineKey: keys.has(e.id) ? offlineKey(e.id, e.type, keys.get(e.id)) : null })) };
}

export async function resolveError(userId: string, id: string) {
  await withUser(userId, (db) => db.query("update learning_errors set resolved = true where id = $1", [id]));
}
