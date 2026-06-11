import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExplorePageClient from "../../[id]/ExplorePageClient";

export const dynamic = "force-dynamic";

export default async function AiAtWorkPerspectivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ExplorePageClient
      title="AI at Work: The Real Questions"
      pageUrl="/perspectives/ai-at-work.html"
    />
  );
}
