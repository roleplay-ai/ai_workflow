"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import ToolLogosManager from "@/components/ToolLogosManager";
import type { Profile, ActivityTag } from "@/lib/supabase/types";
import type { ToolLogoMap } from "@/lib/toolLogos";

type Props = {
  profile: Profile & { companies: { name: string } | null };
  toolLogos: ToolLogoMap;
  tags: Pick<ActivityTag, "id" | "name" | "icon_url">[];
};

export default function ToolLogosPageClient({ profile, toolLogos, tags: initTags }: Props) {
  const supabase = createClient();
  const [tags, setTags] = useState(initTags);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function uploadTagLogo(tagId: string, tagName: string, file: File) {
    if (!file.type.startsWith("image/")) { setMessage("Please choose an image file."); return; }
    if (file.size > 512 * 1024) { setMessage("Logo must be 512 KB or smaller."); return; }

    setUploading(tagId);
    setMessage(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `tag-${tagName.toLowerCase().replace(/\s+/g, "-")}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from("activity-icons")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (storageErr) { setMessage(`Upload failed: ${storageErr.message}`); setUploading(null); return; }

    const { data: { publicUrl } } = supabase.storage.from("activity-icons").getPublicUrl(path);
    const iconUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await supabase.from("activity_tags").update({ icon_url: iconUrl }).eq("id", tagId);
    if (dbErr) { setMessage(`DB error: ${dbErr.message}`); setUploading(null); return; }

    setTags(prev => prev.map(t => t.id === tagId ? { ...t, icon_url: iconUrl } : t));
    setUploading(null);
    setMessage(`Logo uploaded for ${tagName}.`);
  }

  async function removeTagLogo(tagId: string, tagName: string) {
    if (!confirm(`Remove logo for tag "${tagName}"?`)) return;
    setUploading(tagId);
    await supabase.from("activity_tags").update({ icon_url: null }).eq("id", tagId);
    setTags(prev => prev.map(t => t.id === tagId ? { ...t, icon_url: null } : t));
    setUploading(null);
    setMessage(`Removed logo for ${tagName}.`);
  }

  async function deleteTag(tagId: string, tagName: string) {
    if (!confirm(`Delete tag "${tagName}"? It will be removed from all activities.`)) return;
    setUploading(tagId);
    await supabase.from("activity_tags").delete().eq("id", tagId);
    setTags(prev => prev.filter(t => t.id !== tagId));
    setUploading(null);
    setMessage(`Deleted tag "${tagName}".`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <Topbar profile={profile} role="superadmin" onSignOut={handleSignOut} />

      <main style={{ width: "min(1100px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" }}>
        <div style={{ marginBottom: 22 }}>
          <Link href="/superadmin" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 12, fontSize: 13, fontWeight: 600, color: "#6B6B6B", textDecoration: "none" }}>
            ← Activities
          </Link>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-.04em" }}>Tool logos</h1>
          <p style={{ margin: "3px 0 0", color: "#6B6B6B", fontSize: 13 }}>
            Add tools, upload logos, and manage what appears in dashboard filters.
          </p>
        </div>

        <ToolLogosManager initialLogos={toolLogos} />

        {/* Tags section */}
        {tags.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, letterSpacing: "-.03em" }}>Tags</h2>
            <p style={{ margin: "0 0 14px", color: "#6B6B6B", fontSize: 13 }}>
              Upload icons for tags and delete tags you no longer need.
            </p>

            {message && (
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: message.startsWith("Upload failed") || message.includes("error") || message.includes("DB") ? "#B91C1C" : "#17A855" }}>
                {message}
              </p>
            )}

            <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 18, padding: 18, boxShadow: "0 2px 12px rgba(34,29,35,.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {tags.map(tag => {
                  const busy = uploading === tag.id;
                  return (
                    <div key={tag.id} style={{ padding: 12, borderRadius: 12, border: "1px solid #E8E6DC", background: "#FAFAF8" }}>
                      {/* Icon + name */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        {tag.icon_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={tag.icon_url} alt={tag.name} width={32} height={32} style={{ objectFit: "contain", borderRadius: 6, border: "1px solid #E8E6DC" }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #E8E6DC", background: "#F0EEE8", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, color: "#6B6B6B" }}>
                            {tag.name.slice(0, 3).toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{tag.name}</span>
                      </div>

                      {/* Upload logo */}
                      <label style={{ display: "block", marginBottom: 8 }}>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={busy}
                          style={{ fontSize: 11, width: "100%" }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) void uploadTagLogo(tag.id, tag.name, file);
                            e.target.value = "";
                          }}
                        />
                      </label>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 6 }}>
                        {tag.icon_url && (
                          <button type="button" disabled={busy} onClick={() => removeTagLogo(tag.id, tag.name)}
                            style={{ ...btnGhost, padding: "5px 10px", fontSize: 11 }}>
                            {busy ? "…" : "Remove logo"}
                          </button>
                        )}
                        <button type="button" disabled={busy} onClick={() => deleteTag(tag.id, tag.name)}
                          style={{ ...btnGhost, padding: "5px 10px", fontSize: 11, borderColor: "rgba(239,68,68,.3)", color: "#B91C1C" }}>
                          {busy ? "…" : "Delete tag"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const btnGhost: React.CSSProperties = {
  borderRadius: 999,
  border: "1.5px solid #E8E6DC",
  background: "white",
  color: "#6B6B6B",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};
