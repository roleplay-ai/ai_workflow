import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: activityId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let sessionId: string | null = null;
  try {
    const body = await req.json();
    sessionId = body?.sessionId ?? null;
  } catch {}

  // Deduplicate: skip if this session already has a view logged
  if (sessionId) {
    const { count } = await supabase
      .from("activity_views")
      .select("id", { count: "exact", head: true })
      .eq("activity_id", activityId)
      .eq("session_id", sessionId);

    if ((count ?? 0) > 0) {
      const { count: total } = await supabase
        .from("activity_views")
        .select("id", { count: "exact", head: true })
        .eq("activity_id", activityId);
      return NextResponse.json({ count: total ?? 0 });
    }
  }

  await supabase.from("activity_views").insert({
    activity_id: activityId,
    user_id: user?.id ?? null,
    session_id: sessionId,
  });

  const { count: total } = await supabase
    .from("activity_views")
    .select("id", { count: "exact", head: true })
    .eq("activity_id", activityId);

  return NextResponse.json({ count: total ?? 0 });
}
