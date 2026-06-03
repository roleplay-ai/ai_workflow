import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActivityViewClient from "./ActivityViewClient";

export const dynamic = "force-dynamic";

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Simple profile fetch — no join
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  const { data: company } = profile?.company_id
    ? await supabase.from("companies").select("name").eq("id", profile.company_id).single()
    : { data: null };

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("*, activity_content(*)")
    .eq("id", id)
    .single();

  if (activityError || !activity) {
    redirect("/dashboard");
  }

  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("activity_id", id)
    .maybeSingle();

  const fullProfile = profile ? { ...profile, companies: company } : null;

  return (
    <ActivityViewClient
      profile={fullProfile as any}
      activity={activity as any}
      progress={progress as any}
    />
  );
}
