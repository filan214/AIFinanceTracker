import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { computeReportData } from "@/lib/reports/compute-report";

// All Reports-page numbers computed straight from the database (no AI).
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  try {
    const data = await computeReportData(supabase, user.id, month);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to compute report" },
      { status: 500 }
    );
  }
}
