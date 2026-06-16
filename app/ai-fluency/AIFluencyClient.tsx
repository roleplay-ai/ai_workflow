"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { deepDiveHref, deepDiveLabel } from "@/lib/deepDives";
import { formatToolLabel } from "@/lib/tools";
import { resolveToolLogoUrl, type ToolLogoMap } from "@/lib/toolLogos";
import ViewCountBadge from "@/components/ViewCountBadge";
import { recordFluencyView } from "@/lib/fluencyViews";
import type { ToolDeepDive } from "@/lib/supabase/types";
import ModulePlayer, { type ModuleData } from "./ModulePlayer";
import ModuleHtmlModal from "./ModuleHtmlModal";
import VideoModal from "./VideoModal";
import ToolModal, { type ToolModalTool } from "./ToolModal";
import type { FoundationModule } from "./FoundationModuleCard";
import FoundationCardsCarousel from "./FoundationCardsCarousel";
import ToolGuideCard, { type ToolGuide, resolveGuideToolSlug } from "./ToolGuideCard";
import { normalizeToolSlug } from "@/lib/tools";

// ── Types ─────────────────────────────────────────────────────────────────────

type BriefItem  = { id: string; content: string; sort_order: number };
type Brief      = { id: string; title: string; published_date: string; fluency_brief_items: BriefItem[] };
type ApplyVideo = {
  id: string; title: string; description: string | null; video_url: string | null;
  thumbnail_url: string | null; duration: string | null; order_index: number;
  is_locked: boolean; group_name: string | null; category_tag: string | null;
};
type FluencyTool  = ToolModalTool;
type Props = {
  brief:               Brief | null;
  modules:             FoundationModule[];
  videos:              ApplyVideo[];
  tools:               FluencyTool[];
  toolGuides:          ToolGuide[];
  deepDives:           ToolDeepDive[];
  toolLogos:           ToolLogoMap;
  completedModuleIds:  string[];
  isLoggedIn:          boolean;
  userName?:           string | null;
  isAdmin?:            boolean;
  viewCounts?:         Record<string, number>;
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

const TOOL_ACCENTS = ["#17614B", "#326EA9", "#AA577C", "#C66D38", "#623CEA", "#1E8B5C"];

// Tool-guide card colour cycle (purple → yellow → blue → green)
const TOOL_GUIDE_COLORS = [
  { bg: "#F4EFFD", border: "#DED1FF", accent: "#623CEA" },
  { bg: "#FFF6CF", border: "#F0D978", accent: "#FFCE00" },
  { bg: "#EEF7FF", border: "#CFE8FF", accent: "#3699FC" },
  { bg: "#ECFFF4", border: "#C8F3DA", accent: "#23CE6B" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Carousel wrapper ──────────────────────────────────────────────────────────

function Carousel({
  title, label, subtitle, seeAllLabel, seeAllHref, children,
}: {
  title: string; label?: string; subtitle: string; seeAllLabel: string; seeAllHref?: string; children: React.ReactNode;
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
        <a href={seeAllHref ?? "#"} style={{ fontSize: 13, fontWeight: 950, color: "#FF4B1F", whiteSpace: "nowrap", textDecoration: "none" }}>{seeAllLabel}</a>
      </div>

      {/* Scroll row */}
      <div className="aif-carousel-rail">
        <button
          className="aif-arrow-btn"
          onClick={() => scroll("left")}
          aria-label="Previous"
        >‹</button>

        <div ref={scrollRef} className="aif-slider" style={{
          display: "grid", gridAutoFlow: "column", gap: 24, overflowX: "auto",
          padding: "4px 0 30px", scrollSnapType: "x mandatory",
        }}>
          {children}
        </div>

        <button
          className="aif-arrow-btn"
          onClick={() => scroll("right")}
          aria-label="Next"
        >›</button>
      </div>
    </section>
  );
}


// ── Main component ────────────────────────────────────────────────────────────

export default function AIFluencyClient({
  brief, modules, videos, tools, toolGuides, deepDives, toolLogos, completedModuleIds,
  isLoggedIn, userName, isAdmin, viewCounts = {},
}: Props) {
  const sortedItems = brief
    ? [...brief.fluency_brief_items].sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const [completedIds,  setCompletedIds]  = useState<string[]>(completedModuleIds);
  const [openModule,    setOpenModule]    = useState<ModuleData | null>(null);
  const [htmlModule,    setHtmlModule]    = useState<FoundationModule | null>(null);
  const [loadingId,     setLoadingId]     = useState<string | null>(null);
  const [selectedTool,  setSelectedTool]  = useState<FluencyTool | null>(null);

  function openToolDetails(tool: FluencyTool) {
    recordFluencyView("tool", tool.id);
    setSelectedTool(tool);
  }

  async function handleModuleClick(mod: FoundationModule) {
    if (mod.is_locked) return;
    recordFluencyView("module", mod.id);

    // If the module has uploaded HTML content, show it in the HTML popup
    if (mod.html_path) {
      setHtmlModule(mod);
      return;
    }

    // Otherwise fall back to the structured screen player
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

  const deepDiveByTool = new Map(
    deepDives
      .filter((d) => d.tool)
      .map((d) => [normalizeToolSlug(d.tool!), d] as const),
  );

  return (
    <>
      <AppNav activePage="know" userName={userName} isAdmin={isAdmin} />

      {/* ── Page ── */}
      <main style={{ width: "min(1280px,calc(100% - 72px))", margin: "34px auto 0" }}>

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
              fontSize: 12, fontWeight: 900, color: "#221D23", marginBottom: 18,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: "#FFCE00",
                outline: "2px solid #221D23", display: "inline-block",
              }} />
              Updated daily
            </div>

            <h1>Know</h1>

            <p className="aif-hero-desc">
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
            }}>Explore Know →</a>
          </div>

          {/* Brief card */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {brief ? (
              <article className="aif-brief-card">
                <div>
                  <div className="aif-brief-header">
                    <span className="aif-brief-badge">Nudgeable Brief</span>
                    <span className="aif-brief-date">{formatDate(brief.published_date)}</span>
                  </div>

                  <h2 className="aif-brief-title">{brief.title}</h2>

                  <ul className="aif-brief-list">
                    {sortedItems.map((item, i) => (
                      <li key={i}>{item.content}</li>
                    ))}
                  </ul>
                </div>
                <a href="#videos" className="aif-brief-link">Watch video updates →</a>
              </article>
            ) : (
              <div style={{
                minHeight: 420, borderRadius: 24, background: "#F7F2E9",
                display: "grid", placeItems: "center", color: "#6B6670", fontSize: 14, fontWeight: 700,
              }}>No brief available</div>
            )}
          </div>
        </section>

        {/* ── AI Foundations (module cards) ── */}
        {modules.length > 0 && (
          <section style={{ marginTop: 70 }}>
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
              <a href="/know/foundations" style={{ fontSize: 13, fontWeight: 700, color: "#623CEA", whiteSpace: "nowrap", textDecoration: "none" }}>
                See all topics →
              </a>
            </div>

            <FoundationCardsCarousel
              modules={modules}
              completedIds={completedIds}
              loadingId={loadingId}
              onModuleClick={handleModuleClick}
            />
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
            <a href="/know/videos" style={{ fontSize: 13, fontWeight: 950, color: "#FF4B1F", whiteSpace: "nowrap", textDecoration: "none" }}>
              View all videos →
            </a>
          </div>

          <VideoCarousel videos={videos} isLoggedIn={isLoggedIn} viewCounts={viewCounts} />
        </section>

        {/* ── Most Useful Tools ── */}
        <Carousel title="Most Useful Tools" label="Tools" subtitle="AI products worth trying for real work." seeAllLabel="Browse tools →" seeAllHref="/know/tools">
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
                    <h3 className="card-title">{t.name}</h3>
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
                    <button
                      type="button"
                      onClick={() => openToolDetails(t)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "#FFCE00", color: "#221D23", cursor: "pointer",
                        borderRadius: 999, padding: "8px 13px", fontSize: 11, fontWeight: 950,
                        whiteSpace: "nowrap", border: "1px solid rgba(34,29,35,.10)",
                      }}>Details ›</button>
                  </div>
                </div>
              </article>
            );
          })}
        </Carousel>

        {/* ── AI Tool Guides ── */}
        <section style={{ marginTop: 72 }} id="tool-guides">
          <div style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            gap: 22, marginBottom: 24,
          }}>
            <div style={{ position: "relative", paddingLeft: 22 }}>
              <div style={{
                position: "absolute", left: 0, top: 4, width: 7, height: 58,
                borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(34,29,35,.18)",
              }} />
              <h2 style={{ margin: 0, fontSize: 32, lineHeight: 1.03, fontWeight: 950, letterSpacing: "-.055em" }}>
                AI Tool Guides
              </h2>
              <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>
                Understand how each major AI tool fits into real work.
              </p>
            </div>
          </div>

          {/* Tool guide cards */}
          {toolGuides.length > 0 ? (
            <div className="aif-tool-guide-grid">
              {toolGuides.map((g, i) => {
                const deepDive = deepDiveByTool.get(resolveGuideToolSlug(g));
                const rawUrl = g.guide_url?.trim() || (deepDive ? deepDiveHref(deepDive) : null);
                const guideUrl = rawUrl && rawUrl !== "#" ? rawUrl : null;
                const linkExternal = !!deepDive && (deepDive.link_type ?? "external") === "external";
                return (
                  <ToolGuideCard
                    key={g.id}
                    guide={{ ...g, guide_url: guideUrl }}
                    sortIndex={i}
                    toolLogos={toolLogos}
                    deepDiveId={deepDive?.id}
                    linkExternal={linkExternal}
                  />
                );
              })}
            </div>
          ) : deepDives.length > 0 ? (
            <div className="aif-tool-grid" style={{
              display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18,
            }}>
              {deepDives.map((item, i) => {
                const cycle      = TOOL_GUIDE_COLORS[i % TOOL_GUIDE_COLORS.length];
                const slug       = item.tool ?? "";
                const href       = deepDiveHref(item);
                const isExternal = (item.link_type ?? "external") === "external";
                const logoUrl    = slug ? resolveToolLogoUrl(slug, toolLogos) : null;
                const desc       = deepDiveLabel(item, formatToolLabel);

                const cardContent = (
                  <>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: cycle.accent }} />
                    <div>
                      <div style={{
                        width: 46, height: 46, borderRadius: 15, display: "grid", placeItems: "center",
                        background: "#fff", color: "#221D23", fontSize: 20, fontWeight: 950,
                        marginBottom: 18, border: "1px solid rgba(34,29,35,.08)",
                      }}>
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
                        ) : toolInitials(slug)}
                      </div>
                      <h3 className="card-title">{item.title}</h3>
                      <p style={{ margin: "0 0 18px", color: "#514B53", fontSize: 13, lineHeight: 1.35, fontWeight: 650 }}>
                        {desc}
                      </p>
                    </div>
                    <span style={{ color: "#221D23", fontSize: 12, fontWeight: 950 }}>Explore guide →</span>
                  </>
                );

                const cardStyle: React.CSSProperties = {
                  minHeight: 188, padding: 22, borderRadius: 20,
                  background: cycle.bg, border: `1px solid ${cycle.border}`,
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  boxShadow: "0 18px 45px rgba(34,29,35,.08)",
                  position: "relative", overflow: "hidden",
                  textDecoration: "none", color: "inherit",
                };

                if (isExternal) {
                  return <a key={item.id} href={href} target="_blank" rel="noopener noreferrer" onClick={() => recordFluencyView("deep_dive", item.id)} style={cardStyle}>{cardContent}</a>;
                }
                return <Link key={item.id} href={href} onClick={() => recordFluencyView("deep_dive", item.id)} style={cardStyle}>{cardContent}</Link>;
              })}
            </div>
          ) : null}
        </section>

        {/* ── AI at Work POV banner ── */}
        <section className="aif-pov-grid" style={{
          margin: "42px 0 96px", position: "relative", overflow: "hidden", minHeight: 275,
          display: "grid", gridTemplateColumns: "1.35fr .65fr", borderRadius: 26,
          background: "radial-gradient(circle at 82% 30%,rgba(255,206,0,.20),transparent 26%),radial-gradient(circle at 54% 80%,rgba(98,60,234,.20),transparent 32%),#221D23",
          color: "#fff", boxShadow: "0 28px 65px rgba(34,29,35,.14)", borderLeft: "8px solid #FFCE00",
        }}>
          <div style={{ padding: "36px 34px" }}>
            <div className="aif-pov-kicker">Thinking guide</div>

            <h2>AI at Work: The Real Questions</h2>

            <p className="aif-pov-desc">
              A clear guide to the messy questions behind AI adoption, automation,
              capability building, and work redesign.
            </p>

            <Link href="/explore/perspective/ai-at-work" className="aif-btn-primary" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "13px 20px", borderRadius: 999, background: "#FFCE00",
              color: "#221D23", border: "1px solid rgba(34,29,35,.10)",
              fontWeight: 700, textDecoration: "none", fontSize: 14,
            }}>Explore the guide →</Link>
          </div>

          {/* Orbit visual */}
          <div className="aif-pov-visual" style={{ display: "grid", placeItems: "center", minHeight: 260 }}>
            <div style={{ position: "relative", width: 200, height: 200, border: "1px dashed rgba(255,255,255,.22)", borderRadius: "50%" }}>
              <div className="aif-pov-orbit-core" style={{
                position: "absolute", inset: 44, borderRadius: 24, background: "#FFCE00",
                border: "3px solid #000", color: "#221D23", display: "grid",
                placeItems: "center", textAlign: "center",
                transform: "rotate(-5deg)",
              }}>
                <div>
                  <span>AI</span>
                  <small>AT WORK</small>
                </div>
              </div>
              {[
                { label: "Jobs",   cls: { top: -7, left: 78 } },
                { label: "Risk",   cls: { right: -22, top: 72 } },
                { label: "Agents", cls: { bottom: 11, right: 27 } },
                { label: "Skills", cls: { left: -28, bottom: 46 } },
              ].map(n => (
                <span key={n.label} className="aif-pov-orbit-label" style={{
                  position: "absolute", ...n.cls, padding: "8px 10px", borderRadius: 999,
                  background: "#fff", color: "#221D23",
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
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 950, letterSpacing: "-.045em" }}>Know</h2>
        <p style={{ margin: "10px auto 0", maxWidth: 520, color: "#6B6670", fontSize: 13, lineHeight: 1.45, fontWeight: 650 }}>
          Latest news, practical products, tool guides, and Nudgeable&apos;s view on how AI is changing work.
        </p>
      </footer>

      {/* ── Module HTML popup ── */}
      {htmlModule && (
        <ModuleHtmlModal
          moduleId={htmlModule.id}
          moduleTitle={htmlModule.title}
          moduleEmoji={htmlModule.emoji}
          onClose={() => setHtmlModule(null)}
        />
      )}

      {/* ── Module player modal ── */}
      {openModule && (
        <ModulePlayer
          module={openModule}
          isCompleted={completedIds.includes(openModule.id)}
          onClose={() => setOpenModule(null)}
          onComplete={handleComplete}
        />
      )}

      {/* ── Tool details modal ── */}
      {selectedTool && (
        <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
      )}
    </>
  );
}

// ── Video carousel ─────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function AutoVideoThumbnail({ videoUrl }: { videoUrl: string }) {
  const ytId = extractYouTubeId(videoUrl);
  if (ytId) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
  }
  return (
    <video
      src={videoUrl}
      preload="metadata"
      muted
      playsInline
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 1; }}
    />
  );
}

function VideoCarousel({ videos, isLoggedIn, viewCounts = {} }: { videos: ApplyVideo[]; isLoggedIn: boolean; viewCounts?: Record<string, number> }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<ApplyVideo | null>(null);
  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -290 : 290, behavior: "smooth" });

  // Locked videos (for guests) always appear last
  const displayVideos = [...videos].sort((a, b) => {
    const aLocked = !isLoggedIn && a.is_locked ? 1 : 0;
    const bLocked = !isLoggedIn && b.is_locked ? 1 : 0;
    return aLocked - bLocked;
  });

  return (
    <>
    <div className="aif-carousel-rail">
      <button
        className="aif-arrow-btn"
        onClick={() => scroll("left")}
        aria-label="Previous"
      >‹</button>

      <div ref={scrollRef} className="aif-slider" style={{
        display: "grid", gridAutoFlow: "column", gridAutoColumns: 268,
        gap: 14, overflowX: "auto", padding: "4px 0 30px", scrollSnapType: "x mandatory",
      }}>
        {displayVideos.map(v => {
          const accent = GROUP_ACCENT[v.group_name ?? ""] ?? "#623CEA";
          const isLocked = !isLoggedIn && v.is_locked;

          return (
            <article
              key={v.id}
              onClick={() => { recordFluencyView("video", v.id); setSelectedVideo(v); }}
              style={{
              scrollSnapAlign: "start", borderRadius: 18, overflow: "hidden",
              background: "#fff", border: "1px solid rgba(34,29,35,.06)",
              boxShadow: "0 2px 12px rgba(0,0,0,.06)", cursor: "pointer",
              display: "flex", flexDirection: "column",
              opacity: isLocked ? 0.6 : 1,
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

                {/* Auto-thumbnail: extract a frame from the video when no uploaded thumbnail */}
                {!v.thumbnail_url && v.video_url && (
                  <>
                    <AutoVideoThumbnail videoUrl={v.video_url} />
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.25) 100%)",
                    }} />
                  </>
                )}

                {/* Play button */}
                <div style={{
                  position: "absolute", left: "50%", top: "50%",
                  transform: "translate(-50%,-50%)", zIndex: 2,
                  width: 52, height: 52, borderRadius: "50%",
                  background: isLocked ? "rgba(0,0,0,.3)" : "#fff",
                  backdropFilter: isLocked ? "blur(4px)" : undefined,
                  boxShadow: isLocked ? undefined : "0 6px 24px rgba(0,0,0,.20)",
                  display: "grid", placeItems: "center",
                }}>
                  {isLocked ? (
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
                {!isLocked && v.duration && (
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
                    flex: 1, minWidth: 0,
                  }}>
                    {v.category_tag ?? v.group_name ?? "Feature"}
                  </span>
                  <ViewCountBadge count={viewCounts[v.id] ?? 0} />
                </div>
                <h3 className="card-title">{v.title}</h3>
                {isLocked && (
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
      >›</button>
    </div>

    {selectedVideo && (
      <VideoModal video={selectedVideo} isLoggedIn={isLoggedIn} onClose={() => setSelectedVideo(null)} />
    )}
    </>
  );
}
