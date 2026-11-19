import { z } from "zod";
import { route, uuid } from "@/lib/server/http";
import { addNote, deleteNote, notesForPath } from "@/lib/server/services/feedback";

const path = z.string().min(1).max(500).regex(/^\//);

export const GET = route(z.object({ path }), async (user, q) => ({ notes: await notesForPath(user.id, q.path) }));

export const POST = route(z.object({
  path,
  pageTitle: z.string().max(200).optional(),
  heading: z.string().max(300).optional(),
  note: z.string().trim().min(1).max(4000),
  context: z.record(z.string(), z.union([z.string().max(300), z.number(), z.boolean()])).default({}),
}), async (user, b) => ({ note: await addNote(user.id, b) }));

export const DELETE = route(z.object({ id: uuid }), async (user, b) => { await deleteNote(user.id, b.id); return { ok: true }; });
