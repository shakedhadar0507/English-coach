import { z } from "zod";
import { route, uuid } from "@/lib/server/http";
import { completeSession } from "@/lib/server/services/lessons";

export const POST = route(z.object({ sessionId: uuid, activeSeconds: z.number().min(0).max(3600) }), (user, b) => completeSession(user.id, b.sessionId, b.activeSeconds));
