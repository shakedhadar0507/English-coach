import "server-only";
import { withUser } from "@/lib/server/db";

export interface FeedbackInput {
  path: string;
  pageTitle?: string;
  heading?: string;
  note: string;
  context: Record<string, string | number | boolean>;
}

export interface FeedbackNote {
  id: string;
  path: string;
  note: string;
  status: "open" | "done";
  resolution: string | null;
  created_at: string;
}

export function addNote(userId: string, n: FeedbackInput) {
  return withUser(userId, async (db) => {
    const { rows } = await db.query<FeedbackNote>(
      `insert into public.feedback_notes (user_id, path, page_title, heading, note, context)
       values (private.uid(), $1, $2, $3, $4, $5) returning id, path, note, status, resolution, created_at`,
      [n.path, n.pageTitle ?? null, n.heading ?? null, n.note, JSON.stringify(n.context)],
    );
    return rows[0];
  });
}

export function notesForPath(userId: string, path: string) {
  return withUser(userId, async (db) => {
    const { rows } = await db.query<FeedbackNote>(
      `select id, path, note, status, resolution, created_at from public.feedback_notes
       where path = $1 order by created_at desc limit 50`, [path]);
    return rows;
  });
}

export function deleteNote(userId: string, id: string) {
  return withUser(userId, async (db) => {
    await db.query("delete from public.feedback_notes where id = $1 and status = 'open'", [id]);
  });
}
