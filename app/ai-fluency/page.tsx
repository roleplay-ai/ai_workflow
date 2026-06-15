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
    { data: worlds },
    { data: videos },
    { data: tools },
    { data: toolGuides },
    { data: deepDives },
    { data: toolLogoRows },
    { data: progressRows },
  ] = await Promise.all([
    supabase
      .from("fluency_briefs")
      .select("*, fluency_brief_items(*)")
      .eq("is_active", true)
      .order("published_date", { ascending: false })
      .limit(1),
    supabase
      .from("fluency_worlds")
      .select("id, title, emoji, color, fluency_modules(id, title, emoji, concepts, sort_order, is_locked, next_module_hint)")
      .eq("published", true)
      .order("sort_order"),
    supabase
      .from("apply_videos")
      .select("id, title, description, video_url, thumbnail_url, duration, order_index, is_locked, group_name, category_tag, is_featured")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("order_index")
      .limit(10),
    supabase
      .from("fluency_tools")
      .select("*")
      .eq("published", true)
      .order("sort_order")
      .limit(10),
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
    user
      ? supabase.from("fluency_module_progress").select("module_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { module_id: string }[] }),
  ]);

  const toolLogos: Record<string, string> = {};
  for (const row of toolLogoRows ?? []) {
    if (row.tool && row.logo_url) toolLogos[row.tool as string] = row.logo_url as string;
  }

  // Sort modules within each world by sort_order
  const sortedWorlds = (worlds ?? []).map((w: any) => ({
    ...w,
    fluency_modules: [...(w.fluency_modules ?? [])].sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    ),
  }));

  const completedModuleIds = (progressRows ?? []).map((r: any) => r.module_id as string);

  return (
    <AIFluencyClient
      brief={(briefs?.[0] ?? null) as any}
      worlds={sortedWorlds as any}
      videos={(videos ?? []) as any}
      tools={(tools ?? []) as any}
      toolGuides={(toolGuides ?? []) as any}
      deepDives={(deepDives ?? []) as any}
      toolLogos={toolLogos}
      completedModuleIds={completedModuleIds}
      isLoggedIn={!!user}
      userName={(profile as any)?.full_name ?? null}
      isAdmin={(profile as any)?.role === "superadmin"}
    />
  );
}
