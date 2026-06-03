"use client";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Module, Activity, UserProgress, Profile } from "@/lib/supabase/types";
import Topbar from "@/components/Topbar";

type Props = {
  profile: Profile & { companies: { name: string } | null };
  modules: (Module & { activities: Activity[] })[];
  progress: UserProgress[];
};

const TOOL_LOGOS: Record<string, { bg: string; label: string }> = {
  claude:    { bg: "#c15f3c",   label: "Cl" },
  gemini:    { bg: "linear-gradient(135deg,#4285f4,#a142f4)", label: "G" },
  chatgpt:   { bg: "#10a37f",  label: "C" },
  copilot:   { bg: "linear-gradient(135deg,#00a4ef,#7fba00)", label: "Co" },
  drive:     { bg: "#fbbc04",  label: "D" },
  sheets:    { bg: "#0f9d58",  label: "S" },
  gmail:     { bg: "#ea4335",  label: "M" },
  calendar:  { bg: "#1a73e8",  label: "Ca" },
  vapi:      { bg: "#111827",  label: "V" },
  wati:      { bg: "#22c55e",  label: "W" },
  lovable:   { bg: "#ff477e",  label: "L" },
  napkin:    { bg: "#8b5cf6",  label: "N" },
  "ai-studio": { bg: "#3b82f6", label: "AI" },
  notebooklm: { bg: "#fbbc04", label: "NB" },
};

const CATEGORY_META: Record<string, { label: string; icon: string; stripe: string; bg: string }> = {
  chat:     { label: "Chatbot Feature", icon: "✦", stripe: "linear-gradient(90deg,#623CEA,#3696FC)", bg: "linear-gradient(180deg,#fff,#faf9ff)" },
  automate: { label: "Work Automation", icon: "⚡", stripe: "linear-gradient(90deg,#F68A29,#FFCE00)", bg: "linear-gradient(180deg,#fff,#fffcf5)" },
  build:    { label: "Vibe Coding",     icon: "🛠", stripe: "linear-gradient(90deg,#23CE68,#3696FC)", bg: "linear-gradient(180deg,#fff,#f5fff9)" },
};

function statusChip(status: string, pct?: number) {
  if (status === "completed")  return { label: "Completed",    cls: { background: "rgba(35,206,104,.12)", color: "#17A855" } };
  if (status === "in_progress") return { label: `${pct ?? 0}% done`, cls: { background: "rgba(54,150,252,.12)", color: "#1A7FD4" } };
  return { label: "Not Started", cls: { background: "#F0EEE8", color: "#6B6B6B" } };
}

function ToolLogo({ tool }: { tool: string }) {
  const meta = TOOL_LOGOS[tool] ?? { bg: "#888", label: tool.slice(0,2).toUpperCase() };
  return (
    <span style={{
      height: 28, display: "inline-flex", alignItems: "center", gap: 5,
      padding: "0 8px 0 4px", border: "1px solid #E8E6DC", background: "white",
      borderRadius: 999, boxShadow: "0 1px 3px rgba(34,29,35,.04)",
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: 6, display: "inline-grid", placeItems: "center",
        fontSize: 9.5, fontWeight: 900, color: "white", background: meta.bg, flexShrink: 0,
      }}>{meta.label}</span>
      <span style={{ fontSize: 11, color: "#444", fontWeight: 700 }}>{tool}</span>
    </span>
  );
}

function ActivityCard({ activity, status, progress }: {
  activity: Activity;
  status: "not_started" | "in_progress" | "completed";
  progress?: UserProgress;
}) {
  const cat = CATEGORY_META[activity.module_id] ?? CATEGORY_META.chat; // fallback
  const chip = statusChip(status);
  const visibleTools = activity.tools.slice(0, 2);
  const extra = activity.tools.length - 2;

  return (
    <article
      onClick={() => window.location.href = `/activity/${activity.id}`}
      style={{
        position: "relative", minHeight: 248, padding: 15, display: "flex",
        flexDirection: "column", overflow: "hidden", borderRadius: 20,
        background: "white", border: "1px solid #E8E6DC",
        boxShadow: "0 2px 12px rgba(34,29,35,.07)",
        cursor: "pointer", transition: ".17s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(34,29,35,.13)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(34,29,35,.07)";
      }}
    >
      {/* Top stripe */}
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 4, background: "#623CEA", borderRadius: "20px 20px 0 0" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 24, marginBottom: 11, marginTop: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 800, ...chip.cls }}>{chip.label}</span>
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 999, border: "1px solid rgba(98,60,234,.2)", background: "rgba(98,60,234,.08)", color: "#5030C0", fontSize: 10.5, fontWeight: 800, marginBottom: 9, width: "fit-content" }}>
        ✦ Activity
      </div>

      <h3 style={{ margin: "0 0 6px", fontSize: 16.5, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.03em" }}>{activity.title}</h3>
      <p style={{ margin: "0 0 10px", color: "#6B6B6B", fontSize: 12.5, lineHeight: 1.45, minHeight: 34, flex: 1 }}>{activity.description}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {visibleTools.map(t => <ToolLogo key={t} tool={t} />)}
        {extra > 0 && <span style={{ height: 28, padding: "0 8px", display: "inline-flex", alignItems: "center", borderRadius: 999, background: "#F0EEE8", color: "#6B6B6B", fontSize: 11, fontWeight: 800 }}>+{extra}</span>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 10, borderTop: "1px solid rgba(232,230,220,.9)" }}>
        {activity.time_estimate_minutes && (
          <span style={{ height: 26, display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, padding: "0 8px", fontSize: 11, fontWeight: 700, background: "rgba(54,150,252,.1)", color: "#1A7FD4", border: "1px solid rgba(54,150,252,.22)" }}>
            ⏱ {activity.time_estimate_minutes}m
          </span>
        )}
        {activity.level && (
          <span style={{ height: 26, display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, padding: "0 8px", fontSize: 11, fontWeight: 700, background: "rgba(246,138,41,.1)", color: "#B05000", border: "1px solid rgba(246,138,41,.25)" }}>
            ◆ {activity.level}
          </span>
        )}
        <span style={{ height: 26, display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, padding: "0 8px", fontSize: 11, fontWeight: 700, background: "rgba(255,206,0,.16)", color: "#7A5F00", border: "1px solid rgba(255,206,0,.35)" }}>
          + {activity.points} pts
        </span>
      </div>
    </article>
  );
}

export default function DashboardClient({ profile, modules, progress }: Props) {
  const [searchQ, setSearchQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeTool, setActiveTool] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  const progressMap = useMemo(() => {
    const m: Record<string, UserProgress> = {};
    progress.forEach(p => { m[p.activity_id] = p; });
    return m;
  }, [progress]);

  const allActivities = useMemo(() =>
    modules.flatMap(mod => mod.activities.map(a => ({ ...a, module: mod }))),
    [modules]
  );

  const completed = progress.filter(p => p.status === "completed").length;
  const inProgress = progress.filter(p => p.status === "in_progress").length;
  const totalPts = progress.filter(p => p.status === "completed")
    .reduce((s, p) => {
      const act = allActivities.find(a => a.id === p.activity_id);
      return s + (act?.points ?? 0);
    }, 0);

  const recentModules = modules.slice(0, 3);
  const continueActivities = allActivities.filter(a => progressMap[a.id]?.status === "in_progress").slice(0, 3);

  const filteredActivities = useMemo(() => {
    const q = searchQ.toLowerCase();
    return allActivities.filter(a => {
      const prog = progressMap[a.id];
      const status = prog?.status ?? "not_started";
      const text = `${a.title} ${a.description} ${a.tools.join(" ")} ${a.level} ${status}`.toLowerCase();

      const matchTab = activeTab === "all" || a.module.categories?.includes(activeTab);
      const matchTool = activeTool === "all" || a.tools.includes(activeTool);
      const matchQ = !q || text.includes(q);
      let matchFilter = true;
      if (activeFilter === "beginner")    matchFilter = a.level === "Beginner";
      if (activeFilter === "short")       matchFilter = (a.time_estimate_minutes ?? 99) <= 15;
      if (activeFilter === "notstarted")  matchFilter = status === "not_started";
      if (activeFilter === "mytool")      matchFilter = matchTool;

      return matchTab && matchTool && matchQ && (activeFilter === "mytool" ? matchTool : matchFilter);
    });
  }, [allActivities, progressMap, searchQ, activeTab, activeTool, activeFilter]);

  const tools = ["all", "claude", "gemini", "chatgpt", "copilot"];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", color: "#221D23" }}>
      <Topbar profile={profile} role={profile?.role} onSignOut={handleSignOut} />

      <main style={{ width: "min(1180px, calc(100% - 48px))", margin: "0 auto" }}>
        {/* Hero */}
        <section style={{ padding: "44px 0 22px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", gap: 6, alignItems: "center", padding: "6px 13px", borderRadius: 999, background: "white", border: "1px solid #E8E6DC", color: "#F68A29", fontSize: 11.5, fontWeight: 700, marginBottom: 18, letterSpacing: ".02em", boxShadow: "0 1px 6px rgba(34,29,35,.05)" }}>
            ★ New activities added every week
          </div>
          <h1 style={{ maxWidth: 740, margin: "0 auto 14px", fontSize: "clamp(30px,5vw,50px)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-.055em" }}>
            Practical AI workflows for everyday work
          </h1>
          <p style={{ maxWidth: 520, margin: "0 auto 26px", color: "#6B6B6B", fontSize: 15, lineHeight: 1.5 }}>
            Pick your chatbot. Pick a problem. Build or practice.
          </p>

          {/* Search */}
          <div style={{ maxWidth: 740, height: 60, margin: "0 auto 16px", display: "flex", alignItems: "center", gap: 10, padding: "0 7px 0 16px", background: "white", border: "1.5px solid #E8E6DC", borderRadius: 999, boxShadow: "0 2px 12px rgba(34,29,35,.07)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B0ABA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search features, automations, tools, or prompts…"
              style={{ flex: 1, border: 0, outline: 0, fontSize: 14.5, background: "transparent", color: "#221D23", fontFamily: "inherit" }}
            />
            <button onClick={() => {}} style={{ border: 0, borderRadius: 999, padding: "10px 22px", color: "#221D23", fontWeight: 800, fontSize: 13, background: "#FFCE00", cursor: "pointer" }}>
              Search
            </button>
          </div>

          {/* Tool pills */}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 7 }}>
            {tools.map(t => (
              <button key={t} onClick={() => setActiveTool(t)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                borderRadius: 999, border: "1.5px solid",
                borderColor: activeTool === t ? "#FFCE00" : "#E8E6DC",
                background: activeTool === t ? "#FFCE00" : "white",
                color: activeTool === t ? "#221D23" : "#4A4848",
                fontWeight: 700, fontSize: 12.5, cursor: "pointer",
                boxShadow: activeTool === t ? "0 4px 14px rgba(255,206,0,.28)" : "none",
              }}>
                {t === "all" ? "All tools" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 308px", gap: 22, alignItems: "start", padding: "22px 0 56px" }}>
          <div>
            {/* Recently added */}
            {recentModules.length > 0 && (
              <section style={{ marginBottom: 26 }}>
                <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, letterSpacing: "-.04em" }}>Newly added</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 13 }}>
                  {recentModules.flatMap(mod => mod.activities.slice(0, 1)).map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      status={progressMap[activity.id]?.status ?? "not_started"}
                      progress={progressMap[activity.id]}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Continue */}
            {continueActivities.length > 0 && (
              <section style={{ marginBottom: 26 }}>
                <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, letterSpacing: "-.04em" }}>Continue where you left off</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 13 }}>
                  {continueActivities.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      status="in_progress"
                      progress={progressMap[activity.id]}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Explore all */}
            <section style={{ marginBottom: 26 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, letterSpacing: "-.04em" }}>Explore all activities</h2>
              <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 15, boxShadow: "0 2px 12px rgba(34,29,35,.07)" }}>
                {/* Tabs */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 11, marginBottom: 11, borderBottom: "1px solid #E8E6DC" }}>
                  {[{ id: "all", label: "⭐ All" }, { id: "chat", label: "✦ Chatbot" }, { id: "automate", label: "⚡ Automation" }, { id: "build", label: "🛠 Vibe Coding" }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                      border: "1.5px solid", borderColor: activeTab === tab.id ? "#221D23" : "#E8E6DC",
                      background: activeTab === tab.id ? "#221D23" : "transparent",
                      color: activeTab === tab.id ? "white" : "#6B6B6B",
                      padding: "8px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}>{tab.label}</button>
                  ))}
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {[{ id: "all", label: "All" }, { id: "beginner", label: "Beginner" }, { id: "short", label: "≤ 15 min" }, { id: "notstarted", label: "Not Started" }, { id: "mytool", label: "My Chatbot" }].map(f => (
                    <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{
                      border: "1.5px solid",
                      borderColor: activeFilter === f.id ? "rgba(246,138,41,.28)" : "transparent",
                      background: activeFilter === f.id ? "#FFF6CF" : "#F2F0EB",
                      color: activeFilter === f.id ? "#F68A29" : "#6B6B6B",
                      padding: "6px 11px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                    }}>{f.label}</button>
                  ))}
                </div>

                {filteredActivities.length === 0 ? (
                  <div style={{ padding: 36, border: "1.5px dashed #D5D0C8", borderRadius: 20, textAlign: "center", color: "#6B6B6B", fontSize: 13.5 }}>
                    No matching activities. Try a different search or filter.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 13 }}>
                    {filteredActivities.map(activity => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        status={progressMap[activity.id]?.status ?? "not_started"}
                        progress={progressMap[activity.id]}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside style={{ position: "sticky", top: 82 }}>
            <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 16, boxShadow: "0 2px 12px rgba(34,29,35,.07)" }}>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.03em", marginBottom: 13 }}>Your progress</div>

              {/* Level card */}
              <div style={{
                padding: 15, borderRadius: 15, color: "white", marginBottom: 13,
                background: "radial-gradient(circle at 80% 20%,rgba(255,206,0,.25),transparent 42%),#221D23",
                border: "1px solid rgba(255,255,255,.05)",
              }}>
                <div style={{ color: "rgba(255,255,255,.5)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 7 }}>Current Level</div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-.05em" }}>
                    {totalPts < 100 ? "Starter" : totalPts < 300 ? "Explorer" : totalPts < 600 ? "Builder" : "Expert"}
                  </div>
                  <div style={{ color: "#FFCE00", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{totalPts} pts</div>
                </div>
                <div style={{ height: 6, overflow: "hidden", borderRadius: 999, background: "rgba(255,255,255,.15)" }}>
                  <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#FFCE00,#F68A29)", width: `${Math.min((totalPts % 300) / 3, 100)}%` }} />
                </div>
              </div>

              {/* Summary tiles */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 7, marginBottom: 14 }}>
                {[
                  { label: "✓ Completed", value: completed, bg: "rgba(35,206,104,.08)", border: "rgba(35,206,104,.2)" },
                  { label: "↻ In Progress", value: inProgress, bg: "rgba(54,150,252,.08)", border: "rgba(54,150,252,.2)" },
                  { label: "+ Points", value: totalPts, bg: "rgba(255,206,0,.12)", border: "rgba(255,206,0,.3)" },
                  { label: "◆ Activities", value: allActivities.length, bg: "rgba(246,138,41,.08)", border: "rgba(246,138,41,.2)" },
                ].map((tile, i) => (
                  <div key={i} style={{ borderRadius: 13, padding: "11px 10px", border: `1px solid ${tile.border}`, background: tile.bg }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6B6B6B", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{tile.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-.05em" }}>{tile.value}</div>
                  </div>
                ))}
              </div>

              {/* Category progress */}
              {[
                { label: "Chatbot Features", key: "chat", color: "linear-gradient(90deg,#623CEA,#3696FC)" },
                { label: "Work Automation", key: "automate", color: "linear-gradient(90deg,#F68A29,#FFCE00)" },
                { label: "Vibe Coding", key: "build", color: "linear-gradient(90deg,#23CE68,#3696FC)" },
              ].map(cat => {
                const catActivities = allActivities.filter(a => a.module.categories?.includes(cat.key));
                const catDone = catActivities.filter(a => progressMap[a.id]?.status === "completed").length;
                const pct = catActivities.length ? (catDone / catActivities.length) * 100 : 0;
                return (
                  <div key={cat.key} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      <span>{cat.label}</span>
                      <span style={{ color: "#6B6B6B", fontWeight: 600 }}>{catDone} / {catActivities.length}</span>
                    </div>
                    <div style={{ height: 6, background: "#ECEAE4", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 999, background: cat.color, width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
