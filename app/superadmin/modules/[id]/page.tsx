import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ModuleEditClient from "./ModuleEditClient";

export default async function ModuleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*, companies(name)").eq("id", user.id).single();
  if (profile?.role !== "superadmin") redirect("/dashboard");

  const { data: mod } = await supabase.from("modules").select("*").eq("id", id).single();
  if (!mod) redirect("/superadmin");

  const { data: activities } = await supabase
    .from("activities")
    .select("*, activity_content(*)")
    .eq("module_id", id)
    .order("position");

  return (
    <ModuleEditClient
      profile={profile as any}
      module={mod as any}
      activities={activities as any ?? []}
    />
  );
}
