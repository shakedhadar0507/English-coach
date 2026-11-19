/**
 * AI content-generation pipeline (draft-only).
 *   npm run content:generate -- --email owner@example.com --unit b1-workplace --kind grammar --topic present-perfect
 *
 * - Off unless AI_PROVIDER, AI_API_KEY and AI_FEATURE_CONTENT_GENERATION=true are set.
 * - Costs go through the same atomic budget reservation as every other AI call (charged to that user).
 * - Output must pass the Lesson schema AND the full content validator (merged into the current bundle);
 *   failing drafts are rejected. Valid drafts are written to content/drafts/ for human review.
 */
import { writeFileSync } from "node:fs";
import { Pool } from "pg";
import { chatJSON } from "../src/lib/ai/client";
import { aiEnabled } from "../src/lib/ai/config";
import { Lesson } from "../content/schema";
import { bundle } from "../content";
import { validateBundle } from "../content/validate";

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };

const SYSTEM = `You write English lessons for Hebrew-speaking adult learners. Return ONLY one JSON object matching this TypeScript type:
{ slug: string (kebab-case), kind: "grammar"|"vocabulary"|"reading"|"writing"|"speaking", title_en: string, title_he: string, intro_en: string, intro_he: string, minutes: number,
  exercises: Exercise[] }
Exercise types allowed: multiple_choice {type, skill, prompt:{question, options:[{id:"a"..,text}]}, answer:{correct:["a"]}, explanation_en, explanation_he, grammar?},
fill_blank {prompt:{text with ___}, answer:{blanks:[["accepted", ...]]}}, correct_sentence {prompt:{sentence}, answer:{accepted:[...]}}, translate_he_en {prompt:{source}, answer:{accepted:[...]}}.
Rules: exactly one correct option and no ambiguous distractors; explanation_he must be in natural Hebrew (English terms may appear); give several accepted answers for open items; never include the answer inside the prompt.`;

async function main() {
  if (!aiEnabled("content_generation")) throw new Error("content generation is disabled (set AI_PROVIDER, AI_API_KEY, AI_FEATURE_CONTENT_GENERATION=true)");
  const email = arg("email"), unitSlug = arg("unit"), kind = arg("kind") ?? "grammar", topic = arg("topic") ?? "";
  if (!email || !unitSlug) throw new Error("--email and --unit are required");
  const unit = bundle.courses.flatMap((c) => c.modules.flatMap((m) => m.units)).find((u) => u.slug === unitSlug);
  if (!unit) throw new Error(`unknown unit ${unitSlug}`);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows: [u] } = await pool.query("select id from auth_users where email = $1", [email.toLowerCase()]);
  await pool.end();
  if (!u) throw new Error("user not found");

  const { data } = await chatJSON({
    userId: u.id, feature: "content_generation", schema: Lesson, maxTokens: 3000, temperature: 0.4,
    messages: [{ role: "system", content: SYSTEM }, { role: "user", content: `Level ${unit.level}. Unit: "${unit.title_en}". Lesson kind: ${kind}. Focus: ${topic || (unit.grammar ?? []).join(", ")}. 6 exercises. Slug prefix: ${unit.slug}-draft-.` }],
  });
  // Validate the draft in the context of the whole curriculum (references, duplicates, keys, Hebrew).
  const merged = structuredClone(bundle);
  const target = merged.courses.flatMap((c) => c.modules.flatMap((m) => m.units)).find((x) => x.slug === unitSlug)!;
  target.lessons.push(data as never);
  const result = validateBundle(merged);
  const errors = result.issues.filter((i) => i.severity === "error");
  if (errors.length) { console.error("Draft rejected by validator:"); for (const e of errors) console.error(`- ${e.code}: ${e.message} (${e.entity}:${e.slug})`); process.exit(2); }
  const file = `content/drafts/${data.slug}.json`;
  writeFileSync(file, JSON.stringify({ unit: unitSlug, generated_at: new Date().toISOString(), status: "needs_review", lesson: data }, null, 2));
  console.log(`Draft written to ${file}. Review it before adding it to the curriculum.`);
  process.exit(0);
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
