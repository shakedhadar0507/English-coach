import { z } from "zod";
import { route } from "@/lib/server/http";
import { setLevel } from "@/lib/server/services/settings";

export const POST = route(z.object({ level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]) }), async (user, body) => { await setLevel(user.id, body.level); return { ok: true }; });
