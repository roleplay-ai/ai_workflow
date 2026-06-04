"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TOOLS } from "@/lib/tools";
import type { ToolLogoMap } from "@/lib/toolLogos";
import ToolIcon from "@/components/ToolIcon";

type Props = {
  initialLogos: ToolLogoMap;
};

export default function ToolLogosManager({ initialLogos }: Props) {
  const supabase = createClient();
  const [logos, setLogos] = useState<ToolLogoMap>(initialLogos);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function uploadLogo(tool: string, file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file (PNG, JPG, SVG, or WebP).");
      return;
    }
    if (file.size > 512 * 1024) {
      setMessage("Logo must be 512 KB or smaller.");
      return;
    }

    setUploading(tool);
    setMessage(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${tool}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("tool-logos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (storageError) {
      setMessage(`Upload failed: ${storageError.message}`);
      setUploading(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("tool-logos").getPublicUrl(path);
    const logoUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase
      .from("tool_logos")
      .upsert({ tool, logo_url: logoUrl, updated_at: new Date().toISOString() });

    if (dbError) {
      setMessage(`Saved file but database error: ${dbError.message}. Run migration_003_tool_logos.sql if the table is missing.`);
      setUploading(null);
      return;
    }

    setLogos(prev => ({ ...prev, [tool]: logoUrl }));
    setUploading(null);
    setMessage(`Uploaded logo for ${tool}.`);
  }

  async function removeLogo(tool: string) {
    if (!confirm(`Remove logo for ${tool}?`)) return;
    setUploading(tool);
    setMessage(null);

    await supabase.from("tool_logos").delete().eq("tool", tool);

    const { data: files } = await supabase.storage.from("tool-logos").list();
    const toRemove = (files ?? []).filter(f => f.name.startsWith(`${tool}.`)).map(f => f.name);
    if (toRemove.length) {
      await supabase.storage.from("tool-logos").remove(toRemove);
    }

    setLogos(prev => {
      const next = { ...prev };
      delete next[tool];
      return next;
    });
    setUploading(null);
    setMessage(`Removed logo for ${tool}.`);
  }

  return (
    <div style={card}>
      {message && (
        <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: message.startsWith("Upload failed") || message.includes("error") ? "#B91C1C" : "#17A855" }}>
          {message}
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {TOOLS.map(tool => {
          const logoUrl = logos[tool];
          const busy = uploading === tool;
          return (
            <div key={tool} style={{ padding: 12, borderRadius: 12, border: "1px solid #E8E6DC", background: "#FAFAF8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <ToolIcon tool={tool} size={32} logos={logos} />
                <span style={{ fontWeight: 700, fontSize: 13, textTransform: "capitalize" }}>{tool}</span>
              </div>
              <label style={{ display: "block", marginBottom: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  style={{ fontSize: 11, width: "100%" }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) void uploadLogo(tool, file);
                    e.target.value = "";
                  }}
                />
              </label>
              {logoUrl && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeLogo(tool)}
                  style={{ ...btnGhost, padding: "5px 10px", fontSize: 11 }}
                >
                  {busy ? "…" : "Remove"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "white",
  border: "1px solid #E8E6DC",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 2px 12px rgba(34,29,35,.06)",
};

const btnGhost: React.CSSProperties = {
  borderRadius: 999,
  border: "1.5px solid #E8E6DC",
  background: "white",
  color: "#6B6B6B",
  fontWeight: 700,
  cursor: "pointer",
};
