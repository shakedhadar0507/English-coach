import { describe, expect, it } from "vitest";
import { gradeFromOutcome, newCardState, Rating, review, State } from "@/lib/learning/srs";

const t0 = new Date("2026-01-01T08:00:00Z");

describe("FSRS scheduling", () => {
  it("is deterministic", () => {
    const a = review(newCardState(t0), Rating.Good, t0);
    const b = review(newCardState(t0), Rating.Good, t0);
    expect(a).toEqual(b);
  });

  it("schedules a failed card sooner than a remembered one", () => {
    let s = newCardState(t0);
    for (let i = 0; i < 3; i++) s = review(s, Rating.Good, new Date(s.due));
    const now = new Date(s.due);
    const good = review(s, Rating.Good, now);
    const again = review(s, Rating.Again, now);
    expect(new Date(again.due).getTime()).toBeLessThan(new Date(good.due).getTime());
    expect(again.lapses).toBe(s.lapses + 1);
  });

  it("grows intervals with successful reviews", () => {
    let s = newCardState(t0);
    const intervals: number[] = [];
    for (let i = 0; i < 6; i++) {
      const now = new Date(s.due);
      s = review(s, Rating.Good, now);
      intervals.push(new Date(s.due).getTime() - now.getTime());
    }
    expect(intervals.at(-1)!).toBeGreaterThan(intervals[2]);
    expect(s.fsrs_state).toBe(State.Review);
  });

  it("weights production above recognition", () => {
    expect(gradeFromOutcome({ correct: true, direction: "production", fsrsState: State.Review })).toBe(Rating.Good);
    expect(gradeFromOutcome({ correct: true, direction: "recognition", fsrsState: State.Review })).toBe(Rating.Hard);
    expect(gradeFromOutcome({ correct: false, direction: "production", fsrsState: State.Review })).toBe(Rating.Again);
    expect(gradeFromOutcome({ correct: true, direction: "production", typo: true, fsrsState: State.Review })).toBe(Rating.Hard);
  });
});
