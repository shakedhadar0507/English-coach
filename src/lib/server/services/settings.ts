import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import { withUser } from "../db";
import { LOCALE_COOKIE } from "@/i18n";
import { THEME_COOKIE } from "../locale";

export const PreferencesPatch = z.object({
  locale: z.enum(["he", "en"]),
  theme: z.enum(["system", "light", "dark"]),
  daily_minutes: z.number().int().min(5).max(120),
  accent: z.enum(["american", "british", "australian"]),
  voice_rate: z.number().min(0.5).max(1.5),
  correction_mode: z.enum(["immediate", "end_of_conversation"]),
  timezone: z.string().min(1).max(64).refine((tz) => { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; } }, "invalid timezone"),
  reminder_enabled: z.boolean(),
  reminder_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  monthly_ai_budget_usd: z.number().min(0).max(15),
  vocab_new_per_day: z.number().int().min(0).max(50),
}).partial().strict();

export async function updatePreferences(userId: string, patch: z.infer<typeof PreferencesPatch>) {
  const entries = Object.entries(patch);
  if (entries.length) {
    // Column names come from the strict zod schema keys, never from user input.
    const sets = entries.map(([k], i) => `${k} = $${i + 1}`).join(", ");
    await withUser(userId, (db) => db.query(`update user_preferences set ${sets} where user_id = private.uid()`, entries.map(([, v]) => v)));
  }
  const jar = await cookies();
  const opts = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const, httpOnly: false };
  if (patch.locale) jar.set(LOCALE_COOKIE, patch.locale, opts);
  if (patch.theme) jar.set(THEME_COOKIE, patch.theme, opts);
}

export const GoalsInput = z.object({ goals: z.array(z.enum(["everyday", "business", "academic", "travel", "job_interviews", "presentations", "general_fluency"])).min(1).max(7) });

export async function setGoals(userId: string, goals: string[]) {
  const unique = [...new Set(goals)];
  await withUser(userId, async (db) => {
    await db.query("delete from learning_goals where user_id = private.uid()");
    for (const [i, g] of unique.entries()) await db.query("insert into learning_goals (user_id, goal, priority) values (private.uid(), $1, $2)", [g, i + 1]);
  });
}

export async function setLevel(userId: string, level: string) {
  await withUser(userId, (db) => db.query("update profiles set current_level = $1, level_source = 'manual' where id = private.uid()", [level]));
}
