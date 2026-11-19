import "server-only";
import { z } from "zod";
import { requireApiUser, type SessionUser } from "./session";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Authenticated JSON route helper with zod validation and uniform errors. */
export function route<S extends z.ZodType>(schema: S, handler: (user: SessionUser, body: z.infer<S>, req: Request) => Promise<unknown>) {
  return async (req: Request) => {
    const user = await requireApiUser();
    if (user instanceof Response) return user;
    let raw: unknown = {};
    if (req.method !== "GET") {
      // Defense in depth on top of SameSite=Lax cookies: reject cross-origin writes.
      const origin = req.headers.get("origin");
      if (origin && originHost(origin) !== (req.headers.get("x-forwarded-host") ?? req.headers.get("host"))) {
        return Response.json({ error: "forbidden_origin" }, { status: 403 });
      }
      const text = await req.text();
      if (text.length > 64_000) return Response.json({ error: "payload_too_large" }, { status: 413 });
      try { raw = text ? JSON.parse(text) : {}; } catch { return Response.json({ error: "invalid_json" }, { status: 400 }); }
    } else {
      raw = Object.fromEntries(new URL(req.url).searchParams);
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return Response.json({ error: "invalid_input", details: parsed.error.issues.slice(0, 5).map((i) => i.path.join(".") + ": " + i.message) }, { status: 400 });
    try {
      const result = await handler(user, parsed.data, req);
      return result instanceof Response ? result : Response.json(result ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      console.error("route error", e);
      return Response.json({ error: "server_error" }, { status: 500 });
    }
  };
}

function originHost(origin: string) { try { return new URL(origin).host; } catch { return null; } }

export const idempotencyKey = z.string().min(8).max(80).regex(/^[A-Za-z0-9_-]+$/);
export const uuid = z.string().uuid();
