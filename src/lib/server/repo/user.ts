import "server-only";
import type { Db } from "../db";

export interface Profile {
  id: string; display_name: string | null; current_level: string | null; level_source: string | null;
  onboarding_step: string; onboarded_at: string | null;
}
export interface Preferences {
  locale: "he" | "en"; theme: "system" | "light" | "dark"; daily_minutes: number; accent: "american" | "british" | "australian";
  voice_rate: number; correction_mode: "immediate" | "end_of_conversation"; timezone: string; reminder_enabled: boolean;
  reminder_time: string; monthly_ai_budget_usd: number; vocab_new_per_day: number; store_raw_audio: boolean;
}

export async function getProfile(db: Db): Promise<Profile> {
  const { rows } = await db.query("select id, display_name, current_level, level_source, onboarding_step, onboarded_at from profiles where id = private.uid()");
  if (!rows[0]) throw new Error("profile missing");
  return rows[0];
}

export async function getPreferences(db: Db): Promise<Preferences> {
  const { rows } = await db.query(`select locale, theme, daily_minutes, accent, voice_rate::float as voice_rate, correction_mode, timezone,
    reminder_enabled, to_char(reminder_time, 'HH24:MI') as reminder_time, monthly_ai_budget_usd::float as monthly_ai_budget_usd,
    vocab_new_per_day, store_raw_audio from user_preferences where user_id = private.uid()`);
  if (!rows[0]) throw new Error("preferences missing");
  return rows[0];
}

export async function getGoals(db: Db): Promise<{ goal: string; priority: number }[]> {
  const { rows } = await db.query("select goal, priority from learning_goals where user_id = private.uid() order by priority");
  return rows;
}
