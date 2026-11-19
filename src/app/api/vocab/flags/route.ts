import { z } from "zod";
import { route, uuid } from "@/lib/server/http";
import { setWordFlags } from "@/lib/server/services/vocab";

export const POST = route(z.object({ id: uuid, saved: z.boolean().optional(), difficult: z.boolean().optional(), suspended: z.boolean().optional() }),
  async (user, b) => { await setWordFlags(user.id, b.id, b); return { ok: true }; });
