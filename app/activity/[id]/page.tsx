import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActivityViewClient from "./ActivityViewClient";
import { rowsToToolLogoMap } from "@/lib/toolLogos";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("title, description, level, banner_url")
    .eq("id", id)
    .single();

  if (!activity) return {};

  const title = activity.title;
  const description =
    activity.description ??
    `${activity.level ?? ""} AI workflow activity on ${SITE_NAME}`.trim();

  const ogImage = activity.banner_url
    ? { url: activity.banner_url, width: 1200, height: 630, alt: title }
    : { url: `/api/og/${id}`, width: 1200, height: 630, alt: title };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("*, activity_content(*)")
    .eq("id", id)
    .single();

  if (activityError || !activity) redirect("/apply");

  // Guests cannot open locked activities
  if (!user && activity.is_locked) redirect("/apply");

  let profile = null;
  let company = null;
  let progress = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, email, role, company_id, full_name, avatar_url, created_at")
      .eq("id", user.id)
      .single();

    profile = profileData;

    const [{ data: companyData }, { data: progressData }] = await Promise.all([
      profile?.company_id
        ? supabase.from("companies").select("name").eq("id", profile.company_id).single()
        : Promise.resolve({ data: null }),
      supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("activity_id", id)
        .maybeSingle(),
    ]);

    company = companyData;
    progress = progressData;
  }

  const { data: activitySteps } = await supabase
    .from("activity_steps")
    .select("*")
    .eq("activity_id", id)
    .order("step_number", { ascending: true });

  const { data: toolLogoRows } = await supabase.from("tool_logos").select("tool, logo_url");

  return (
    <ActivityViewClient
      profile={profile ? { ...(profile as any), companies: company } : null}
      activity={activity as any}
      activitySteps={(activitySteps ?? []) as any}
      progress={progress as any}
      toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])}
    />
  );
}
