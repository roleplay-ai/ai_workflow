"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { APP_FONT } from "@/lib/fonts";
import styles from "./AppNav.module.css";

export type AppPage = "apply" | "learn" | "know";

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
  textDecoration: "none",
  whiteSpace: "nowrap",
  fontFamily: APP_NAV_FONT,
};

export const APP_NAV_LINKS: { label: string; href: string; page: AppPage }[] = [
  { label: "Apply", href: "/apply", page: "apply" },
  { label: "Learn", href: "/learn", page: "learn" },
  { label: "Know", href: "/know", page: "know" },
];

export function AppNavBrand() {
  return (
    <Link href="/apply" style={APP_NAV_BRAND_STYLE}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Nudgeable-black.png"
        alt="Nudgeable"
        style={{ display: "block", flexShrink: 0, height: 40, width: "auto" }}
      />
      <span style={{
        fontWeight: 400,
        fontSize: 15,
        letterSpacing: "-0.02em",
        color: "#221D23",
      }}>Practice Lab</span>
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
  isLoggedIn?: boolean;
};

export default function AppNav({ activePage, userName, isAdmin, isLoggedIn }: Props) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/apply");
    router.refresh();
  }

  const showSignedIn = isLoggedIn ?? !!userName;

  return (
    <>
      <header className={styles.header} style={APP_NAV_HEADER_STYLE}>
        <AppNavBrand />
        <div className={styles.desktopOnly}>
          <AppNavLinks activePage={activePage} />
        </div>

        {/* Desktop actions */}
        <div className={styles.desktopOnly} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {showSignedIn ? (
            <>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#746F78" }}>
                {userName?.split(" ")[0]}
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
            <Link href="/login" style={{
              borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 900,
              background: "#221D23", color: "#fff",
              border: "1px solid #221D23", textDecoration: "none",
            }}>Sign in</Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(v => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          )}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className={styles.mobileOverlay}>
          <div className={styles.mobileBackdrop} onClick={() => setMobileOpen(false)} />
          <div className={styles.mobilePanel}>
            {APP_NAV_LINKS.map(({ label, href, page }) => (
              <Link
                key={page}
                href={href}
                className={activePage === page ? styles.mobileNavLinkActive : styles.mobileNavLink}
                onClick={() => setMobileOpen(false)}
              >{label}</Link>
            ))}
            <div className={styles.mobileActions}>
              {showSignedIn ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" className={styles.mobileActionBtn} onClick={() => setMobileOpen(false)}>Admin</Link>
                  )}
                  <button onClick={() => { setMobileOpen(false); handleSignOut(); }} className={styles.mobileActionBtn}>Sign out</button>
                </>
              ) : (
                <Link href="/login" className={styles.mobileActionBtnPrimary} onClick={() => setMobileOpen(false)}>Sign in</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
