"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import type { Activity, UserProgress, Profile } from "@/lib/supabase/types";
import { resolveToolLogoUrl, type ToolLogoMap } from "@/lib/toolLogos";
import { formatToolLabel, normalizeActivityTools } from "@/lib/tools";
import RotatingTools from "@/components/RotatingTools";
import ToolIcon from "@/components/ToolIcon";
import AppNav from "@/components/AppNav";
import { APP_FONT } from "@/lib/fonts";
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
  activities, selectedFunction, selectedTool, isLoggedIn, onSignUpRequired, toolLogos, tagLogos, viewCounts,
}: {
  activities: Activity[];
  selectedFunction: string | null;
  selectedTool: string | null;
  isLoggedIn: boolean;
  onSignUpRequired: () => void;
  toolLogos: ToolLogoMap;
  tagLogos: Record<string, string>;
  viewCounts: Record<string, number>;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedFunction, selectedTool]);

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

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const titleParts: string[] = ["All"];
  if (selectedFunction) titleParts.push(selectedFunction);
  if (selectedTool) titleParts.push(formatToolLabel(selectedTool));
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
        key={`${selectedFunction ?? "all"}-${selectedTool ?? "all"}`}
        label="Full library"
        title={title}
        subtitle={""}
        activities={visibleItems}
        isLoggedIn={isLoggedIn}
        onSignUpRequired={onSignUpRequired}
        toolLogos={toolLogos}
        tagLogos={tagLogos}
        viewCounts={viewCounts}
        onLoadMore={hasMore ? () => setVisibleCount(c => Math.min(filtered.length, c + PAGE_SIZE)) : undefined}
      />
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
          <span className="section-label">Filter by role</span>
          <h2>Browse by function</h2>
          <p>Select a function to filter All Workflows above.</p>
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
  title, subtitle, label, activities, isLoggedIn, onSignUpRequired, toolLogos, tagLogos, variant = "default", viewCounts = {}, onLoadMore,
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
                <ActivityCard activity={a} focusStyle={style} isLoggedIn={isLoggedIn} onSignUpRequired={onSignUpRequired} toolLogos={toolLogos} tagLogos={tagLogos} variant={variant} viewCount={viewCounts[a.id] ?? 0} />
              </div>
            );
          })}
        </div>
        <button className="row-arrow right" onClick={() => scrollTo(1)}>›</button>
      </div>
    </section>
  );
}

// ── HeroSelect ────────────────────────────────────────────────────────────

type HeroSelectOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

function HeroSelect({
  placeholder,
  value,
  options,
  isOpen,
  onOpenChange,
  onChange,
}: {
  placeholder: string;
  value: string;
  options: HeroSelectOption[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div
      ref={rootRef}
      className={`hero-select${isOpen ? " is-open" : ""}${!value ? " is-placeholder" : ""}`}
    >
      <button
        type="button"
        className="hero-select-trigger"
        onClick={() => onOpenChange(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={selected ? selected.label : placeholder}
      >
        <span className="hero-select-value">
          {selected ? (
            <>
              {selected.icon && <span className="hero-select-leading">{selected.icon}</span>}
              <span className="hero-select-label">{selected.label}</span>
            </>
          ) : (
            <span className="hero-select-label">{placeholder}</span>
          )}
        </span>
        <svg
          className="hero-select-chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="hero-select-menu" role="listbox">
          {options.map(opt => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`hero-select-option${isSelected ? " is-selected" : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  onOpenChange(false);
                }}
              >
                {opt.icon && <span className="hero-select-leading">{opt.icon}</span>}
                <span className="hero-select-option-label">{opt.label}</span>
                {isSelected && (
                  <svg
                    className="hero-select-check"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── HeroSection ───────────────────────────────────────────────────────────

function HeroSection({
  heroActivities,
  allFunctions,
  heroToolOptions,
  onShowWorkflows,
  toolLogos,
  functionLogos,
}: {
  heroActivities: Activity[];
  allFunctions: string[];
  heroToolOptions: string[];
  onShowWorkflows: (tool: string, fn: string) => void;
  toolLogos: ToolLogoMap;
  functionLogos: Record<string, string>;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [heroTool, setHeroTool] = useState("");
  const [heroFunction, setHeroFunction] = useState("");
  const [openSelect, setOpenSelect] = useState<"tool" | "function" | null>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);

  const toolOptions = useMemo<HeroSelectOption[]>(() =>
    heroToolOptions.map(t => ({
      value: t,
      label: formatToolLabel(t),
      icon: <ToolIcon tool={t} size={20} logos={toolLogos} insetScale={0.88} />,
    })),
  [heroToolOptions, toolLogos]);

  const functionOptions = useMemo<HeroSelectOption[]>(() =>
    allFunctions.map(fn => {
      const logo = functionLogos[fn.toLowerCase()];
      return {
        value: fn,
        label: fn,
        icon: logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="hero-select-fn-icon" />
        ) : (
          <span className="hero-select-fn-fallback" style={{ background: fnColor(fn) }}>
            {fn.slice(0, 1).toUpperCase()}
          </span>
        ),
      };
    }),
  [allFunctions, functionLogos]);

  useEffect(() => {
    if (heroActivities.length === 0) return;
    const id = setInterval(() => setActiveIdx(i => (i + 1) % heroActivities.length), 3000);
    return () => clearInterval(id);
  }, [heroActivities.length]);

  useEffect(() => {
    const sc = showcaseRef.current;
    if (!sc) return;
    const posters = sc.querySelectorAll<HTMLElement>(".hero-poster");
    const active = posters[activeIdx];
    if (active) sc.scrollTo({ left: Math.max(0, active.offsetLeft - sc.offsetWidth * 0.08), behavior: "smooth" });
  }, [activeIdx]);

  return (
    <header className="hero-shell">
      <section className="hero">
        {/* Left column */}
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Updated every week</div>
          <h1>Practical AI workflows for your daily work</h1>
          <p>Discover and run guided AI automations tailored to your tool stack and job function.</p>

          <div className="selector-row">
            <HeroSelect
              placeholder="Choose tool"
              value={heroTool}
              options={toolOptions}
              isOpen={openSelect === "tool"}
              onOpenChange={open => setOpenSelect(open ? "tool" : null)}
              onChange={setHeroTool}
            />
            <HeroSelect
              placeholder="Choose function"
              value={heroFunction}
              options={functionOptions}
              isOpen={openSelect === "function"}
              onOpenChange={open => setOpenSelect(open ? "function" : null)}
              onChange={setHeroFunction}
            />
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
            const chip = timeLabel(a);
            const isActive = i === activeIdx;

            return (
              <article
                key={a.id}
                className="hero-poster"
                onClick={() => setActiveIdx(i)}
                style={{
                  flexBasis: isActive ? "56%" : "38%",
                  opacity: isActive ? 1 : 0.48,
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

// ── Featured promo cards ────────────────────────────────────────────────────

const TOTAL_COURSE_MODULES = 30;

function formatBriefDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function NewsBriefCard({ brief }: { brief: Brief }) {
  const items = [...brief.fluency_brief_items].sort((a, b) => a.sort_order - b.sort_order).slice(0, 3);

  return (
    <section className="brief-card-section">
      <Link href="/ai-fluency" className="brief-card">
        <div>
          <div className="brief-card-header">
            <span className="brief-card-badge">Nudgeable Brief</span>
            <span className="brief-card-date">{formatBriefDate(brief.published_date)}</span>
          </div>
          <h2 className="brief-card-title">{brief.title}</h2>
          <ul className="brief-card-list">
            {items.map((item, i) => (
              <li key={item.id ?? i}>{item.content}</li>
            ))}
          </ul>
        </div>
        <span className="brief-card-link">Explore AI Fluency →</span>
      </Link>
    </section>
  );
}

function AIMasteryCourseSection({ completedCount, isLoggedIn }: { completedCount: number; isLoggedIn: boolean }) {
  const pct = Math.round((completedCount / TOTAL_COURSE_MODULES) * 100);
  const started = completedCount > 0;
  const done = completedCount >= TOTAL_COURSE_MODULES;
  const href = isLoggedIn ? "/ai-mastery" : "/login";

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
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);

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
    if (fn) setSelectedFunction(fn);
    document.getElementById("all-workflows")?.scrollIntoView({ behavior: "smooth" });
  }

  const heroToolOptions = toolFilters.filter(t => t !== "all");
  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";

  return (
    <>
      <AppNav
        activePage="workflows"
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
        onShowWorkflows={handleShowWorkflows}
        toolLogos={toolLogos}
        functionLogos={functionLogos}
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
            tagLogos={tagLogos}
            viewCounts={viewCounts}
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
            tagLogos={tagLogos}
            viewCounts={viewCounts}
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
            tagLogos={tagLogos}
            viewCounts={viewCounts}
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
          tagLogos={tagLogos}
          viewCounts={viewCounts}
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
            tagLogos={tagLogos}
            viewCounts={viewCounts}
          />
        )}
        <AIMasteryCourseSection completedCount={masteryProgressCount} isLoggedIn={isLoggedIn} />
        {brief && <NewsBriefCard brief={brief} />}



      </main>

      {/* ── Footer ── */}
      <footer className="nudge-footer">
        <div className="nf-inner">
          <section className="nf-head">
            <div className="nf-copy">
              <h2>Nudgeable builds AI capability and behavior change at work.</h2>
              <p>AI Work Studio, AI Coach, and Nudge Engine for learning, application, practice, and sustained action.</p>
            </div>
            <div className="nf-contact">
              <a className="nf-pill" href="mailto:team@nudgeable.ai">team@nudgeable.ai</a>
              <a className="nf-pill" href="https://www.nudgeable.ai">www.nudgeable.ai</a>
            </div>
          </section>
          <section className="nf-products">
            <article className="nf-card nf-dark">
              <h3>AI Work Studio</h3>
              <p>For AI learning, application, mastery, and fluency.</p>
              <div className="nf-chips">
                <span className="nf-chip">Masterclasses</span>
                <span className="nf-chip">Application</span>
                <span className="nf-chip">Mastery</span>
                <span className="nf-chip">Fluency</span>
              </div>
            </article>
            <article className="nf-card nf-coach">
              <h3>AI Coach</h3>
              <p>Safe practice before real workplace conversations.</p>
              <div className="nf-chips">
                <span className="nf-chip">Roleplays</span>
                <span className="nf-chip">Feedback</span>
              </div>
            </article>
            <article className="nf-card nf-nudge">
              <h3>Nudge Engine</h3>
              <p>Convert training into actions, habits, and measurement.</p>
              <div className="nf-chips">
                <span className="nf-chip">Actions</span>
                <span className="nf-chip">Habits</span>
              </div>
            </article>
          </section>
        </div>
      </footer>
    </div>
    </>
  );
}
