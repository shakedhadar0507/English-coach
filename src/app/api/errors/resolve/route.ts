import { z } from "zod";
import { route, uuid } from "@/lib/server/http";
import { resolveError } from "@/lib/server/services/errors";

export const POST = route(z.object({ id: uuid }), async (user, b) => { await resolveError(user.id, b.id); return { ok: true }; });
