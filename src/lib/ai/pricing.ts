/**
 * Price table used for *estimated* cost accounting (USD per 1M tokens or per
 * minute of audio). These are estimates for budgeting, not invoices. Update
 * when provider pricing changes; unknown models fall back to a conservative
 * default so the budget guard errs on the side of over-estimating.
 */
export interface ModelPrice { inputPerM: number; outputPerM: number; audioPerMin?: number }

export const PRICES: Record<string, ModelPrice> = {
  // Free-tier models (still tracked so usage is visible)
  "gemini-2.5-flash:free": { inputPerM: 0, outputPerM: 0 },
  "gemini-2.5-flash-lite:free": { inputPerM: 0, outputPerM: 0 },
  "browser-speech": { inputPerM: 0, outputPerM: 0, audioPerMin: 0 },
  // Paid examples (estimates)
  "gpt-4.1-mini": { inputPerM: 0.4, outputPerM: 1.6 },
  "gpt-4o-mini": { inputPerM: 0.15, outputPerM: 0.6 },
  "gpt-4o-mini-transcribe": { inputPerM: 0, outputPerM: 0, audioPerMin: 0.003 },
  "gpt-4o-mini-tts": { inputPerM: 0, outputPerM: 0, audioPerMin: 0.015 },
  "gpt-realtime-mini": { inputPerM: 0.6, outputPerM: 2.4, audioPerMin: 0.06 },
};

const FALLBACK: ModelPrice = { inputPerM: 3, outputPerM: 15, audioPerMin: 0.1 };

export function priceFor(model: string, freeTier: boolean): ModelPrice {
  if (freeTier) return PRICES[`${model}:free`] ?? { inputPerM: 0, outputPerM: 0 };
  return PRICES[model] ?? FALLBACK;
}

export function estimateCost(p: ModelPrice, usage: { inputTokens?: number; outputTokens?: number; audioSeconds?: number }): number {
  const c = ((usage.inputTokens ?? 0) * p.inputPerM + (usage.outputTokens ?? 0) * p.outputPerM) / 1_000_000
    + ((usage.audioSeconds ?? 0) / 60) * (p.audioPerMin ?? 0);
  return Math.round(c * 1e6) / 1e6;
}

/** Conservative pre-call reservation: assumes the full output budget is used. */
export function reservationFor(p: ModelPrice, promptChars: number, maxOutputTokens: number): number {
  const inputTokens = Math.ceil(promptChars / 3.5);
  return estimateCost(p, { inputTokens, outputTokens: maxOutputTokens });
}
