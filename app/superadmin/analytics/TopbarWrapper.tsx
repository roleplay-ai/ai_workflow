"use client";
import Topbar from "@/components/Topbar";
import type { Profile } from "@/lib/supabase/types";

export default function TopbarWrapper({ profile }: { profile: Profile & { companies: { name: string } | null } }) {
  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    window.location.href = "/login";
  }
  return <Topbar profile={profile} role="superadmin" onSignOut={handleSignOut} />;
}
