import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActivityEditClient from "./ActivityEditClient";

export const dynamic = "force-dynamic";

export default async function ActivityEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("id,email,role,company_id,full_name,avatar_url,created_at").eq("id", user.id).single();
  if (profile?.role !== "superadmin") redirect("/dashboard");

  const { data: company } = profile?.company_id
    ? await supabase.from("companies").select("name").eq("id", profile.company_id).single()
    : { data: null };

  const { data: activity } = await supabase.from("activities").select("*, activity_content(*)").eq("id", id).single();
  if (!activity) redirect("/superadmin");

  return (
    <ActivityEditClient
      profile={{ ...profile!, companies: company } as any}
      activity={activity as any}
    />
  );
}
