import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

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

  // Activities are now standalone — no module layer
  const [{ data: activities }, { data: progress }] = await Promise.all([
    supabase
      .from("activities")
      .select("*, activity_content(id)")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id),
  ]);

  const fullProfile = profile ? { ...profile, companies: company } : null;

  return (
    <DashboardClient
      profile={fullProfile as any}
      activities={activities as any ?? []}
      progress={progress ?? []}
    />
  );
}
