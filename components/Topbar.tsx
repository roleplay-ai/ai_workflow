"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/supabase/types";
import { AppNavBrand, AppNavLinks, APP_NAV_HEADER_STYLE, type AppPage } from "@/components/AppNav";

type Props = {
  profile: (Profile & { companies?: { name: string } | null }) | null;
  role?: string;
  activePage?: AppPage;
  onSignOut?: () => void;
};

export default function Topbar({ profile, role, activePage, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (profile?.email ?? "?")[0].toUpperCase();

  const displayName = profile?.full_name?.split(" ")[0] ?? profile?.email?.split("@")[0] ?? "Me";
  const companyName = (profile?.companies as any)?.name ?? null;

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <header style={APP_NAV_HEADER_STYLE}>
      <AppNavBrand />
      <AppNavLinks activePage={activePage} />

      {/* Actions */}
      <nav style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: "auto" }}>
        {(role === "admin" || role === "superadmin") && (
          <Link href="/admin" style={{
            borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 900,
            background: "transparent", border: "1px solid #E9E4DC",
            color: "#221D23", textDecoration: "none",
          }}>Admin</Link>
        )}
        {role === "superadmin" && (
          <>
            <Link href="/superadmin" style={{
              borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 900,
              background: "transparent", border: "1px solid #E9E4DC",
              color: "#221D23", textDecoration: "none",
            }}>Superadmin</Link>
            <Link href="/superadmin/analytics" style={{
              borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 900,
              background: "rgba(255,206,0,.1)", border: "1px solid #FFCE00",
              color: "#221D23", textDecoration: "none",
            }}>Analytics</Link>
            <Link href="/superadmin/tool-logos" style={{
              borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 900,
              background: "transparent", border: "1px solid #E9E4DC",
              color: "#221D23", textDecoration: "none",
            }}>Tool logos</Link>
          </>
        )}

        {/* Profile pill + dropdown */}
        <div ref={ref} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "5px 10px 5px 5px", background: "white",
              border: "1px solid #E8E6DC", borderRadius: 999,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: "50%", background: "#221D23",
              color: "white", display: "grid", placeItems: "center",
              fontSize: 10, fontWeight: 800, flexShrink: 0,
            }}>
              {initials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#221D23" }}>{displayName}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B0ABA5" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: ".15s" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown */}
          {open && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              width: 220, background: "white", border: "1px solid #E8E6DC",
              borderRadius: 16, boxShadow: "0 8px 32px rgba(34,29,35,.12)",
              overflow: "hidden", zIndex: 100,
            }}>
              {/* Profile info */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #F0EEE8" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", background: "#221D23",
                    color: "white", display: "grid", placeItems: "center",
                    fontSize: 13, fontWeight: 800, flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: "#221D23" }}>
                      {profile?.full_name ?? displayName}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#B0ABA5", marginTop: 1 }}>
                      {profile?.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {/* Role badge */}
                  <span style={{
                    padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: role === "superadmin" ? "rgba(98,60,234,.1)" : role === "admin" ? "rgba(54,150,252,.1)" : "rgba(35,206,104,.1)",
                    color: role === "superadmin" ? "#5030C0" : role === "admin" ? "#1A7FD4" : "#17A855",
                  }}>
                    {role ?? "user"}
                  </span>
                  {/* Company badge */}
                  {companyName && (
                    <span style={{
                      padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: "#F0EEE8", color: "#6B6B6B",
                    }}>
                      {companyName}
                    </span>
                  )}
                </div>
              </div>

              {/* Sign out */}
              <button
                onClick={() => { setOpen(false); onSignOut?.(); }}
                style={{
                  width: "100%", padding: "12px 16px", border: 0, background: "none",
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: 13.5, fontWeight: 600, color: "#EF4444",
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#FFF5F5")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
