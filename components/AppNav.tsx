"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { APP_FONT } from "@/lib/fonts";

export type AppPage = "workflows" | "ai-mastery" | "ai-fluency";

export const APP_NAV_FONT = APP_FONT;

export const APP_NAV_HEADER_STYLE: React.CSSProperties = {
  height: 68,
  position: "sticky",
  top: 0,
  zIndex: 100,
  background: "rgba(255,255,255,0.96)",
  borderBottom: "1px solid #E9E4DC",
  backdropFilter: "blur(18px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 36px",
  gap: 16,
  fontFamily: APP_NAV_FONT,
  letterSpacing: "normal",
};

export const APP_NAV_BRAND_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 900,
  fontSize: 15,
  letterSpacing: "-0.04em",
  color: "#221D23",
  textDecoration: "none",
  whiteSpace: "nowrap",
  fontFamily: APP_NAV_FONT,
};

export const APP_NAV_LINKS: { label: string; href: string; page: AppPage }[] = [
  { label: "Application", href: "/dashboard", page: "workflows" },
  { label: "Mastery", href: "/ai-mastery", page: "ai-mastery" },
  { label: "Fluency", href: "/ai-fluency", page: "ai-fluency" },
];

export function AppNavBrand() {
  return (
    <Link href="/dashboard" style={APP_NAV_BRAND_STYLE}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.png"
        alt=""
        width={32}
        height={32}
        style={{ borderRadius: 9, display: "block", flexShrink: 0 }}
      />
      <span>Nudgeable AI Work Studio</span>
    </Link>
  );
}

export function AppNavLinks({ activePage }: { activePage?: AppPage }) {
  return (
    <nav style={{ display: "flex", gap: 26, fontSize: 14, fontWeight: 700 }}>
      {APP_NAV_LINKS.map(({ label, href, page }) => {
        const active = activePage != null && page === activePage;
        return (
          <Link key={page} href={href} style={{
            color: active ? "#221D23" : "#746F78",
            textDecoration: "none",
            paddingBottom: 4,
            borderBottom: active ? "2.5px solid #FFCE00" : "2.5px solid transparent",
            transition: "color .15s",
          }}>{label}</Link>
        );
      })}
    </nav>
  );
}

type Props = {
  activePage: AppPage;
  userName?: string | null;
  isAdmin?: boolean;
};

export default function AppNav({ activePage, userName, isAdmin }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header style={APP_NAV_HEADER_STYLE}>
      <AppNavBrand />
      <AppNavLinks activePage={activePage} />

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {userName ? (
          <>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#746F78" }}>
              {userName.split(" ")[0]}
            </span>
            {isAdmin && (
              <Link href="/admin" style={{
                borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 900,
                background: "transparent", border: "1px solid #E9E4DC",
                color: "#221D23", textDecoration: "none",
              }}>Admin</Link>
            )}
            <button onClick={handleSignOut} style={{
              borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 900,
              background: "transparent", border: "1px solid #E9E4DC",
              color: "#221D23", cursor: "pointer",
            }}>Sign out</button>
          </>
        ) : (
          <>
            <Link href="/login" style={{
              borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 900,
              background: "transparent", border: "1px solid #E9E4DC",
              color: "#221D23", textDecoration: "none",
            }}>Sign in</Link>
            <Link href="/login" style={{
              borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 900,
              background: "#221D23", color: "#fff",
              border: "1px solid #221D23", textDecoration: "none",
            }}>Get started</Link>
          </>
        )}
      </div>
    </header>
  );
}
