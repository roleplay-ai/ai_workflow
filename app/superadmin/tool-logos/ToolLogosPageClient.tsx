"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import ToolLogosManager from "@/components/ToolLogosManager";
import type { Profile } from "@/lib/supabase/types";
import type { ToolLogoMap } from "@/lib/toolLogos";

type Props = {
  profile: Profile & { companies: { name: string } | null };
  toolLogos: ToolLogoMap;
};

export default function ToolLogosPageClient({ profile, toolLogos }: Props) {
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <Topbar profile={profile} role="superadmin" onSignOut={handleSignOut} />

      <main style={{ width: "min(1100px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" }}>
        <div style={{ marginBottom: 22 }}>
          <Link
            href="/superadmin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              marginBottom: 12,
              fontSize: 13,
              fontWeight: 600,
              color: "#6B6B6B",
              textDecoration: "none",
            }}
          >
            ← Activities
          </Link>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-.04em" }}>Tool logos</h1>
          <p style={{ margin: "3px 0 0", color: "#6B6B6B", fontSize: 13 }}>
            Upload logos for each tool. They appear on dashboard cards and activity pages.
          </p>
        </div>

        <ToolLogosManager initialLogos={toolLogos} />
      </main>
    </div>
  );
}
