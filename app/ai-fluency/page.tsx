import { createClient } from "@/lib/supabase/server";
import AIFluencyClient from "./AIFluencyClient";

export const dynamic = "force-dynamic";

export default async function AIFluencyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
    : { data: null };

  const [
    { data: briefs },
    { data: videos },
    { data: tools },
    { data: toolGuides },
    { data: deepDives },
    { data: toolLogoRows },
    { data: viewRows },
  ] = await Promise.all([
    supabase
      .from("fluency_briefs")
      .select("*, fluency_brief_items(*)")
      .eq("is_active", true)
      .order("published_date", { ascending: false })
      .limit(1),
    supabase
      .from("apply_videos")
      .select("id, title, description, video_url, thumbnail_url, duration, order_index, is_locked, group_name, category_tag, is_featured")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("order_index")
      .limit(10),
    supabase
      .from("fluency_tools")
      .select("*, fluency_tool_pros(content, sort_order), fluency_tool_cons(content, sort_order)")
      .eq("published", true)
      .order("sort_order"),
    supabase
      .from("fluency_tool_guides")
      .select("*")
      .eq("published", true)
      .order("sort_order"),
    supabase
      .from("tool_deep_dives")
      .select("*")
      .eq("published", true)
      .order("position"),
    supabase.from("tool_logos").select("tool, logo_url"),
    supabase.from("fluency_view_counts").select("entity_id, count").eq("entity_type", "video"),
  ]);

  const viewCounts: Record<string, number> = {};
  for (const row of viewRows ?? []) {
    const r = row as { entity_id: string; count: number };
    viewCounts[r.entity_id] = Number(r.count);
  }

  const toolLogos: Record<string, string> = {};
  for (const row of toolLogoRows ?? []) {
    if (row.tool && row.logo_url) toolLogos[row.tool as string] = row.logo_url as string;
  }

  return (
    <AIFluencyClient
      brief={(briefs?.[0] ?? null) as any}
      videos={(videos ?? []) as any}
      tools={(tools ?? []) as any}
      toolGuides={(toolGuides ?? []) as any}
      deepDives={(deepDives ?? []) as any}
      toolLogos={toolLogos}
      isLoggedIn={!!user}
      userName={(profile as any)?.full_name ?? null}
      isAdmin={(profile as any)?.role === "superadmin"}
      viewCounts={viewCounts}
    />
  );
}
