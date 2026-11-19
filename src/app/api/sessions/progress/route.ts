import { z } from "zod";
import { route, uuid } from "@/lib/server/http";
import { saveSessionProgress } from "@/lib/server/services/lessons";

const Body = z.object({ sessionId: uuid, position: z.number().int().min(0).max(500), activeSeconds: z.number().min(0).max(3600), pause: z.boolean().default(false) });

export const POST = route(Body, async (user, b) => { await saveSessionProgress(user.id, b.sessionId, b.position, b.activeSeconds, b.pause); return { ok: true }; });
