import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return NextResponse.json({ status: "ok", application: "ok", database: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "error", application: "ok", database: "error" }, { status: 503 });
  }
}
