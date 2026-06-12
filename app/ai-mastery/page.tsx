import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AIMasteryClient from "./AIMasteryClient";

export const dynamic = "force-dynamic";

export default async function AIMasteryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase.from("ai_mastery_progress").select("module_id").eq("user_id", user.id),
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
  ]);

  const completedModules = (rows ?? []).map(r => r.module_id as string);

  return (
    <AIMasteryClient
      completedModules={completedModules}
      userName={(profile as any)?.full_name ?? null}
      isAdmin={(profile as any)?.role === "superadmin"}
    />
  );
}
