"use client";

export type ProCon = { content: string; sort_order: number };

export type ToolModalTool = {
  id: string;
  category_label: string;
  name: string;
  description: string;
  icon_emoji: string | null;
  letter: string | null;
  color: string | null;
  company_name: string | null;
  try_url: string | null;
  best_for: string | null;
  pricing: string | null;
  is_featured: boolean;
  fluency_tool_pros?: ProCon[];
  fluency_tool_cons?: ProCon[];
};

const ACCENT_FALLBACK = "#623CEA";

export default function ToolModal({ tool, onClose }: { tool: ToolModalTool; onClose: () => void }) {
  const accent = tool.color ?? ACCENT_FALLBACK;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,.55)", backdropFilter: "blur(5px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: "relative", width: "min(520px,100%)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 10,
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(0,0,0,.55)", border: 0, cursor: "pointer",
            color: "#fff", fontSize: 20, fontWeight: 700,
            display: "grid", placeItems: "center",
          }}
        >×</button>

        <div className="aif-modal-scroll" style={{
          background: "#fff", borderRadius: 20, overflow: "hidden",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,.35)",
        }}>
          {/* Gradient header */}
          <div style={{
            padding: "28px 28px 24px",
            background: `linear-gradient(125deg, ${accent} 0%, #F9A8D4 55%, #221D23 100%)`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <span style={{
                width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                background: "rgba(255,255,255,.20)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,.30)",
                display: "grid", placeItems: "center",
                fontSize: tool.letter ? 22 : 24, fontWeight: 950, color: "#fff",
                letterSpacing: "-.02em",
              }}>
                {tool.letter ?? tool.icon_emoji ?? tool.name[0]}
              </span>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    background: "rgba(255,255,255,.25)", color: "#fff",
                    padding: "2px 10px", borderRadius: 999,
                    fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase",
                  }}>{tool.category_label}</span>
                  {tool.is_featured && (
                    <span style={{
                      background: "#FFCE00", color: "#221D23",
                      padding: "2px 10px", borderRadius: 999,
                      fontSize: 10, fontWeight: 800, letterSpacing: ".08em",
                    }}>Featured</span>
                  )}
                </div>
                <h2 style={{
                  margin: 0, fontSize: 22, fontWeight: 950,
                  letterSpacing: "-.04em", color: "#fff", lineHeight: 1.1,
                }}>{tool.name}</h2>
                {tool.company_name && (
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600 }}>
                    by {tool.company_name}
                  </p>
                )}
              </div>
            </div>

            <p style={{
              margin: 0, fontSize: 14, lineHeight: 1.6,
              color: "rgba(255,255,255,.9)", fontWeight: 500,
            }}>{tool.description}</p>
          </div>

          {/* Info grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid #F0ECE6",
          }}>
            <div style={{ padding: "16px 20px", borderRight: "1px solid #F0ECE6" }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#9B9199" }}>Pricing</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#221D23" }}>{tool.pricing ?? "—"}</p>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#9B9199" }}>Category</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: accent }}>{tool.category_label}</p>
            </div>
          </div>

          {/* Best for */}
          {tool.best_for && (
            <div style={{ padding: "16px 20px 20px", borderBottom: "1px solid #F0ECE6" }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#9B9199" }}>Best for</p>
              <div style={{ background: accent + "14", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 650, color: "#221D23", lineHeight: 1.5 }}>{tool.best_for}</p>
              </div>
            </div>
          )}

          {/* Pros */}
          {(tool.fluency_tool_pros?.length ?? 0) > 0 && (
            <div style={{ padding: "16px 20px 20px", borderBottom: "1px solid #F0ECE6" }}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#9B9199" }}>Pros</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {[...(tool.fluency_tool_pros ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((p, i) => (
                  <li key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    background: "#E8FBEE", borderRadius: 10, padding: "9px 13px",
                  }}>
                    <span style={{ color: "#16A34A", fontWeight: 900, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, fontWeight: 650, color: "#166534", lineHeight: 1.45 }}>{p.content}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {(tool.fluency_tool_cons?.length ?? 0) > 0 && (
            <div style={{ padding: "16px 20px 20px", borderBottom: "1px solid #F0ECE6" }}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#9B9199" }}>Cons</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {[...(tool.fluency_tool_cons ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((c, i) => (
                  <li key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    background: "#FDE9EB", borderRadius: 10, padding: "9px 13px",
                  }}>
                    <span style={{ color: "#DC2626", fontWeight: 900, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✕</span>
                    <span style={{ fontSize: 13, fontWeight: 650, color: "#991B1B", lineHeight: 1.45 }}>{c.content}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div style={{ padding: "16px 20px 20px", display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 999, cursor: "pointer",
                background: "#fff", border: "1.5px solid #E9E4DC",
                fontSize: 13, fontWeight: 750, color: "#6B6670",
              }}
            >Close</button>
            {tool.try_url ? (
              <a
                href={tool.try_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 2, padding: "11px 0", borderRadius: 999, textAlign: "center",
                  background: accent, color: "#fff",
                  fontSize: 13, fontWeight: 800, textDecoration: "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                Try {tool.name} ↗
              </a>
            ) : (
              <span style={{
                flex: 2, padding: "11px 0", borderRadius: 999, textAlign: "center",
                background: "#F7F2E9", color: "#9B9199",
                fontSize: 13, fontWeight: 750, display: "flex", alignItems: "center", justifyContent: "center",
              }}>Coming soon</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
