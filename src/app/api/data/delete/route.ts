import { z } from "zod";
import { route } from "@/lib/server/http";
import { deleteAllData } from "@/lib/server/services/data";

export const POST = route(z.object({ confirm: z.literal("DELETE") }), async (user) => { await deleteAllData(user.id); return { ok: true }; });
