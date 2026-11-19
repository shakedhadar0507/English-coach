"use client";

import { normalizeAnswer } from "@/lib/learning/normalize";
import type { ExerciseResponse, Feedback } from "@/components/exercise-view";

/** Must mirror offlineKey() in src/lib/server/services/exercises.ts */
async function h(exerciseId: string, s: string): Promise<string> {
  const data = new TextEncoder().encode(`${exerciseId}|${s}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

export type OfflineKey = { kind: "choice"; hashes: string[] } | { kind: "blanks"; hashes: string[][] } | { kind: "text"; hashes: string[] };

/** Grades locally when offline. Returns null when this exercise cannot be graded offline. */
export async function gradeOffline(exerciseId: string, key: OfflineKey | null, r: ExerciseResponse): Promise<Feedback | null> {
  if (!key || !globalThis.crypto?.subtle) return null;
  if (key.kind === "choice" && r.kind === "choice") {
    const ok = key.hashes.includes(await h(exerciseId, [...r.selected].sort().join(",")));
    return { verdict: ok ? "correct" : "incorrect", isCorrect: ok, queued: true };
  }
  if (key.kind === "blanks" && r.kind === "blanks") {
    const blanks = await Promise.all(r.values.map(async (v, i) => (key.hashes[i] ?? []).includes(await h(exerciseId, normalizeAnswer(v)))));
    const ok = blanks.every(Boolean);
    return { verdict: ok ? "correct" : "incorrect", isCorrect: ok, blanks, queued: true };
  }
  if (key.kind === "text" && (r.kind === "text" || r.kind === "tokens")) {
    const v = r.kind === "text" ? r.value : r.order.join(" ");
    const ok = key.hashes.includes(await h(exerciseId, normalizeAnswer(v)));
    return { verdict: ok ? "correct" : "incorrect", isCorrect: ok, queued: true };
  }
  return null;
}
