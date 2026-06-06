import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { rowsToToolLogoMap } from "@/lib/toolLogos";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[dashboard] profile error:", profileError.message);
  }

  const { data: company } = profile?.company_id
    ? await supabase.from("companies").select("name").eq("id", profile.company_id).single()
    : { data: null };

  // RLS on activities handles company filtering via user_can_access_activity()
  const [
    { data: activities },
    { data: progress },
    { data: toolLogoRows },
    { data: tagRows },
  ] = await Promise.all([
    supabase
      .from("activities")
      .select("*, activity_content(id)")
      .eq("published", true)
      .order("tools")
      .order("position"),
    supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id),
    supabase.from("tool_logos").select("tool, logo_url"),
    supabase.from("activity_tags").select("name, icon_url"),
  ]);

  const tagLogos: Record<string, string> = {};
  for (const row of tagRows ?? []) {
    if (row.icon_url) tagLogos[(row.name as string).toLowerCase()] = row.icon_url as string;
  }

  const fullProfile = profile ? { ...profile, companies: company } : null;

  return (
    <DashboardClient
      profile={fullProfile as any}
      activities={activities as any ?? []}
      progress={progress ?? []}
      toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])}
      tagLogos={tagLogos}
    />
  );
}
