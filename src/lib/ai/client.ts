import "server-only";
import { z } from "zod";
import { withUser } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
import { getAiConfig, type AiFeature } from "./config";
import { estimateCost, priceFor, reservationFor } from "./pricing";

export interface ChatMessage { role: "system" | "user" | "assistant"; content: string }

// --- Per-user in-memory rate limit (single instance deployment) ---
const buckets = new Map<string, number[]>();
function rateLimit(userId: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const hits = (buckets.get(userId) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) throw new HttpError(429, "rate_limited");
  hits.push(now);
  buckets.set(userId, hits);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Calls the configured OpenAI-compatible chat endpoint and returns JSON
 * validated against `schema`. Budget is reserved atomically in Postgres before
 * the call and settled with actual token usage afterwards. The model output is
 * treated as untrusted data: it is schema-validated and never executed.
 */
export async function chatJSON<S extends z.ZodType>(opts: {
  userId: string; feature: AiFeature; messages: ChatMessage[]; schema: S; maxTokens: number; temperature?: number; signal?: AbortSignal;
}): Promise<{ data: z.infer<S>; model: string }> {
  const cfg = getAiConfig();
  if (!cfg.features[opts.feature] || !cfg.apiKey) throw new HttpError(503, "ai_disabled");
  rateLimit(opts.userId);

  const price = priceFor(cfg.textModel, cfg.freeTier);
  const promptChars = opts.messages.reduce((n, m) => n + m.content.length, 0);
  const reserve = reservationFor(price, promptChars, opts.maxTokens);
  const reservationId = await withUser(opts.userId, async (db) => {
    const { rows } = await db.query("select reserve_ai_budget($1, $2, $3, $4) as id", [opts.feature, cfg.providerLabel, cfg.textModel, reserve]);
    return rows[0].id as string | null;
  });
  if (!reservationId) throw new HttpError(402, "budget_exceeded");

  let inputTokens = 0, outputTokens = 0;
  try {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
      opts.signal?.addEventListener("abort", () => ctrl.abort(), { once: true });
      try {
        const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
          method: "POST",
          signal: ctrl.signal,
          headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
          body: JSON.stringify({
            model: cfg.textModel,
            messages: opts.messages,
            max_tokens: opts.maxTokens,
            temperature: opts.temperature ?? 0.3,
            response_format: { type: "json_object" },
          }),
        });
        if (res.status === 429 || res.status >= 500) { lastErr = new Error(`provider ${res.status}`); await sleep(800 * 2 ** attempt); continue; }
        if (!res.ok) throw new HttpError(502, `provider_error_${res.status}`);
        const body = await res.json();
        inputTokens += body.usage?.prompt_tokens ?? Math.ceil(promptChars / 3.5);
        outputTokens += body.usage?.completion_tokens ?? 0;
        const content: string = body.choices?.[0]?.message?.content ?? "";
        const parsed = opts.schema.safeParse(extractJson(content));
        if (!parsed.success) { lastErr = new Error("invalid_ai_output"); continue; }
        await settle(opts.userId, reservationId, "committed", inputTokens, outputTokens, estimateCost(price, { inputTokens, outputTokens }));
        return { data: parsed.data, model: cfg.textModel };
      } catch (e) {
        if (e instanceof HttpError) throw e;
        lastErr = e;
        if (opts.signal?.aborted) break;
        await sleep(800 * 2 ** attempt);
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr ?? new Error("ai_failed");
  } catch (e) {
    const cost = estimateCost(price, { inputTokens, outputTokens });
    await settle(opts.userId, reservationId, inputTokens ? "failed" : "released", inputTokens, outputTokens, cost, String((e as Error).message)).catch(() => {});
    if (e instanceof HttpError) throw e;
    throw new HttpError(502, "ai_unavailable");
  }
}

async function settle(userId: string, id: string, status: string, inTok: number, outTok: number, cost: number, error?: string) {
  await withUser(userId, (db) => db.query("select settle_ai_usage($1, $2, $3, $4, 0, $5, $6)", [id, status, inTok, outTok, cost, error ?? null]));
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  try { return JSON.parse(trimmed); } catch { /* fall through */ }
  const start = trimmed.indexOf("{"), end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) { try { return JSON.parse(trimmed.slice(start, end + 1)); } catch { /* ignore */ } }
  return null;
}
