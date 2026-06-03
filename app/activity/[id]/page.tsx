import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActivityViewClient from "./ActivityViewClient";

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*, companies(name)").eq("id", user.id).single();

  const { data: activity } = await supabase
    .from("activities")
    .select("*, modules(*), activity_content(*)")
    .eq("id", id)
    .single();

  if (!activity) redirect("/dashboard");

  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("activity_id", id)
    .maybeSingle();

  return (
    <ActivityViewClient
      profile={profile as any}
      activity={activity as any}
      progress={progress as any}
    />
  );
}
