"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import type { Profile, Company, Activity } from "@/lib/supabase/types";

type ActivityRow = Activity & { activity_content: { id: string } | null };

type Props = {
  profile: Profile & { companies: { name: string } | null };
  companies: Pick<Company, "id" | "name" | "domain">[];
  activities: ActivityRow[];
  allAssignments: { activity_id: string; company_id: string }[];
};

const CATEGORIES = ["chat", "build", "automate"];
const TOOLS = ["claude","gemini","chatgpt","copilot","drive","sheets","gmail","calendar","vapi","wati","lovable","napkin","ai-studio","notebooklm"];

export default function SuperadminClient({ profile, companies, activities: initActivities, allAssignments: initAssignments }: Props) {
  const [activities,   setActivities]   = useState(initActivities);
  const [assignments,  setAssignments]  = useState(initAssignments);
  const [showForm,     setShowForm]     = useState(false);
  const supabase = createClient();

  // Create form state
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [level,    setLevel]    = useState<Activity["level"]>("Beginner");
  const [time,     setTime]     = useState(15);
  const [points,   setPoints]   = useState(50);
  const [tools,    setTools]    = useState<string[]>([]);
  const [category, setCategory] = useState("chat");
  const [creating, setCreating] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function createActivity(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await supabase.from("activities").insert({
      title, description: desc, level, time_estimate_minutes: time,
      points, tools, category, published: false, position: activities.length,
    }).select().single();
    if (!error && data) {
      setActivities(prev => [{ ...(data as any), activity_content: null }, ...prev]);
      setTitle(""); setDesc(""); setTools([]); setShowForm(false);
    }
    setCreating(false);
  }

  async function togglePublish(act: ActivityRow) {
    await supabase.from("activities").update({ published: !act.published }).eq("id", act.id);
    setActivities(prev => prev.map(a => a.id === act.id ? { ...a, published: !a.published } : a));
  }

  async function deleteActivity(id: string) {
    if (!confirm("Delete this activity?")) return;
    await supabase.from("activities").delete().eq("id", id);
    setActivities(prev => prev.filter(a => a.id !== id));
  }

  async function toggleAssignment(activityId: string, companyId: string) {
    const exists = assignments.some(a => a.activity_id === activityId && a.company_id === companyId);
    if (exists) {
      await supabase.from("activity_companies")
        .delete().eq("activity_id", activityId).eq("company_id", companyId);
      setAssignments(prev => prev.filter(a => !(a.activity_id === activityId && a.company_id === companyId)));
    } else {
      await supabase.from("activity_companies").insert({ activity_id: activityId, company_id: companyId });
      setAssignments(prev => [...prev, { activity_id: activityId, company_id: companyId }]);
    }
  }

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const catColor = (cat: string) => ({
    chat:     { bg: "rgba(98,60,234,.08)",  color: "#5030C0" },
    build:    { bg: "rgba(35,206,104,.08)", color: "#17A855" },
    automate: { bg: "rgba(246,138,41,.08)", color: "#B05000" },
  }[cat] ?? { bg: "#F0EEE8", color: "#6B6B6B" });

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <Topbar profile={profile} role="superadmin" onSignOut={handleSignOut} />

      <main style={{ width: "min(1100px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-.04em" }}>Activities</h1>
            <p style={{ margin: "3px 0 0", color: "#6B6B6B", fontSize: 13 }}>{activities.length} total · create, edit content, assign to companies</p>
          </div>
          <button onClick={() => setShowForm(v => !v)} style={btnAmber}>+ New Activity</button>
        </div>

        {/* Create form */}
        {showForm && (
          <div style={{ ...card, marginBottom: 18, borderColor: "#FFCE00" }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>New Activity</div>
            <form onSubmit={createActivity} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Activity title" style={inp} />
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Short description shown on the dashboard card" style={{ ...inp, resize: "vertical" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={inp}>
                    <option value="chat">✦ Chatbot</option>
                    <option value="build">🛠 Vibe Coding</option>
                    <option value="automate">⚡ Automation</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Level</label>
                  <select value={level ?? "Beginner"} onChange={e => setLevel(e.target.value as any)} style={inp}>
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Time (min)</label>
                  <input type="number" value={time} onChange={e => setTime(+e.target.value)} style={inp} min={1} />
                </div>
                <div>
                  <label style={lbl}>Points</label>
                  <input type="number" value={points} onChange={e => setPoints(+e.target.value)} style={inp} min={0} />
                </div>
              </div>
              <div>
                <label style={lbl}>Tools</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5 }}>
                  {TOOLS.map(t => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}>
                      <input type="checkbox" checked={tools.includes(t)} onChange={e => setTools(p => e.target.checked ? [...p, t] : p.filter(x => x !== t))} />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={creating} style={btnAmber}>{creating ? "Creating…" : "Create Activity"}</button>
                <button type="button" onClick={() => setShowForm(false)} style={btnGhost}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Activity list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {activities.length === 0 && (
            <div style={{ ...card, textAlign: "center", color: "#B0ABA5", padding: 48 }}>
              No activities yet. Create your first one above.
            </div>
          )}
          {activities.map(act => {
            const expanded = expandedId === act.id;
            const actAssignments = assignments.filter(a => a.activity_id === act.id);
            const cc = catColor(act.category);

            return (
              <div key={act.id} style={{ ...card, padding: 0 }}>
                {/* Row header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }}
                  onClick={() => setExpandedId(expanded ? null : act.id)}>
                  {/* Category badge */}
                  <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: cc.bg, color: cc.color, flexShrink: 0 }}>
                    {act.category}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{act.title}</div>
                    <div style={{ fontSize: 11.5, color: "#6B6B6B", marginTop: 2 }}>
                      {act.level} · {act.time_estimate_minutes}m · {act.points}pts
                      <span style={{ marginLeft: 8, color: act.activity_content ? "#17A855" : "#F68A29", fontWeight: 700 }}>
                        {act.activity_content ? "✓ content" : "⚠ no content"}
                      </span>
                      {actAssignments.length > 0 && (
                        <span style={{ marginLeft: 8, color: "#3696FC" }}>· {actAssignments.length} compan{actAssignments.length === 1 ? "y" : "ies"}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => togglePublish(act)} style={{
                      padding: "5px 12px", borderRadius: 999, border: "1px solid",
                      borderColor: act.published ? "rgba(35,206,104,.3)" : "#E8E6DC",
                      background: act.published ? "rgba(35,206,104,.08)" : "#F0EEE8",
                      color: act.published ? "#17A855" : "#6B6B6B",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>{act.published ? "Published" : "Draft"}</button>

                    <Link href={`/superadmin/activity/${act.id}`} style={{
                      padding: "5px 12px", borderRadius: 999, border: "1px solid #E8E6DC",
                      background: "white", color: "#221D23", fontSize: 12, fontWeight: 700,
                      textDecoration: "none",
                    }}>Edit content</Link>

                    <button onClick={() => deleteActivity(act.id)} style={{
                      border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 16,
                    }}>×</button>
                  </div>

                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B0ABA5" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: ".15s", flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>

                {/* Expanded: company assignment */}
                {expanded && (
                  <div style={{ padding: "0 18px 16px", borderTop: "1px solid #F0EEE8" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B", margin: "12px 0 8px" }}>
                      Assign to companies
                      <span style={{ fontWeight: 400, marginLeft: 6 }}>
                        {actAssignments.length === 0 ? "· no assignments = visible to everyone" : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {companies.map(co => {
                        const assigned = assignments.some(a => a.activity_id === act.id && a.company_id === co.id);
                        return (
                          <button key={co.id} onClick={() => toggleAssignment(act.id, co.id)} style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "6px 13px", borderRadius: 999, cursor: "pointer",
                            border: "1.5px solid",
                            borderColor: assigned ? "#FFCE00" : "#E8E6DC",
                            background: assigned ? "#FFF6CF" : "white",
                            fontWeight: 700, fontSize: 12.5, transition: ".12s",
                          }}>
                            <span style={{
                              width: 16, height: 16, borderRadius: "50%",
                              background: assigned ? "#FFCE00" : "#F0EEE8",
                              display: "grid", placeItems: "center",
                              fontSize: 9, fontWeight: 900,
                              color: assigned ? "#221D23" : "transparent",
                            }}>✓</span>
                            {co.name}
                            {co.domain && <span style={{ fontSize: 10.5, color: "#B0ABA5", fontWeight: 400 }}>{co.domain}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "white", border: "1px solid #E8E6DC", borderRadius: 18,
  boxShadow: "0 2px 12px rgba(34,29,35,.06)",
};
const inp: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E8E6DC",
  fontSize: 13.5, outline: "none", width: "100%", boxSizing: "border-box",
  fontFamily: "inherit", background: "#FAFAF8",
};
const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, color: "#6B6B6B", marginBottom: 4 };
const btnAmber: React.CSSProperties = { padding: "9px 18px", borderRadius: 999, border: 0, background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 13, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "9px 18px", borderRadius: 999, border: "1.5px solid #E8E6DC", background: "white", color: "#6B6B6B", fontWeight: 700, fontSize: 13, cursor: "pointer" };
