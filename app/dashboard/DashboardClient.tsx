"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Activity, UserProgress, Profile, ToolDeepDive } from "@/lib/supabase/types";
import type { ToolLogoMap } from "@/lib/toolLogos";
import { activityHasTool, formatToolLabel, normalizeActivityTools } from "@/lib/tools";
import "./netflix-dashboard.css";

type Props = {
  profile: (Profile & { companies: { name: string } | null }) | null;
  activities: (Activity & { activity_content: { id: string } | null })[];
  progress: UserProgress[];
  toolLogos: ToolLogoMap;
  tagLogos: Record<string, string>;
  functionLogos: Record<string, string>;
  toolFilters: string[];
  deepDives: ToolDeepDive[];
  isLoggedIn: boolean;
};

// ── Scene theme system ────────────────────────────────────────────────────

type LeftEl  = "spreadsheet" | "person-purple" | "person-green" | "person-red" | "doc-stack" | "ticket-cloud";
type RightEl = "deck" | "scorecard" | "result-card" | "tool-ui" | "theme-map";
type SparkV  = "s1" | "s2";

type SceneTheme = {
  posterColor: "green" | "blue" | "purple" | "orange" | "warm";
  left: LeftEl;
  right: RightEl;
  spark?: SparkV;
};

const THEMES: SceneTheme[] = [
  { posterColor: "green",  left: "spreadsheet",   right: "deck",        spark: "s1" },
  { posterColor: "blue",   left: "person-purple",  right: "scorecard",   spark: "s1" },
  { posterColor: "purple", left: "doc-stack",      right: "result-card", spark: "s2" },
  { posterColor: "orange", left: "person-green",   right: "tool-ui",     spark: "s1" },
  { posterColor: "blue",   left: "ticket-cloud",   right: "theme-map"               },
  { posterColor: "green",  left: "doc-stack",      right: "tool-ui",     spark: "s1" },
  { posterColor: "purple", left: "spreadsheet",    right: "result-card", spark: "s2" },
];

function getTheme(id: string): SceneTheme {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = ((h << 5) - h) + id.charCodeAt(i); h |= 0; }
  return THEMES[Math.abs(h) % THEMES.length];
}

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

function fnSubtitle(fn: string): string {
  const f = fn.toLowerCase();
  if (f.includes("finance") || f.includes("account")) return "Workflows for financial analysis, reporting, and data.";
  if (f.includes("hr") || f.includes("human resources") || f.includes("people")) return "Workflows for hiring, performance, and people management.";
  if (f.includes("legal") || f.includes("compliance")) return "Workflows for contracts, policy, and risk review.";
  if (f.includes("market") || f.includes("brand") || f.includes("content")) return "Workflows for campaigns, copy, and content strategy.";
  if (f.includes("sales")) return "Workflows for pipeline, outreach, and deal management.";
  if (f.includes("support") || f.includes("customer")) return "Workflows for tickets, responses, and service quality.";
  return `AI-guided workflows for ${fn} teams.`;
}

function timeLabel(a: Activity): string {
  if (a.time_estimate_minutes) return `${a.time_estimate_minutes} min`;
  if (a.points)                 return `${a.points} pts`;
  return "";
}

// ── Illustration components ───────────────────────────────────────────────

function Person({ shirt }: { shirt: "red" | "purple" | "green" }) {
  return (
    <div className={`person ${shirt}-shirt`}>
      <span className="hair" /><span className="head" /><span className="body" />
      <span className="arm left" /><span className="arm right" />
      <span className="leg left" /><span className="leg right" />
    </div>
  );
}

function Scene({ theme }: { theme: SceneTheme }) {
  const left =
    theme.left === "spreadsheet"   ? <div className="spreadsheet" /> :
    theme.left === "doc-stack"     ? <div className="document-stack"><span className="doc" /><span className="doc" /><span className="doc" /></div> :
    theme.left === "ticket-cloud"  ? <div className="ticket-cloud"><span className="ticket" /><span className="ticket" /><span className="ticket" /></div> :
    theme.left === "person-purple" ? <Person shirt="purple" /> :
    theme.left === "person-green"  ? <Person shirt="green" /> :
                                     <Person shirt="red" />;

  const right =
    theme.right === "deck"        ? <div className="deck" /> :
    theme.right === "scorecard"   ? <div className="scorecard" /> :
    theme.right === "result-card" ? <div className="result-card" /> :
    theme.right === "tool-ui"     ? <div className="tool-ui" /> :
                                    <div className="theme-map"><span /><span /><span /></div>;

  return (
    <div className="scene">
      {left}
      <div className="arrow-flow" />
      {right}
      {theme.spark && <div className={`spark ${theme.spark}`} />}
    </div>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span className="pill" style={{ color, borderColor: `${color}40` }}>
      {label}
    </span>
  );
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
        <div style={{ fontSize: 36, marginBottom: 16, color: "#FFCE00" }}>✦</div>
        <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 12, lineHeight: 1.3 }}>
          Sign up free. Unlock every workflow.
        </h2>
        <p style={{ color: "#A09AA6", marginBottom: 32, lineHeight: 1.65, fontSize: 15 }}>
          Get access to every guided workflow, tool comparison, and AI mastery tip in the studio.
        </p>
        <Link
          href="/login"
          style={{
            display: "block", background: "#FFCE00", color: "#221D23",
            fontWeight: 800, padding: "15px 32px", borderRadius: 12,
            textDecoration: "none", marginBottom: 14, fontSize: 16,
            transition: "opacity 0.15s",
          }}
        >
          Get started — it&apos;s free
        </Link>
        <button
          onClick={onClose}
          style={{
            background: "transparent", border: "none", color: "#746F78",
            cursor: "pointer", fontSize: 14, padding: "8px",
          }}
        >
          Continue browsing
        </button>
      </div>
    </div>
  );
}

// ── WorkflowCard ──────────────────────────────────────────────────────────

function WorkflowCard({
  activity,
  focusStyle,
  isLoggedIn,
  onSignUpRequired,
}: {
  activity: Activity;
  focusStyle: React.CSSProperties;
  isLoggedIn: boolean;
  onSignUpRequired: () => void;
}) {
  const theme  = getTheme(activity.id);
  const tools  = normalizeActivityTools(activity.tools);
  const fns    = activity.functions ?? [];
  const chip   = timeLabel(activity);

  const inner = (
    <>
      {activity.is_featured && <span className="new-badge">New</span>}
      <div className={`card-poster ${theme.posterColor}`}>
        {activity.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activity.thumbnail_url}
            alt={activity.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 2 }}
          />
        ) : (
          <Scene theme={theme} />
        )}
      </div>
      <div className="card-body">
        <div className="meta-line">
          {tools[0] && <Pill label={formatToolLabel(tools[0])} color={toolColor(tools[0])} />}
          {fns[0]   && <Pill label={fns[0]}                    color={fnColor(fns[0])} />}
          {chip     && <span className="time-chip">{chip}</span>}
        </div>
        <h3 className="card-title">{activity.title}</h3>
        <p className="card-desc">{activity.description}</p>
      </div>
    </>
  );

  if (!isLoggedIn) {
    return (
      <div
        className="workflow-card"
        style={{ ...focusStyle, cursor: "pointer" }}
        onClick={onSignUpRequired}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onSignUpRequired(); }}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link href={`/activity/${activity.id}`} className="workflow-card" style={focusStyle}>
      {inner}
    </Link>
  );
}

// ── HorizontalRail ────────────────────────────────────────────────────────

function HorizontalRail({
  title, subtitle, activities, isLoggedIn, onSignUpRequired,
}: {
  title: string;
  subtitle: string;
  activities: Activity[];
  isLoggedIn: boolean;
  onSignUpRequired: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [focusedIdx, setFocusedIdx] = useState(0);

  function findCenter(row: HTMLDivElement): number {
    const cards = Array.from(row.querySelectorAll<HTMLElement>(".workflow-card"));
    const mid   = row.getBoundingClientRect().left + row.clientWidth / 2;
    let best = 0, bestD = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(c.getBoundingClientRect().left + c.clientWidth / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    setFocusedIdx(findCenter(row));
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => { clearTimeout(t); t = setTimeout(() => setFocusedIdx(findCenter(row)), 80); };
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => { row.removeEventListener("scroll", onScroll); clearTimeout(t); };
  }, [activities]);

  function scrollTo(dir: number) {
    const row = rowRef.current;
    if (!row) return;
    const cards = Array.from(row.querySelectorAll<HTMLElement>(".workflow-card"));
    const next  = Math.min(cards.length - 1, Math.max(0, focusedIdx + dir));
    const card  = cards[next];
    if (card) {
      row.scrollTo({ left: card.offsetLeft - (row.clientWidth - card.clientWidth) / 2, behavior: "smooth" });
      setFocusedIdx(next);
    }
  }

  if (activities.length === 0) return null;

  return (
    <section className="rail">
      <div className="rail-header">
        <div className="rail-title">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="see-all">View all →</span>
      </div>
      <div className="rail-window">
        <button className="row-arrow left" onClick={() => scrollTo(-1)}>‹</button>
        <div className="cards-row" ref={rowRef}>
          {activities.map((a, i) => {
            const active  = i === focusedIdx;
            const style: React.CSSProperties = {
              opacity:    active ? 1 : 0.64,
              transform:  active ? "scale(1.08)" : "scale(0.94)",
              zIndex:     active ? 8 : 1,
              boxShadow:  active ? "0 26px 55px rgba(34, 29, 35, 0.16)" : "none",
              borderColor: active ? "#D0C7BA" : "#E5E0D8",
            };
            return <WorkflowCard key={a.id} activity={a} focusStyle={style} isLoggedIn={isLoggedIn} onSignUpRequired={onSignUpRequired} />;
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
}: {
  heroActivities: Activity[];
  allFunctions: string[];
  heroToolOptions: string[];
  onShowWorkflows: (tool: string, fn: string) => void;
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
          <h1>Discover AI workflows worth trying at work</h1>
          <p>Choose your AI tool, pick your function, and explore guided workflows built around real workplace moments.</p>

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
            const fns   = a.functions ?? [];
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
                <div className={`poster-visual ${theme.posterColor}`}>
                  {a.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.thumbnail_url}
                      alt={a.title}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 2 }}
                    />
                  ) : (
                    <Scene theme={theme} />
                  )}
                </div>
                <div className="poster-content">
                  <div className="poster-meta">
                    {tools[0] && <Pill label={formatToolLabel(tools[0])} color={toolColor(tools[0])} />}
                    {fns[0]   && <Pill label={fns[0]}                    color={fnColor(fns[0])} />}
                    {chip     && <span className="time-chip">{chip}</span>}
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

// ── ToolsBand (static) ───────────────────────────────────────────────────

function ToolsBand({ activities }: { activities: Activity[] }) {
  const counts: Record<string, number> = {};
  activities.forEach(a => normalizeActivityTools(a.tools).forEach(t => { counts[t] = (counts[t] ?? 0) + 1; }));

  const tools = [
    { slug: "claude",  label: "Claude",  desc: "Strong for long documents, artifacts, writing, and structured reasoning.", init: "C",   color: "#623CEA" },
    { slug: "chatgpt", label: "ChatGPT", desc: "Useful for everyday work, custom GPTs, research, images, and multimodal tasks.", init: "GPT", color: "#23CE68" },
    { slug: "gemini",  label: "Gemini",  desc: "Useful for Google Workspace, research, and connected productivity tasks.", init: "Ge",  color: "#3696FC" },
    { slug: "copilot", label: "Copilot", desc: "Useful inside Microsoft 365 for documents, meetings, and enterprise workflows.", init: "Co",  color: "#F68A29" },
  ];

  return (
    <section className="tools-band" id="tools">
      <div className="rail-header">
        <div className="rail-title">
          <h2>Know your tool</h2>
          <p>Make tool choice feel visual, simple, and practical.</p>
        </div>
      </div>
      <div className="tool-grid">
        {tools.map(t => (
          <article key={t.slug} className="tool-card">
            <div>
              <div className="tool-logo" style={{ color: t.color }}>{t.init}</div>
              <h3>{t.label}</h3>
              <p>{t.desc}</p>
            </div>
            <div className="tool-link">
              <span>{counts[t.slug] ?? 0} workflows</span>
              <span>→</span>
            </div>
          </article>
        ))}
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

export default function DashboardClient({ profile, activities, toolFilters, isLoggedIn }: Props) {
  const [activeTool, setActiveTool]         = useState("all");
  const [activeFunction, setActiveFunction] = useState("all");
  const [showSignUp, setShowSignUp]         = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // Unique functions sorted by frequency
  const allFunctions = useMemo(() => {
    const map = new Map<string, number>();
    activities.forEach(a => (a.functions ?? []).forEach(fn => {
      const k = fn.trim();
      if (k) map.set(k, (map.get(k) ?? 0) + 1);
    }));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  }, [activities]);

  // Hero carousel: is_featured first, then newest
  const heroActivities = useMemo(() => {
    const featured = activities.filter(a => a.is_featured);
    if (featured.length >= 3) return featured.slice(0, 3);
    const rest = activities
      .filter(a => !a.is_featured)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return [...featured, ...rest].slice(0, 3);
  }, [activities]);

  // Filtered by active tool + function
  const filtered = useMemo(() => activities.filter(a => {
    const tOk = activeTool === "all"     || activityHasTool(a.tools, activeTool);
    const fOk = activeFunction === "all" || (a.functions ?? []).some(f => f.toLowerCase() === activeFunction.toLowerCase());
    return tOk && fOk;
  }), [activities, activeTool, activeFunction]);

  // "New this week" = featured activities in filtered set
  const newThisWeek = useMemo(() => filtered.filter(a => a.is_featured), [filtered]);

  // Per-function rails
  const fnRails = useMemo(() => {
    const fns = activeFunction === "all" ? allFunctions : [activeFunction];
    return fns
      .map(fn => ({ fn, items: filtered.filter(a => (a.functions ?? []).some(f => f.toLowerCase() === fn.toLowerCase())) }))
      .filter(r => r.items.length > 0);
  }, [allFunctions, filtered, activeFunction]);

  function handleShowWorkflows(tool: string, fn: string) {
    if (tool) setActiveTool(tool);
    if (fn)   setActiveFunction(fn);
    document.getElementById("workflows")?.scrollIntoView({ behavior: "smooth" });
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
      />

      {/* ── Content ── */}
      <main className="content">

        {/* Filter panel */}
        <section className="filter-panel">
          <div className="filter-head">
            <h2>Browse by AI tool</h2>
            <span>{filtered.length} visual workflow guide{filtered.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="filter-pills">
            {toolFilters.map(t => {
              const slug = t === "claude" ? " claude" : t === "chatgpt" ? " chatgpt" : t === "gemini" ? " gemini" : t === "copilot" ? " copilot" : "";
              return (
                <button
                  key={t}
                  className={`filter-btn${activeTool === t ? " active" : ""}`}
                  onClick={() => { setActiveTool(t); if (t !== "all") setActiveFunction("all"); }}
                >
                  <span className={`tool-dot${slug}`} />
                  {t === "all" ? "All" : formatToolLabel(t)}
                </button>
              );
            })}
            {activeFunction !== "all" && (
              <button
                className="filter-btn active"
                onClick={() => setActiveFunction("all")}
                style={{ background: fnColor(activeFunction) + "22", borderColor: fnColor(activeFunction), color: fnColor(activeFunction) }}
              >
                {activeFunction} ✕
              </button>
            )}
          </div>
        </section>

        {/* Rails */}
        <div id="workflows">
          {newThisWeek.length > 0 && (
            <HorizontalRail
              title="New this week"
              subtitle="Fresh workflows with visual workplace scenes."
              activities={newThisWeek}
              isLoggedIn={isLoggedIn}
              onSignUpRequired={() => setShowSignUp(true)}
            />
          )}

          {fnRails.map(({ fn, items }) => (
            <HorizontalRail
              key={fn}
              title={fn}
              subtitle={fnSubtitle(fn)}
              activities={items}
              isLoggedIn={isLoggedIn}
              onSignUpRequired={() => setShowSignUp(true)}
            />
          ))}
        </div>

        <ToolsBand activities={activities} />
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
