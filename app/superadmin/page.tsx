import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SuperadminClient from "./SuperadminClient";

export default async function SuperadminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*, companies(name)").eq("id", user.id).single();
  if (profile?.role !== "superadmin") redirect("/dashboard");

  const [{ data: companies }, { data: modules }, { data: allProfiles }] = await Promise.all([
    supabase.from("companies").select("*").order("name"),
    supabase.from("modules").select("*, activities(id)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, role, company_id").limit(1000),
  ]);

  return (
    <SuperadminClient
      profile={profile as any}
      companies={companies ?? []}
      modules={modules ?? []}
      allProfiles={allProfiles ?? []}
    />
  );
}
