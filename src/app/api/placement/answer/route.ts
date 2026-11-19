import { z } from "zod";
import { route, uuid } from "@/lib/server/http";
import { answerPlacement } from "@/lib/server/services/placement";
import { ResponseSchema } from "@/lib/server/schemas";

export const POST = route(z.object({ assessmentId: uuid, itemId: uuid, response: ResponseSchema }), async (user, b) => answerPlacement(user.id, b.assessmentId, b.itemId, b.response));
