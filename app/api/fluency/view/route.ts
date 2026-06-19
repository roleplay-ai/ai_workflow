import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_TYPES = ["video", "tool", "tool_guide", "deep_dive", "module", "page"] as const;
type EntityType = (typeof VALID_TYPES)[number];

function getIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? null;
}

export async function POST(req: NextRequest) {
  let entityType: string | null = null;
  let entityId: string | null = null;
  let sessionId: string | null = null;
  try {
    const body = await req.json();
    entityType = body?.entityType ?? null;
    entityId = body?.entityId ?? null;
    sessionId = body?.sessionId ?? null;
  } catch {}

  if (!entityId || !entityType || !VALID_TYPES.includes(entityType as EntityType)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ip = getIp(req);

  // Deduplicate by session
  if (sessionId) {
    const { count } = await supabase
      .from("fluency_views")
      .select("id", { count: "exact", head: true })
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("session_id", sessionId);

    if ((count ?? 0) > 0) {
      return NextResponse.json({ ok: true });
    }
  }

  // For anonymous users without a session, deduplicate by IP per day
  if (!sessionId && ip && !user) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("fluency_views")
      .select("id", { count: "exact", head: true })
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("ip_address", ip)
      .gte("created_at", todayStart.toISOString());

    if ((count ?? 0) > 0) {
      return NextResponse.json({ ok: true });
    }
  }

  await supabase.from("fluency_views").insert({
    entity_type: entityType as EntityType,
    entity_id: entityId,
    user_id: user?.id ?? null,
    session_id: sessionId,
    ip_address: ip,
  });

  return NextResponse.json({ ok: true });
}
