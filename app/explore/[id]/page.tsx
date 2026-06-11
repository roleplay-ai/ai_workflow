import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ExplorePageClient from "./ExplorePageClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  let query = supabase.from("tool_deep_dives").select("*").eq("id", id);
  if (profile?.role !== "superadmin") {
    query = query.eq("published", true);
  }

  const { data: item } = await query.single();
  if (!item || item.link_type !== "html" || !item.html_path) notFound();

  return (
    <ExplorePageClient
      title={item.title}
      pageUrl={`/api/explore/${id}/html`}
    />
  );
}
