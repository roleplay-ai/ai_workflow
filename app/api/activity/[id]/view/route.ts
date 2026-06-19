import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: activityId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const ip = getIp(req);

  let sessionId: string | null = null;
  try {
    const body = await req.json();
    sessionId = body?.sessionId ?? null;
  } catch {}

  // Deduplicate: skip if this session already viewed this activity
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

  // For anonymous users without a session, deduplicate by IP (same IP + activity today = skip)
  if (!sessionId && ip && !user) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("activity_views")
      .select("id", { count: "exact", head: true })
      .eq("activity_id", activityId)
      .eq("ip_address", ip)
      .gte("created_at", todayStart.toISOString());

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
    ip_address: ip,
  });

  const { count: total } = await supabase
    .from("activity_views")
    .select("id", { count: "exact", head: true })
    .eq("activity_id", activityId);

  return NextResponse.json({ count: total ?? 0 });
}
