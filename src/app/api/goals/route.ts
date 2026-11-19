import { route } from "@/lib/server/http";
import { GoalsInput, setGoals } from "@/lib/server/services/settings";

export const POST = route(GoalsInput, async (user, body) => { await setGoals(user.id, body.goals); return { ok: true }; });
