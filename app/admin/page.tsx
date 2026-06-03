import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (!["admin", "superadmin"].includes(profile?.role ?? "")) redirect("/dashboard");

  const { data: company } = profile?.company_id
    ? await supabase.from("companies").select("name").eq("id", profile.company_id).single()
    : { data: null };

  const { data: companyUsers } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, full_name, created_at")
    .eq("company_id", profile!.company_id!)
    .order("created_at", { ascending: false });

  const userIds = (companyUsers ?? []).map((u: any) => u.id);
  const { data: allProgress } = userIds.length
    ? await supabase.from("user_progress").select("*, activities(title, points)").in("user_id", userIds)
    : { data: [] };

  const { count: totalActivities } = await supabase
    .from("activities").select("*", { count: "exact", head: true });

  const fullProfile = { ...profile!, companies: company };

  return (
    <AdminClient
      profile={fullProfile as any}
      companyUsers={companyUsers as any ?? []}
      allProgress={allProgress as any ?? []}
      totalActivities={totalActivities ?? 0}
    />
  );
}
