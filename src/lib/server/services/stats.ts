import "server-only";
import { withUser, type Db } from "../db";
import { computeStreaks, isActiveDay } from "@/lib/learning/stats";
import { userToday } from "./plan";

export interface DayActivity { day: string; items: number; correct: number; seconds: number }

/** Per-day activity in the learner's time zone, built only from recorded events. */
async function dailyActivity(db: Db, timezone: string, sinceDays: number): Promise<DayActivity[]> {
  const { rows } = await db.query(
    `with ev as (
       select (created_at at time zone $1)::date as day, 1 as items, is_correct::int as correct, 0 as seconds
         from exercise_attempts where user_id = private.uid() and created_at > now() - make_interval(days => $2)
       union all
       select (reviewed_at at time zone $1)::date, 1, correct::int, 0
         from vocabulary_reviews where user_id = private.uid() and reviewed_at > now() - make_interval(days => $2)
       union all
       select (started_at at time zone $1)::date, 0, 0, active_seconds
         from learning_sessions where user_id = private.uid() and started_at > now() - make_interval(days => $2)
       union all
       select (started_at at time zone $1)::date, 0, 0, user_speaking_seconds
         from conversations where user_id = private.uid() and started_at > now() - make_interval(days => $2)
     )
     select day::text, sum(items)::int as items, sum(correct)::int as correct, sum(seconds)::int as seconds
     from ev group by day order by day`, [timezone, sinceDays]);
  return rows;
}

export async function homeStats(userId: string) {
  return withUser(userId, async (db) => {
    const { today, timezone } = await userToday(db);
    const days = await dailyActivity(db, timezone, 400);
    const streak = computeStreaks(days.filter((d) => isActiveDay({ items: d.items, activeSeconds: d.seconds })).map((d) => d.day), today);
    const t = days.find((d) => d.day === today);
    const { rows: [v] } = await db.query("select count(*) filter (where due <= now())::int as due from user_vocabulary where user_id = private.uid() and status <> 'new'");
    return { timezone, streak, minutesToday: Math.round((t?.seconds ?? 0) / 60), itemsToday: t?.items ?? 0, dueReviews: v.due as number };
  });
}

export async function progressStats(userId: string) {
  return withUser(userId, async (db) => {
    const { today, timezone } = await userToday(db);
    const days = await dailyActivity(db, timezone, 400);
    const active = days.filter((d) => isActiveDay({ items: d.items, activeSeconds: d.seconds }));
    const streak = computeStreaks(active.map((d) => d.day), today);
    const q = async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows[0];
    const [time, lessons, vocab, grammar, writing, speaking, listening, aiRow] = await Promise.all([
      q(`select coalesce(sum(active_seconds),0)::int as s from learning_sessions where user_id = private.uid()`),
      q(`select count(*) filter (where status = 'completed')::int as done from lesson_progress where user_id = private.uid()`),
      q(`select count(*)::int as total, count(*) filter (where stability >= 21)::int as retained,
           count(*) filter (where status <> 'new' and due <= now())::int as due, count(*) filter (where status = 'mastered')::int as mastered
         from user_vocabulary where user_id = private.uid()`),
      q(`select count(*)::int as n from user_grammar_progress where user_id = private.uid() and attempts > 0`),
      q(`select count(*)::int as n from writing_submissions where user_id = private.uid()`),
      q(`select coalesce(sum(user_speaking_seconds),0)::int as s, count(*)::int as n from conversations where user_id = private.uid()`),
      q(`select count(*)::int as n from exercise_attempts a join exercises e on e.id = a.exercise_id where a.user_id = private.uid() and e.skill = 'listening'`),
      q(`select spent::float, budget::float, requests::int from public.ai_month_summary()`),
    ]);
    const { rows: bySkill } = await db.query(
      `select e.skill, count(*)::int as n, avg(a.is_correct::int)::float as accuracy
       from exercise_attempts a join exercises e on e.id = a.exercise_id where a.user_id = private.uid() group by e.skill order by e.skill`);
    const { rows: errors } = await db.query(
      `select id, category, pattern, example_wrong, example_right, explanation, occurrences from learning_errors
       where user_id = private.uid() and not resolved order by occurrences desc, last_seen_at desc limit 5`);
    const { rows: [assess] } = await db.query(
      `select overall_level, overall_confidence, completed_at from assessments where user_id = private.uid() and status = 'completed' order by completed_at desc limit 1`);
    const { rows: [profile] } = await db.query("select current_level, level_source from profiles where id = private.uid()");
    return {
      today, days, streak, activeDays: active.length,
      totalSeconds: time.s as number, lessonsDone: lessons.done as number,
      vocab: vocab as { total: number; retained: number; due: number; mastered: number },
      grammarTopics: grammar.n as number, writingCount: writing.n as number,
      speakingSeconds: speaking.s as number, conversations: speaking.n as number, listeningCount: listening.n as number,
      bySkill: bySkill as { skill: string; n: number; accuracy: number }[],
      errors, assessment: assess ?? null, profile,
      ai: aiRow as { spent: number; budget: number; requests: number },
    };
  });
}
