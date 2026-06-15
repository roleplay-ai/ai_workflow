"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";

type ProCon = { content: string; sort_order: number };

type FluencyTool = {
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

type Props = {
  tools: FluencyTool[];
  userName: string | null;
  isAdmin: boolean;
};

const ACCENT_FALLBACK = "#623CEA";

// ── Tool detail modal ─────────────────────────────────────────────────────────

function ToolModal({ tool, onClose }: { tool: FluencyTool; onClose: () => void }) {
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

// ── Main component ────────────────────────────────────────────────────────────

export default function AllToolsClient({ tools, userName, isAdmin }: Props) {
  const categories = ["All", ...Array.from(new Set(tools.map(t => t.category_label)))];
  const [filter, setFilter] = useState("All");
  const [selectedTool, setSelectedTool] = useState<FluencyTool | null>(null);

  const filtered = filter === "All" ? tools : tools.filter(t => t.category_label === filter);

  return (
    <>
      <AppNav activePage="ai-fluency" userName={userName} isAdmin={isAdmin} />

      <main style={{ width: "min(1200px,calc(100% - 56px))", margin: "34px auto 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a
            href="/ai-fluency"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 18,
              fontSize: 13, fontWeight: 750, color: "#6B6670", textDecoration: "none",
            }}
          >
            ← Back to AI Fluency
          </a>

          <div style={{ position: "relative", paddingLeft: 22 }}>
            <div style={{
              position: "absolute", left: 0, top: "4px", bottom: "4px", width: 5,
              background: "#FFCE00", borderRadius: 999,
            }} />
            <span style={{
              display: "inline-flex", padding: "5px 10px", background: "#221D23",
              color: "#fff", borderRadius: 999, marginBottom: 10,
              fontSize: 12, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase",
            }}>Tools</span>
            <h1 style={{
              margin: "4px 0 0", fontSize: 34, lineHeight: 1.03,
              fontWeight: 950, letterSpacing: "-.055em",
            }}>Best AI Tools</h1>
            <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>
              Vetted picks — with honest descriptions and who they're best for.
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: "8px 18px", borderRadius: 999, fontSize: 12, fontWeight: 750,
                border: "1px solid", cursor: "pointer", transition: "all .15s",
                background: filter === cat ? "#221D23" : "#fff",
                color: filter === cat ? "#FFCE00" : "#221D23",
                borderColor: filter === cat ? "#221D23" : "#E9E4DC",
              }}
            >{cat}</button>
          ))}
        </div>

        <p style={{ margin: "0 0 24px", fontSize: 11, fontWeight: 700, color: "#9B9199", letterSpacing: ".04em" }}>
          {filtered.length} tool{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p style={{ color: "#9B9199", fontSize: 14, textAlign: "center", paddingTop: 60 }}>
            No tools in this category.
          </p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {filtered.map(t => {
              const accent = t.color ?? ACCENT_FALLBACK;
              return (
                <article
                  key={t.id}
                  onClick={() => setSelectedTool(t)}
                  style={{
                    borderRadius: 20, overflow: "hidden",
                    background: "#fff", border: "1px solid #E9E4DC",
                    boxShadow: "0 2px 12px rgba(0,0,0,.05)",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    position: "relative", minHeight: 220,
                    transition: "transform .15s, box-shadow .15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,.10)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,.05)";
                  }}
                >
                  {/* Top accent stripe */}
                  <div style={{ height: 4, background: accent, flexShrink: 0 }} />

                  {/* Card body */}
                  <div style={{ padding: "18px 18px 16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      {/* Category */}
                      <div style={{
                        fontSize: 10, fontWeight: 800, letterSpacing: ".1em",
                        textTransform: "uppercase", color: accent, marginBottom: 12,
                      }}>{t.category_label}</div>

                      {/* Avatar + name */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <span style={{
                          width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                          background: t.color ?? "#FFCE00",
                          display: "grid", placeItems: "center",
                          fontSize: t.letter ? 18 : 20, fontWeight: 950, color: "#fff",
                          letterSpacing: "-.02em",
                        }}>
                          {t.letter ?? t.icon_emoji ?? t.name[0]}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <h3 className="card-title">{t.name}</h3>
                          {t.is_featured && (
                            <span style={{
                              display: "inline-block", marginTop: 3,
                              background: "#FFF6CF", color: "#B8860B",
                              padding: "1px 8px", borderRadius: 999,
                              fontSize: 10, fontWeight: 800, letterSpacing: ".06em",
                            }}>Featured</span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p style={{
                        margin: 0, fontSize: 12, lineHeight: 1.45, fontWeight: 650, color: "#514B53",
                        display: "-webkit-box", WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                      }}>{t.description}</p>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #F0ECE6" }}>
                      {t.pricing && (
                        <div style={{ fontSize: 10, color: "#6B6670", fontWeight: 800, marginBottom: 8 }}>
                          {t.pricing}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 11, color: "#6B6670", fontWeight: 750 }}>
                          {t.company_name ? <>by <strong style={{ color: "#221D23" }}>{t.company_name}</strong></> : null}
                        </span>
                        <span style={{
                          fontSize: 12, fontWeight: 800, color: accent,
                          display: "flex", alignItems: "center", gap: 3,
                        }}>
                          Details ›
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {selectedTool && (
        <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
      )}
    </>
  );
}
