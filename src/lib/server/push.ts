import "server-only";
import webpush from "web-push";
import { withOwner, withUser } from "./db";

export function pushConfigured() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}
export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? null;

let ready = false;
function init() {
  if (!ready && pushConfigured()) { webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!); ready = true; }
  return ready;
}

export async function saveSubscription(userId: string, s: { endpoint: string; keys: { p256dh: string; auth: string } }, ua: string | null) {
  await withUser(userId, (db) => db.query(
    `insert into push_subscriptions (user_id, endpoint, p256dh, auth, user_agent) values (private.uid(), $1, $2, $3, $4)
     on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent`,
    [s.endpoint, s.keys.p256dh, s.keys.auth, ua?.slice(0, 200) ?? null]));
}

export async function removeSubscription(userId: string, endpoint: string) {
  await withUser(userId, (db) => db.query("delete from push_subscriptions where endpoint = $1", [endpoint]));
}

/** Sends to every device of a user; drops subscriptions the push service reports as gone. Runs as owner (used by cron). */
export async function sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!init()) return { sent: 0, configured: false };
  const subs = await withOwner(async (db) => (await db.query("select id, endpoint, p256dh, auth from push_subscriptions where user_id = $1", [userId])).rows);
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 });
      sent++;
    } catch (e: unknown) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await withOwner((db) => db.query("delete from push_subscriptions where id = $1", [s.id]));
    }
  }
  return { sent, configured: true };
}

const REMINDER = {
  he: { title: "זמן לאנגלית", body: "התוכנית היומית שלך מחכה. כמה דקות עכשיו שומרות על הרצף." },
  en: { title: "Time for English", body: "Your daily plan is waiting. A few minutes now keeps your streak going." },
};

/** Daily reminder: once per local day, after the chosen time, only if the learner hasn't been active today. */
export async function runReminders(now = new Date()) {
  if (!init()) return { configured: false, checked: 0, sent: 0 };
  const due = await withOwner(async (db) => (await db.query(
    `select p.user_id, p.locale, (now() at time zone p.timezone)::date::text as local_day
     from user_preferences p
     where p.reminder_enabled
       and (now() at time zone p.timezone)::time >= p.reminder_time
       and exists (select 1 from push_subscriptions s where s.user_id = p.user_id)
       and not exists (select 1 from exercise_attempts a where a.user_id = p.user_id and (a.created_at at time zone p.timezone)::date = (now() at time zone p.timezone)::date)
       and not exists (select 1 from vocabulary_reviews r where r.user_id = p.user_id and (r.reviewed_at at time zone p.timezone)::date = (now() at time zone p.timezone)::date)`)).rows);
  let sent = 0;
  for (const u of due) {
    const key = `reminder:${u.local_day}`;
    const msg = REMINDER[u.locale as "he" | "en"] ?? REMINDER.he;
    const claimed = await withOwner(async (db) => (await db.query(
      `insert into notifications (user_id, kind, title, body, scheduled_for, dedupe_key) values ($1, 'daily_reminder', $2, $3, $4, $5)
       on conflict (user_id, dedupe_key) do nothing returning id`, [u.user_id, msg.title, msg.body, now, key])).rows[0]);
    if (!claimed) continue;
    const r = await sendToUser(u.user_id, { ...msg, url: "/" });
    await withOwner((db) => db.query("update notifications set status = $2, sent_at = now() where id = $1", [claimed.id, r.sent ? "sent" : "failed"]));
    sent += r.sent ? 1 : 0;
  }
  return { configured: true, checked: due.length, sent };
}
