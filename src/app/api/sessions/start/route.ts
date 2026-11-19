import { z } from "zod";
import { route, uuid } from "@/lib/server/http";
import { startOrResumeSession } from "@/lib/server/services/lessons";

export const POST = route(z.object({ lessonId: uuid, planItemId: uuid.nullish() }), (user, b) => startOrResumeSession(user.id, b.lessonId, b.planItemId));
