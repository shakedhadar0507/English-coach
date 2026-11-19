import "server-only";
import { withUser, type Db } from "../db";
import { generatePlan, type CandidateLesson, type SkillKey } from "@/lib/learning/daily-plan";
import { localDate } from "@/lib/learning/stats";

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

export async function userToday(db: Db): Promise<{ today: string; timezone: string }> {
  const { rows } = await db.query("select timezone from user_preferences where user_id = private.uid()");
  const timezone = rows[0]?.timezone ?? "Asia/Jerusalem";
  return { today: localDate(new Date(), timezone), timezone };
}

/**
 * Candidate lessons ordered along the learner's path: units nearest to the
 * current level (same level first, then above, then below), courses matching
 * the learner's goals first, then curriculum order.
 */
export async function candidateLessons(db: Db, level: string): Promise<CandidateLesson[]> {
  const lv = LEVEL_ORDER.indexOf(level);
  const { rows } = await db.query(
    `with goals as (select goal::text, priority from learning_goals where user_id = private.uid())
     select l.id, l.slug, l.kind::text, l.estimated_minutes as minutes, u.slug as unit_slug, u.level::text as unit_level,
            c.sort as course_sort, m.sort as module_sort, u.sort as unit_sort, l.sort as lesson_sort,
            coalesce((select min(g.priority) from goals g where g.goal = any(c.goals::text[])), 99) as goal_rank,
            lp.status as progress
     from lessons l
     join curriculum_units u on u.id = l.unit_id and u.status = 'approved'
     join curriculum_modules m on m.id = u.module_id
     join curriculum_courses c on c.id = m.course_id and c.status = 'approved'
     left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = private.uid()
     where l.status = 'approved'`);
  const dist = (l: string) => {
    const d = LEVEL_ORDER.indexOf(l) - lv;
    return d === 0 ? 0 : d > 0 ? d * 2 - 1 : -d * 2; // same, +1, -1, +2, -2 ...
  };
  rows.sort((a, b) => dist(a.unit_level) - dist(b.unit_level) || a.goal_rank - b.goal_rank || a.course_sort - b.course_sort
    || a.module_sort - b.module_sort || a.unit_sort - b.unit_sort || a.lesson_sort - b.lesson_sort);
  const unitOrder = new Map<string, number>();
  return rows.map((r) => {
    if (!unitOrder.has(r.unit_slug)) unitOrder.set(r.unit_slug, unitOrder.size);
    return {
      id: r.id, slug: r.slug, kind: r.kind, minutes: r.minutes, unitSlug: r.unit_slug, unitOrder: unitOrder.get(r.unit_slug)!,
      lessonOrder: r.lesson_sort, inProgress: r.progress === "in_progress", completed: r.progress === "completed",
    };
  });
}

export async function ensureTodayPlan(userId: string) {
  return withUser(userId, async (db) => {
    const { today } = await userToday(db);
    const existing = await db.query("select id from daily_plans where user_id = private.uid() and plan_date = $1", [today]);
    if (existing.rows[0]) return existing.rows[0].id as string;

    const { rows: [p] } = await db.query(
      `select pr.current_level, up.daily_minutes, up.vocab_new_per_day from profiles pr join user_preferences up on up.user_id = pr.id where pr.id = private.uid()`);
    const level = p?.current_level ?? "A1";
    const candidates = await candidateLessons(db, level);

    const due = await db.query("select count(*)::int as n from user_vocabulary where user_id = private.uid() and status <> 'suspended' and status <> 'new' and due <= now()");
    const pathUnits = [...new Set(candidates.filter((c) => !c.completed).slice(0, 12).map((c) => c.unitSlug))];
    const newWords = await db.query(
      `select count(distinct uv.vocabulary_id)::int as n from unit_vocabulary uv join curriculum_units u on u.id = uv.unit_id
       where u.slug = any($1) and not exists (select 1 from user_vocabulary x where x.user_id = private.uid() and x.vocabulary_id = uv.vocabulary_id)`, [pathUnits]);
    const errors = await db.query("select count(*)::int as n from learning_errors where user_id = private.uid() and not resolved and occurrences >= 2");
    const stats = await db.query(
      `select e.skill::text as skill, avg(case when a.is_correct then 1 else 0 end)::float as accuracy, count(*)::int as n
       from exercise_attempts a join exercises e on e.id = a.exercise_id
       where a.user_id = private.uid() and a.created_at > now() - interval '14 days' group by e.skill`);
    const recent = await db.query("select lesson_id from lesson_progress where user_id = private.uid() and status = 'completed' and last_activity_at > now() - interval '3 days'");
    const speaking = await db.query("select count(*)::int as n from conversations where user_id = private.uid() and started_at > now() - interval '7 days'");
    const writing = await db.query("select count(*)::int as n from writing_submissions where user_id = private.uid() and created_at > now() - interval '7 days'");

    const skillStats: Partial<Record<SkillKey, { accuracy: number; recentAttempts: number }>> = {};
    for (const s of stats.rows) skillStats[s.skill as SkillKey] = { accuracy: s.accuracy, recentAttempts: s.n };
    skillStats.speaking = { accuracy: skillStats.speaking?.accuracy ?? 0.5, recentAttempts: (skillStats.speaking?.recentAttempts ?? 0) + speaking.rows[0].n * 5 };
    skillStats.writing = { accuracy: skillStats.writing?.accuracy ?? 0.5, recentAttempts: (skillStats.writing?.recentAttempts ?? 0) + writing.rows[0].n * 5 };

    const items = generatePlan({
      targetMinutes: p?.daily_minutes ?? 15,
      dueReviews: due.rows[0].n,
      newWordsAvailable: newWords.rows[0].n,
      newWordsPerDay: p?.vocab_new_per_day ?? 8,
      unresolvedErrors: errors.rows[0].n,
      candidates,
      skillStats,
      recentLessonIds: recent.rows.map((r) => r.lesson_id),
    });

    const ins = await db.query(
      `insert into daily_plans (user_id, plan_date, target_minutes, rationale) values (private.uid(), $1, $2, $3)
       on conflict (user_id, plan_date) do nothing returning id`,
      [today, p?.daily_minutes ?? 15, { level, dueReviews: due.rows[0].n, unresolvedErrors: errors.rows[0].n, skillStats, pathUnits: pathUnits.slice(0, 3) }]);
    if (!ins.rows[0]) {
      const again = await db.query("select id from daily_plans where user_id = private.uid() and plan_date = $1", [today]);
      return again.rows[0].id as string;
    }
    const planId = ins.rows[0].id as string;
    for (const [i, it] of items.entries()) {
      await db.query(
        `insert into daily_plan_items (plan_id, user_id, seq, kind, lesson_id, payload, estimated_minutes) values ($1, private.uid(), $2, $3, $4, $5, $6)`,
        [planId, i, it.kind, it.lessonId ?? null, { ...(it.payload ?? {}), reason: it.reason }, it.minutes]);
    }
    return planId;
  });
}

export interface PlanView {
  id: string; plan_date: string; target_minutes: number; status: string;
  items: { id: string; seq: number; kind: string; lesson_id: string | null; lesson_slug: string | null; lesson_title_en: string | null; lesson_title_he: string | null; payload: Record<string, unknown>; estimated_minutes: number; status: string }[];
}

export async function getTodayPlan(userId: string): Promise<PlanView | null> {
  await ensureTodayPlan(userId);
  return withUser(userId, async (db) => {
    const { today } = await userToday(db);
    const { rows: [plan] } = await db.query("select id, plan_date::text, target_minutes, status from daily_plans where user_id = private.uid() and plan_date = $1", [today]);
    if (!plan) return null;
    const { rows: items } = await db.query(
      `select i.id, i.seq, i.kind, i.lesson_id, l.slug as lesson_slug, l.title_en as lesson_title_en, l.title_he as lesson_title_he, i.payload, i.estimated_minutes,
         case when i.kind = 'lesson' and lp.status = 'completed' then 'completed' else i.status end as status
       from daily_plan_items i left join lessons l on l.id = i.lesson_id
       left join lesson_progress lp on lp.lesson_id = i.lesson_id and lp.user_id = private.uid()
       where i.plan_id = $1 order by i.seq`, [plan.id]);
    return { ...plan, items };
  });
}

export async function completePlanItem(userId: string, itemId: string) {
  await withUser(userId, async (db) => {
    await db.query("update daily_plan_items set status = 'completed', completed_at = now() where id = $1 and status <> 'completed'", [itemId]);
    await db.query(
      `update daily_plans p set status = case when not exists (select 1 from daily_plan_items i where i.plan_id = p.id and i.status not in ('completed','skipped')) then 'completed' else 'in_progress' end
       where p.id = (select plan_id from daily_plan_items where id = $1)`, [itemId]);
  });
}
