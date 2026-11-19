import { z } from "zod";
import { route } from "@/lib/server/http";
import { removeSubscription, saveSubscription } from "@/lib/server/push";

const Sub = z.object({ endpoint: z.string().url().max(1000).startsWith("https://"), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) });

export const POST = route(z.object({ subscription: Sub }), async (user, b, req) => {
  await saveSubscription(user.id, b.subscription, req.headers.get("user-agent"));
  return { ok: true };
});
export const DELETE = route(z.object({ endpoint: z.string().max(1000) }), async (user, b) => { await removeSubscription(user.id, b.endpoint); return { ok: true }; });
