"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Activity, UserProgress, Profile, ToolDeepDive } from "@/lib/supabase/types";
import { resolveToolLogoUrl, type ToolLogoMap } from "@/lib/toolLogos";
import { deepDiveHref, deepDiveLabel } from "@/lib/deepDives";
import { formatToolLabel, normalizeActivityTools } from "@/lib/tools";
import RotatingTools from "@/components/RotatingTools";
import ActivityCard, { Scene, getTheme, timeLabel, type CardVariant } from "./ActivityCard";
import "./netflix-dashboard.css";

type Props = {
  profile: (Profile & { companies: { name: string } | null }) | null;
  activities: (Activity & { activity_content: { id: string } | null })[];
  progress: UserProgress[];
  toolLogos: ToolLogoMap;
  tagLogos: Record<string, string>;
  functionLogos: Record<string, string>;
  functionThumbnails: Record<string, string>;
  functionDescriptions: Record<string, string>;
  toolFilters: string[];
  deepDives: ToolDeepDive[];
  isLoggedIn: boolean;
};

// ── Colour helpers ────────────────────────────────────────────────────────

function toolColor(tool: string): string {
  if (tool === "claude")             return "#623CEA";
  if (tool === "chatgpt")            return "#23CE68";
  if (tool === "gemini")             return "#3696FC";
  if (tool === "copilot")            return "#F68A29";
  if (tool === "agentic-workflows")  return "#623CEA";
  return "#FFCE00";
}

function fnColor(fn: string): string {
  const f = fn.toLowerCase();
  if (f.includes("finance") || f.includes("account"))           return "#23CE68";
  if (f.includes("hr") || f.includes("human") || f.includes("people")) return "#ED4551";
  if (f.includes("legal") || f.includes("compliance"))          return "#623CEA";
  if (f.includes("market") || f.includes("sales") || f.includes("brand")) return "#F68A29";
  if (f.includes("support") || f.includes("customer"))          return "#3696FC";
  return "#746F78";
}


// ── SignUpCard modal ──────────────────────────────────────────────────────

function SignUpCard({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(34,29,35,0.72)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#221D23", color: "#F8F8F6", borderRadius: 24,
          padding: "48px 44px", maxWidth: 440, width: "90%", textAlign: "center",
          boxShadow: "0 40px 100px rgba(34,29,35,0.56)", position: "relative",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 20, background: "none",
            border: "none", color: "#746F78", cursor: "pointer", fontSize: 22, lineHeight: 1,
          }}
          aria-label="Close"
        >×</button>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 12, lineHeight: 1.3 }}>
          This workflow is locked
        </h2>
        <p style={{ color: "#A09AA6", marginBottom: 28, lineHeight: 1.65, fontSize: 15 }}>
          Sign in or create a free account to access this and every other guided workflow in the studio.
        </p>
        <Link
          href="/login"
          style={{
            display: "block", background: "#FFCE00", color: "#221D23",
            fontWeight: 800, padding: "14px 32px", borderRadius: 12,
            textDecoration: "none", marginBottom: 10, fontSize: 15,
          }}
        >
          Sign in
        </Link>
        <Link
          href="/login"
          style={{
            display: "block", background: "rgba(255,255,255,0.08)", color: "#F8F8F6",
            fontWeight: 700, padding: "14px 32px", borderRadius: 12,
            textDecoration: "none", marginBottom: 18, fontSize: 15,
            border: "1.5px solid rgba(255,255,255,0.12)",
          }}
        >
          Create a free account
        </Link>
        <button
          onClick={onClose}
          style={{
            background: "transparent", border: "none", color: "#746F78",
            cursor: "pointer", fontSize: 13, padding: "4px",
          }}
        >
          Continue browsing
        </button>
      </div>
    </div>
  );
}

// ── AllWorkflowsSection ───────────────────────────────────────────────────

const PAGE_SIZE = 10;

function AllWorkflowsSection({
  activities, selectedFunction, selectedTool, isLoggedIn, onSignUpRequired, toolLogos,
}: {
  activities: Activity[];
  selectedFunction: string | null;
  selectedTool: string | null;
  isLoggedIn: boolean;
  onSignUpRequired: () => void;
  toolLogos: ToolLogoMap;
}) {
  const [page, setPage] = useState(0);

  // Reset to first page when either filter changes
  useEffect(() => { setPage(0); }, [selectedFunction, selectedTool]);

  const filtered = useMemo(() => {
    let result = activities;
    if (selectedFunction) {
      result = result.filter(a =>
        (a.functions ?? []).some(f => f.toLowerCase() === selectedFunction.toLowerCase())
      );
    }
    if (selectedTool) {
      result = result.filter(a =>
        normalizeActivityTools(a.tools).some(t => t.toLowerCase() === selectedTool.toLowerCase())
      );
    }
    return result;
  }, [activities, selectedFunction, selectedTool]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Build title: "All [Function] [Tool] Workflows"
  const titleParts: string[] = ["All"];
  if (selectedFunction) titleParts.push(selectedFunction);
  if (selectedTool)     titleParts.push(formatToolLabel(selectedTool));
  titleParts.push("Workflows");
  const title = titleParts.join(" ");

  const activeFilters = [
    selectedFunction ?? null,
    selectedTool ? formatToolLabel(selectedTool) : null,
  ].filter(Boolean) as string[];
  const subtitle = `${filtered.length} workflow${filtered.length !== 1 ? "s" : ""}${activeFilters.length ? ` · ${activeFilters.join(" · ")}` : ""}`;

  if (filtered.length === 0) return (
    <section className="rail" id="all-workflows">
      <div className="rail-header">
        <div className="rail-title">
          <h2>{title}</h2>
          <p>No workflows found{activeFilters.length ? ` for "${activeFilters.join('" + "')}"` : ""}.</p>
        </div>
      </div>
    </section>
  );

  return (
    <div id="all-workflows">
      <HorizontalRail
        key={`${selectedFunction ?? "all"}-${selectedTool ?? "all"}-${page}`}
        label="Full library"
        title={title}
        subtitle={subtitle}
        activities={pageItems}
        isLoggedIn={isLoggedIn}
        onSignUpRequired={onSignUpRequired}
        toolLogos={toolLogos}
      />
      {totalPages > 1 && (
        <div className="pagination-row">
          <span className="page-info">Page {page + 1} of {totalPages}</span>
          <div className="page-btns">
            {page > 0 && (
              <button className="btn btn-ghost pagination-btn" onClick={() => setPage(p => p - 1)}>← Previous</button>
            )}
            {page < totalPages - 1 && (
              <button className="btn btn-ghost pagination-btn" onClick={() => setPage(p => p + 1)}>More workflows →</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── FunctionCard ──────────────────────────────────────────────────────────

function FunctionCard({
  name, count, description, thumbnail, icon, selected, color, onClick,
}: {
  name: string;
  count: number;
  description: string | null;
  thumbnail: string | null;
  icon: string | null;
  selected: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`fn-activity-card${thumbnail ? " has-thumbnail" : ""}${selected ? " selected" : ""}`}
      onClick={onClick}
      style={{ "--fn-color": color } as React.CSSProperties}
    >
      <div
        className={`fn-card-poster${thumbnail ? " has-thumbnail" : ""}`}
        style={thumbnail ? undefined : { background: `linear-gradient(145deg, ${color}28 0%, ${color}50 100%)` }}
      >
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="fn-card-thumb" />
        ) : icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="fn-card-icon-large" />
        ) : (
          <span className="fn-card-initials" style={{ color }}>{name.slice(0, 2).toUpperCase()}</span>
        )}
        {selected && (
          <div className="fn-card-check">✓</div>
        )}
        {/* Workflow count tag — top-right corner */}
        <div className="fn-count-tag" style={{ background: color }}>
          {count} workflow{count !== 1 ? "s" : ""}
        </div>
      </div>
      <div className="fn-card-body">
        <div className="fn-card-name">{name}</div>
        <div className="fn-card-count">
          <span className="fn-card-dot" style={{ background: color }} />
          {count} workflow{count !== 1 ? "s" : ""}
        </div>
        {description && (
          <p className="fn-card-desc">{description}</p>
        )}
      </div>
    </button>
  );
}

// ── FunctionsCarousel ─────────────────────────────────────────────────────

function FunctionsCarousel({
  activities, selectedFunction, onSelect, functionLogos, functionThumbnails, functionDescriptions,
}: {
  activities: Activity[];
  selectedFunction: string | null;
  onSelect: (fn: string | null) => void;
  functionLogos: Record<string, string>;
  functionThumbnails: Record<string, string>;
  functionDescriptions: Record<string, string>;
}) {
  const functions = useMemo(() => {
    const map = new Map<string, number>();
    activities.forEach(a => (a.functions ?? []).forEach(fn => {
      const k = fn.trim();
      if (k) map.set(k, (map.get(k) ?? 0) + 1);
    }));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [activities]);

  if (functions.length === 0) return null;

  return (
    <section className="rail functions-rail">
      <div className="rail-header">
        <div className="rail-title">
          <span className="section-label">Filter by role</span>
          <h2>Browse by function</h2>
          <p>Select a function to filter All Workflows above.</p>
        </div>
        {selectedFunction && (
          <button className="see-all" onClick={() => onSelect(null)}>Clear filter ✕</button>
        )}
      </div>
      <div className="fn-cards-row">
        {functions.map(([fn, count]) => {
          const key = fn.toLowerCase();
          return (
            <FunctionCard
              key={fn}
              name={fn}
              count={count}
              description={functionDescriptions?.[key] ?? null}
              thumbnail={functionThumbnails?.[key] ?? null}
              icon={functionLogos?.[key] ?? null}
              selected={selectedFunction === fn}
              color={fnColor(fn)}
              onClick={() => onSelect(selectedFunction === fn ? null : fn)}
            />
          );
        })}
      </div>
    </section>
  );
}

// ── HorizontalRail ────────────────────────────────────────────────────────

function HorizontalRail({
  title, subtitle, label, activities, isLoggedIn, onSignUpRequired, toolLogos, variant = "default",
}: {
  title: string;
  subtitle: string;
  label?: string;
  activities: Activity[];
  isLoggedIn: boolean;
  onSignUpRequired: () => void;
  toolLogos: ToolLogoMap;
  variant?: CardVariant;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const focusedIdxRef = useRef(0);
  const programmaticRef = useRef(false);
  const isPausedRef = useRef(false);
  const rowPadding = 54;

  function setFocused(i: number) {
    focusedIdxRef.current = i;
    setFocusedIdx(i);
  }

  function findLeadingCard(row: HTMLDivElement): number {
    const slots = Array.from(row.querySelectorAll<HTMLElement>(".rail-card-slot"));
    if (slots.length === 0) return 0;
    const anchor = row.scrollLeft + rowPadding;
    let best = 0;
    let bestDist = Infinity;
    slots.forEach((slot, i) => {
      const d = Math.abs(slot.offsetLeft - anchor);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  function scrollToIndex(index: number) {
    const row = rowRef.current;
    if (!row) return;
    // Prevent onScroll from overwriting focusedIdx during the smooth animation
    programmaticRef.current = true;
    setTimeout(() => { programmaticRef.current = false; }, 600);
    if (index === 0) {
      row.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      const slots = Array.from(row.querySelectorAll<HTMLElement>(".rail-card-slot"));
      const slot = slots[index];
      if (!slot) return;
      row.scrollTo({ left: Math.max(0, slot.offsetLeft - rowPadding), behavior: "smooth" });
    }
    setFocused(index);
  }

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollLeft = 0;
    setFocused(0);
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      if (programmaticRef.current) return;
      clearTimeout(t);
      t = setTimeout(() => setFocused(findLeadingCard(row)), 80);
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => { row.removeEventListener("scroll", onScroll); clearTimeout(t); };
  }, [activities]);

  useEffect(() => {
    if (activities.length <= 1) return;
    const id = setInterval(() => {
      if (isPausedRef.current) return;
      const next = (focusedIdxRef.current + 1) % activities.length;
      scrollToIndex(next);
    }, 3000);
    return () => clearInterval(id);
  }, [activities.length]);

  function scrollTo(dir: number) {
    const next = Math.min(activities.length - 1, Math.max(0, focusedIdxRef.current + dir));
    scrollToIndex(next);
  }

  if (activities.length === 0) return null;

  return (
    <section className="rail">
      <div className="rail-header">
        <div className="rail-title">
          {label && <span className={`section-label${variant === "yellow" ? " section-label--yellow" : ""}`}>{label}</span>}
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="see-all">View all →</span>
      </div>
      <div className="rail-window">
        <button className="row-arrow left" onClick={() => scrollTo(-1)}>‹</button>
        <div
          className="cards-row"
          ref={rowRef}
          onMouseLeave={() => { setHoveredIdx(null); isPausedRef.current = false; }}
        >
          {activities.map((a, i) => {
            const active = i === (hoveredIdx !== null ? hoveredIdx : focusedIdx);
            const borderActive   = variant === "dark" ? "rgba(255,255,255,0.28)" : variant === "yellow" ? "#D0A600" : "#D0C7BA";
            const borderInactive = variant === "dark" ? "rgba(255,255,255,0.07)" : variant === "yellow" ? "#E8B800" : "#E5E0D8";
            const style: React.CSSProperties = {
              borderColor: active ? borderActive : borderInactive,
            };
            return (
              <div
                key={a.id}
                className={`rail-card-slot${active ? " is-active" : ""}`}
                onMouseEnter={() => { setHoveredIdx(i); isPausedRef.current = true; }}
              >
                <ActivityCard activity={a} focusStyle={style} isLoggedIn={isLoggedIn} onSignUpRequired={onSignUpRequired} toolLogos={toolLogos} variant={variant} />
              </div>
            );
          })}
        </div>
        <button className="row-arrow right" onClick={() => scrollTo(1)}>›</button>
      </div>
    </section>
  );
}

// ── HeroSection ───────────────────────────────────────────────────────────

function HeroSection({
  heroActivities,
  allFunctions,
  heroToolOptions,
  onShowWorkflows,
  toolLogos,
}: {
  heroActivities: Activity[];
  allFunctions: string[];
  heroToolOptions: string[];
  onShowWorkflows: (tool: string, fn: string) => void;
  toolLogos: ToolLogoMap;
}) {
  const [activeIdx,    setActiveIdx]    = useState(0);
  const [heroTool,     setHeroTool]     = useState("");
  const [heroFunction, setHeroFunction] = useState("");
  const showcaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroActivities.length === 0) return;
    const id = setInterval(() => setActiveIdx(i => (i + 1) % heroActivities.length), 3000);
    return () => clearInterval(id);
  }, [heroActivities.length]);

  useEffect(() => {
    const sc = showcaseRef.current;
    if (!sc) return;
    const posters = sc.querySelectorAll<HTMLElement>(".hero-poster");
    const active  = posters[activeIdx];
    if (active) sc.scrollTo({ left: Math.max(0, active.offsetLeft - sc.offsetWidth * 0.08), behavior: "smooth" });
  }, [activeIdx]);

  return (
    <header className="hero-shell">
      <section className="hero">
        {/* Left column */}
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> Updated every week</div>
          <h1>Practical AI workflows for your daily work</h1>
          <p>Discover and run guided AI automations tailored to your tool stack and job function.</p>

          <div className="selector-row">
            <label className="select-wrap">
              <select value={heroTool} onChange={e => setHeroTool(e.target.value)}>
                <option value="">I use...</option>
                {heroToolOptions.map(t => (
                  <option key={t} value={t}>I use {formatToolLabel(t)}</option>
                ))}
              </select>
            </label>
            <label className="select-wrap">
              <select value={heroFunction} onChange={e => setHeroFunction(e.target.value)}>
                <option value="">I work in...</option>
                {allFunctions.map(fn => (
                  <option key={fn} value={fn}>I work in {fn}</option>
                ))}
              </select>
            </label>
            <button className="btn btn-dark" onClick={() => onShowWorkflows(heroTool, heroFunction)}>
              Show me workflows
            </button>
          </div>

          <div className="trust-line">Browse selected workflows. Use filters below to explore more.</div>

          <div className="hero-progress" aria-hidden="true">
            {heroActivities.map((_, i) => (
              <span key={i} className={i === activeIdx ? "active" : ""} onClick={() => setActiveIdx(i)} />
            ))}
          </div>
        </div>

        {/* Right column — carousel */}
        <div className="hero-showcase" ref={showcaseRef} aria-label="Featured workflows">
          {heroActivities.map((a, i) => {
            const theme = getTheme(a.id);
            const tools = normalizeActivityTools(a.tools);
            const chip  = timeLabel(a);
            const isActive = i === activeIdx;

            return (
              <article
                key={a.id}
                className="hero-poster"
                onClick={() => setActiveIdx(i)}
                style={{
                  flexBasis: isActive ? "56%" : "38%",
                  opacity:   isActive ? 1 : 0.48,
                  transform: isActive ? "scale(1)" : "scale(0.84)",
                  boxShadow: isActive ? "0 28px 55px rgba(34, 29, 35, 0.24)" : "0 16px 30px rgba(34, 29, 35, 0.08)",
                }}
              >
                <div className={`poster-visual ${theme.posterColor}${a.thumbnail_url ? " has-thumbnail" : ""}`}>
                  {a.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="card-thumbnail"
                      src={a.thumbnail_url}
                      alt={a.title}
                    />
                  ) : (
                    <Scene theme={theme} />
                  )}
                </div>
                <div className="poster-content">
                  <div className="poster-meta">
                    {tools.length > 0 && (
                      <RotatingTools
                        tools={tools}
                        toolLogos={toolLogos}
                        iconSize={14}
                        insetScale={0.9}
                        borderColor="#E5E0D8"
                        labelColor="#221D23"
                        labelSize={10}
                        chipStyle={{ padding: "6px 9px 6px 6px", fontWeight: 900 }}
                      />
                    )}
                    {chip && <span className="time-chip">{chip}</span>}
                  </div>
                  <h2>{a.title}</h2>
                  <p>{a.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </header>
  );
}

function toolInitials(tool: string): string {
  const words = formatToolLabel(tool).split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return formatToolLabel(tool).slice(0, 3);
}

// ── ToolsBand (from published deep dives) ────────────────────────────────

function ToolsBand({
  deepDives,
  toolLogos,
}: {
  deepDives: ToolDeepDive[];
  toolLogos: ToolLogoMap;
}) {
  if (deepDives.length === 0) return null;

  return (
    <section className="tools-band" id="tools">
      <div className="rail-header">
        <div className="rail-title">
          <h2>Know your tool</h2>
          <p>Deep dives on the AI tools behind these workflows.</p>
        </div>
      </div>
      <div className="tool-grid">
        {deepDives.map(item => {
          const slug = item.tool ?? "";
          const href = deepDiveHref(item);
          const isExternal = (item.link_type ?? "external") === "external";
          const color = slug ? toolColor(slug) : "#FFCE00";
          const logoUrl = slug ? resolveToolLogoUrl(slug, toolLogos) : null;
          const desc = item.description ?? deepDiveLabel(item, formatToolLabel);

          const inner = (
            <>
              <div>
                <div className="tool-logo" style={{ color }}>
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
                  ) : slug ? (
                    toolInitials(slug)
                  ) : (
                    "AI"
                  )}
                </div>
                <h3>{item.title}</h3>
                <p>{desc}</p>
              </div>
              <div className="tool-link">
                <span>Explore →</span>
              </div>
            </>
          );

          const cardStyle: React.CSSProperties = { textDecoration: "none", color: "inherit" };

          if (isExternal) {
            return (
              <a
                key={item.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="tool-card"
                style={cardStyle}
              >
                {inner}
              </a>
            );
          }

          return (
            <Link key={item.id} href={href} className="tool-card" style={cardStyle}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ── POVSection (static) ──────────────────────────────────────────────────

function POVSection() {
  return (
    <section className="pov" id="pov">
      <a className="pov-card" href="#" aria-label="Explore AI at Work: The Real Questions">
        <div className="pov-card-copy">
          <div className="pov-kicker">Thinking guide</div>
          <h2>AI at Work: The Real Questions</h2>
          <p>A clear guide to the messy questions behind AI adoption, automation, capability building, and work redesign.</p>
          <div className="pov-chip-row">
            <span>Adoption</span><span>Automation</span><span>Capability building</span>
            <span>Work redesign</span><span>Human judgment</span><span>Enterprise rollouts</span>
          </div>
          <div className="pov-cta">Explore the guide →</div>
        </div>
        <div className="pov-visual" aria-hidden="true">
          <div className="question-orbit">
            <span className="orbit-chip c1">Jobs</span>
            <span className="orbit-chip c2">Risk</span>
            <span className="orbit-chip c3">Agents</span>
            <span className="orbit-chip c4">Skills</span>
            <div className="center-note">
              <strong>AI</strong>
              <small>at work</small>
            </div>
          </div>
        </div>
      </a>
    </section>
  );
}

// ── DashboardClient ──────────────────────────────────────────────────────

export default function DashboardClient({ profile, activities, progress, toolFilters, deepDives, toolLogos, functionLogos, functionThumbnails, functionDescriptions, isLoggedIn }: Props) {
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedTool,     setSelectedTool]     = useState<string | null>(null);
  const [showSignUp, setShowSignUp]             = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // Unique functions (for HeroSection dropdowns)
  const allFunctions = useMemo(() => {
    const map = new Map<string, number>();
    activities.forEach(a => (a.functions ?? []).forEach(fn => {
      const k = fn.trim();
      if (k) map.set(k, (map.get(k) ?? 0) + 1);
    }));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  }, [activities]);

  // Hero carousel: superadmin-pinned slots first, fallback to is_featured then newest
  const heroActivities = useMemo(() => {
    // Prefer activities with explicit hero_position slots (1, 2, 3)
    const slotted = activities
      .filter(a => a.hero_position != null)
      .sort((a, b) => (a.hero_position ?? 99) - (b.hero_position ?? 99))
      .slice(0, 3);
    if (slotted.length > 0) return slotted;
    // Fallback: is_featured first, then newest
    const featured = activities.filter(a => a.is_featured);
    if (featured.length >= 3) return featured.slice(0, 3);
    const rest = activities
      .filter(a => !a.is_featured)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return [...featured, ...rest].slice(0, 3);
  }, [activities]);

  // Section 1: New
  const newActivities = useMemo(() => activities.filter(a => a.is_featured), [activities]);

  // Section 1b: Continue where you left off (in_progress for logged-in user)
  const pendingActivities = useMemo(() => {
    if (!isLoggedIn || progress.length === 0) return [];
    const ids = new Set(progress.filter(p => p.status === "in_progress").map(p => p.activity_id));
    return activities.filter(a => ids.has(a.id));
  }, [activities, progress, isLoggedIn]);

  // Section 2: AI Tools Mastery
  const masteryActivities = useMemo(() => activities.filter(a => a.is_mastery), [activities]);

  // Section last: Completed workflows (logged-in user)
  const completedActivities = useMemo(() => {
    if (!isLoggedIn || progress.length === 0) return [];
    const ids = new Set(progress.filter(p => p.status === "completed").map(p => p.activity_id));
    return activities.filter(a => ids.has(a.id));
  }, [activities, progress, isLoggedIn]);

  function handleShowWorkflows(tool: string, fn: string) {
    if (tool) setSelectedTool(tool);
    if (fn)   setSelectedFunction(fn);
    document.getElementById("all-workflows")?.scrollIntoView({ behavior: "smooth" });
  }

  const heroToolOptions = toolFilters.filter(t => t !== "all");
  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";

  return (
    <div className="ndb-root" style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", color: "#221D23" }}>

      {showSignUp && <SignUpCard onClose={() => setShowSignUp(false)} />}

      {/* ── Nav ── */}
      <nav className="nav">
        <Link className="brand" href="/dashboard">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-icon" src="/icon.png" alt="" width={32} height={32} />
          <span>Nudgeable AI Work Studio</span>
        </Link>
        <div className="nav-links">
          <a href="#workflows">Workflows</a>
          <a href="#tools">AI Tools</a>
          <a href="#pov">Our POV</a>
        </div>
        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              {profile?.full_name && (
                <span style={{ fontSize: 14, fontWeight: 700, color: "#746F78" }}>
                  {profile.full_name.split(" ")[0]}
                </span>
              )}
              {isAdmin && (
                <Link href="/admin" className="btn btn-ghost">Admin</Link>
              )}
              <button className="btn btn-ghost" onClick={handleSignOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Sign in</Link>
              <Link href="/login" className="btn btn-amber">Get started</Link>
            </>
          )}
          <button className="mobile-menu" aria-label="Open menu">☰</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <HeroSection
        heroActivities={heroActivities}
        allFunctions={allFunctions}
        heroToolOptions={heroToolOptions}
        onShowWorkflows={handleShowWorkflows}
        toolLogos={toolLogos}
      />

      {/* ── Content ── */}
      <main className="content">

        {/* Section 1: New — dark cards */}
        {newActivities.length > 0 && (
          <HorizontalRail
            label="New this week"
            title="Newly added workflows this week"
            subtitle="Fresh workflows added for this week's practice."
            activities={newActivities}
            variant="dark"
            isLoggedIn={isLoggedIn}
            onSignUpRequired={() => setShowSignUp(true)}
            toolLogos={toolLogos}
          />
        )}

        {/* Section 1b: Continue where you left off (in_progress, logged-in only) */}
        {isLoggedIn && pendingActivities.length > 0 && (
          <HorizontalRail
            label="In progress"
            title="Continue where you left off"
            subtitle={`You have ${pendingActivities.length} workflow${pendingActivities.length !== 1 ? "s" : ""} in progress.`}
            activities={pendingActivities}
            isLoggedIn={isLoggedIn}
            onSignUpRequired={() => setShowSignUp(true)}
            toolLogos={toolLogos}
          />
        )}

        {/* Section 2: AI Mastery — yellow cards */}
        {masteryActivities.length > 0 && (
          <HorizontalRail
            label="Core practice"
            title="AI Mastery"
            subtitle="Core workflows for improving AI fluency and everyday practice."
            activities={masteryActivities}
            variant="yellow"
            isLoggedIn={isLoggedIn}
            onSignUpRequired={() => setShowSignUp(true)}
            toolLogos={toolLogos}
          />
        )}

        {/* Section 3: All Workflows (paginated, filtered by function + tool) */}
        <AllWorkflowsSection
          activities={activities}
          selectedFunction={selectedFunction}
          selectedTool={selectedTool}
          isLoggedIn={isLoggedIn}
          onSignUpRequired={() => setShowSignUp(true)}
          toolLogos={toolLogos}
        />

        {/* Section 4: Functions carousel (filters section 3) */}
        <FunctionsCarousel
          activities={activities}
          selectedFunction={selectedFunction}
          onSelect={fn => setSelectedFunction(fn)}
          functionLogos={functionLogos}
          functionThumbnails={functionThumbnails}
          functionDescriptions={functionDescriptions}
        />

        {/* Section last: Completed Workflows (logged-in only) */}
        {isLoggedIn && completedActivities.length > 0 && (
          <HorizontalRail
            label="Done"
            title="Completed Workflows"
            subtitle={`${completedActivities.length} workflow${completedActivities.length !== 1 ? "s" : ""} you've finished — revisit anytime.`}
            activities={completedActivities}
            isLoggedIn={isLoggedIn}
            onSignUpRequired={() => setShowSignUp(true)}
            toolLogos={toolLogos}
          />
        )}

        <ToolsBand deepDives={deepDives} toolLogos={toolLogos} />
        <POVSection />
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        {isLoggedIn ? (
          <>
            <h2>You&apos;re all set. Keep exploring.</h2>
            <p>New guided workflows are added every week. Check back for what&apos;s fresh.</p>
          </>
        ) : (
          <>
            <h2>Sign up free. Unlock every workflow.</h2>
            <p>Get access to every workflow, tool guide, and AI mastery tip in the studio.</p>
            <Link href="/login" className="btn btn-amber">Get started</Link>
          </>
        )}
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
