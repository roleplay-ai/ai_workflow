"use client";
import Link from "next/link";
import type { Profile } from "@/lib/supabase/types";

type Props = {
  profile: (Profile & { companies?: { name: string } | null }) | null;
  role?: string;
  onSignOut?: () => void;
};

export default function Topbar({ profile, role, onSignOut }: Props) {
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (profile?.email ?? "?")[0].toUpperCase();

  return (
    <header style={{
      height: 62, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 44px", background: "rgba(255,255,255,.94)", borderBottom: "1px solid #E8E6DC",
      position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(16px)",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 800, letterSpacing: "-.03em" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center",
          background: "linear-gradient(135deg,#FFCE00,#F68A29)",
          boxShadow: "0 4px 14px rgba(255,206,0,.3)", fontSize: 10, fontWeight: 900, color: "#221D23",
        }}>AI</div>
        <span>AI Work Studio</span>
      </div>

      <nav style={{ display: "flex", gap: 22, alignItems: "center", color: "#6B6B6B", fontSize: 13.5, fontWeight: 600 }}>
        <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>Explore</Link>
        {(role === "admin" || role === "superadmin") && (
          <Link href="/admin" style={{ color: "inherit", textDecoration: "none" }}>Admin</Link>
        )}
        {role === "superadmin" && (
          <Link href="/superadmin" style={{ color: "inherit", textDecoration: "none" }}>Superadmin</Link>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px 5px 5px", background: "white", border: "1px solid #E8E6DC", borderRadius: 999, cursor: "pointer" }}
          onClick={onSignOut}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#221D23", color: "white", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800 }}>
            {initials}
          </div>
          <span style={{ fontSize: 13 }}>{profile?.full_name?.split(" ")[0] ?? profile?.email?.split("@")[0] ?? "Me"}</span>
        </div>
      </nav>
    </header>
  );
}
