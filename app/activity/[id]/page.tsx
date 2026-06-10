import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActivityViewClient from "./ActivityViewClient";
import { rowsToToolLogoMap } from "@/lib/toolLogos";

export const dynamic = "force-dynamic";

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("*, activity_content(*)")
    .eq("id", id)
    .single();

  if (activityError || !activity) redirect("/dashboard");

  // Guests cannot open locked activities
  if (!user && activity.is_locked) redirect("/dashboard");

  let profile = null;
  let company = null;
  let progress = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, email, role, company_id, full_name, avatar_url, created_at")
      .eq("id", user.id)
      .single();

    profile = profileData;

    const [{ data: companyData }, { data: progressData }] = await Promise.all([
      profile?.company_id
        ? supabase.from("companies").select("name").eq("id", profile.company_id).single()
        : Promise.resolve({ data: null }),
      supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("activity_id", id)
        .maybeSingle(),
    ]);

    company = companyData;
    progress = progressData;
  }

  const { data: activitySteps } = await supabase
    .from("activity_steps")
    .select("*")
    .eq("activity_id", id)
    .order("step_number", { ascending: true });

  const { data: toolLogoRows } = await supabase.from("tool_logos").select("tool, logo_url");

  return (
    <ActivityViewClient
      profile={profile ? { ...(profile as any), companies: company } : null}
      activity={activity as any}
      activitySteps={(activitySteps ?? []) as any}
      progress={progress as any}
      toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])}
    />
  );
}
