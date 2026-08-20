import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return NextResponse.json({ ok: true, service: "lander-records-cms" }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, service: "lander-records-cms" }, { status: 503 });
  }
}
