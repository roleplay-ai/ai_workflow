import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FunctionsManageClient from "./FunctionsManageClient";

export const dynamic = "force-dynamic";

export default async function FunctionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) redirect("/login");
  if (profile.role !== "superadmin") redirect("/dashboard");

  const { data: company } = profile.company_id
    ? await supabase.from("companies").select("name").eq("id", profile.company_id).single()
    : { data: null };

  const { data: functions } = await supabase
    .from("activity_functions")
    .select("id, name, icon_url, thumbnail_url, created_at")
    .order("name");

  return (
    <FunctionsManageClient
      profile={{ ...profile, companies: company } as any}
      functions={(functions ?? []) as any}
    />
  );
}
