"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { deepDiveHref, deepDiveLabel } from "@/lib/deepDives";
import { formatToolLabel } from "@/lib/tools";
import { resolveToolLogoUrl, type ToolLogoMap } from "@/lib/toolLogos";
import type { ToolDeepDive } from "@/lib/supabase/types";
import ModulePlayer, { type ModuleData } from "./ModulePlayer";
import "./ai-fluency.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type BriefItem  = { id: string; content: string; sort_order: number };
type Brief      = { id: string; title: string; published_date: string; fluency_brief_items: BriefItem[] };
type FluencyModule = {
  id: string; title: string; emoji: string; concepts: string[];
  sort_order: number; is_locked: boolean; next_module_hint: string | null;
};
type World = { id: string; title: string; emoji: string; color: string; fluency_modules: FluencyModule[] };
type ApplyVideo = {
  id: string; title: string; description: string | null; video_url: string | null;
  thumbnail_url: string | null; duration: string | null; order_index: number;
  is_locked: boolean; group_name: string | null; category_tag: string | null;
};
type FluencyTool  = { id: string; category_label: string; name: string; description: string; icon_emoji: string | null; letter: string | null; color: string | null; company_name: string | null; try_url: string | null; best_for: string | null; pricing: string | null; is_featured: boolean };
type ToolGuide    = { id: string; name: string; logo_letter: string; description: string; accent_color: string; bg_color: string; border_color: string; guide_url: string | null };
type Props = {
  brief:               Brief | null;
  worlds:              World[];
  videos:              ApplyVideo[];
  tools:               FluencyTool[];
  toolGuides:          ToolGuide[];
  deepDives:           ToolDeepDive[];
  toolLogos:           ToolLogoMap;
  completedModuleIds:  string[];
};

// ── Deep-dive helpers ────────────────────────────────────────────────────────

function toolColor(slug: string): string {
  if (slug === "claude")            return "#623CEA";
  if (slug === "chatgpt")           return "#23CE68";
  if (slug === "gemini")            return "#3696FC";
  if (slug === "copilot")           return "#F68A29";
  if (slug === "agentic-workflows") return "#623CEA";
  return "#FFCE00";
}

function toolInitials(slug: string): string {
  const label = formatToolLabel(slug);
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return label.slice(0, 3);
}


const GROUP_ACCENT: Record<string, string> = {
  Features:  "#A855F7",
  Apps:      "#EC4899",
  Workflows: "#F68A29",
  Skills:    "#3699FC",
};

// Foundation-card colours — cycles for each world card (matches HTML exactly)
const WORLD_CARD_COLORS = [
  { bg: "#FDF0E2", border: "#F68A29", textColor: "#ED4551", circleBg: "#F68A29", circleText: "#fff"    },
  { bg: "#FDECEC", border: "#ED4551", textColor: "#ED4551", circleBg: "#ED4551", circleText: "#fff"    },
  { bg: "#EAF6F4", border: "#36BBD1", textColor: "#2EADCB", circleBg: "#36BBD1", circleText: "#fff"    },
  { bg: "#F2EDFF", border: "#A984FF", textColor: "#9B76FA", circleBg: "#A984FF", circleText: "#fff"    },
  { bg: "#ECFFF4", border: "#23CE6B", textColor: "#159E4B", circleBg: "#23CE6B", circleText: "#221D23" },
];

const TOOL_ACCENTS = ["#17614B", "#326EA9", "#AA577C", "#C66D38", "#623CEA", "#1E8B5C"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Carousel wrapper ──────────────────────────────────────────────────────────

function Carousel({
  title, label, subtitle, seeAllLabel, children,
}: {
  title: string; label?: string; subtitle: string; seeAllLabel: string; children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -330 : 330, behavior: "smooth" });

  return (
    <section style={{ marginTop: 70 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 22, marginBottom: 22 }}>
        <div style={{ position: "relative", paddingLeft: 22 }}>
          <div style={{
            position: "absolute", left: 0, top: 4, width: 7, height: 58,
            borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(34,29,35,.18)",
          }} />
          {label && (
            <span style={{
              display: "inline-flex", padding: "7px 10px", borderRadius: 999, background: "#221D23",
              color: "#fff", fontSize: 10, fontWeight: 950, textTransform: "uppercase",
              letterSpacing: ".10em", marginBottom: 8,
            }}>{label}</span>
          )}
          <h2 style={{ margin: 0, fontSize: 32, lineHeight: 1.03, fontWeight: 950, letterSpacing: "-.055em" }}>{title}</h2>
          <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>{subtitle}</p>
        </div>
        <a href="#" style={{ fontSize: 13, fontWeight: 950, color: "#FF4B1F", whiteSpace: "nowrap", textDecoration: "none" }}>{seeAllLabel}</a>
      </div>

      {/* Scroll row */}
      <div style={{ position: "relative" }}>
        <button
          className="aif-arrow-btn"
          onClick={() => scroll("left")}
          aria-label="Previous"
          style={{
            position: "absolute", top: "44%", transform: "translateY(-50%)", zIndex: 5, left: -14,
            width: 42, height: 52, borderRadius: 999, background: "#fff", border: "1px solid #E9E4DC",
            boxShadow: "0 16px 35px rgba(34,29,35,.13)", display: "grid", placeItems: "center",
            fontSize: 26, fontWeight: 950, cursor: "pointer",
          }}
        >‹</button>

        <div ref={scrollRef} className="aif-slider" style={{
          display: "grid", gridAutoFlow: "column", gap: 24, overflowX: "auto",
          padding: "4px 10px 30px", scrollSnapType: "x mandatory",
        }}>
          {children}
        </div>

        <button
          className="aif-arrow-btn"
          onClick={() => scroll("right")}
          aria-label="Next"
          style={{
            position: "absolute", top: "44%", transform: "translateY(-50%)", zIndex: 5, right: -14,
            width: 42, height: 52, borderRadius: 999, background: "#fff", border: "1px solid #E9E4DC",
            boxShadow: "0 16px 35px rgba(34,29,35,.13)", display: "grid", placeItems: "center",
            fontSize: 26, fontWeight: 950, cursor: "pointer",
          }}
        >›</button>
      </div>
    </section>
  );
}


// ── Main component ────────────────────────────────────────────────────────────

export default function AIFluencyClient({
  brief, worlds, videos, tools, toolGuides, deepDives, toolLogos, completedModuleIds,
}: Props) {
  const sortedItems = brief
    ? [...brief.fluency_brief_items].sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const [completedIds,  setCompletedIds]  = useState<string[]>(completedModuleIds);
  const [openModule,    setOpenModule]    = useState<ModuleData | null>(null);
  const [loadingId,     setLoadingId]     = useState<string | null>(null);
  const [openWorldId,   setOpenWorldId]   = useState<string | null>(null);
  const foundScrollRef = useRef<HTMLDivElement>(null);

  async function handleModuleClick(mod: FluencyModule) {
    if (mod.is_locked) return;
    setLoadingId(mod.id);
    try {
      const res  = await fetch(`/api/fluency/module/${mod.id}`);
      const data = await res.json() as ModuleData;
      setOpenModule(data);
    } finally {
      setLoadingId(null);
    }
  }

  function handleComplete(moduleId: string) {
    setCompletedIds(ids => ids.includes(moduleId) ? ids : [...ids, moduleId]);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#FEFCFA", color: "#221D23",
      fontFamily: '"Visby CF", Inter, system-ui, -apple-system, sans-serif',
      letterSpacing: "-.01em",
    }}>

      {/* ── Topbar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20, height: 66,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 36px", background: "rgba(254,252,250,.88)",
        backdropFilter: "blur(18px)", borderBottom: "1px solid #E9E4DC",
      }}>
        <Link href="/dashboard" style={{
          display: "flex", alignItems: "center", gap: 10, fontWeight: 900,
          fontSize: 15, color: "#221D23", textDecoration: "none",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" width={26} height={26} style={{ borderRadius: "50%" }} />
          <span>Nudgeable AI Work Studio</span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 13, fontWeight: 800, color: "#3B363D" }}>
          <Link href="/dashboard" style={{
            padding: "9px 0", borderBottom: "3px solid transparent",
            color: "#3B363D", textDecoration: "none",
          }}>Workflows</Link>
          <Link href="/ai-mastery" style={{
            padding: "9px 0", borderBottom: "3px solid transparent",
            color: "#3B363D", textDecoration: "none",
          }}>AI Mastery</Link>
          <Link href="/ai-fluency" style={{
            padding: "9px 0", borderBottom: "3px solid #FFCE00",
            color: "#221D23", textDecoration: "none",
          }}>AI Fluency</Link>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="#videos" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "10px 15px", borderRadius: 999, background: "#221D23",
            color: "#fff", fontSize: 12, fontWeight: 900, textDecoration: "none",
          }}>Watch videos</a>
        </div>
      </header>

      {/* ── Page ── */}
      <main style={{ width: "min(1200px,calc(100% - 56px))", margin: "34px auto 0" }}>

        {/* ── Hero ── */}
        <section className="aif-hero" style={{
          position: "relative", minHeight: 520, display: "grid",
          gridTemplateColumns: ".9fr 1.1fr", gap: 34, padding: 44,
          border: "1px solid #E9E4DC", borderRadius: 28, overflow: "hidden",
          background: "#fff", boxShadow: "0 1px 0 rgba(34,29,35,.04)",
        }}>
          {/* Decorative circle */}
          <div style={{
            position: "absolute", right: -100, top: -130, width: 430, height: 430,
            borderRadius: "50%", background: "#FFF6CF", zIndex: 0, pointerEvents: "none",
          }} />

          {/* Copy */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 13px",
              borderRadius: 999, background: "#fff", border: "1px solid #EAD993",
              fontSize: 12, fontWeight: 950, color: "#221D23", marginBottom: 26,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: "#FFCE00",
                outline: "2px solid #221D23", display: "inline-block",
              }} />
              Updated daily
            </div>

            <h1 style={{
              margin: 0, fontSize: "clamp(50px,6.1vw,82px)", lineHeight: .94,
              fontWeight: 950, letterSpacing: "-.075em", maxWidth: 580,
            }}>AI Fluency</h1>

            <p style={{
              maxWidth: 560, margin: "28px 0 30px", fontSize: 18, lineHeight: 1.48,
              color: "#514B53", fontWeight: 600, letterSpacing: "-.02em",
            }}>
              Stay current with AI news, useful products, practical tool updates,
              and the real questions shaping work.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
              {["Videos", "Products", "AI Foundations", "Tool Guides"].map(tag => (
                <span key={tag} style={{
                  display: "inline-flex", alignItems: "center", borderRadius: 999,
                  background: "#F7F5F1", border: "1px solid #E9E4DC",
                  padding: "10px 13px", fontSize: 12, fontWeight: 900, color: "#514B53",
                }}>{tag}</span>
              ))}
            </div>

            <a className="aif-btn-primary" href="#videos" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "13px 20px", borderRadius: 999, background: "#FFCE00",
              color: "#221D23", border: "1px solid rgba(34,29,35,.10)",
              fontWeight: 950, textDecoration: "none", fontSize: 14,
            }}>Explore AI Fluency →</a>
          </div>

          {/* Brief card */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {brief ? (
              <article style={{
                background: "linear-gradient(135deg,#191612,#211B1F 68%,#171218)",
                color: "#fff", borderRadius: 24, padding: "30px 32px",
                boxShadow: "0 24px 55px rgba(34,29,35,.22)", minHeight: 420,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                border: "1px solid rgba(255,255,255,.06)",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                    <span style={{
                      display: "inline-flex", padding: "8px 13px", borderRadius: 7,
                      background: "#C97D3A", color: "#fff", fontSize: 11, fontWeight: 950,
                      letterSpacing: ".12em", textTransform: "uppercase",
                    }}>Nudgeable Brief</span>
                    <span style={{ color: "#B9A995", fontSize: 13, fontWeight: 700 }}>
                      {formatDate(brief.published_date)}
                    </span>
                  </div>

                  <h2 style={{
                    margin: "0 0 20px", fontSize: 31, lineHeight: 1.05,
                    fontWeight: 950, letterSpacing: "-.055em", color: "#fff",
                  }}>{brief.title}</h2>

                  <ul style={{ display: "grid", gap: 16, margin: 0, padding: 0, listStyle: "none" }}>
                    {sortedItems.map((item, i) => (
                      <li key={i} style={{
                        position: "relative", paddingLeft: 24, color: "#C9B9A2",
                        fontSize: 14, lineHeight: 1.55, fontWeight: 650,
                      }}>
                        <span style={{
                          position: "absolute", left: 0, top: 9, width: 6, height: 6,
                          borderRadius: "50%", background: "#D48742", display: "inline-block",
                        }} />
                        {item.content}
                      </li>
                    ))}
                  </ul>
                </div>
                <a href="#videos" style={{
                  display: "inline-flex", color: "#FFCE00", fontWeight: 950,
                  fontSize: 13, marginTop: 24, textDecoration: "none",
                }}>Watch video updates →</a>
              </article>
            ) : (
              <div style={{
                minHeight: 420, borderRadius: 24, background: "#F7F2E9",
                display: "grid", placeItems: "center", color: "#6B6670", fontSize: 14, fontWeight: 700,
              }}>No brief available</div>
            )}
          </div>
        </section>

        {/* ── AI Foundations (horizontal world cards + expandable modules panel) ── */}
        {worlds.length > 0 && (
          <section style={{ marginTop: 70 }}>
            {/* Section header */}
            <div style={{
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              gap: 22, marginBottom: 22,
            }}>
              <div style={{ position: "relative", paddingLeft: 22 }}>
                <div style={{
                  position: "absolute", left: 0, top: 4, width: 7, height: 58,
                  borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(34,29,35,.18)",
                }} />
                <span style={{
                  display: "inline-flex", padding: "7px 10px", borderRadius: 999, background: "#221D23",
                  color: "#fff", fontSize: 10, fontWeight: 950, textTransform: "uppercase",
                  letterSpacing: ".10em", marginBottom: 8,
                }}>Learn</span>
                <h2 style={{ margin: 0, fontSize: 32, lineHeight: 1.03, fontWeight: 950, letterSpacing: "-.055em" }}>AI Foundations</h2>
                <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>
                  Short explainers that build practical AI fluency.
                </p>
              </div>
              <a href="#" style={{ fontSize: 13, fontWeight: 950, color: "#FF4B1F", whiteSpace: "nowrap", textDecoration: "none" }}>
                See all →
              </a>
            </div>

            {/* Horizontal world-card carousel */}
            <div style={{ position: "relative" }}>
              <button
                className="aif-arrow-btn"
                onClick={() => foundScrollRef.current?.scrollBy({ left: -330, behavior: "smooth" })}
                aria-label="Previous"
                style={{
                  position: "absolute", top: "44%", transform: "translateY(-50%)", zIndex: 5, left: -14,
                  width: 42, height: 52, borderRadius: 999, background: "#fff", border: "1px solid #E9E4DC",
                  boxShadow: "0 16px 35px rgba(34,29,35,.13)", display: "grid", placeItems: "center",
                  fontSize: 26, fontWeight: 950, cursor: "pointer",
                }}
              >‹</button>

              <div
                ref={foundScrollRef}
                className="aif-slider"
                style={{
                  display: "grid", gridAutoFlow: "column", gridAutoColumns: 300,
                  gap: 18, overflowX: "auto", padding: "4px 10px 24px",
                  scrollSnapType: "x mandatory",
                }}
              >
                {worlds.map((world, i) => {
                  const c      = WORLD_CARD_COLORS[i % WORLD_CARD_COLORS.length];
                  const isOpen = openWorldId === world.id;
                  const doneCount = completedIds.filter(id => world.fluency_modules.some(m => m.id === id)).length;

                  return (
                    <article
                      key={world.id}
                      onClick={() => setOpenWorldId(isOpen ? null : world.id)}
                      style={{
                        scrollSnapAlign: "start",
                        minHeight: 96, borderRadius: 21,
                        padding: "19px 18px",
                        display: "grid", gridTemplateColumns: "52px 1fr 42px",
                        gap: 14, alignItems: "center",
                        background: isOpen ? `${world.color}12` : c.bg,
                        border: `3px solid ${isOpen ? world.color : c.border}`,
                        boxShadow: "0 12px 30px rgba(34,29,35,.05)",
                        cursor: "pointer",
                        transition: "border-color .18s ease, background .18s ease",
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: "rgba(255,255,255,.55)", border: "1px solid rgba(34,29,35,.10)",
                        display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0,
                      }}>{world.emoji}</div>

                      {/* Text */}
                      <div>
                        <h3 style={{ margin: 0, fontSize: 15, lineHeight: 1.18, fontWeight: 950, letterSpacing: "-.035em" }}>
                          {world.title}
                        </h3>
                        <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 900, color: isOpen ? world.color : c.textColor }}>
                          {world.fluency_modules.length} module{world.fluency_modules.length !== 1 ? "s" : ""}
                          {doneCount > 0 ? ` · ${doneCount} done` : ""}
                        </p>
                      </div>

                      {/* Go circle */}
                      <div style={{
                        width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                        background: isOpen ? world.color : c.circleBg,
                        color: isOpen ? "#221D23" : c.circleText,
                        display: "grid", placeItems: "center",
                        fontSize: 24, fontWeight: 950,
                        transform: isOpen ? "rotate(90deg)" : "none",
                        transition: "transform .2s ease, background .18s ease",
                      }}>›</div>
                    </article>
                  );
                })}
              </div>

              <button
                className="aif-arrow-btn"
                onClick={() => foundScrollRef.current?.scrollBy({ left: 330, behavior: "smooth" })}
                aria-label="Next"
                style={{
                  position: "absolute", top: "44%", transform: "translateY(-50%)", zIndex: 5, right: -14,
                  width: 42, height: 52, borderRadius: 999, background: "#fff", border: "1px solid #E9E4DC",
                  boxShadow: "0 16px 35px rgba(34,29,35,.13)", display: "grid", placeItems: "center",
                  fontSize: 26, fontWeight: 950, cursor: "pointer",
                }}
              >›</button>
            </div>

            {/* Expanded modules panel — slides in below carousel when a world is selected */}
            {(() => {
              const world = worlds.find(w => w.id === openWorldId);
              if (!world) return null;
              return (
                <div style={{
                  marginTop: 14,
                  borderRadius: 20,
                  border: `1px solid ${world.color}30`,
                  background: `${world.color}06`,
                  padding: "20px 22px 16px",
                }}>
                  {/* Panel heading */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
                    paddingBottom: 14, borderBottom: `1px solid ${world.color}20`,
                  }}>
                    <span style={{ fontSize: 20 }}>{world.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#221D23", letterSpacing: "-.03em" }}>
                      {world.title}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 999,
                      background: `${world.color}18`, color: world.color, marginLeft: "auto",
                    }}>
                      {completedIds.filter(id => world.fluency_modules.some(m => m.id === id)).length} / {world.fluency_modules.length} done
                    </span>
                  </div>

                  {/* Module rows */}
                  <div style={{ display: "grid", gap: 2 }}>
                    {world.fluency_modules.map((mod, i) => {
                      const done    = completedIds.includes(mod.id);
                      const loading = loadingId === mod.id;
                      return (
                        <button
                          key={mod.id}
                          onClick={() => handleModuleClick(mod)}
                          disabled={mod.is_locked || loading}
                          style={{
                            width: "100%", display: "grid",
                            gridTemplateColumns: "32px 1fr 20px", gap: 12, alignItems: "center",
                            padding: "11px 8px", borderRadius: 12,
                            background: "none", border: "none",
                            cursor: mod.is_locked ? "not-allowed" : "pointer",
                            textAlign: "left", transition: "background .12s ease",
                          }}
                          onMouseEnter={e => { if (!mod.is_locked) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.80)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                        >
                          {/* Number / done / lock badge */}
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                            display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900,
                            ...(done
                              ? { background: "rgba(34,197,94,.12)", border: "1.5px solid rgba(34,197,94,.35)", color: "#16a34a" }
                              : mod.is_locked
                              ? { background: "rgba(34,29,35,.07)", border: "1.5px solid rgba(34,29,35,.12)", color: "#9e8e7a" }
                              : { background: `${world.color}18`, border: `1.5px solid ${world.color}35`, color: world.color }
                            ),
                          }}>
                            {done ? "✓" : mod.is_locked ? "🔒" : i + 1}
                          </div>

                          {/* Title + concepts */}
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{
                                fontSize: 13, fontWeight: 800, lineHeight: 1.3,
                                color: mod.is_locked ? "#9B9199" : "#221D23",
                              }}>{mod.title}</span>
                              {done && (
                                <span style={{
                                  fontSize: 9, fontWeight: 900, letterSpacing: ".06em",
                                  padding: "2px 6px", borderRadius: 999,
                                  background: "#F0FFF4", color: "#16a34a", border: "1px solid #BBF7D0",
                                }}>DONE</span>
                              )}
                            </div>
                            {mod.concepts.length > 0 && (
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 5 }}>
                                {mod.concepts.slice(0, 3).map(c => (
                                  <span key={c} style={{
                                    fontSize: 10, color: "#6B6670",
                                    background: "rgba(34,29,35,.05)",
                                    padding: "2px 6px", borderRadius: 6,
                                  }}>{c}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Arrow / spinner */}
                          <span style={{
                            fontSize: 16, fontWeight: 900,
                            color: loading ? world.color : mod.is_locked ? "rgba(34,29,35,.25)" : "rgba(34,29,35,.4)",
                          }}>{loading ? "…" : "›"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* ── Videos ── */}
        <section id="videos" style={{ marginTop: 70 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 22, marginBottom: 22 }}>
            <div style={{ position: "relative", paddingLeft: 22 }}>
              <div style={{
                position: "absolute", left: 0, top: 4, width: 7, height: 58,
                borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(34,29,35,.18)",
              }} />
              <span style={{
                display: "inline-flex", padding: "7px 10px", borderRadius: 999, background: "#221D23",
                color: "#fff", fontSize: 10, fontWeight: 950, textTransform: "uppercase",
                letterSpacing: ".10em", marginBottom: 8,
              }}>Videos</span>
              <h2 style={{ margin: 0, fontSize: 32, lineHeight: 1.03, fontWeight: 950, letterSpacing: "-.055em" }}>Latest Launches</h2>
              <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>
                Short videos on new launches across AI tools.
              </p>
            </div>
            <a href="#" style={{ fontSize: 13, fontWeight: 950, color: "#FF4B1F", whiteSpace: "nowrap", textDecoration: "none" }}>
              View all videos →
            </a>
          </div>

          <VideoCarousel videos={videos} />
        </section>

        {/* ── Most Useful Tools ── */}
        <Carousel title="Most Useful Tools" label="Tools" subtitle="AI products worth trying for real work." seeAllLabel="Browse tools →">
          {tools.map((t, i) => {
            const accent = TOOL_ACCENTS[i % TOOL_ACCENTS.length];
            return (
              <article
                key={t.id}
                className="aif-product-card"
                style={{
                  scrollSnapAlign: "start", height: 258, borderRadius: 20,
                  padding: "18px 18px 16px", color: "#221D23",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  overflow: "hidden", position: "relative", background: "#fff",
                  border: "1px solid #E9E4DC", boxShadow: "0 18px 45px rgba(34,29,35,.08)",
                  width: 292, flexShrink: 0,
                  ["--aif-accent" as string]: accent,
                }}
              >
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ color: accent, fontSize: 11, fontWeight: 950, letterSpacing: ".08em", textTransform: "uppercase" }}>
                    {t.category_label}
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0" }}>
                    <span style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      background: t.color ?? "#FFCE00",
                      display: "grid", placeItems: "center",
                      fontSize: t.letter ? 18 : 19, fontWeight: 950, color: "#fff",
                      letterSpacing: "-.02em",
                    }}>{t.letter ?? t.icon_emoji}</span>
                    <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1, fontWeight: 950, letterSpacing: "-.035em" }}>{t.name}</h3>
                  </div>
                  <p style={{
                    margin: 0, fontSize: 12, lineHeight: 1.38, fontWeight: 650, color: "#514B53",
                    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>{t.description}</p>
                </div>

                <div style={{
                  position: "relative", zIndex: 1, paddingTop: 12,
                  borderTop: "1px solid #E9E4DC",
                }}>
                  {t.pricing && (
                    <div style={{ fontSize: 10, color: "#6B6670", fontWeight: 800, marginBottom: 8 }}>
                      {t.pricing}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "#6B6670", fontWeight: 850 }}>
                      {t.company_name ? <>by <strong style={{ color: "#221D23" }}>{t.company_name}</strong></> : null}
                    </span>
                    {t.try_url ? (
                      <a href={t.try_url} target="_blank" rel="noopener noreferrer" style={{
                        display: "inline-flex", background: "#FFCE00", color: "#221D23",
                        borderRadius: 999, padding: "8px 13px", fontSize: 11, fontWeight: 950,
                        whiteSpace: "nowrap", border: "1px solid rgba(34,29,35,.10)", textDecoration: "none",
                      }}>Try it →</a>
                    ) : (
                      <span style={{
                        display: "inline-flex", background: "#F7F2E9", color: "#6B6670",
                        borderRadius: 999, padding: "8px 13px", fontSize: 11, fontWeight: 950,
                        whiteSpace: "nowrap", border: "1px solid #E9E4DC",
                      }}>Coming soon</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </Carousel>

        {/* ── AI Tool Guides ── */}
        <section style={{ marginTop: 72 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ position: "relative", paddingLeft: 22 }}>
              <div style={{
                position: "absolute", left: 0, top: 4, width: 7, height: 58,
                borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(34,29,35,.18)",
              }} />
              <h2 style={{ margin: 0, fontSize: 32, lineHeight: 1.03, fontWeight: 950, letterSpacing: "-.055em" }}>AI Tool Guides</h2>
              <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>
                Deep dives on the AI tools behind these workflows.
              </p>
            </div>
          </div>

          {/* Know Your Tools — deep dive cards (dark band) */}
          {deepDives.length > 0 && (
            <div style={{
              background: "#1C1720", borderRadius: 30, padding: 30,
              border: "1px solid rgba(255,206,0,.24)", marginBottom: 20,
            }}>
              <div className="aif-tool-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {deepDives.map(item => {
                  const slug = item.tool ?? "";
                  const href = deepDiveHref(item);
                  const isExternal = (item.link_type ?? "external") === "external";
                  const color = slug ? toolColor(slug) : "#FFCE00";
                  const logoUrl = slug ? resolveToolLogoUrl(slug, toolLogos) : null;
                  const desc = deepDiveLabel(item, formatToolLabel);

                  const cardInner = (
                    <>
                      <div>
                        <div style={{
                          width: 50, height: 50, borderRadius: 17, display: "grid", placeItems: "center",
                          background: "rgba(255,255,255,.10)", border: `1px solid ${color}44`,
                          color, fontSize: 14, fontWeight: 900, marginBottom: 16,
                        }}>
                          {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logoUrl} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
                          ) : (
                            toolInitials(slug)
                          )}
                        </div>
                        <h3 style={{ margin: "0 0 7px", fontSize: 18, fontWeight: 950, letterSpacing: "-.05em", color: "#fff", lineHeight: 1.15 }}>
                          {item.title}
                        </h3>
                        <p style={{ margin: 0, color: "#D8D2DA", fontSize: 12, lineHeight: 1.45, fontWeight: 650 }}>
                          {desc}
                        </p>
                      </div>
                      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, fontWeight: 950, color: "#FFCE00" }}>Explore →</span>
                      </div>
                    </>
                  );

                  const cardStyle: React.CSSProperties = {
                    minHeight: 188, background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,206,0,.22)", borderRadius: 22,
                    padding: "20px 20px 16px", display: "flex", flexDirection: "column",
                    justifyContent: "space-between", textDecoration: "none", color: "inherit",
                    transition: "transform 0.18s ease, background 0.18s ease", cursor: "pointer",
                  };

                  if (isExternal) {
                    return (
                      <a key={item.id} href={href} target="_blank" rel="noopener noreferrer" style={cardStyle}>
                        {cardInner}
                      </a>
                    );
                  }
                  return (
                    <Link key={item.id} href={href} style={cardStyle}>
                      {cardInner}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tool overview cards */}
          {toolGuides.length > 0 && (
            <div className="aif-tool-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
              {toolGuides.map(g => (
                <article
                  key={g.id}
                  className="aif-tool-card"
                  style={{
                    minHeight: 188, padding: 22, borderRadius: 20,
                    background: g.bg_color, border: `1px solid ${g.border_color}`,
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                    boxShadow: "0 18px 45px rgba(34,29,35,.08)",
                    position: "relative", overflow: "hidden",
                    ["--aif-guide-accent" as string]: g.accent_color,
                  }}
                >
                  <div>
                    <div style={{
                      width: 46, height: 46, borderRadius: 15, display: "grid", placeItems: "center",
                      background: "#fff", color: "#221D23", fontSize: 20, fontWeight: 950,
                      marginBottom: 18, border: "1px solid rgba(34,29,35,.08)",
                    }}>{g.logo_letter}</div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 18, lineHeight: 1.1, fontWeight: 950, letterSpacing: "-.04em", color: "#221D23" }}>
                      {g.name}
                    </h3>
                    <p style={{ margin: "0 0 18px", color: "#514B53", fontSize: 13, lineHeight: 1.35, fontWeight: 650 }}>
                      {g.description}
                    </p>
                  </div>
                  {g.guide_url ? (
                    <Link href={g.guide_url} style={{ color: "#221D23", fontSize: 12, fontWeight: 950, textDecoration: "none" }}>
                      Explore guide →
                    </Link>
                  ) : (
                    <span style={{ color: "#6B6670", fontSize: 12, fontWeight: 950 }}>Guide coming soon</span>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── AI at Work POV banner ── */}
        <section className="aif-pov-grid" style={{
          margin: "42px 0 96px", position: "relative", overflow: "hidden", minHeight: 275,
          display: "grid", gridTemplateColumns: "1.35fr .65fr", borderRadius: 26,
          background: "radial-gradient(circle at 82% 30%,rgba(255,206,0,.20),transparent 26%),radial-gradient(circle at 54% 80%,rgba(98,60,234,.20),transparent 32%),#221D23",
          color: "#fff", boxShadow: "0 28px 65px rgba(34,29,35,.14)", borderLeft: "8px solid #FFCE00",
        }}>
          <div style={{ padding: "36px 34px" }}>
            <div style={{
              width: "fit-content", padding: "8px 12px", borderRadius: 999,
              background: "rgba(255,206,0,.14)", border: "1px solid rgba(255,206,0,.45)",
              color: "#FFCE00", fontSize: 10, fontWeight: 950,
              textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 22,
            }}>Thinking guide</div>

            <h2 style={{
              margin: 0, fontSize: "clamp(34px,4vw,50px)", lineHeight: .98,
              letterSpacing: "-.065em", fontWeight: 950, color: "#fff",
            }}>AI at Work: The Real Questions</h2>

            <p style={{
              maxWidth: 660, margin: "18px 0 26px", color: "rgba(255,255,255,.75)",
              fontSize: 15, lineHeight: 1.45, fontWeight: 650,
            }}>
              A clear guide to the messy questions behind AI adoption, automation,
              capability building, and work redesign.
            </p>

            <Link href="/explore/perspective/ai-at-work" className="aif-btn-primary" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "13px 20px", borderRadius: 999, background: "#FFCE00",
              color: "#221D23", border: "1px solid rgba(34,29,35,.10)",
              fontWeight: 950, textDecoration: "none", fontSize: 14,
            }}>Explore the guide →</Link>
          </div>

          {/* Orbit visual */}
          <div className="aif-pov-visual" style={{ display: "grid", placeItems: "center", minHeight: 260 }}>
            <div style={{ position: "relative", width: 200, height: 200, border: "1px dashed rgba(255,255,255,.22)", borderRadius: "50%" }}>
              <div style={{
                position: "absolute", inset: 44, borderRadius: 24, background: "#FFCE00",
                border: "3px solid #000", color: "#221D23", display: "grid",
                placeItems: "center", textAlign: "center", fontWeight: 950,
                transform: "rotate(-5deg)",
              }}>
                <div>
                  <span style={{ fontSize: 30, display: "block", letterSpacing: "-.06em" }}>AI</span>
                  <small style={{ fontSize: 9, letterSpacing: ".05em" }}>AT WORK</small>
                </div>
              </div>
              {[
                { label: "Jobs",   cls: { top: -7, left: 78 } },
                { label: "Risk",   cls: { right: -22, top: 72 } },
                { label: "Agents", cls: { bottom: 11, right: 27 } },
                { label: "Skills", cls: { left: -28, bottom: 46 } },
              ].map(n => (
                <span key={n.label} style={{
                  position: "absolute", ...n.cls, padding: "8px 10px", borderRadius: 999,
                  background: "#fff", color: "#221D23", fontSize: 10, fontWeight: 950,
                  border: "1px solid rgba(34,29,35,.18)",
                }}>{n.label}</span>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid #E9E4DC", padding: "44px 24px 50px",
        textAlign: "center", background: "#fff",
      }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 950, letterSpacing: "-.045em" }}>AI Fluency</h2>
        <p style={{ margin: "10px auto 0", maxWidth: 520, color: "#6B6670", fontSize: 13, lineHeight: 1.45, fontWeight: 650 }}>
          Latest news, practical products, tool guides, and Nudgeable&apos;s view on how AI is changing work.
        </p>
      </footer>

      {/* ── Module player modal ── */}
      {openModule && (
        <ModulePlayer
          module={openModule}
          isCompleted={completedIds.includes(openModule.id)}
          onClose={() => setOpenModule(null)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}

// ── Video carousel ─────────────────────────────────────────────────────────────

function VideoCarousel({ videos }: { videos: ApplyVideo[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -290 : 290, behavior: "smooth" });

  return (
    <div style={{ position: "relative" }}>
      <button
        className="aif-arrow-btn"
        onClick={() => scroll("left")}
        aria-label="Previous"
        style={{
          position: "absolute", top: "44%", transform: "translateY(-50%)", zIndex: 5, left: -14,
          width: 42, height: 52, borderRadius: 999, background: "#fff", border: "1px solid #E9E4DC",
          boxShadow: "0 16px 35px rgba(34,29,35,.13)", display: "grid", placeItems: "center",
          fontSize: 26, fontWeight: 950, cursor: "pointer",
        }}
      >‹</button>

      <div ref={scrollRef} className="aif-slider" style={{
        display: "grid", gridAutoFlow: "column", gridAutoColumns: 268,
        gap: 14, overflowX: "auto", padding: "4px 10px 30px", scrollSnapType: "x mandatory",
      }}>
        {videos.map(v => {
          const accent = GROUP_ACCENT[v.group_name ?? ""] ?? "#623CEA";
          const blurb = v.description
            ? v.description.split("\n")[0].slice(0, 96) + (v.description.length > 96 ? "…" : "")
            : null;

          return (
            <article key={v.id} style={{
              scrollSnapAlign: "start", borderRadius: 18, overflow: "hidden",
              background: "#fff", border: "1px solid rgba(34,29,35,.06)",
              boxShadow: "0 2px 12px rgba(0,0,0,.06)", cursor: "pointer",
              display: "flex", flexDirection: "column",
              opacity: v.is_locked ? 0.6 : 1,
            }}>
              {/* Thumbnail */}
              <div style={{
                position: "relative", height: 132, flexShrink: 0, overflow: "hidden",
                background: v.thumbnail_url
                  ? "transparent"
                  : `linear-gradient(155deg,${accent} 0%,#1a1030 48%,#0f0a18 100%)`,
              }}>
                {v.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail_url}
                    alt=""
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                {v.thumbnail_url && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.25) 100%)",
                  }} />
                )}

                {/* Play button */}
                <div style={{
                  position: "absolute", left: "50%", top: "50%",
                  transform: "translate(-50%,-50%)", zIndex: 2,
                  width: 52, height: 52, borderRadius: "50%",
                  background: v.is_locked ? "rgba(0,0,0,.3)" : "#fff",
                  backdropFilter: v.is_locked ? "blur(4px)" : undefined,
                  boxShadow: v.is_locked ? undefined : "0 6px 24px rgba(0,0,0,.20)",
                  display: "grid", placeItems: "center",
                }}>
                  {v.is_locked ? (
                    <span style={{ fontSize: 18 }}>🔒</span>
                  ) : (
                    <span style={{
                      width: 0, height: 0, marginLeft: 3,
                      borderTop: "9px solid transparent",
                      borderBottom: "9px solid transparent",
                      borderLeft: "14px solid #221D23",
                      display: "block",
                    }} />
                  )}
                </div>

                {/* Duration badge */}
                {!v.is_locked && v.duration && (
                  <span style={{
                    position: "absolute", bottom: 8, right: 8, zIndex: 2,
                    background: "rgba(0,0,0,.80)", color: "#fff",
                    padding: "2px 6px", borderRadius: 4,
                    fontFamily: "monospace", fontSize: 11, fontWeight: 500,
                  }}>{v.duration}</span>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: "12px 14px 14px", flex: 1, background: "#fff" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 7, marginBottom: 7,
                  overflow: "hidden",
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                    background: accent, display: "inline-block",
                  }} />
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: ".12em",
                    textTransform: "uppercase", color: "#6B6670",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {v.category_tag ?? v.group_name ?? "Feature"}
                  </span>
                </div>
                <h3 style={{
                  margin: "0 0 6px", fontSize: 15, lineHeight: 1.28,
                  fontWeight: 800, letterSpacing: "-.03em", color: "#221D23",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                }}>{v.title}</h3>
                {blurb && !v.is_locked && (
                  <p style={{
                    margin: 0, fontSize: 12, lineHeight: 1.5, color: "#6B6670", fontWeight: 650,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                  }}>{blurb}</p>
                )}
                {v.is_locked && (
                  <p style={{ margin: 0, fontSize: 12, color: "#9B9199", fontStyle: "italic" }}>
                    Login to unlock
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <button
        className="aif-arrow-btn"
        onClick={() => scroll("right")}
        aria-label="Next"
        style={{
          position: "absolute", top: "44%", transform: "translateY(-50%)", zIndex: 5, right: -14,
          width: 42, height: 52, borderRadius: 999, background: "#fff", border: "1px solid #E9E4DC",
          boxShadow: "0 16px 35px rgba(34,29,35,.13)", display: "grid", placeItems: "center",
          fontSize: 26, fontWeight: 950, cursor: "pointer",
        }}
      >›</button>
    </div>
  );
}
