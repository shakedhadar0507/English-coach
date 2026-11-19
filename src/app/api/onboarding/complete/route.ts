import { z } from "zod";
import { route, HttpError } from "@/lib/server/http";
import { withUser } from "@/lib/server/db";
import { ensureTodayPlan } from "@/lib/server/services/plan";

export const POST = route(z.object({}), async (user) => {
  await withUser(user.id, async (db) => {
    const { rows } = await db.query("select current_level from profiles where id = private.uid()");
    if (!rows[0]?.current_level) throw new HttpError(400, "level_required");
    const goals = await db.query("select 1 from learning_goals where user_id = private.uid()");
    if (!goals.rowCount) await db.query("insert into learning_goals (user_id, goal, priority) values (private.uid(), 'general_fluency', 1)");
    await db.query("update profiles set onboarded_at = coalesce(onboarded_at, now()), onboarding_step = 'done' where id = private.uid()");
  });
  await ensureTodayPlan(user.id);
  return { ok: true };
});
