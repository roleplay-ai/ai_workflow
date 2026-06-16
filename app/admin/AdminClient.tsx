"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import type { Profile } from "@/lib/supabase/types";

type Props = {
  profile: Profile & { companies: { name: string } | null };
  companyUsers: (Profile & { companies: { name: string } | null })[];
  allProgress: any[];
  totalActivities: number;
};

export default function AdminClient({ profile, companyUsers, allProgress, totalActivities }: Props) {
  const [tab, setTab] = useState<"overview" | "users">("overview");
  const supabase = createClient();

  const completedCount = allProgress.filter((p: any) => p.status === "completed").length;
  const activeUsers = new Set(allProgress.map((p: any) => p.user_id)).size;
  const avgCompletion = companyUsers.length
    ? Math.round((completedCount / (companyUsers.length * Math.max(totalActivities, 1))) * 100)
    : 0;

  async function changeRole(userId: string, role: string) {
    await supabase.from("profiles").update({ role }).eq("id", userId);
    window.location.reload();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const statStyle = (bg: string, border: string): React.CSSProperties => ({
    background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 20px",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif" }}>
      <Topbar profile={profile} role={profile.role} onSignOut={handleSignOut} />

      <main style={{ width: "min(1280px,calc(100% - 72px))", margin: "0 auto", padding: "32px 0 60px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-.05em" }}>
            {(profile.companies as any)?.name ?? "Company"} — Admin
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 14 }}>
            Manage your team's learning progress
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[{ id: "overview", label: "Overview" }, { id: "users", label: "Users" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{
              padding: "9px 18px", borderRadius: 999, border: "1.5px solid",
              borderColor: tab === t.id ? "#221D23" : "#E8E6DC",
              background: tab === t.id ? "#221D23" : "white",
              color: tab === t.id ? "white" : "#6B6B6B",
              fontWeight: 700, fontSize: 13.5, cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
              <div style={statStyle("rgba(35,206,104,.08)", "rgba(35,206,104,.2)")}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", marginBottom: 6 }}>Total Users</div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-.05em" }}>{companyUsers.length}</div>
              </div>
              <div style={statStyle("rgba(54,150,252,.08)", "rgba(54,150,252,.2)")}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", marginBottom: 6 }}>Active Learners</div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-.05em" }}>{activeUsers}</div>
              </div>
              <div style={statStyle("rgba(255,206,0,.12)", "rgba(255,206,0,.3)")}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", marginBottom: 6 }}>Completions</div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-.05em" }}>{completedCount}</div>
              </div>
              <div style={statStyle("rgba(246,138,41,.08)", "rgba(246,138,41,.2)")}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", marginBottom: 6 }}>Avg Completion</div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-.05em" }}>{avgCompletion}%</div>
              </div>
            </div>

            {/* Top activities */}
            <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Most completed activities</div>
              {Object.entries(
                allProgress.reduce((acc: Record<string, { title: string; count: number }>, p: any) => {
                  if (p.status === "completed") {
                    const key = p.activity_id;
                    if (!acc[key]) acc[key] = { title: p.activities?.title ?? key, count: 0 };
                    acc[key].count++;
                  }
                  return acc;
                }, {})
              ).sort((a, b) => b[1].count - a[1].count).slice(0, 8).map(([id, { title, count }]) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F0EEE8" }}>
                  <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#6B6B6B", fontWeight: 700 }}>{count} completions</div>
                  <div style={{ width: 120, height: 6, background: "#F0EEE8", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg,#FFCE00,#F68A29)", width: `${Math.min(count * 20, 100)}%`, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
              {completedCount === 0 && <p style={{ color: "#6B6B6B", fontSize: 13.5, textAlign: "center", padding: 24 }}>No completions yet</p>}
            </div>
          </>
        )}

        {tab === "users" && (
          <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #E8E6DC" }}>
                  {["Name", "Email", "Role", "Completions", "Joined"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B6B6B" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companyUsers.map((u: any, i) => {
                  const userDone = allProgress.filter((p: any) => p.user_id === u.id && p.status === "completed").length;
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #F0EEE8", background: i % 2 === 0 ? "white" : "#FAFAF8" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#221D23", color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                            {(u.full_name ?? u.email ?? "?")[0].toUpperCase()}
                          </div>
                          {u.full_name ?? "—"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#6B6B6B" }}>{u.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {profile.role === "superadmin" ? (
                          <select defaultValue={u.role} onChange={e => changeRole(u.id, e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #E8E6DC", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                            <option value="superadmin">superadmin</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "#F0EEE8", color: "#6B6B6B" }}>{u.role}</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>{userDone}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#6B6B6B" }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
