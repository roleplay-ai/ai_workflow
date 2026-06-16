"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import ToolModal, { type ToolModalTool } from "../ToolModal";

type FluencyTool = ToolModalTool;

type Props = {
  tools: FluencyTool[];
  userName: string | null;
  isAdmin: boolean;
};

const ACCENT_FALLBACK = "#623CEA";

// ── Main component ────────────────────────────────────────────────────────────

export default function AllToolsClient({ tools, userName, isAdmin }: Props) {
  const categories = ["All", ...Array.from(new Set(tools.map(t => t.category_label)))];
  const [filter, setFilter] = useState("All");
  const [selectedTool, setSelectedTool] = useState<FluencyTool | null>(null);

  const filtered = filter === "All" ? tools : tools.filter(t => t.category_label === filter);

  return (
    <>
      <AppNav activePage="know" userName={userName} isAdmin={isAdmin} />

      <main style={{ width: "min(1280px,calc(100% - 72px))", margin: "34px auto 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a
            href="/know"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 18,
              fontSize: 13, fontWeight: 750, color: "#6B6670", textDecoration: "none",
            }}
          >
            ← Back to Know
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
