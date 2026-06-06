"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Activity, UserProgress, Profile } from "@/lib/supabase/types";
import Topbar from "@/components/Topbar";
import ToolIcon from "@/components/ToolIcon";
import type { ToolLogoMap } from "@/lib/toolLogos";

type Props = {
  profile: Profile & { companies: { name: string } | null };
  activities: (Activity & { activity_content: { id: string } | null })[];
  progress: UserProgress[];
  toolLogos: ToolLogoMap;
  tagLogos: Record<string, string>;
};

const C = {
  yellow: "#FFCE00",
  lightYellow: "#FFF6CF",
  orange: "#F68A29",
  purple: "#623CEA",
  blue: "#3699FC",
  green: "#23CE6B",
  dark: "#221D23",
  muted: "#6f6a73",
  line: "#e8e3d8",
  bg: "#faf9f5",
  soft: "#f4f1ea",
};

function isNew(activity: Activity) {
  return activity.is_featured;
}

function toolDot(tool: string) {
  if (tool === "claude") return C.orange;
  if (tool === "chatgpt") return C.green;
  if (tool === "gemini") return C.blue;
  if (tool === "copilot") return C.purple;
  return C.yellow;
}

function botBadge(tool: string) {
  if (tool === "claude") return { bg: C.orange, letter: "C" };
  if (tool === "chatgpt") return { bg: C.green, letter: "G" };
  if (tool === "gemini") return { bg: C.blue, letter: "G" };
  if (tool === "copilot") return { bg: C.purple, letter: "M" };
  return { bg: C.dark, letter: "AI" };
}

function visualStyle(category: string) {
  if (category === "automate") return { bg: "linear-gradient(180deg,#fff8d9,#fff2ad)", dot: C.yellow };
  if (category === "build") return { bg: "linear-gradient(180deg,#f3eeff,#e9deff)", dot: C.purple };
  return { bg: "linear-gradient(180deg,#ecf6ff,#dff0ff)", dot: C.blue };
}

function typeLabel(category: string) {
  if (category === "automate") return "Automation";
  if (category === "build") return "Build";
  return "Chat";
}

function ActivityCard({
  activity,
  status,
  toolLogos,
  tagLogos,
}: {
  activity: Activity;
  status: string;
  toolLogos: ToolLogoMap;
  tagLogos: Record<string, string>;
}) {
  const newBadge = isNew(activity) && status !== "completed";
  const showBadge = newBadge || status === "in_progress" || status === "completed";
  const badgeLabel = status === "completed" ? "Completed" : status === "in_progress" ? "In Progress" : "New";
  const vis = visualStyle(activity.category);

  return (
    <Link href={`/activity/${activity.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <article
        style={{
          background: "white",
          border: `1px solid ${C.line}`,
          borderRadius: 24,
          padding: 14,
          minHeight: 230,
          boxShadow: "0 10px 30px rgba(34,29,35,.08)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          transition: ".16s ease",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 36px rgba(34,29,35,.13)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = "";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(34,29,35,.08)";
        }}
      >
        {/* Visual */}
        <div style={{
          position: "relative",
          minHeight: 100,
          borderRadius: 18,
          padding: 16,
          border: `1px solid ${C.line}`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: vis.bg,
        }}>
          {showBadge && (
            <span style={{
              position: "absolute", top: 12, right: 12, zIndex: 3,
              display: "inline-flex", alignItems: "center",
              padding: "5px 10px", borderRadius: 999,
              fontSize: 11, fontWeight: 900,
              ...(badgeLabel === "Completed"
                ? { background: "white", border: "1px solid rgba(35,206,107,.4)", color: "#15803d" }
                : badgeLabel === "In Progress"
                ? { background: "white", border: "1px solid rgba(54,153,252,.4)", color: "#1a6fc4" }
                : { background: "white", border: `1px solid ${C.line}`, color: "#5e5962" }
              ),
            }}>
              {badgeLabel}
            </span>
          )}
          {/* Flow — tag logos */}
          <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 12, padding: "0 6px" }}>
            <div style={{ position: "absolute", left: "14%", right: "14%", top: "50%", transform: "translateY(-50%)", borderTop: "2px dashed rgba(34,29,35,.2)", zIndex: 1 }} />
            {(activity.tags.length > 0 ? activity.tags : activity.tools).slice(0, 4).map((item, i) => {
              const isTag = activity.tags.length > 0;
              const url = isTag ? tagLogos[item.toLowerCase()] : toolLogos[item.toLowerCase()];
              return (
                <div key={i} style={{
                  width: 42, height: 42, borderRadius: 14,
                  background: "rgba(255,255,255,.96)",
                  border: `1px solid ${C.line}`,
                  display: "grid", placeItems: "center",
                  boxShadow: "0 4px 12px rgba(34,29,35,.06)",
                  position: "relative", zIndex: 2, flexShrink: 0,
                }}>
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={item} width={24} height={24} style={{ objectFit: "contain", borderRadius: 4 }} />
                  ) : isTag ? (
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.muted }}>{item.slice(0, 3).toUpperCase()}</span>
                  ) : (
                    <ToolIcon tool={item} size={22} logos={toolLogos} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Title block */}
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.04em", minHeight: "2.4em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{activity.title}</h3>
          <p style={{ margin: 0, color: C.muted, fontSize: 13.5, lineHeight: 1.45, minHeight: "calc(13.5px * 1.45 * 3)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{activity.description}</p>
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: "auto" }}>
          {/* Tool logo + name (single tool) */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {activity.tools[0] && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 9px", borderRadius: 999, border: `1px solid ${C.line}`, background: "white", fontSize: 11.5, fontWeight: 700, color: C.dark }}>
                <ToolIcon tool={activity.tools[0]} size={16} logos={toolLogos} />
                {activity.tools[0].charAt(0).toUpperCase() + activity.tools[0].slice(1)}
              </div>
            )}
          </div>
          {/* Type chip */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "7px 10px", borderRadius: 999,
            fontSize: 11, fontWeight: 900,
            border: `1px solid ${C.line}`, color: C.muted, background: "#faf8f3",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: vis.dot }} />
            {typeLabel(activity.category)}
          </div>
        </div>
      </article>
    </Link>
  );
}

const INTENT_BTNS = [
  { id: "all", icon: "✦", label: "All workflows", desc: "Browse everything available for your AI tools." },
  { id: "chat", icon: "💬", label: "Chat", desc: "Write, summarize, analyze, compare, and decide faster." },
  { id: "automate", icon: "⚡", label: "Automate", desc: "Save time on repetitive document, email, and follow-up tasks." },
  { id: "build", icon: "🛠", label: "Build", desc: "Create apps, dashboards, tools, and reusable workflows." },
];

const TOOL_FILTERS = ["all", "claude", "chatgpt", "gemini", "copilot"];

export default function DashboardClient({ profile, activities, progress, toolLogos, tagLogos }: Props) {
  const [searchQ, setSearchQ] = useState("");
  const [activeTool, setActiveTool] = useState("all");
  const [activeIntent, setActiveIntent] = useState("all");

  const progressMap = useMemo(() => {
    const m: Record<string, UserProgress> = {};
    progress.forEach(p => { m[p.activity_id] = p; });
    return m;
  }, [progress]);

  const completed = progress.filter(p => p.status === "completed").length;
  const inProgress = progress.filter(p => p.status === "in_progress").length;
  const totalPts = progress
    .filter(p => p.status === "completed")
    .reduce((s, p) => s + (activities.find(a => a.id === p.activity_id)?.points ?? 0), 0);
  const levelPct = totalPts < 100 ? (totalPts / 100) * 100
    : totalPts < 500 ? ((totalPts - 100) / 400) * 100
      : totalPts < 1000 ? ((totalPts - 500) / 500) * 100 : 100;
  const levelName = totalPts < 100 ? "Starter" : totalPts < 500 ? "Explorer" : totalPts < 1000 ? "Builder" : "Expert";
  const newCount = activities.filter(isNew).length;

  // Primary tool is always tools[0], normalised to lowercase
  const primaryTool = (a: Activity) => (a.tools[0] ?? "").toLowerCase();

  const toolRelevant = useMemo(() =>
    activities.filter(a => activeTool === "all" || primaryTool(a) === activeTool),
    [activities, activeTool] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const intentRelevant = useMemo(() =>
    toolRelevant.filter(a => activeIntent === "all" || a.category === activeIntent),
    [toolRelevant, activeIntent]
  );

  const newList = useMemo(() =>
    intentRelevant.filter(a => isNew(a) && progressMap[a.id]?.status !== "completed").slice(0, 3),
    [intentRelevant, progressMap]
  );

  const continueList = useMemo(() =>
    intentRelevant.filter(a => progressMap[a.id]?.status === "in_progress").slice(0, 3),
    [intentRelevant, progressMap]
  );

  const filtered = useMemo(() => {
    const q = searchQ.toLowerCase();
    return activities.filter(a => {
      const status = progressMap[a.id]?.status ?? "not_started";
      const text = `${a.title} ${a.description} ${primaryTool(a)} ${a.level} ${a.category} ${status}`.toLowerCase();
      const toolOk = activeTool === "all" || primaryTool(a) === activeTool;
      const intentOk = activeIntent === "all" || a.category === activeIntent;
      const searchOk = !q || text.includes(q);
      return toolOk && intentOk && searchOk;
    });
  }, [activities, progressMap, searchQ, activeTool, activeIntent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group filtered activities by tool (already sorted by tool + position from server)
  const filteredByTool = useMemo(() => {
    const toolOrder = Array.from(new Set(filtered.map(primaryTool)));
    return toolOrder.map(t => ({
      tool: t,
      items: filtered.filter(a => primaryTool(a) === t),
    }));
  }, [filtered]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function scrollToLibrary() {
    document.getElementById("library")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", color: C.dark }}>
      <Topbar profile={profile} role={profile?.role} onSignOut={handleSignOut} />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "44px 32px 80px" }}>

        {/* ── Hero ── */}
        <section style={{ textAlign: "center", maxWidth: 900, margin: "0 auto 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", border: `1px solid ${C.line}`, color: "#a45b00", borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 850, boxShadow: "0 10px 30px rgba(34,29,35,.08)" }}>
            ★ New applications added every week
          </div>
          <h1 style={{ margin: "20px 0 10px", fontSize: "clamp(34px,5vw,48px)", fontWeight: 900, lineHeight: .96, letterSpacing: "-.065em" }}>
            Keep pace with practical AI workflows
          </h1>
          <p style={{ margin: 0, color: C.muted, fontSize: 17 }}>
            Pick the AI tool you have. Choose a work problem. Practice with guided screenshots and videos.
          </p>

          {/* Search bar */}
          <div style={{ maxWidth: 820, margin: "28px auto 0", display: "flex", gap: 10, background: "white", padding: 10, borderRadius: 999, border: `1px solid ${C.line}`, boxShadow: "0 10px 30px rgba(34,29,35,.08)" }}>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              type="search"
              placeholder="Search activities, tools, topics, or work problems..."
              suppressHydrationWarning
              style={{ flex: 1, border: 0, outline: 0, padding: "0 16px", fontSize: 15, background: "transparent", color: C.dark, fontFamily: "inherit" }}
            />
            <button
              onClick={scrollToLibrary}
              style={{ border: 0, background: C.yellow, color: C.dark, fontWeight: 900, padding: "13px 28px", borderRadius: 999, boxShadow: `2px 2px 0 ${C.dark}`, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}
            >
              Search
            </button>
          </div>
        </section>

        {/* ── Selector panel ── */}
        <section style={{ background: "white", border: `1px solid ${C.line}`, borderRadius: 28, boxShadow: "0 10px 30px rgba(34,29,35,.08)", padding: 18, margin: "0 0 26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, letterSpacing: "-.03em" }}>Start with your AI tool</h2>
              {/* <div style={{ color: C.muted, fontSize: 13, fontWeight: 650, marginTop: 3 }}>
                Select your tool to see the most relevant workflows first.
              </div> */}
            </div>
            <div style={{ color: C.muted, fontSize: 13, fontWeight: 650 }}>
              {filtered.length} workflow{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Tool chips */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            {TOOL_FILTERS.map(t => {
              const active = activeTool === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTool(t)}
                  style={{
                    border: `1px solid ${active ? C.dark : C.line}`,
                    background: active ? C.dark : "white",
                    borderRadius: 999, padding: "10px 15px",
                    fontSize: 14, fontWeight: 850,
                    color: active ? "white" : C.dark,
                    display: "flex", alignItems: "center", gap: 8,
                    cursor: "pointer",
                    boxShadow: active ? `2px 2px 0 ${C.yellow}` : "none",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid currentColor", display: "inline-block", background: toolDot(t) }} />
                  {t === "all" ? "All tools" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Intent grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {INTENT_BTNS.map(btn => {
              const active = activeIntent === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setActiveIntent(btn.id)}
                  style={{
                    textAlign: "left",
                    border: `1px solid ${active ? "#f0bd00" : C.line}`,
                    background: active ? C.lightYellow : C.soft,
                    padding: 16, borderRadius: 20, minHeight: 104,
                    cursor: "pointer", fontFamily: "inherit",
                    boxShadow: active ? `3px 3px 0 ${C.dark}` : "none",
                    transition: ".12s ease",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 12, background: "white", border: `1px solid ${C.line}`, display: "grid", placeItems: "center", marginBottom: 10, fontSize: 16 }}>
                    {btn.icon}
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 15, letterSpacing: "-.03em" }}>{btn.label}</h3>
                  <p style={{ margin: 0, fontSize: 12.5, color: C.muted, lineHeight: 1.35 }}>{btn.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Main layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 330px", gap: 24, alignItems: "start" }}>

          {/* Left column */}
          <div>

            {/* New this week — only featured activities */}
            {newList.length > 0 && (
              <section style={{ marginBottom: 34 }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 23, letterSpacing: "-.045em" }}>New this week</h2>
                    <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 14 }}>Fresh workflows you can practice right away.</p>
                  </div>
                  <button
                    onClick={scrollToLibrary}
                    style={{ border: 0, background: "transparent", color: C.purple, fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                  >
                    View all new
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 }}>
                  {newList.map(a => (
                    <ActivityCard key={a.id} activity={a} status={progressMap[a.id]?.status ?? "not_started"} toolLogos={toolLogos} tagLogos={tagLogos} />
                  ))}
                </div>
              </section>
            )}

            {/* Continue */}
            {continueList.length > 0 && (
              <section style={{ marginBottom: 34 }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 23, letterSpacing: "-.045em" }}>Continue where you left off</h2>
                    <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 14 }}>Jump back into unfinished workflows.</p>
                  </div>
                  <button
                    onClick={scrollToLibrary}
                    style={{ border: 0, background: "transparent", color: C.purple, fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                  >
                    View in progress
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 }}>
                  {continueList.map(a => (
                    <ActivityCard key={a.id} activity={a} status="in_progress" toolLogos={toolLogos} tagLogos={tagLogos} />
                  ))}
                </div>
              </section>
            )}

            {/* Full library */}
            <section id="library" style={{ marginBottom: 34 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 23, letterSpacing: "-.045em" }}>Full workflow library</h2>
                  <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 14 }}>Use filters when you want to browse everything.</p>
                </div>
              </div>

              <div style={{ background: "white", border: `1px solid ${C.line}`, borderRadius: 28, padding: 16, boxShadow: "0 10px 30px rgba(34,29,35,.08)" }}>
                {filtered.length === 0 ? (
                  <div style={{ border: "1px dashed #d7d0c2", borderRadius: 22, padding: 26, textAlign: "center", color: C.muted, fontWeight: 750 }}>
                    No matching workflows. Try changing the tool, intent, or search term.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    {filteredByTool.map(({ tool: t, items }) => (
                      <div key={t}>
                        {/* Tool group header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: toolDot(t), display: "inline-block" }} />
                            <span style={{ fontSize: 13, fontWeight: 900, textTransform: "capitalize", color: C.dark, letterSpacing: "-.02em" }}>{t || "Other"}</span>
                          </div>
                          <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{items.length} workflow{items.length !== 1 ? "s" : ""}</span>
                          <div style={{ flex: 1, height: 1, background: C.line }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 }}>
                          {items.map(a => (
                            <ActivityCard key={a.id} activity={a} status={progressMap[a.id]?.status ?? "not_started"} toolLogos={toolLogos} tagLogos={tagLogos} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ── Sidebar ── */}
          <aside style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Progress card */}
            <section style={{ background: "white", border: `1px solid ${C.line}`, borderRadius: 26, padding: 20, boxShadow: "0 10px 30px rgba(34,29,35,.08)" }}>
              <h3 style={{ margin: "0 0 14px", letterSpacing: "-.03em", fontSize: 18 }}>Your AI Work Pace</h3>

              {/* Level box */}
              <div style={{ color: "white", background: `radial-gradient(circle at 80% 20%,rgba(255,206,0,.35),transparent 26%),${C.dark}`, borderRadius: 18, padding: 18, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#d6d0ca", textTransform: "uppercase", letterSpacing: ".18em", fontWeight: 900 }}>Current level</div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}>
                  <strong style={{ fontSize: 24, letterSpacing: "-.05em" }}>{levelName}</strong>
                  <span style={{ color: C.yellow, fontWeight: 900, fontSize: 13 }}>{totalPts} pts</span>
                </div>
                <div style={{ height: 8, background: "#4a414d", borderRadius: 999, overflow: "hidden", marginTop: 14 }}>
                  <div style={{ width: `${Math.min(levelPct, 100)}%`, height: "100%", background: C.yellow }} />
                </div>
              </div>

              {/* Stat grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Completed", value: completed, bg: "#fbf7e6" },
                  { label: "In progress", value: inProgress, bg: "#eef6ff" },
                  { label: "New this week", value: newCount, bg: "#f0fff5" },
                  { label: "Available", value: activities.length, bg: "#fff2e8" },
                ].map((tile, i) => (
                  <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 16, background: tile.bg, padding: 13 }}>
                    <div style={{ color: C.muted, fontSize: 11, fontWeight: 850, marginBottom: 6 }}>{tile.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: "-.05em" }}>{tile.value}</div>
                  </div>
                ))}
              </div>

              {/* Pace callout */}
              {(() => {
                const nextLevel = levelName === "Starter" ? "Explorer"
                  : levelName === "Explorer" ? "Builder"
                  : levelName === "Builder" ? "Expert"
                  : null;
                const ptsNeeded = levelName === "Starter" ? 100 - totalPts
                  : levelName === "Explorer" ? 500 - totalPts
                  : levelName === "Builder" ? 1000 - totalPts
                  : 0;
                const avgPts = completed > 0 ? Math.round(totalPts / completed) : 50;
                const estWorkflows = Math.ceil(ptsNeeded / Math.max(avgPts, 25));
                const isClose = levelPct >= 75;

                let icon = "🚀";
                let line1 = "";
                let line2 = "";

                if (!nextLevel) {
                  icon = "🏆";
                  line1 = "Expert level reached!";
                  line2 = "Keep completing workflows to stay ahead.";
                } else if (completed === 0 && inProgress === 0) {
                  icon = "👋";
                  line1 = "Start your first workflow.";
                  line2 = `Complete any activity to earn points toward ${nextLevel}.`;
                } else if (completed === 0 && inProgress > 0) {
                  icon = "⚡";
                  line1 = `${inProgress} workflow${inProgress !== 1 ? "s" : ""} in progress.`;
                  line2 = "Finish one to earn your first points and level up.";
                } else if (isClose) {
                  icon = "🎯";
                  line1 = `Almost ${nextLevel}!`;
                  line2 = "You're so close — just keep going.";
                } else {
                  icon = "📈";
                  line1 = `Next: ${nextLevel}`;
                  line2 = `Keep completing workflows to get there.`;
                }

                return (
                  <div style={{ padding: 13, borderRadius: 16, background: C.lightYellow, border: "1px solid #f3d25a" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3, color: C.dark }}>{line1}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, color: C.muted, marginTop: 2 }}>{line2}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* News card — driven by is_featured activities */}
            {activities.filter(a => a.is_featured).length > 0 && (
              <section style={{ background: "white", border: `1px solid ${C.line}`, borderRadius: 26, padding: 20, boxShadow: "0 10px 30px rgba(34,29,35,.08)" }}>
                <h3 style={{ margin: "0 0 14px", letterSpacing: "-.03em", fontSize: 18 }}>This week in AI work</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {activities.filter(a => a.is_featured).map(a => {
                    const primary = a.tools[0] ?? "claude";
                    const bot = botBadge(primary);
                    return (
                      <Link key={a.id} href={`/activity/${a.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, alignItems: "start", padding: 11, border: `1px solid ${C.line}`, borderRadius: 16, background: "#fbfaf7", cursor: "pointer", transition: ".12s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f4f1ea"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fbfaf7"}
                        >
                          <div style={{ width: 34, height: 34, borderRadius: 12, display: "grid", placeItems: "center", background: bot.bg, color: "white", fontWeight: 950, fontSize: 14 }}>{bot.letter}</div>
                          <div>
                            <strong style={{ display: "block", fontSize: 13, lineHeight: 1.25, marginBottom: 2 }}>{a.title}</strong>
                            <span style={{ color: C.muted, fontSize: 12, fontWeight: 650 }}>{typeLabel(a.category)}{a.level ? ` · ${a.level}` : ""}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
