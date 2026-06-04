"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Activity, UserProgress, Profile } from "@/lib/supabase/types";
import Topbar from "@/components/Topbar";

type Props = {
  profile: Profile & { companies: { name: string } | null };
  activities: (Activity & { activity_content: { id: string } | null })[];
  progress: UserProgress[];
};

const TOOL_LOGOS: Record<string, { bg: string; label: string }> = {
  claude: { bg: "#c15f3c", label: "Cl" },
  gemini: { bg: "linear-gradient(135deg,#4285f4,#a142f4)", label: "G" },
  chatgpt: { bg: "#10a37f", label: "C" },
  copilot: { bg: "linear-gradient(135deg,#00a4ef,#7fba00)", label: "Co" },
  drive: { bg: "#fbbc04", label: "D" },
  sheets: { bg: "#0f9d58", label: "S" },
  gmail: { bg: "#ea4335", label: "M" },
  calendar: { bg: "#1a73e8", label: "Ca" },
  vapi: { bg: "#111827", label: "V" },
  wati: { bg: "#22c55e", label: "W" },
  lovable: { bg: "#ff477e", label: "L" },
  napkin: { bg: "#8b5cf6", label: "N" },
  "ai-studio": { bg: "#3b82f6", label: "AI" },
  notebooklm: { bg: "#fbbc04", label: "NB" },
};

const CAT_META: Record<string, { icon: string; label: string; stripe: string; pill: { bg: string; color: string; border: string } }> = {
  chat: { icon: "✦", label: "Chatbot Feature", stripe: "linear-gradient(90deg,#623CEA,#3696FC)", pill: { bg: "rgba(98,60,234,.08)", color: "#5030C0", border: "rgba(98,60,234,.2)" } },
  build: { icon: "🛠", label: "Build with AI", stripe: "linear-gradient(90deg,#23CE68,#3696FC)", pill: { bg: "rgba(35,206,104,.08)", color: "#17A855", border: "rgba(35,206,104,.2)" } },
  automate: { icon: "⚡", label: "Work Automation", stripe: "linear-gradient(90deg,#F68A29,#FFCE00)", pill: { bg: "rgba(246,138,41,.08)", color: "#B05000", border: "rgba(246,138,41,.2)" } },
};

function statusChip(status: string) {
  if (status === "completed") return { label: "Completed", bg: "rgba(35,206,104,.12)", color: "#17A855" };
  if (status === "in_progress") return { label: "In Progress", bg: "rgba(54,150,252,.12)", color: "#1A7FD4" };
  return { label: "Not Started", bg: "#F0EEE8", color: "#6B6B6B" };
}

function ActivityCard({ activity, status }: { activity: Activity; status: string }) {
  const cat = CAT_META[activity.category] ?? CAT_META.chat;
  const chip = statusChip(status);
  const visible = activity.tools.slice(0, 2);
  const extra = activity.tools.length - 2;

  return (
    <Link href={`/activity/${activity.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <article
        style={{ position: "relative", minHeight: 232, padding: 15, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 20, background: "white", border: "1px solid #E8E6DC", boxShadow: "0 2px 12px rgba(34,29,35,.07)", cursor: "pointer", transition: ".17s ease" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(34,29,35,.13)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(34,29,35,.07)"; }}
      >
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: 4, background: cat.stripe, borderRadius: "20px 20px 0 0" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: 8 }}>
          <span style={{ padding: "4px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 800, background: chip.bg, color: chip.color }}>{chip.label}</span>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 999, border: `1px solid ${cat.pill.border}`, background: cat.pill.bg, color: cat.pill.color, fontSize: 10.5, fontWeight: 800, marginBottom: 8, width: "fit-content" }}>
          {cat.icon} {cat.label}
        </div>
        <h3 style={{ margin: "0 0 5px", fontSize: 15.5, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.03em" }}>{activity.title}</h3>
        <p style={{ margin: "0 0 10px", color: "#6B6B6B", fontSize: 12.5, lineHeight: 1.45, flex: 1 }}>{activity.description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          {visible.map(t => {
            const logo = TOOL_LOGOS[t] ?? { bg: "#888", label: t.slice(0, 2).toUpperCase() };
            return (
              <span key={t} style={{ height: 26, display: "inline-flex", alignItems: "center", gap: 5, padding: "0 8px 0 4px", border: "1px solid #E8E6DC", background: "white", borderRadius: 999 }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, display: "inline-grid", placeItems: "center", fontSize: 8, fontWeight: 900, color: "white", background: logo.bg, flexShrink: 0 }}>{logo.label}</span>
                <span style={{ fontSize: 11, color: "#444", fontWeight: 700 }}>{t}</span>
              </span>
            );
          })}
          {extra > 0 && <span style={{ height: 26, padding: "0 8px", display: "inline-flex", alignItems: "center", borderRadius: 999, background: "#F0EEE8", color: "#6B6B6B", fontSize: 11, fontWeight: 800 }}>+{extra}</span>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 10, borderTop: "1px solid rgba(232,230,220,.9)" }}>
          {activity.time_estimate_minutes && (
            <span style={{ height: 24, display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "0 8px", fontSize: 11, fontWeight: 700, background: "rgba(54,150,252,.1)", color: "#1A7FD4", border: "1px solid rgba(54,150,252,.22)" }}>⏱ {activity.time_estimate_minutes}m</span>
          )}
          {activity.level && (
            <span style={{ height: 24, display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "0 8px", fontSize: 11, fontWeight: 700, background: "rgba(246,138,41,.1)", color: "#B05000", border: "1px solid rgba(246,138,41,.25)" }}>◆ {activity.level}</span>
          )}
          <span style={{ height: 24, display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "0 8px", fontSize: 11, fontWeight: 700, background: "rgba(255,206,0,.16)", color: "#7A5F00", border: "1px solid rgba(255,206,0,.35)" }}>+ {activity.points} pts</span>
        </div>
      </article>
    </Link>
  );
}

export default function DashboardClient({ profile, activities, progress }: Props) {
  const [searchQ, setSearchQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeTool, setActiveTool] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  const progressMap = useMemo(() => {
    const m: Record<string, UserProgress> = {};
    progress.forEach(p => { m[p.activity_id] = p; });
    return m;
  }, [progress]);

  const completed = progress.filter(p => p.status === "completed").length;
  const inProgress = progress.filter(p => p.status === "in_progress").length;
  const totalPts = progress.filter(p => p.status === "completed")
    .reduce((s, p) => s + (activities.find(a => a.id === p.activity_id)?.points ?? 0), 0);

  const recentActivities = activities.slice(0, 3);
  const continueActivities = activities.filter(a => progressMap[a.id]?.status === "in_progress").slice(0, 3);

  const filtered = useMemo(() => {
    const q = searchQ.toLowerCase();
    return activities.filter(a => {
      const status = progressMap[a.id]?.status ?? "not_started";
      const text = `${a.title} ${a.description} ${a.tools.join(" ")} ${a.level} ${a.category} ${status}`.toLowerCase();
      const matchTab = activeTab === "all" || a.category === activeTab;
      const matchTool = activeTool === "all" || a.tools.includes(activeTool);
      const matchQ = !q || text.includes(q);
      let matchFilter = true;
      if (activeFilter === "beginner") matchFilter = a.level === "Beginner";
      if (activeFilter === "short") matchFilter = (a.time_estimate_minutes ?? 99) <= 15;
      if (activeFilter === "notstarted") matchFilter = status === "not_started";
      if (activeFilter === "mytool") matchFilter = matchTool;
      return matchTab && matchTool && matchQ && (activeFilter === "mytool" ? matchTool : matchFilter);
    });
  }, [activities, progressMap, searchQ, activeTab, activeTool, activeFilter]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const tools = ["all", "claude", "gemini", "chatgpt", "copilot"];

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 13px", borderRadius: 999, border: "1.5px solid",
    borderColor: active ? "#221D23" : "#E8E6DC",
    background: active ? "#221D23" : "transparent",
    color: active ? "white" : "#6B6B6B",
    fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap",
  });

  const filterBtn = (active: boolean): React.CSSProperties => ({
    border: "1.5px solid",
    borderColor: active ? "rgba(246,138,41,.28)" : "transparent",
    background: active ? "#FFF6CF" : "#F2F0EB",
    color: active ? "#F68A29" : "#6B6B6B",
    padding: "6px 11px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
  });

  const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 13 };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", color: "#221D23" }}>
      <Topbar profile={profile} role={profile?.role} onSignOut={handleSignOut} />

      <main style={{ width: "min(1180px,calc(100% - 48px))", margin: "0 auto" }}>
        {/* Hero */}
        <section style={{ padding: "44px 0 22px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", gap: 6, alignItems: "center", padding: "6px 13px", borderRadius: 999, background: "white", border: "1px solid #E8E6DC", color: "#F68A29", fontSize: 11.5, fontWeight: 700, marginBottom: 18, letterSpacing: ".02em" }}>
            ★ New applications added every week
          </div>
          <h1 style={{ maxWidth: 740, margin: "0 auto 14px", fontSize: "clamp(28px,5vw,48px)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-.05em" }}>
            Practical AI workflows for everyday work
          </h1>
          <p style={{ maxWidth: 520, margin: "0 auto 26px", color: "#6B6B6B", fontSize: 15, lineHeight: 1.5 }}>
            Pick your chatbot. Pick a problem. Build or practice.
          </p>
          {/* Search */}
          <div style={{ maxWidth: 740, height: 60, margin: "0 auto 16px", display: "flex", alignItems: "center", gap: 10, padding: "0 7px 0 16px", background: "white", border: "1.5px solid #E8E6DC", borderRadius: 999, boxShadow: "0 2px 12px rgba(34,29,35,.07)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B0ABA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search activities, tools, or topics…"
              suppressHydrationWarning
              style={{ flex: 1, border: 0, outline: 0, fontSize: 14.5, background: "transparent", color: "#221D23", fontFamily: "inherit" }} />
            <button style={{ border: 0, borderRadius: 999, padding: "10px 22px", color: "#221D23", fontWeight: 800, fontSize: 13, background: "#FFCE00", cursor: "pointer" }}>Search</button>
          </div>
          {/* Tool pills */}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 7 }}>
            {tools.map(t => (
              <button key={t} onClick={() => setActiveTool(t)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999,
                border: "1.5px solid", borderColor: activeTool === t ? "#FFCE00" : "#E8E6DC",
                background: activeTool === t ? "#FFCE00" : "white", color: activeTool === t ? "#221D23" : "#4A4848",
                fontWeight: 700, fontSize: 12.5, cursor: "pointer", boxShadow: activeTool === t ? "0 4px 14px rgba(255,206,0,.28)" : "none",
              }}>
                {t === "all" ? "All tools" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 308px", gap: 22, alignItems: "start", padding: "22px 0 56px" }}>
          <div>
            {/* Newly added */}
            {recentActivities.length > 0 && (
              <section style={{ marginBottom: 26 }}>
                <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, letterSpacing: "-.04em" }}>Newly added</h2>
                <div style={grid3}>
                  {recentActivities.map(a => <ActivityCard key={a.id} activity={a} status={progressMap[a.id]?.status ?? "not_started"} />)}
                </div>
              </section>
            )}

            {/* Continue */}
            {continueActivities.length > 0 && (
              <section style={{ marginBottom: 26 }}>
                <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, letterSpacing: "-.04em" }}>Continue where you left off</h2>
                <div style={grid3}>
                  {continueActivities.map(a => <ActivityCard key={a.id} activity={a} status="in_progress" />)}
                </div>
              </section>
            )}

            {/* Explore all */}
            <section style={{ marginBottom: 26 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, letterSpacing: "-.04em" }}>Explore all activities</h2>
              <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 15, boxShadow: "0 2px 12px rgba(34,29,35,.07)" }}>
                {/* Tabs */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 11, marginBottom: 11, borderBottom: "1px solid #E8E6DC" }}>
                  {[{ id: "all", label: "⭐ All" }, { id: "chat", label: "✦ Chatbot" }, { id: "automate", label: "⚡ Automation" }, { id: "build", label: "🛠 Build" }]
                    .map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabBtn(activeTab === tab.id)}>{tab.label}</button>)}
                </div>
                {/* Filters */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {[{ id: "all", label: "All" }, { id: "beginner", label: "Beginner" }, { id: "short", label: "≤ 15 min" }, { id: "notstarted", label: "Not Started" }]
                    .map(f => <button key={f.id} onClick={() => setActiveFilter(f.id)} style={filterBtn(activeFilter === f.id)}>{f.label}</button>)}
                </div>
                {filtered.length === 0 ? (
                  <div style={{ padding: 36, border: "1.5px dashed #D5D0C8", borderRadius: 20, textAlign: "center", color: "#6B6B6B", fontSize: 13.5 }}>
                    No matching activities. Try a different filter.
                  </div>
                ) : (
                  <div style={grid3}>
                    {filtered.map(a => <ActivityCard key={a.id} activity={a} status={progressMap[a.id]?.status ?? "not_started"} />)}
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
              <div style={{ padding: 15, borderRadius: 15, color: "white", marginBottom: 13, background: "radial-gradient(circle at 80% 20%,rgba(255,206,0,.25),transparent 42%),#221D23", border: "1px solid rgba(255,255,255,.05)" }}>
                <div style={{ color: "rgba(255,255,255,.5)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 7 }}>Current Level</div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-.05em" }}>
                    {totalPts < 100 ? "Starter" : totalPts < 300 ? "Explorer" : totalPts < 600 ? "Builder" : "Expert"}
                  </div>
                  <div style={{ color: "#FFCE00", fontSize: 12, fontWeight: 700 }}>{totalPts} pts</div>
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
                  { label: "◆ Available", value: activities.length, bg: "rgba(246,138,41,.08)", border: "rgba(246,138,41,.2)" },
                ].map((tile, i) => (
                  <div key={i} style={{ borderRadius: 13, padding: "11px 10px", border: `1px solid ${tile.border}`, background: tile.bg }}>
                    <div style={{ color: "#6B6B6B", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{tile.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-.05em" }}>{tile.value}</div>
                  </div>
                ))}
              </div>
              {/* Category progress */}
              {[
                { label: "Chatbot", key: "chat", color: "linear-gradient(90deg,#623CEA,#3696FC)" },
                { label: "Automation", key: "automate", color: "linear-gradient(90deg,#F68A29,#FFCE00)" },
                { label: "Vibe Coding", key: "build", color: "linear-gradient(90deg,#23CE68,#3696FC)" },
              ].map(cat => {
                const catActs = activities.filter(a => a.category === cat.key);
                const catDone = catActs.filter(a => progressMap[a.id]?.status === "completed").length;
                const pct = catActs.length ? (catDone / catActs.length) * 100 : 0;
                return (
                  <div key={cat.key} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      <span>{cat.label}</span>
                      <span style={{ color: "#6B6B6B", fontWeight: 600 }}>{catDone} / {catActs.length}</span>
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
