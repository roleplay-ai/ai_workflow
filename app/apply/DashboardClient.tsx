"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import type { Activity, UserProgress, Profile } from "@/lib/supabase/types";
import { resolveToolLogoUrl, type ToolLogoMap } from "@/lib/toolLogos";
import { formatToolLabel, normalizeActivityTools } from "@/lib/tools";
import ToolIcon from "@/components/ToolIcon";
import AppNav from "@/components/AppNav";
import SiteFooter from "@/components/SiteFooter";
import BriefNewsCard from "@/components/BriefNewsCard";
import { APP_FONT } from "@/lib/fonts";
import ActivityCard, { type CardVariant } from "./ActivityCard";
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
  isLoggedIn: boolean;
  masteryProgressCount: number;
  brief: Brief | null;
  viewCounts: Record<string, number>;
};

type BriefItem = { id: string; content: string; sort_order: number };
type Brief = { id: string; title: string; published_date: string; fluency_brief_items: BriefItem[] };

// ── Colour helpers ────────────────────────────────────────────────────────

function toolColor(tool: string): string {
  if (tool === "claude") return "#623CEA";
  if (tool === "chatgpt") return "#23CE68";
  if (tool === "gemini") return "#3696FC";
  if (tool === "copilot") return "#F68A29";
  if (tool === "agentic-workflows") return "#623CEA";
  return "#FFCE00";
}

function fnColor(fn: string): string {
  const f = fn.toLowerCase();
  if (f.includes("finance") || f.includes("account")) return "#23CE68";
  if (f.includes("hr") || f.includes("human") || f.includes("people")) return "#ED4551";
  if (f.includes("legal") || f.includes("compliance")) return "#623CEA";
  if (f.includes("market") || f.includes("sales") || f.includes("brand")) return "#F68A29";
  if (f.includes("support") || f.includes("customer")) return "#3696FC";
  return "#746F78";
}

function filterActivitiesBySelection(
  activities: Activity[],
  selectedFunction: string | null,
  selectedTool: string | null,
  searchQuery = "",
): Activity[] {
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
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    result = result.filter(a => {
      const title = a.title.toLowerCase();
      const desc = (a.description ?? "").toLowerCase();
      const tools = normalizeActivityTools(a.tools).map(t => formatToolLabel(t).toLowerCase()).join(" ");
      const fns = (a.functions ?? []).join(" ").toLowerCase();
      return title.includes(q) || desc.includes(q) || tools.includes(q) || fns.includes(q);
    });
  }
  return result;
}


// ── ToolFilterDropdown ───────────────────────────────────────────────────

function ToolFilterDropdown({
  tools,
  selected,
  onChange,
  toolLogos,
}: {
  tools: string[];
  selected: string | null;
  onChange: (tool: string | null) => void;
  toolLogos: ToolLogoMap;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const displayLabel = selected ? formatToolLabel(selected) : "All Tools";

  return (
    <div className="tool-dropdown" ref={ref}>
      <button
        type="button"
        className={`tool-dropdown-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selected ? (
          <ToolIcon tool={selected} size={20} logos={toolLogos} insetScale={0.88} />
        ) : (
          <span className="tool-dropdown-all-icon">⚙</span>
        )}
        <span>{displayLabel}</span>
        <span className={`tool-dropdown-chevron${open ? " flipped" : ""}`}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </button>
      {open && (
        <div className="tool-dropdown-menu" role="listbox">
          <button
            className={`tool-dropdown-item${!selected ? " is-selected" : ""}`}
            onClick={() => { onChange(null); setOpen(false); }}
            role="option"
            aria-selected={!selected}
          >
            <span className="tool-dropdown-item-icon">⚙</span>
            <span>All Tools</span>
            {!selected && <span className="tool-dropdown-check">✓</span>}
          </button>
          {tools.filter(t => t !== "all").map(t => {
            const isActive = selected === t;
            return (
              <button
                key={t}
                className={`tool-dropdown-item${isActive ? " is-selected" : ""}`}
                onClick={() => { onChange(isActive ? null : t); setOpen(false); }}
                role="option"
                aria-selected={isActive}
              >
                <ToolIcon tool={t} size={22} logos={toolLogos} insetScale={0.88} />
                <span>{formatToolLabel(t)}</span>
                {isActive && <span className="tool-dropdown-check">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Grid column count hook ────────────────────────────────────────────────

function useGridColumns(): number {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setCols(w <= 680 ? 2 : w <= 900 ? 2 : w <= 1120 ? 3 : w < 1680 ? 4 : 5);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
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

function AllWorkflowsSection({
  activities, selectedFunction, selectedTool, searchQuery, isLoggedIn, onSignUpRequired, toolLogos, tagLogos, viewCounts,
}: {
  activities: Activity[];
  selectedFunction: string | null;
  selectedTool: string | null;
  searchQuery: string;
  isLoggedIn: boolean;
  onSignUpRequired: () => void;
  toolLogos: ToolLogoMap;
  tagLogos: Record<string, string>;
  viewCounts: Record<string, number>;
}) {
  const cols = useGridColumns();
  const [extraRows, setExtraRows] = useState(0);

  useEffect(() => { setExtraRows(0); }, [selectedFunction, selectedTool, searchQuery]);

  const filtered = useMemo(
    () => filterActivitiesBySelection(activities, selectedFunction, selectedTool, searchQuery),
    [activities, selectedFunction, selectedTool, searchQuery],
  );

  const visibleCount = cols * (2 + extraRows);
  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const titleParts: string[] = ["All"];
  if (selectedFunction) titleParts.push(selectedFunction);
  if (selectedTool) titleParts.push(formatToolLabel(selectedTool));
  titleParts.push("Workflows");
  const title = titleParts.join(" ");

  const activeFilters = [
    searchQuery ? `"${searchQuery}"` : null,
    selectedFunction ?? null,
    selectedTool ? formatToolLabel(selectedTool) : null,
  ].filter(Boolean) as string[];

  const description = activeFilters.length
    ? `Showing ${filtered.length} workflow${filtered.length !== 1 ? "s" : ""} for ${activeFilters.join(" · ")}.`
    : "Browse every guided workflow in the library. Filter by tool or function to find what fits your work.";

  if (filtered.length === 0) return (
    <section className="rail" id="all-workflows">
      <div className="rail-header">
        <div className="rail-title">
          <span className="section-label">Full library</span>
          <h2>{title}</h2>
          <p>Oops no workflow found, try using some other filter</p>
        </div>
      </div>
    </section>
  );

  return (
    <section className="rail" id="all-workflows">
      <div className="rail-header">
        <div className="rail-title">
          <span className="section-label">Full library</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="static-grid">
        {visibleItems.map(a => (
          <div key={a.id} className="static-grid-slot">
            <ActivityCard
              activity={a}
              isLoggedIn={isLoggedIn}
              onSignUpRequired={onSignUpRequired}
              toolLogos={toolLogos}
              tagLogos={tagLogos}
              viewCount={viewCounts[a.id] ?? 0}
              selectedTool={selectedTool}
            />
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="static-grid-more">
          <button className="view-more-link" onClick={() => setExtraRows(r => r + 1)}>
            View more
          </button>
        </div>
      )}
    </section>
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
  const rowRef = useRef<HTMLDivElement>(null);

  const functions = useMemo(() => {
    const map = new Map<string, number>();
    activities.forEach(a => (a.functions ?? []).forEach(fn => {
      const k = fn.trim();
      if (k) map.set(k, (map.get(k) ?? 0) + 1);
    }));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [activities]);

  if (functions.length === 0) return null;

  function scrollFn(dir: number) {
    rowRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  }

  return (
    <section className="rail functions-rail">
      <div className="rail-header">
        <div className="rail-title">
          <span className="section-label">Workflow types</span>
          <h2>Browse by Outcome</h2>
          <p>Or browse by outcome below.</p>
        </div>
        {selectedFunction && (
          <button className="see-all" onClick={() => onSelect(null)}>Clear filter ✕</button>
        )}
      </div>
      <div className="fn-rail-wrap">
        <button className="fn-arrow-btn" onClick={() => scrollFn(-1)}>‹</button>
        <div className="fn-cards-row" ref={rowRef}>
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
        <button className="fn-arrow-btn" onClick={() => scrollFn(1)}>›</button>
      </div>
    </section>
  );
}

// ── HorizontalRail ────────────────────────────────────────────────────────

function HorizontalRail({
  title, subtitle, label, activities, isLoggedIn, onSignUpRequired, toolLogos, tagLogos, variant = "default", viewCounts = {}, onLoadMore, selectedTool = null,
}: {
  title: string;
  subtitle: string;
  label?: string;
  activities: Activity[];
  isLoggedIn: boolean;
  onSignUpRequired: () => void;
  toolLogos: ToolLogoMap;
  tagLogos: Record<string, string>;
  variant?: CardVariant;
  viewCounts?: Record<string, number>;
  onLoadMore?: () => void;
  selectedTool?: string | null;
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

  // Only reset scroll on mount; load-more appends items without resetting position
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const last = activities.length - 1;
    const cur = focusedIdxRef.current;
    if (dir > 0 && cur >= last) {
      onLoadMore?.();
      return;
    }
    const next = Math.min(last, Math.max(0, cur + dir));
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
            const borderActive = variant === "dark" ? "rgba(255,255,255,0.28)" : variant === "yellow" ? "#D0A600" : "#D0C7BA";
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
                <ActivityCard activity={a} focusStyle={style} isLoggedIn={isLoggedIn} onSignUpRequired={onSignUpRequired} toolLogos={toolLogos} tagLogos={tagLogos} variant={variant} viewCount={viewCounts[a.id] ?? 0} selectedTool={selectedTool} />
              </div>
            );
          })}
        </div>
        <button className="row-arrow right" onClick={() => scrollTo(1)}>›</button>
      </div>
    </section>
  );
}

// ── StaticGrid (replaces HorizontalRail for static card grid) ────────────

function StaticGrid({
  title, subtitle, label, activities, isLoggedIn, onSignUpRequired, toolLogos, tagLogos, variant = "default", viewCounts = {}, selectedTool = null,
}: {
  title: string;
  subtitle: string;
  label?: string;
  activities: Activity[];
  isLoggedIn: boolean;
  onSignUpRequired: () => void;
  toolLogos: ToolLogoMap;
  tagLogos: Record<string, string>;
  variant?: CardVariant;
  viewCounts?: Record<string, number>;
  selectedTool?: string | null;
}) {
  const cols = useGridColumns();
  const [extraRows, setExtraRows] = useState(0);
  const visibleCount = cols * (2 + extraRows);
  const visibleItems = activities.slice(0, visibleCount);
  const hasMore = visibleCount < activities.length;

  if (activities.length === 0) return null;

  return (
    <section className="rail">
      <div className="rail-header">
        <div className="rail-title">
          {label && <span className={`section-label${variant === "yellow" ? " section-label--yellow" : ""}`}>{label}</span>}
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="static-grid">
        {visibleItems.map(a => (
          <div key={a.id} className="static-grid-slot">
            <ActivityCard
              activity={a}
              isLoggedIn={isLoggedIn}
              onSignUpRequired={onSignUpRequired}
              toolLogos={toolLogos}
              tagLogos={tagLogos}
              variant={variant}
              viewCount={viewCounts[a.id] ?? 0}
              selectedTool={selectedTool}
            />
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="static-grid-more">
          <button className="view-more-link" onClick={() => setExtraRows(r => r + 1)}>
            View more
          </button>
        </div>
      )}
    </section>
  );
}

// ── Hero filter chip ──────────────────────────────────────────────────────

function HeroExpandChip({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`hero-filter-chip${selected ? " is-active" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
      title={label}
    >
      <span className="hero-filter-chip-icon">{icon}</span>
      <span className="hero-filter-chip-label">{label}</span>
    </button>
  );
}

// ── HeroSection ───────────────────────────────────────────────────────────

function HeroSection({
  heroActivities,
  allFunctions,
  heroToolOptions,
  selectedTool,
  selectedFunction,
  searchQuery,
  onToolChange,
  onFunctionChange,
  onSearch,
  toolLogos,
  functionLogos,
  tagLogos,
  isLoggedIn,
  onSignUpRequired,
  viewCounts,
}: {
  heroActivities: Activity[];
  allFunctions: string[];
  heroToolOptions: string[];
  selectedTool: string | null;
  selectedFunction: string | null;
  searchQuery: string;
  onToolChange: (tool: string | null) => void;
  onFunctionChange: (fn: string | null) => void;
  onSearch: (query: string) => void;
  toolLogos: ToolLogoMap;
  functionLogos: Record<string, string>;
  tagLogos: Record<string, string>;
  isLoggedIn: boolean;
  onSignUpRequired: () => void;
  viewCounts: Record<string, number>;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const showcaseRef = useRef<HTMLDivElement>(null);

  const toolOptions = useMemo(
    () => heroToolOptions.filter(t => t !== "all"),
    [heroToolOptions],
  );

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (heroActivities.length === 0) return;
    const id = setInterval(() => setActiveIdx(i => (i + 1) % heroActivities.length), 3000);
    return () => clearInterval(id);
  }, [heroActivities.length]);

  useEffect(() => {
    const sc = showcaseRef.current;
    if (!sc) return;
    const slots = sc.querySelectorAll<HTMLElement>(".hero-card-slot");
    const active = slots[activeIdx];
    if (active) sc.scrollTo({ left: Math.max(0, active.offsetLeft - sc.offsetWidth * 0.08), behavior: "smooth" });
  }, [activeIdx]);

  function submitSearch() {
    onSearch(searchInput.trim());
  }

  return (
    <header className="hero-shell">
      <section className="hero">
        {/* Left column */}
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Updated every week</div>
          <h1>Practical AI workflows for your daily work</h1>
          <p>Discover and run guided AI automations tailored to your tool stack and job function.</p>

          <div className="hero-search-row">
            <input
              type="search"
              className="hero-search-input"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submitSearch(); }}
              placeholder="Search workflows…"
              aria-label="Search workflows"
            />
            <button type="button" className="btn btn-dark hero-search-btn" onClick={submitSearch}>
              Search
            </button>
          </div>

          {toolOptions.length > 0 && (
            <div className="hero-filter-block">
              <span className="hero-filter-label">Tools</span>
              <div className="hero-filter-chips">
                {toolOptions.map(tool => (
                  <HeroExpandChip
                    key={tool}
                    label={formatToolLabel(tool)}
                    selected={selectedTool === tool}
                    onClick={() => onToolChange(selectedTool === tool ? null : tool)}
                    icon={<ToolIcon tool={tool} size={28} logos={toolLogos} insetScale={0.88} />}
                  />
                ))}
              </div>
            </div>
          )}

          {/* {allFunctions.length > 0 && (
            <div className="hero-filter-block">
              <span className="hero-filter-label">Functions</span>
              <div className="hero-filter-chips">
                {allFunctions.map(fn => {
                  const logo = functionLogos[fn.toLowerCase()];
                  return (
                    <HeroExpandChip
                      key={fn}
                      label={fn}
                      selected={selectedFunction === fn}
                      onClick={() => onFunctionChange(selectedFunction === fn ? null : fn)}
                      icon={logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logo} alt="" className="hero-filter-fn-img" />
                      ) : (
                        <span className="hero-filter-fn-fallback" style={{ background: fnColor(fn) }}>
                          {fn.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    />
                  );
                })}
              </div>
            </div>
          )} */}

          <div className="trust-line">Tap a tool to filter instantly. Search to narrow the library below.</div>

          <div className="hero-progress" aria-hidden="true">
            {heroActivities.map((_, i) => (
              <span key={i} className={i === activeIdx ? "active" : ""} onClick={() => setActiveIdx(i)} />
            ))}
          </div>
        </div>

        {/* Right column — carousel */}
        <div className="hero-showcase" ref={showcaseRef} aria-label="Featured workflows">
          {heroActivities.map((a, i) => {
            const isActive = i === activeIdx;

            return (
              <div
                key={a.id}
                className={`hero-card-slot${isActive ? " is-active" : ""}`}
                style={{
                  flexBasis: isActive ? "50%" : "34%",
                  opacity: isActive ? 1 : 0.48,
                  transform: isActive ? "scale(1)" : "scale(0.88)",
                }}
              >
                <ActivityCard
                  activity={a}
                  variant="dark"
                  renderAs={isActive ? "link" : "div"}
                  onPress={!isActive ? () => setActiveIdx(i) : undefined}
                  isLoggedIn={isLoggedIn}
                  onSignUpRequired={onSignUpRequired}
                  toolLogos={toolLogos}
                  tagLogos={tagLogos}
                  viewCount={viewCounts[a.id] ?? 0}
                />
              </div>
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

// ── Featured promo cards ────────────────────────────────────────────────────

const TOTAL_COURSE_MODULES = 30;

function NewsBriefCard({ brief }: { brief: Brief }) {
  return (
    <section className="brief-card-section">
      <div className="rail-header" style={{ marginBottom: 30 }}>
        <div className="rail-title">
          <span className="section-label">Updated every week</span>
          <h2>Stay current with AI</h2>
          <p>Latest AI news, tools, videos, and practical updates, curated for people using AI at work.</p>
        </div>
      </div>
      <Link href="/know" className="brief-news-card-link">
        <BriefNewsCard items={brief.fluency_brief_items} />
      </Link>
    </section>
  );
}

function AIMasteryCourseSection({ completedCount, isLoggedIn }: { completedCount: number; isLoggedIn: boolean }) {
  const pct = Math.round((completedCount / TOTAL_COURSE_MODULES) * 100);
  const started = completedCount > 0;
  const done = completedCount >= TOTAL_COURSE_MODULES;
  const href = isLoggedIn ? "/learn" : "/login";

  return (
    <section className="mastery-course-section" id="ai-mastery-course">
      <div className="rail-header" style={{ marginBottom: 16 }}>
        <div className="rail-title">
          <span className="section-label">Featured course</span>
          <h2>AI Mastery Course</h2>
          <p>Go from AI basics to advanced workflows — 10 parts, 30 modules.</p>
        </div>
      </div>
      <Link href={href} className="mastery-course-card">
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="mastery-course-label">AI Mastery Course</div>
          <h2 className="mastery-course-title">From AI Basics to Advanced Workflows</h2>
          <p className="mastery-course-desc">
            10 parts · 30 modules · Everything from LLM fundamentals to building agents, vibe-coding, and AI safety.
          </p>
          {isLoggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="mastery-course-progress-track">
                <div className="mastery-course-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="mastery-course-progress-text">
                {completedCount}/{TOTAL_COURSE_MODULES} {done ? "Complete ✓" : started ? "modules done" : "modules"}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 13, color: "rgba(34,29,35,0.62)" }}>Sign in to track your progress</span>
          )}
        </div>
        <span className="mastery-course-cta">
          {!isLoggedIn ? "Sign in to start →" : done ? "Review course" : started ? "Continue learning →" : "Start course →"}
        </span>
      </Link>
    </section>
  );
}

// ── DashboardClient ──────────────────────────────────────────────────────

export default function DashboardClient({ profile, activities, progress, toolFilters, toolLogos, tagLogos, functionLogos, functionThumbnails, functionDescriptions, isLoggedIn, masteryProgressCount, brief, viewCounts }: Props) {
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSignUp, setShowSignUp] = useState(false);

  const selectedFunction = selectedTab.startsWith("fn-") ? selectedTab.slice(3) : null;

  const allFunctions = useMemo(() => {
    const map = new Map<string, number>();
    activities.forEach(a => (a.functions ?? []).forEach(fn => {
      const k = fn.trim();
      if (k) map.set(k, (map.get(k) ?? 0) + 1);
    }));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  }, [activities]);

  const heroActivities = useMemo(() => {
    const slotted = activities
      .filter(a => a.hero_position != null)
      .sort((a, b) => (a.hero_position ?? 99) - (b.hero_position ?? 99))
      .slice(0, 3);
    if (slotted.length > 0) return slotted;
    const featured = activities.filter(a => a.is_featured);
    if (featured.length >= 3) return featured.slice(0, 3);
    const rest = activities
      .filter(a => !a.is_featured)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return [...featured, ...rest].slice(0, 3);
  }, [activities]);

  const pendingActivities = useMemo(() => {
    if (!isLoggedIn || progress.length === 0) return [];
    const ids = new Set(progress.filter(p => p.status === "in_progress").map(p => p.activity_id));
    return activities.filter(a => ids.has(a.id));
  }, [activities, progress, isLoggedIn]);

  type TabDef = { id: string; label: string; icon: string; logo?: string; variant: CardVariant; sectionLabel: string; title: string; subtitle: string };

  const tabs = useMemo<TabDef[]>(() => {
    const t: TabDef[] = [];
    t.push({
      id: "all", label: "All Workflows", icon: "📋", variant: "default",
      sectionLabel: "Practice Path",
      title: "All Workflows",
      subtitle: "Browse every guided workflow in the library. Use filters to narrow results.",
    });
    t.push({
      id: "new", label: "New", icon: "🔥", variant: "default",
      sectionLabel: "Practice Path",
      title: "Newly added workflows this week",
      subtitle: "Fresh workflows added for this week's practice.",
    });

    t.push({
      id: "essentials", label: "Start Here", icon: "🤖", variant: "default",
      sectionLabel: "Practice Path",
      title: "Chatbot Essentials",
      subtitle: "Core workflows for improving AI fluency and everyday practice.",
    });
    allFunctions.forEach(fn => {
      const count = activities.filter(a => (a.functions ?? []).some(f => f.toLowerCase() === fn.toLowerCase())).length;
      const logo = functionLogos[fn.toLowerCase()];
      t.push({
        id: `fn-${fn}`, label: fn, icon: "⚡", logo, variant: "default",
        sectionLabel: "Practice Path",
        title: `${fn} workflows`,
        subtitle: `${count} workflow${count !== 1 ? "s" : ""} for ${fn}.`,
      });
    });
    if (isLoggedIn && pendingActivities.length > 0) {
      t.push({
        id: "continue", label: "Continue", icon: "⏩", variant: "default",
        sectionLabel: "Practice Path",
        title: "Continue where you left off",
        subtitle: `You have ${pendingActivities.length} workflow${pendingActivities.length !== 1 ? "s" : ""} in progress.`,
      });
    }
    return t;
  }, [activities, allFunctions, isLoggedIn, pendingActivities, functionLogos]);

  const activeTab = tabs.find(t => t.id === selectedTab) ?? tabs[0];

  const tabActivities = useMemo(() => {
    let base: Activity[];
    const id = activeTab?.id ?? "new";
    if (id === "new") {
      base = activities.filter(a => a.is_featured);
    } else if (id === "continue") {
      base = pendingActivities;
    } else if (id === "essentials") {
      base = activities.filter(a => a.is_mastery);
    } else if (id.startsWith("fn-")) {
      const fn = id.slice(3);
      base = activities.filter(a => (a.functions ?? []).some(f => f.toLowerCase() === fn.toLowerCase()));
    } else {
      base = activities;
    }
    return filterActivitiesBySelection(base, null, selectedTool, searchQuery);
  }, [activeTab, activities, pendingActivities, selectedTool, searchQuery]);

  const cols = useGridColumns();
  const [extraRows, setExtraRows] = useState(0);
  useEffect(() => { setExtraRows(0); }, [selectedTab, selectedTool, searchQuery]);

  const visibleCount = cols * (2 + extraRows);
  const visibleItems = tabActivities.slice(0, visibleCount);
  const hasMore = visibleCount < tabActivities.length;

  function handleSearch(query: string) {
    setSearchQuery(query);
  }

  function handleFunctionChange(fn: string | null) {
    setSelectedTab(fn ? `fn-${fn}` : "all");
  }

  const heroToolOptions = toolFilters;
  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";

  return (
    <>
      <AppNav
        activePage="apply"
        userName={isLoggedIn ? profile?.full_name : null}
        isAdmin={isAdmin}
      />

      <div className="ndb-root" style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: APP_FONT, color: "#221D23" }}>

        {showSignUp && <SignUpCard onClose={() => setShowSignUp(false)} />}

        {/* ── Hero ── */}
        <HeroSection
          heroActivities={heroActivities}
          allFunctions={allFunctions}
          heroToolOptions={heroToolOptions}
          selectedTool={selectedTool}
          selectedFunction={selectedFunction}
          searchQuery={searchQuery}
          onToolChange={setSelectedTool}
          onFunctionChange={handleFunctionChange}
          onSearch={handleSearch}
          toolLogos={toolLogos}
          functionLogos={functionLogos}
          tagLogos={tagLogos}
          isLoggedIn={isLoggedIn}
          onSignUpRequired={() => setShowSignUp(true)}
          viewCounts={viewCounts}
        />

        {/* ── Tabbed Content ── */}
        <main className="content">
          <section className="rail" id="workflows-tabs">
            <div className="rail-header">
              <div className="rail-title">
                {activeTab && (
                  <span className={`section-label${activeTab.variant === "yellow" ? " section-label--yellow" : ""}`}>
                    {activeTab.sectionLabel}
                  </span>
                )}
                <h2>{activeTab?.title}</h2>
                <p>{activeTab?.subtitle}</p>
              </div>
              <div className="rail-filter-right">
                <ToolFilterDropdown
                  tools={toolFilters}
                  selected={selectedTool}
                  onChange={setSelectedTool}
                  toolLogos={toolLogos}
                />
              </div>
            </div>

            <div className="tab-bar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-chip${selectedTab === tab.id ? " active" : ""}`}
                  onClick={() => setSelectedTab(tab.id)}
                >
                  <span className="tab-chip-icon">
                    {tab.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tab.logo} alt="" className="tab-chip-logo" />
                    ) : tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            {tabActivities.length > 0 ? (
              <div className="static-grid">
                {visibleItems.map(a => (
                  <div key={a.id} className="static-grid-slot">
                    <ActivityCard
                      activity={a}
                      isLoggedIn={isLoggedIn}
                      onSignUpRequired={() => setShowSignUp(true)}
                      toolLogos={toolLogos}
                      tagLogos={tagLogos}
                      variant={activeTab?.variant}
                      viewCount={viewCounts[a.id] ?? 0}
                      selectedTool={selectedTool}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="static-grid-empty">
                No workflows found. Try another tab, tool, or search term.
              </div>
            )}

            {hasMore && (
              <div className="static-grid-more">
                <button className="view-more-link" onClick={() => setExtraRows(r => r + 1)}>
                  View more
                </button>
              </div>
            )}
          </section>

          {brief && <NewsBriefCard brief={brief} />}
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
