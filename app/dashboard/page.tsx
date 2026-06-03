import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, companies(name)")
    .eq("id", user.id)
    .single();

  const { data: modules } = await supabase
    .from("modules")
    .select("*, activities(*)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id);

  return (
    <DashboardClient
      profile={profile as any}
      modules={modules ?? []}
      progress={progress ?? []}
    />
  );
}
