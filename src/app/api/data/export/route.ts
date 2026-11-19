import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server/session";
import { exportAll } from "@/lib/server/services/data";

export async function GET() {
  const user = await requireApiUser();
  if (user instanceof Response) return user;
  const data = await exportAll(user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="english-coach-export-${new Date().toISOString().slice(0, 10)}.json"`, "cache-control": "no-store" },
  });
}
