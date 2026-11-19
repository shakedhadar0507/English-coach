/**
 * Personalized daily plan generation. Pure function: all inputs are loaded by
 * the caller, so the composition is deterministic for a given day and can be
 * persisted (refreshing the page never reshuffles the plan).
 */

export type PlanItemKind = "vocab_review" | "vocab_new" | "lesson" | "listening" | "writing" | "speaking" | "error_review";
export type Reason = "overdue" | "weakSkill" | "nextInPath" | "recurringErrors" | "balance";
export type SkillKey = "vocabulary" | "grammar" | "listening" | "reading" | "writing" | "speaking";

export interface CandidateLesson {
  id: string; slug: string; kind: string; minutes: number; unitSlug: string; unitOrder: number; lessonOrder: number;
  inProgress: boolean; completed: boolean;
}

export interface PlanInput {
  targetMinutes: number;
  dueReviews: number;
  newWordsAvailable: number;
  newWordsPerDay: number;
  unresolvedErrors: number;
  /** Lessons in curriculum order for the learner's level and goals. */
  candidates: CandidateLesson[];
  /** Recent accuracy per skill (0..1) and attempts in the last 7 days. */
  skillStats: Partial<Record<SkillKey, { accuracy: number; recentAttempts: number }>>;
  /** Lesson ids completed in the last 3 days, to avoid immediate repeats. */
  recentLessonIds: string[];
}

export interface PlanItem { kind: PlanItemKind; lessonId?: string; minutes: number; reason: Reason; payload?: Record<string, unknown> }

const KIND_TO_SKILL: Record<string, SkillKey> = {
  vocabulary: "vocabulary", grammar: "grammar", listening: "listening", reading: "reading", writing: "writing", speaking: "speaking", mixed: "grammar", review: "vocabulary",
};

export function generatePlan(input: PlanInput): PlanItem[] {
  const budget = Math.max(5, input.targetMinutes);
  let left = budget;
  const items: PlanItem[] = [];

  // 1. Overdue reviews come first (≈15s per card), capped at 40% of the session.
  if (input.dueReviews > 0) {
    const m = clamp(Math.ceil(input.dueReviews * 0.25), 2, Math.floor(budget * 0.4));
    items.push({ kind: "vocab_review", minutes: m, reason: "overdue", payload: { cards: Math.min(input.dueReviews, Math.floor(m * 4)) } });
    left -= m;
  }

  // 2. Recurring mistakes deserve a short targeted block.
  if (input.unresolvedErrors >= 3 && left >= 6) {
    items.push({ kind: "error_review", minutes: 3, reason: "recurringErrors" });
    left -= 3;
  }

  // 3. Lessons: continue in-progress first, then the next uncompleted lessons,
  //    preferring the weakest / least-practiced skill when several are available.
  const recent = new Set(input.recentLessonIds);
  const open = input.candidates
    .filter((c) => !c.completed && !recent.has(c.id))
    .sort((a, b) => Number(b.inProgress) - Number(a.inProgress) || a.unitOrder - b.unitOrder || a.lessonOrder - b.lessonOrder);
  const weakness = (kind: string) => {
    const s = input.skillStats[KIND_TO_SKILL[kind] ?? "grammar"];
    if (!s) return 0.5; // unknown skill: medium priority
    return (1 - s.accuracy) * 0.7 + (s.recentAttempts < 5 ? 0.3 : 0);
  };
  const window = open.slice(0, 4); // stay close to the path; don't jump far ahead
  const ranked = [...window].sort((a, b) => Number(b.inProgress) - Number(a.inProgress) || weakness(b.kind) - weakness(a.kind) || a.unitOrder - b.unitOrder || a.lessonOrder - b.lessonOrder);

  const chosen: CandidateLesson[] = [];
  for (const l of ranked) {
    if (left < Math.min(l.minutes, 4)) break;
    chosen.push(l);
    left -= l.minutes;
    if (left <= 2) break;
  }
  // Keep path order in the final plan for a predictable experience.
  chosen.sort((a, b) => a.unitOrder - b.unitOrder || a.lessonOrder - b.lessonOrder);
  for (const l of chosen) {
    const reason: Reason = l.inProgress || l === open[0] ? "nextInPath" : weakness(l.kind) > 0.45 ? "weakSkill" : "balance";
    items.push({ kind: "lesson", lessonId: l.id, minutes: l.minutes, reason, payload: { slug: l.slug, lessonKind: l.kind } });
  }

  // 4. Ensure a productive skill (speaking/writing) when the session allows it.
  const hasProductive = chosen.some((l) => l.kind === "speaking" || l.kind === "writing");
  if (!hasProductive && budget >= 10 && left >= 3) {
    const speakingWeaker = (input.skillStats.speaking?.recentAttempts ?? 0) <= (input.skillStats.writing?.recentAttempts ?? 0);
    items.push({ kind: speakingWeaker ? "speaking" : "writing", minutes: Math.min(5, left), reason: "balance" });
    left -= Math.min(5, left);
  }

  // 5. New words with the remaining time.
  if (input.newWordsAvailable > 0 && input.newWordsPerDay > 0 && left >= 2) {
    const words = Math.min(input.newWordsAvailable, input.newWordsPerDay, left * 2);
    items.push({ kind: "vocab_new", minutes: Math.ceil(words / 2), reason: "balance", payload: { words } });
  }

  return items;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
