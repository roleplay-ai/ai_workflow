"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import type { Activity, UserProgress, Profile } from "@/lib/supabase/types";
import { resolveToolLogoUrl, type ToolLogoMap } from "@/lib/toolLogos";
import { formatToolLabel, normalizeActivityTools } from "@/lib/tools";
import ToolIcon from "@/components/ToolIcon";
import AppNav from "@/components/AppNav";
import SiteFooter from "@/components/SiteFooter";
import { APP_FONT } from "@/lib/fonts";
import { recordFluencyView } from "@/lib/fluencyViews";
import FoundationCardsCarousel from "@/app/ai-fluency/FoundationCardsCarousel";
import ModulePlayer, { type ModuleData } from "@/app/ai-fluency/ModulePlayer";
import ModuleHtmlModal from "@/app/ai-fluency/ModuleHtmlModal";
import type { FoundationModule } from "@/app/ai-fluency/FoundationModuleCard";
import ActivityCard, { type CardVariant, getTheme, Scene } from "./ActivityCard";
import "./netflix-dashboard.css";
import "@/app/ai-fluency/ai-fluency.css";

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
  modules: FoundationModule[];
  completedModuleIds: string[];
  viewCounts: Record<string, number>;
};

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
  name, count, description, thumbnail, onClick,
}: {
  name: string;
  count: number;
  description: string | null;
  thumbnail: string | null;
  onClick: () => void;
}) {
  const theme = getTheme(name);
  const countLabel = `${count} workflow${count !== 1 ? "s" : ""}`;

  return (
    <div
      className="workflow-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <div className={`card-poster ${theme.posterColor}${thumbnail ? " has-thumbnail" : ""}`}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="card-thumbnail" src={thumbnail} alt="" />
        ) : (
          <Scene theme={theme} />
        )}
      </div>
      <div className="card-body function-card-body">
        <div className="meta-line">
          <span className="function-card-count">{countLabel}</span>
        </div>
        <h3 className="card-title">{name}</h3>
        {description && <p className="card-desc">{description}</p>}
        <div className="function-card-footer">
          <span className="function-card-cta">Try it →</span>
        </div>
      </div>
    </div>
  );
}

// ── FunctionsGrid ─────────────────────────────────────────────────────────

function FunctionsGrid({
  activities,
  selectedTool,
  onSelect,
  functionThumbnails,
  functionDescriptions,
}: {
  activities: Activity[];
  selectedTool: string | null;
  onSelect: (fn: string) => void;
  functionThumbnails: Record<string, string>;
  functionDescriptions: Record<string, string>;
}) {
  const functions = useMemo(() => {
    const filtered = selectedTool
      ? activities.filter(a =>
          normalizeActivityTools(a.tools).some(t => t.toLowerCase() === selectedTool.toLowerCase())
        )
      : activities;
    const map = new Map<string, number>();
    filtered.forEach(a => (a.functions ?? []).forEach(fn => {
      const k = fn.trim();
      if (k) map.set(k, (map.get(k) ?? 0) + 1);
    }));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [activities, selectedTool]);

  if (functions.length === 0) {
    return (
      <div className="static-grid-empty">
        No workflow types found{selectedTool ? ` for ${formatToolLabel(selectedTool)}` : ""}. Try another tool filter.
      </div>
    );
  }

  return (
    <div className="static-grid">
      {functions.map(([fn, count]) => {
        const key = fn.toLowerCase();
        return (
          <div key={fn} className="static-grid-slot">
            <FunctionCard
              name={fn}
              count={count}
              description={functionDescriptions?.[key] ?? null}
              thumbnail={functionThumbnails?.[key] ?? null}
              onClick={() => onSelect(fn)}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── WorkflowsFilterBar ────────────────────────────────────────────────────

function WorkflowsToolChip({
  label,
  selected,
  onClick,
  icon,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`workflows-tool-chip${selected ? " is-active" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
      title={label}
    >
      <span className="workflows-tool-chip-icon">{icon}</span>
      <span className="workflows-tool-chip-label">{label}</span>
    </button>
  );
}

type WorkflowTab = "new" | "essentials" | "continue" | null;

function WorkflowsFilterBar({
  selectedTab,
  onTabChange,
  toolOptions,
  selectedTool,
  onToolChange,
  toolLogos,
  showContinue,
}: {
  selectedTab: WorkflowTab;
  onTabChange: (tab: WorkflowTab) => void;
  toolOptions: string[];
  selectedTool: string | null;
  onToolChange: (tool: string | null) => void;
  toolLogos: ToolLogoMap;
  showContinue: boolean;
}) {
  const quickTabs: { id: Exclude<WorkflowTab, null>; label: string; icon: string }[] = [
    { id: "new", label: "New", icon: "🔥" },
    { id: "essentials", label: "Start Here", icon: "🤖" },
  ];

  return (
    <div className="workflows-filter-bar">
      {quickTabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          className={`tab-chip${selectedTab === tab.id ? " active" : ""}`}
          onClick={() => onTabChange(selectedTab === tab.id ? null : tab.id)}
        >
          <span className="tab-chip-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
      {toolOptions.map(tool => (
        <WorkflowsToolChip
          key={tool}
          label={formatToolLabel(tool)}
          selected={selectedTool === tool}
          onClick={() => onToolChange(selectedTool === tool ? null : tool)}
          icon={<ToolIcon tool={tool} size={28} logos={toolLogos} insetScale={0.88} />}
        />
      ))}
      {showContinue && (
        <button
          type="button"
          className={`tab-chip${selectedTab === "continue" ? " active" : ""}`}
          onClick={() => onTabChange(selectedTab === "continue" ? null : "continue")}
        >
          <span className="tab-chip-icon">⏩</span>
          Continue
        </button>
      )}
    </div>
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

// ── HeroSection ───────────────────────────────────────────────────────────

function HeroSection({
  heroActivities,
  searchQuery,
  onSearch,
  toolLogos,
  tagLogos,
  isLoggedIn,
  onSignUpRequired,
  viewCounts,
}: {
  heroActivities: Activity[];
  searchQuery: string;
  onSearch: (query: string) => void;
  toolLogos: ToolLogoMap;
  tagLogos: Record<string, string>;
  isLoggedIn: boolean;
  onSignUpRequired: () => void;
  viewCounts: Record<string, number>;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const showcaseRef = useRef<HTMLDivElement>(null);

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

          <div className="trust-line">Search to narrow the library below.</div>

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

function AIFoundationsSection({
  modules,
  completedIds,
  loadingId,
  onModuleClick,
}: {
  modules: FoundationModule[];
  completedIds: string[];
  loadingId: string | null;
  onModuleClick: (mod: FoundationModule) => void;
}) {
  if (modules.length === 0) return null;

  return (
    <section className="foundations-section">
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        gap: 22, marginBottom: 22,
      }}>
        <div style={{ position: "relative", paddingLeft: 22 }}>
          <div style={{
            position: "absolute", left: 0, top: 4, width: 7, height: 58,
            borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(34,29,35,.18)",
          }} />
          <span className="section-label">Learn</span>
          <h2 className="aif-section-title">AI Foundations</h2>
          <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>
            Short explainers that build practical AI fluency.
          </p>
        </div>
        <Link href="/know/foundations" style={{ fontSize: 13, fontWeight: 700, color: "#623CEA", whiteSpace: "nowrap", textDecoration: "none" }}>
          See all topics →
        </Link>
      </div>

      <FoundationCardsCarousel
        modules={modules}
        completedIds={completedIds}
        loadingId={loadingId}
        onModuleClick={onModuleClick}
      />
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

export default function DashboardClient({ profile, activities, progress, toolFilters, toolLogos, tagLogos, functionLogos, functionThumbnails, functionDescriptions, isLoggedIn, masteryProgressCount, modules, completedModuleIds, viewCounts }: Props) {
  const [selectedTab, setSelectedTab] = useState<WorkflowTab>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSignUp, setShowSignUp] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>(completedModuleIds);
  const [openModule, setOpenModule] = useState<ModuleData | null>(null);
  const [htmlModule, setHtmlModule] = useState<FoundationModule | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleModuleClick(mod: FoundationModule) {
    if (mod.is_locked) return;
    recordFluencyView("module", mod.id);

    setLoadingId(mod.id);

    if (mod.html_path) {
      setHtmlModule(mod);
      return;
    }

    try {
      const res = await fetch(`/api/fluency/module/${mod.id}`);
      const data = await res.json() as ModuleData;
      setOpenModule(data);
    } finally {
      setLoadingId(null);
    }
  }

  function handleHtmlModuleClose() {
    setHtmlModule(null);
    setLoadingId(null);
  }

  function handleModuleComplete(moduleId: string) {
    setCompletedIds(ids => ids.includes(moduleId) ? ids : [...ids, moduleId]);
  }

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

  const showActivities = selectedFunction !== null || selectedTab !== null || searchQuery.trim().length > 0;

  const sectionMeta = useMemo(() => {
    if (searchQuery.trim()) {
      return {
        sectionLabel: "Search results",
        title: `Results for "${searchQuery.trim()}"`,
        subtitle: "Workflows matching your search.",
      };
    }
    if (selectedFunction) {
      const count = activities.filter(a =>
        (a.functions ?? []).some(f => f.toLowerCase() === selectedFunction.toLowerCase())
      ).length;
      return {
        sectionLabel: "Workflow type",
        title: `${selectedFunction} workflows`,
        subtitle: `${count} workflow${count !== 1 ? "s" : ""} for ${selectedFunction}.`,
      };
    }
    if (selectedTab === "new") {
      return {
        sectionLabel: "Practice Path",
        title: "Newly added workflows this week",
        subtitle: "Fresh workflows added for this week's practice.",
      };
    }
    if (selectedTab === "essentials") {
      return {
        sectionLabel: "Practice Path",
        title: "Chatbot Essentials",
        subtitle: "Core workflows for improving AI fluency and everyday practice.",
      };
    }
    if (selectedTab === "continue") {
      return {
        sectionLabel: "Practice Path",
        title: "Continue where you left off",
        subtitle: `${pendingActivities.length} workflow${pendingActivities.length !== 1 ? "s" : ""} in progress.`,
      };
    }
    return {
      sectionLabel: "Workflow types",
      title: "Browse by Outcome",
      subtitle: "Pick a workflow type to see all guided activities for that function.",
    };
  }, [activities, selectedFunction, selectedTab, searchQuery, pendingActivities.length]);

  const tabActivities = useMemo(() => {
    if (!showActivities) return [];

    let base: Activity[];
    if (searchQuery.trim()) {
      base = activities;
    } else if (selectedFunction) {
      base = activities.filter(a =>
        (a.functions ?? []).some(f => f.toLowerCase() === selectedFunction.toLowerCase())
      );
    } else if (selectedTab === "new") {
      base = activities.filter(a => a.is_featured);
    } else if (selectedTab === "essentials") {
      base = activities.filter(a => a.is_mastery);
    } else if (selectedTab === "continue") {
      base = pendingActivities;
    } else {
      base = activities;
    }
    return filterActivitiesBySelection(base, null, selectedTool, searchQuery);
  }, [showActivities, activities, pendingActivities, selectedFunction, selectedTab, selectedTool, searchQuery]);

  const cols = useGridColumns();
  const [extraRows, setExtraRows] = useState(0);
  useEffect(() => { setExtraRows(0); }, [selectedTab, selectedFunction, selectedTool, searchQuery]);

  const visibleCount = cols * (2 + extraRows);
  const visibleItems = tabActivities.slice(0, visibleCount);
  const hasMore = visibleCount < tabActivities.length;

  function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.trim()) {
      setSelectedFunction(null);
      setSelectedTab(null);
    }
  }

  function handleTabChange(tab: WorkflowTab) {
    setSelectedTab(tab);
    setSelectedFunction(null);
  }

  function handleFunctionSelect(fn: string) {
    setSelectedFunction(fn);
    setSelectedTab(null);
  }

  function handleBackToFunctions() {
    setSelectedFunction(null);
    setSearchQuery("");
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
          searchQuery={searchQuery}
          onSearch={handleSearch}
          toolLogos={toolLogos}
          tagLogos={tagLogos}
          isLoggedIn={isLoggedIn}
          onSignUpRequired={() => setShowSignUp(true)}
          viewCounts={viewCounts}
        />

        {/* ── Workflows ── */}
        <main className="content">
          <section className="rail" id="workflows-tabs">
            <div className="rail-header">
              <div className="rail-title">
                <span className="section-label">{sectionMeta.sectionLabel}</span>
                <h2>{sectionMeta.title}</h2>
                <p>{sectionMeta.subtitle}</p>
              </div>
              {(selectedFunction || searchQuery.trim()) && (
                <button type="button" className="see-all" onClick={handleBackToFunctions}>
                  ← Back to all types
                </button>
              )}
            </div>

            <WorkflowsFilterBar
              selectedTab={selectedTab}
              onTabChange={handleTabChange}
              toolOptions={heroToolOptions.filter(t => t !== "all")}
              selectedTool={selectedTool}
              onToolChange={setSelectedTool}
              toolLogos={toolLogos}
              showContinue={isLoggedIn && pendingActivities.length > 0}
            />

            {showActivities ? (
              tabActivities.length > 0 ? (
                <>
                  <div className="static-grid">
                    {visibleItems.map(a => (
                      <div key={a.id} className="static-grid-slot">
                        <ActivityCard
                          activity={a}
                          isLoggedIn={isLoggedIn}
                          onSignUpRequired={() => setShowSignUp(true)}
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
                </>
              ) : (
                <div className="static-grid-empty">
                  No workflows found. Try another filter or search term.
                </div>
              )
            ) : (
              <FunctionsGrid
                activities={activities}
                selectedTool={selectedTool}
                onSelect={handleFunctionSelect}
                functionThumbnails={functionThumbnails}
                functionDescriptions={functionDescriptions}
              />
            )}
          </section>

          <AIFoundationsSection
            modules={modules}
            completedIds={completedIds}
            loadingId={loadingId}
            onModuleClick={handleModuleClick}
          />
        </main>

        <SiteFooter />
      </div>

      {htmlModule && (
        <ModuleHtmlModal
          moduleId={htmlModule.id}
          moduleTitle={htmlModule.title}
          moduleEmoji={htmlModule.emoji}
          onClose={handleHtmlModuleClose}
          onReady={() => setLoadingId(null)}
        />
      )}

      {openModule && (
        <ModulePlayer
          module={openModule}
          isCompleted={completedIds.includes(openModule.id)}
          onClose={() => setOpenModule(null)}
          onComplete={handleModuleComplete}
        />
      )}
    </>
  );
}
