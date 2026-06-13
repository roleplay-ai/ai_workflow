import { createClient } from "@/lib/supabase/server";
import AllVideosClient from "./AllVideosClient";

export const dynamic = "force-dynamic";

export default async function AllVideosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
    : { data: null };

  const { data: videos } = await supabase
    .from("apply_videos")
    .select("id, title, description, video_url, thumbnail_url, duration, order_index, is_locked, group_name, category_tag, platforms")
    .eq("is_published", true)
    .order("order_index");

  return (
    <AllVideosClient
      videos={(videos ?? []) as any}
      userName={(profile as any)?.full_name ?? null}
      isAdmin={(profile as any)?.role === "superadmin"}
    />
  );
}
