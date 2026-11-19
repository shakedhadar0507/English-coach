import "server-only";

/**
 * AI configuration (all server-side env vars; nothing here reaches the browser).
 *
 * AI_PROVIDER=openai-compatible enables text AI through any OpenAI-compatible
 * Chat Completions endpoint (OpenAI, Google Gemini's OpenAI endpoint, OpenRouter,
 * Groq, ...). Each feature also has its own flag so paid features stay off until
 * explicitly approved.
 */
export type AiFeature = "writing_feedback" | "tutor_turn" | "conversation_feedback" | "realtime" | "content_generation";

export interface AiConfig {
  provider: "none" | "openai-compatible";
  baseUrl: string;
  apiKey: string | null;
  textModel: string;
  freeTier: boolean;
  providerLabel: string;
  features: Record<AiFeature, boolean>;
  realtime: { apiKey: string | null; model: string; voice: string };
  timeoutMs: number;
}

const flag = (v: string | undefined, def = false) => (v === undefined ? def : ["1", "true", "yes", "on"].includes(v.toLowerCase()));

export function getAiConfig(): AiConfig {
  const provider = process.env.AI_PROVIDER === "openai-compatible" ? "openai-compatible" : "none";
  const apiKey = process.env.AI_API_KEY || null;
  const on = provider === "openai-compatible" && !!apiKey;
  return {
    provider,
    baseUrl: (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
    apiKey,
    textModel: process.env.AI_MODEL_TEXT || "gpt-4o-mini",
    freeTier: flag(process.env.AI_FREE_TIER),
    providerLabel: process.env.AI_PROVIDER_LABEL || "openai-compatible",
    features: {
      writing_feedback: on && flag(process.env.AI_FEATURE_WRITING),
      tutor_turn: on && flag(process.env.AI_FEATURE_TUTOR),
      conversation_feedback: on && flag(process.env.AI_FEATURE_TUTOR),
      content_generation: on && flag(process.env.AI_FEATURE_CONTENT_GENERATION),
      // Real-time voice is paid and uncappable at the provider level, so it needs its own key and flag.
      realtime: flag(process.env.AI_FEATURE_REALTIME) && !!process.env.OPENAI_REALTIME_API_KEY,
    },
    realtime: {
      apiKey: process.env.OPENAI_REALTIME_API_KEY || null,
      model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-mini",
      voice: process.env.OPENAI_REALTIME_VOICE || "marin",
    },
    timeoutMs: Number(process.env.AI_TIMEOUT_MS || 30_000),
  };
}

export function aiEnabled(feature: AiFeature): boolean {
  return getAiConfig().features[feature];
}

/** Public, non-secret summary for the UI. */
export function aiPublicStatus() {
  const c = getAiConfig();
  return { features: c.features, freeTier: c.freeTier, model: c.provider === "none" ? null : c.textModel };
}
