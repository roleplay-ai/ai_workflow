import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActivityEditClient from "./ActivityEditClient";

export const dynamic = "force-dynamic";

export default async function ActivityEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("id,email,role,company_id,full_name,avatar_url,created_at").eq("id", user.id).single();
  if (profile?.role !== "superadmin") redirect("/dashboard");

  const { data: company } = profile?.company_id
    ? await supabase.from("companies").select("name").eq("id", profile.company_id).single()
    : { data: null };

  const { data: activity } = await supabase.from("activities").select("*, activity_content(*)").eq("id", id).single();
  if (!activity) redirect("/superadmin");

  const { data: activitySteps } = await supabase
    .from("activity_steps")
    .select("*")
    .eq("activity_id", id)
    .order("step_number", { ascending: true });

  // Tool & tag options for the Info dropdowns
  const [{ data: toolLogoRows }, { data: tagRows }, { data: catRows }] = await Promise.all([
    supabase.from("tool_logos").select("tool, logo_url").order("tool"),
    supabase.from("activity_tags").select("name, icon_url").order("name"),
    supabase.from("activities").select("category").not("category", "is", null).not("category", "eq", ""),
  ]);

  const toolOptions = (toolLogoRows ?? []).map(r => ({ name: r.tool, imageUrl: r.logo_url || null }));
  const tagOptions  = (tagRows ?? []).map(r => ({ name: r.name, imageUrl: r.icon_url || null }));
  const categories  = [...new Set((catRows ?? []).map(r => r.category).filter(Boolean))] as string[];

  return (
    <ActivityEditClient
      profile={{ ...profile!, companies: company } as any}
      activity={activity as any}
      activitySteps={activitySteps ?? []}
      toolOptions={toolOptions}
      tagOptions={tagOptions}
      categories={categories}
    />
  );
}
