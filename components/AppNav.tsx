"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { AI_UPDATES_PAGE_NAME, WORKFLOWS_PAGE_NAME } from "@/lib/site";
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
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
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
  { label: WORKFLOWS_PAGE_NAME, href: "/apply", page: "apply" },
  { label: "Learn", href: "/learn", page: "learn" },
  { label: AI_UPDATES_PAGE_NAME, href: "/know", page: "know" },
];

export function AppNavBrand() {
  return (
    <Link href="/apply" className={styles.brand} style={APP_NAV_BRAND_STYLE}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Nudgeable-black.png"
        alt="Nudgeable"
        className={styles.brandLogo}
      />
      <span className={styles.brandText}>AI Practice Lab</span>
    </Link>
  );
}

export function AppNavLinks({ activePage }: { activePage?: AppPage }) {
  return (
    <nav className={styles.navTrack} aria-label="Main navigation">
      {APP_NAV_LINKS.map(({ label, href, page }) => {
        const active = activePage != null && page === activePage;
        return (
          <Link
            key={page}
            href={href}
            className={active ? styles.navLinkActive : styles.navLink}
          >
            {label}
          </Link>
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
      <header className={styles.header} style={{ fontFamily: APP_NAV_FONT }}>
        <AppNavBrand />

        <div className={styles.navWrap}>
          <AppNavLinks activePage={activePage} />
        </div>

        <div className={styles.actions}>
          {showSignedIn ? (
            <>
              <span className={styles.userName}>{userName?.split(" ")[0]}</span>
              {isAdmin && (
                <Link href="/admin" className={styles.btnOutline}>Admin</Link>
              )}
              <button type="button" onClick={handleSignOut} className={styles.btnOutline}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.btnPrimary}>Sign in</Link>
          )}
        </div>

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

      {mobileOpen && (
        <div className={styles.mobileOverlay}>
          <div className={styles.mobileBackdrop} onClick={() => setMobileOpen(false)} />
          <div className={styles.mobilePanel}>
            <div className={styles.mobileNavTrack}>
              {APP_NAV_LINKS.map(({ label, href, page }) => (
                <Link
                  key={page}
                  href={href}
                  className={activePage === page ? styles.mobileNavLinkActive : styles.mobileNavLink}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className={styles.mobileActions}>
              {showSignedIn ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" className={styles.mobileActionBtn} onClick={() => setMobileOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); handleSignOut(); }}
                    className={styles.mobileActionBtn}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/login" className={styles.mobileActionBtnPrimary} onClick={() => setMobileOpen(false)}>
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
