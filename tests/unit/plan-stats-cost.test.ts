import { describe, expect, it } from "vitest";
import { generatePlan, type CandidateLesson } from "@/lib/learning/daily-plan";
import { computeStreaks, isActiveDay, localDate } from "@/lib/learning/stats";
import { estimateCost, priceFor, reservationFor } from "@/lib/ai/pricing";

const lesson = (i: number, kind: string, extra: Partial<CandidateLesson> = {}): CandidateLesson =>
  ({ id: `l${i}`, slug: `l${i}`, kind, minutes: 5, unitSlug: "u1", unitOrder: 0, lessonOrder: i, inProgress: false, completed: false, ...extra });

describe("generatePlan", () => {
  const base = { targetMinutes: 15, dueReviews: 0, newWordsAvailable: 10, newWordsPerDay: 8, unresolvedErrors: 0, skillStats: {}, recentLessonIds: [] };

  it("prioritizes overdue reviews", () => {
    const plan = generatePlan({ ...base, dueReviews: 30, candidates: [lesson(1, "grammar"), lesson(2, "listening")] });
    expect(plan[0].kind).toBe("vocab_review");
    expect(plan[0].minutes).toBeLessThanOrEqual(6);
  });

  it("fits within the target duration (± one item)", () => {
    const plan = generatePlan({ ...base, dueReviews: 10, candidates: [1, 2, 3, 4, 5].map((i) => lesson(i, "grammar")) });
    const total = plan.reduce((a, p) => a + p.minutes, 0);
    expect(total).toBeLessThanOrEqual(15 + 5);
    expect(total).toBeGreaterThanOrEqual(10);
  });

  it("resumes in-progress lessons first and skips completed/recent ones", () => {
    const plan = generatePlan({ ...base, candidates: [lesson(1, "grammar", { completed: true }), lesson(2, "grammar"), lesson(3, "listening", { inProgress: true })], recentLessonIds: ["l2"] });
    const lessons = plan.filter((p) => p.kind === "lesson").map((p) => p.lessonId);
    expect(lessons).toContain("l3");
    expect(lessons).not.toContain("l1");
    expect(lessons).not.toContain("l2");
  });

  it("adds a productive task when none is scheduled", () => {
    const plan = generatePlan({ ...base, targetMinutes: 20, newWordsAvailable: 0, candidates: [lesson(1, "grammar")] });
    expect(plan.some((p) => p.kind === "speaking" || p.kind === "writing")).toBe(true);
  });

  it("adds an error-review block for recurring mistakes", () => {
    const plan = generatePlan({ ...base, unresolvedErrors: 5, candidates: [lesson(1, "grammar")] });
    expect(plan.some((p) => p.kind === "error_review")).toBe(true);
  });

  it("is deterministic", () => {
    const input = { ...base, dueReviews: 7, candidates: [lesson(1, "grammar"), lesson(2, "vocabulary"), lesson(3, "listening")] };
    expect(generatePlan(input)).toEqual(generatePlan(input));
  });
});

describe("streaks", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreaks(["2026-03-01", "2026-03-02", "2026-03-03"], "2026-03-03")).toEqual({ current: 3, best: 3 });
  });
  it("keeps the streak alive until the day ends", () => {
    expect(computeStreaks(["2026-03-01", "2026-03-02"], "2026-03-03").current).toBe(2);
  });
  it("breaks after a missed day and tracks the best run", () => {
    expect(computeStreaks(["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-06"], "2026-03-08")).toEqual({ current: 0, best: 3 });
  });
  it("uses the learner's time zone", () => {
    expect(localDate(new Date("2026-03-01T22:30:00Z"), "Asia/Jerusalem")).toBe("2026-03-02");
  });
  it("requires meaningful activity", () => {
    expect(isActiveDay({ items: 0, activeSeconds: 30 })).toBe(false);
    expect(isActiveDay({ items: 3, activeSeconds: 0 })).toBe(true);
  });
});

describe("cost estimation", () => {
  it("computes token cost", () => {
    expect(estimateCost({ inputPerM: 1, outputPerM: 2 }, { inputTokens: 1_000_000, outputTokens: 500_000 })).toBe(2);
  });
  it("charges zero for free tier but still returns a price", () => {
    expect(estimateCost(priceFor("gemini-2.5-flash", true), { inputTokens: 5000, outputTokens: 5000 })).toBe(0);
  });
  it("falls back to a conservative price for unknown models", () => {
    expect(priceFor("mystery-model", false).outputPerM).toBeGreaterThanOrEqual(10);
  });
  it("reserves for the maximum output", () => {
    expect(reservationFor({ inputPerM: 0, outputPerM: 1 }, 0, 1_000_000)).toBe(1);
  });
});
