import { createClient } from "@/lib/supabase/server";
import FoundationsClient from "./FoundationsClient";

export const dynamic = "force-dynamic";

export default async function FoundationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
    : { data: null };

  const [{ data: modules }, { data: progressRows }] = await Promise.all([
    supabase
      .from("fluency_modules")
      .select("id, title, emoji, description, concepts, sort_order, is_locked, next_module_hint, html_path")
      .eq("published", true)
      .order("sort_order"),
    user
      ? supabase.from("fluency_module_progress").select("module_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { module_id: string }[] }),
  ]);

  return (
    <FoundationsClient
      modules={(modules ?? []) as any}
      completedModuleIds={(progressRows ?? []).map((r: any) => r.module_id as string)}
      userName={(profile as any)?.full_name ?? null}
      isAdmin={(profile as any)?.role === "superadmin"}
    />
  );
}
