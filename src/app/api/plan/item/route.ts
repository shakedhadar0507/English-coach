import { z } from "zod";
import { route, uuid } from "@/lib/server/http";
import { completePlanItem } from "@/lib/server/services/plan";

/** Marks a non-lesson plan item (review/new words/speaking/writing) complete after the learner finished it. */
export const POST = route(z.object({ itemId: uuid }), async (user, b) => { await completePlanItem(user.id, b.itemId); return { ok: true }; });
