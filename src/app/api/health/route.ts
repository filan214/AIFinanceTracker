import { NextResponse } from "next/server";

// Lightweight liveness check pinged by the keep-alive workflow.
// Must not be statically cached, so the ping always hits the running app.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true });
}
