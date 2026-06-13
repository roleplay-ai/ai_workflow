import { createClient } from "@/lib/supabase/server";
import AllToolsClient from "./AllToolsClient";

export const dynamic = "force-dynamic";

export default async function AllToolsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
    : { data: null };

  const { data: tools } = await supabase
    .from("fluency_tools")
    .select("id, category_label, name, description, icon_emoji, letter, color, company_name, try_url, best_for, pricing, is_featured, fluency_tool_pros(content, sort_order), fluency_tool_cons(content, sort_order)")
    .eq("published", true)
    .order("sort_order");

  return (
    <AllToolsClient
      tools={(tools ?? []) as any}
      userName={(profile as any)?.full_name ?? null}
      isAdmin={(profile as any)?.role === "superadmin"}
    />
  );
}
