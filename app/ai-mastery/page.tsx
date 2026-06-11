import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AIMasteryClient from "./AIMasteryClient";

export const dynamic = "force-dynamic";

export default async function AIMasteryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("ai_mastery_progress")
    .select("module_id")
    .eq("user_id", user.id);

  const completedModules = (rows ?? []).map(r => r.module_id as string);

  return <AIMasteryClient completedModules={completedModules} />;
}
