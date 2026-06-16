import { createClient } from "@/lib/supabase/server";
import AllVideosClient from "./AllVideosClient";

export const dynamic = "force-dynamic";

export default async function AllVideosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
    : { data: null };

  const [{ data: videos }, { data: viewRows }] = await Promise.all([
    supabase
      .from("apply_videos")
      .select("id, title, description, video_url, thumbnail_url, duration, order_index, is_locked, group_name, category_tag, platforms")
      .eq("is_published", true)
      .order("order_index"),
    supabase.from("fluency_view_counts").select("entity_id, count").eq("entity_type", "video"),
  ]);

  const viewCounts: Record<string, number> = {};
  for (const row of viewRows ?? []) {
    const r = row as { entity_id: string; count: number };
    viewCounts[r.entity_id] = Number(r.count);
  }

  return (
    <AllVideosClient
      videos={(videos ?? []) as any}
      isLoggedIn={!!user}
      userName={(profile as any)?.full_name ?? null}
      isAdmin={(profile as any)?.role === "superadmin"}
      viewCounts={viewCounts}
    />
  );
}
