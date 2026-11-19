import { describe, expect, it } from "vitest";
import { CONFIG, LEVELS, estimate, guessRate, nextItem, pCorrect, summarize, type Level, type PlacementItem, type PlacementResponse } from "@/lib/learning/placement";

const skills = ["vocabulary", "grammar", "reading", "listening"] as const;
const bank: PlacementItem[] = skills.flatMap((skill) =>
  LEVELS.slice(0, 5).flatMap((level) => [0, 1, 2].map((k) => ({ id: `${skill}-${level}-${k}`, skill, level, type: "multiple_choice", optionCount: 4 }))));

/** Simulates a learner with true ability theta answering deterministically (expected-value threshold). */
function simulate(trueTheta: number) {
  const responses: PlacementResponse[] = [];
  let item = nextItem(bank, responses);
  while (item) {
    const b = LEVELS.indexOf(item.level) + 1;
    const p = pCorrect(trueTheta, b, 0);
    responses.push({ itemId: item.id, skill: item.skill, level: item.level, correct: p >= 0.5, guess: guessRate(item.type, 4) });
    item = nextItem(bank, responses);
  }
  return responses;
}

describe("placement engine", () => {
  it("starts near B1", () => {
    const first = nextItem(bank, [])!;
    expect(first.level).toBe("B1");
  });

  it("never draws strong conclusions from very few answers", () => {
    const r: PlacementResponse[] = [{ itemId: "x", skill: "grammar", level: "C1", correct: true, guess: 0.25 }];
    const s = summarize(r);
    expect(s.overall.confidence).toBeNull();
    expect(s.skills.grammar.level).toBeNull();
  });

  it.each([[1.2, "A1"], [2.1, "A2"], [3.0, "B1"], [4.0, "B2"], [5.2, "C1"]] as [number, Level][])("recovers ability %s as about %s", (theta, level) => {
    const responses = simulate(theta);
    expect(responses.length).toBeGreaterThanOrEqual(CONFIG.minItems);
    expect(responses.length).toBeLessThanOrEqual(CONFIG.maxItems);
    const s = summarize(responses);
    const got = LEVELS.indexOf(s.overall.level);
    expect(Math.abs(got - LEVELS.indexOf(level))).toBeLessThanOrEqual(1);
  });

  it("covers every skill", () => {
    const responses = simulate(3.4);
    for (const sk of skills) expect(responses.filter((r) => r.skill === sk).length).toBeGreaterThanOrEqual(CONFIG.minPerSkill);
  });

  it("caps estimates at C1 because the bank has no C2 items", () => {
    const responses = simulate(6.4);
    expect(summarize(responses).overall.level).toBe("C1");
  });

  it("reduces uncertainty as evidence accumulates", () => {
    const responses = simulate(3);
    expect(estimate(responses.slice(0, 4)).sd).toBeGreaterThan(estimate(responses).sd);
  });
});
