import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_TYPES = ["video", "tool", "tool_guide", "deep_dive", "module"] as const;
type EntityType = (typeof VALID_TYPES)[number];

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

  // Deduplicate: skip if this session already has a view logged for this item
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

  await supabase.from("fluency_views").insert({
    entity_type: entityType,
    entity_id: entityId,
    user_id: user?.id ?? null,
    session_id: sessionId,
  });

  return NextResponse.json({ ok: true });
}
