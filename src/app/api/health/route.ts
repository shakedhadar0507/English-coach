import { getPool } from "@/lib/server/db";

export async function GET() {
  try {
    await getPool().query("select 1");
    return Response.json({ ok: true, db: "up" });
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503 });
  }
}
