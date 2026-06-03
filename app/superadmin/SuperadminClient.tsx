"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import type { Profile, Company, Module } from "@/lib/supabase/types";

type Props = {
  profile: Profile & { companies: { name: string } | null };
  companies: Company[];
  modules: (Module & { activities: { id: string }[] })[];
  allProfiles: { id: string; role: string; company_id: string | null }[];
};

export default function SuperadminClient({ profile, companies, modules, allProfiles }: Props) {
  const [tab, setTab] = useState<"companies" | "modules">("companies");
  const supabase = createClient();

  // Company form
  const [companyName, setCompanyName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [companyError, setCompanyError] = useState("");

  // Module form
  const [modTitle, setModTitle] = useState("");
  const [modDesc, setModDesc] = useState("");
  const [modCats, setModCats] = useState<string[]>([]);
  const [modSaving, setModSaving] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setCompanyError("");
    const { error } = await supabase.from("companies").insert({
      name: companyName,
      domain: companyDomain || null,
      created_by: profile.id,
    });
    if (error) setCompanyError(error.message);
    else { setCompanyName(""); setCompanyDomain(""); window.location.reload(); }
    setSaving(false);
  }

  async function createModule(e: React.FormEvent) {
    e.preventDefault();
    setModSaving(true);
    const { data, error } = await supabase.from("modules").insert({
      title: modTitle,
      description: modDesc,
      categories: modCats,
      published: false,
      created_by: profile.id,
    }).select().single();
    if (!error && data) window.location.href = `/superadmin/modules/${data.id}`;
    setModSaving(false);
  }

  async function togglePublish(modId: string, current: boolean) {
    await supabase.from("modules").update({ published: !current }).eq("id", modId);
    window.location.reload();
  }

  const cardStyle: React.CSSProperties = {
    background: "white", border: "1px solid #E8E6DC", borderRadius: 20,
    padding: 20, boxShadow: "0 2px 12px rgba(34,29,35,.07)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <Topbar profile={profile} role="superadmin" onSignOut={handleSignOut} />

      <main style={{ width: "min(1100px,calc(100% - 48px))", margin: "0 auto", padding: "32px 0 60px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-.05em" }}>Superadmin</h1>
          <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 14 }}>Manage companies and learning content</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[{ id: "companies", label: "🏢 Companies" }, { id: "modules", label: "📚 Modules" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{
              padding: "9px 18px", borderRadius: 999, border: "1.5px solid",
              borderColor: tab === t.id ? "#221D23" : "#E8E6DC",
              background: tab === t.id ? "#221D23" : "white",
              color: tab === t.id ? "white" : "#6B6B6B",
              fontWeight: 700, fontSize: 13.5, cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>

        {tab === "companies" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
            {/* Company list */}
            <div style={cardStyle}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>All Companies ({companies.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {companies.map(co => {
                  const memberCount = allProfiles.filter(p => p.company_id === co.id).length;
                  return (
                    <div key={co.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid #E8E6DC", borderRadius: 14, background: "#FAFAF8" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#221D23", color: "white", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                        {co.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{co.name}</div>
                        <div style={{ fontSize: 12, color: "#6B6B6B" }}>{co.domain ?? "No domain (public)"} · {memberCount} users</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Create company */}
            <div style={cardStyle}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Create Company</div>
              <form onSubmit={createCompany} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 5 }}>Company Name *</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} required
                    placeholder="e.g. Flipkart" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 5 }}>
                    Email Domain <span style={{ fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input value={companyDomain} onChange={e => setCompanyDomain(e.target.value)}
                    placeholder="flipkart.com" style={inputStyle} />
                  <div style={{ fontSize: 11, color: "#B0ABA5", marginTop: 4 }}>Users with this domain auto-join this company</div>
                </div>
                {companyError && <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>{companyError}</p>}
                <button type="submit" disabled={saving} style={btnStyle}>
                  {saving ? "Creating…" : "Create Company"}
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === "modules" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
            {/* Module list */}
            <div style={cardStyle}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>All Modules ({modules.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {modules.map(mod => (
                  <div key={mod.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "1px solid #E8E6DC", borderRadius: 14, background: "#FAFAF8" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{mod.title}</div>
                      <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>
                        {mod.activities.length} activities · {mod.categories?.join(", ") || "no categories"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => togglePublish(mod.id, mod.published)} style={{
                        padding: "5px 12px", borderRadius: 999, border: "1px solid",
                        borderColor: mod.published ? "rgba(35,206,104,.3)" : "#E8E6DC",
                        background: mod.published ? "rgba(35,206,104,.08)" : "#F0EEE8",
                        color: mod.published ? "#17A855" : "#6B6B6B",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}>{mod.published ? "Published" : "Draft"}</button>
                      <Link href={`/superadmin/modules/${mod.id}`} style={{
                        padding: "5px 12px", borderRadius: 999, border: "1px solid #E8E6DC",
                        background: "white", color: "#221D23", fontSize: 12, fontWeight: 700,
                        textDecoration: "none", display: "inline-block",
                      }}>Edit</Link>
                    </div>
                  </div>
                ))}
                {modules.length === 0 && <p style={{ color: "#6B6B6B", fontSize: 13.5, textAlign: "center", padding: 24 }}>No modules yet</p>}
              </div>
            </div>

            {/* Create module */}
            <div style={cardStyle}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Create Module</div>
              <form onSubmit={createModule} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 5 }}>Title *</label>
                  <input value={modTitle} onChange={e => setModTitle(e.target.value)} required
                    placeholder="e.g. Email Automation" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 5 }}>Description</label>
                  <textarea value={modDesc} onChange={e => setModDesc(e.target.value)} rows={3}
                    placeholder="What will learners achieve?" style={{ ...inputStyle, resize: "vertical" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 8 }}>Categories</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["chat", "build", "automate"].map(cat => (
                      <label key={cat} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                        <input type="checkbox" checked={modCats.includes(cat)}
                          onChange={e => setModCats(prev => e.target.checked ? [...prev, cat] : prev.filter(c => c !== cat))} />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={modSaving} style={btnStyle}>
                  {modSaving ? "Creating…" : "Create & Add Activities →"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 13px", borderRadius: 10, border: "1.5px solid #E8E6DC",
  fontSize: 13.5, outline: "none", width: "100%", boxSizing: "border-box",
  fontFamily: "inherit", background: "#FAFAF8",
};

const btnStyle: React.CSSProperties = {
  padding: "11px 18px", borderRadius: 999, border: 0,
  background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 13.5,
  cursor: "pointer", marginTop: 4,
};
