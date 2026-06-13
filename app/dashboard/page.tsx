import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import { rowsToToolLogoMap } from "@/lib/toolLogos";
import { buildDashboardToolFilters } from "@/lib/tools";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user-specific data only when authenticated
  let profile = null;
  let company = null;
  let progress: unknown[] = [];
  let masteryProgressCount = 0;

  if (user) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, company_id, full_name, avatar_url, created_at")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[dashboard] profile error:", profileError.message);
    }

    profile = profileData;

    if (profile?.company_id) {
      const { data: companyData } = await supabase
        .from("companies")
        .select("name")
        .eq("id", profile.company_id)
        .single();
      company = companyData;
    }

    const { data: progressData } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id);
    progress = progressData ?? [];

    const { data: masteryRows } = await supabase
      .from("ai_mastery_progress")
      .select("module_id")
      .eq("user_id", user.id);
    masteryProgressCount = (masteryRows ?? []).length;
  }

  // Activities and static data fetched for all visitors
  const [
    { data: activities },
    { data: toolLogoRows },
    { data: tagRows },
    { data: functionRows },
    { data: briefs },
  ] = await Promise.all([
    supabase
      .from("activities")
      .select("*, activity_content(id)")
      .eq("published", true)
      .order("position"),
    supabase.from("tool_logos").select("tool, logo_url"),
    supabase.from("activity_tags").select("name, icon_url"),
    supabase.from("activity_functions").select("name, icon_url, thumbnail_url, description"),
    supabase
      .from("fluency_briefs")
      .select("*, fluency_brief_items(*)")
      .eq("is_active", true)
      .order("published_date", { ascending: false })
      .limit(1),
  ]);

  const tagLogos: Record<string, string> = {};
  for (const row of tagRows ?? []) {
    if (row.icon_url) tagLogos[(row.name as string).toLowerCase()] = row.icon_url as string;
  }

  const functionLogos: Record<string, string> = {};
  const functionThumbnails: Record<string, string> = {};
  const functionDescriptions: Record<string, string> = {};
  for (const row of functionRows ?? []) {
    const key = (row.name as string).toLowerCase();
    if (row.icon_url) functionLogos[key] = row.icon_url as string;
    if ((row as any).thumbnail_url) functionThumbnails[key] = (row as any).thumbnail_url as string;
    if ((row as any).description) functionDescriptions[key] = (row as any).description as string;
  }

  const fullProfile = profile ? { ...profile, companies: company } : null;
  const toolFilters = buildDashboardToolFilters(
    (toolLogoRows ?? []).map(row => row.tool),
    (activities ?? []).map(a => a.tools ?? []),
  );

  return (
    <DashboardClient
      profile={fullProfile as any}
      activities={activities as any ?? []}
      progress={progress as any}
      toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])}
      tagLogos={tagLogos}
      functionLogos={functionLogos}
      functionThumbnails={functionThumbnails}
      functionDescriptions={functionDescriptions}
      toolFilters={toolFilters}
      isLoggedIn={!!user}
      masteryProgressCount={masteryProgressCount}
      brief={(briefs?.[0] ?? null) as any}
    />
  );
}
