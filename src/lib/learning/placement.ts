/**
 * Adaptive placement engine.
 *
 * A simplified item-response model: the probability of answering an item of
 * difficulty b correctly, given ability θ, is
 *   P = c + (1 - c) · logistic(1.7 · (θ − b))
 * where c is the guessing rate (1/options for multiple choice, ~0 for typed
 * answers). θ and b live on a 1..6 scale (A1..C2). We keep a discrete posterior
 * over θ per skill and pooled overall, pick the next item near the current
 * estimate for the least-measured skill, and stop once enough evidence exists.
 *
 * This yields an *estimated CEFR alignment* with an explicit uncertainty band.
 * It is not a calibrated psychometric instrument and must not be presented as
 * certification.
 */

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Level = (typeof LEVELS)[number];
export type PlacementSkill = "vocabulary" | "grammar" | "listening" | "reading";
export const PLACEMENT_SKILLS: PlacementSkill[] = ["vocabulary", "grammar", "reading", "listening"];

export interface PlacementItem { id: string; skill: PlacementSkill; level: Level; type: string; optionCount?: number }
export interface PlacementResponse { itemId: string; skill: PlacementSkill; level: Level; correct: boolean; guess: number }

export const CONFIG = { minItems: 22, maxItems: 30, minPerSkill: 5, startLevel: 3, sdStop: 0.55 };

const GRID = Array.from({ length: 61 }, (_, i) => 0.5 + i * 0.1); // θ ∈ [0.5, 6.5]
const levelValue = (l: Level) => LEVELS.indexOf(l) + 1;

function logistic(x: number) { return 1 / (1 + Math.exp(-x)); }

export function pCorrect(theta: number, b: number, c: number) {
  return c + (1 - c) * logistic(1.7 * (theta - b));
}

export function guessRate(type: string, optionCount?: number) {
  if (["multiple_choice", "listening_mc", "reading_mc", "identify_error"].includes(type)) return 1 / Math.max(2, optionCount ?? 4);
  return 0.02;
}

export interface Estimate { theta: number; sd: number; n: number; accuracy: number }

export function estimate(responses: PlacementResponse[]): Estimate {
  // Weakly-informative prior centered on B1 so 1–2 answers cannot produce extreme estimates.
  let post = GRID.map((t) => Math.exp(-((t - CONFIG.startLevel) ** 2) / (2 * 1.6 ** 2)));
  for (const r of responses) {
    const b = levelValue(r.level);
    post = post.map((p, i) => p * (r.correct ? pCorrect(GRID[i], b, r.guess) : 1 - pCorrect(GRID[i], b, r.guess)));
  }
  const z = post.reduce((a, b) => a + b, 0);
  const w = post.map((p) => p / z);
  const theta = w.reduce((a, p, i) => a + p * GRID[i], 0);
  const sd = Math.sqrt(w.reduce((a, p, i) => a + p * (GRID[i] - theta) ** 2, 0));
  const n = responses.length;
  return { theta, sd, n, accuracy: n ? responses.filter((r) => r.correct).length / n : 0 };
}

export function thetaToLevel(theta: number, maxLevel: Level = "C1"): Level {
  const idx = Math.min(LEVELS.indexOf(maxLevel), Math.max(0, Math.round(theta) - 1));
  return LEVELS[idx];
}

export type Confidence = "low" | "medium" | "high";
export function confidenceOf(e: Estimate): Confidence | null {
  if (e.n < 4) return null; // insufficient evidence
  if (e.sd < 0.6 && e.n >= 6) return "high";
  if (e.sd < 0.95) return "medium";
  return "low";
}

/** Selects the next item, or null when the test should stop. */
export function nextItem(bank: PlacementItem[], responses: PlacementResponse[]): PlacementItem | null {
  if (shouldStop(bank, responses)) return null;
  const used = new Set(responses.map((r) => r.itemId));
  const available = bank.filter((i) => !used.has(i.id));
  if (!available.length) return null;

  const counts = new Map(PLACEMENT_SKILLS.map((s) => [s, responses.filter((r) => r.skill === s).length]));
  const skillOrder = [...PLACEMENT_SKILLS].sort((a, b) => counts.get(a)! - counts.get(b)!);
  for (const skill of skillOrder) {
    const pool = available.filter((i) => i.skill === skill);
    if (!pool.length) continue;
    const skillResponses = responses.filter((r) => r.skill === skill);
    // Use the pooled estimate until the skill has its own evidence.
    const target = skillResponses.length >= 2 ? estimate(skillResponses).theta : estimate(responses).theta;
    pool.sort((a, b) => Math.abs(levelValue(a.level) - target) - Math.abs(levelValue(b.level) - target) || a.id.localeCompare(b.id));
    return pool[0];
  }
  return null;
}

export function shouldStop(bank: PlacementItem[], responses: PlacementResponse[]): boolean {
  const n = responses.length;
  if (n >= CONFIG.maxItems) return true;
  if (n < CONFIG.minItems) return false;
  const perSkillOk = PLACEMENT_SKILLS.every((s) => {
    const have = responses.filter((r) => r.skill === s).length;
    const possible = bank.filter((i) => i.skill === s).length;
    return have >= Math.min(CONFIG.minPerSkill, possible);
  });
  return perSkillOk && estimate(responses).sd < CONFIG.sdStop;
}

export interface PlacementResult {
  overall: { level: Level; confidence: Confidence | null; theta: number; sd: number; n: number; accuracy: number; range: [Level, Level] };
  skills: Record<PlacementSkill, { level: Level | null; confidence: Confidence | null; n: number; accuracy: number; theta: number | null }>;
}

export function summarize(responses: PlacementResponse[]): PlacementResult {
  const o = estimate(responses);
  const skills = Object.fromEntries(PLACEMENT_SKILLS.map((s) => {
    const rs = responses.filter((r) => r.skill === s);
    const e = estimate(rs);
    const conf = confidenceOf(e);
    return [s, { level: conf ? thetaToLevel(e.theta) : null, confidence: conf, n: e.n, accuracy: round2(e.accuracy), theta: conf ? round2(e.theta) : null }];
  })) as PlacementResult["skills"];
  return {
    overall: {
      level: thetaToLevel(o.theta), confidence: confidenceOf(o), theta: round2(o.theta), sd: round2(o.sd), n: o.n, accuracy: round2(o.accuracy),
      range: [thetaToLevel(o.theta - o.sd), thetaToLevel(o.theta + o.sd)],
    },
    skills,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
