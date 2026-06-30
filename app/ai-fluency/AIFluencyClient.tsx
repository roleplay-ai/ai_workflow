"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { deepDiveHref, deepDiveLabel } from "@/lib/deepDives";
import { formatToolLabel } from "@/lib/tools";
import { resolveToolLogoUrl, type ToolLogoMap } from "@/lib/toolLogos";
import ViewCountBadge from "@/components/ViewCountBadge";
import { recordFluencyView, PAGE_IDS } from "@/lib/fluencyViews";
import type { ToolDeepDive } from "@/lib/supabase/types";
import VideoModal from "./VideoModal";
import ToolModal, { type ToolModalTool } from "./ToolModal";
import ToolGuideCard, { type ToolGuide, resolveGuideToolSlug } from "./ToolGuideCard";
import { normalizeToolSlug } from "@/lib/tools";
import SiteFooter from "@/components/SiteFooter";
import BriefNewsCard from "@/components/BriefNewsCard";
import { PAGE_CONTENT_WIDTH } from "@/lib/layout";

// ── Types ─────────────────────────────────────────────────────────────────────

type BriefItem = { id: string; content: string; sort_order: number };
type Brief = { id: string; title: string; published_date: string; fluency_brief_items: BriefItem[] };
type ApplyVideo = {
  id: string; title: string; description: string | null; video_url: string | null;
  thumbnail_url: string | null; duration: string | null; order_index: number;
  is_locked: boolean; group_name: string | null; category_tag: string | null;
};
type FluencyTool = ToolModalTool;
type Props = {
  brief: Brief | null;
  videos: ApplyVideo[];
  tools: FluencyTool[];
  toolGuides: ToolGuide[];
  deepDives: ToolDeepDive[];
  toolLogos: ToolLogoMap;
  isLoggedIn: boolean;
  userName?: string | null;
  isAdmin?: boolean;
  viewCounts?: Record<string, number>;
};

// ── Deep-dive helpers ────────────────────────────────────────────────────────

function toolColor(slug: string): string {
  if (slug === "claude") return "#623CEA";
  if (slug === "chatgpt") return "#23CE68";
  if (slug === "gemini") return "#3696FC";
  if (slug === "copilot") return "#F68A29";
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
  Features: "#A855F7",
  Apps: "#EC4899",
  Workflows: "#F68A29",
  Skills: "#3699FC",
};

const TOOL_ACCENTS = ["#17614B", "#326EA9", "#AA577C", "#C66D38", "#623CEA", "#1E8B5C"];

// Tool-guide card colour cycle (purple → yellow → blue → green)
const TOOL_GUIDE_COLORS = [
  { bg: "#F4EFFD", border: "#DED1FF", accent: "#623CEA" },
  { bg: "#FFF6CF", border: "#F0D978", accent: "#FFCE00" },
  { bg: "#EEF7FF", border: "#CFE8FF", accent: "#3699FC" },
  { bg: "#ECFFF4", border: "#C8F3DA", accent: "#23CE6B" },
];

const HERO_MINI_CARDS = [
  {
    icon: "📰",
    title: "News without noise",
    description: "Only the updates that affect work, tools, and adoption.",
  },
  {
    icon: "▶",
    title: "Short launch explainers",
    description: "Quick videos on what changed and why it matters.",
  },
  {
    icon: "?",
    title: "Workplace AI questions",
    description: "Our perspective on common AI questions employees ask.",
  },
];

const WORK_QUESTIONS = [
  {
    question: "Is this an AI bubble?",
    short: "It may be a financial bubble in some places, but that does not mean AI capability is hype.",
    bullets: [
      "There are signs of overvaluation around infrastructure and startups.",
      "The capability story is separate because people are getting daily value from real work.",
      "For employees, the useful question is whether AI improves their actual tasks.",
    ],
  },
  {
    question: "Will AI take over the world?",
    short: "The risk deserves attention, but workplace decisions should focus on near-term capability and governance.",
    bullets: [
      "The immediate risks are blind trust, data leakage, bad automation, and unclear accountability.",
      "Most AI still needs human goals, tools, constraints, and review.",
      "Companies need practical guardrails, not panic or hype.",
    ],
  },
  {
    question: "Will AI replace jobs?",
    short: "AI will replace tasks first. Jobs change when enough tasks inside a role are automated or redesigned.",
    bullets: [
      "Writing, research, analysis, coding, and coordination are already changing.",
      "Roles with repeatable digital work will shift faster.",
      "Human judgment, trust, relationships, and context will matter more.",
    ],
  },
  {
    question: "What skills will matter more?",
    short: "Structured thinking, precise expression, domain judgment, and review quality will matter more.",
    bullets: [
      "People need to break work into clear steps.",
      "They need to give AI context, examples, constraints, and quality standards.",
      "They need judgment to detect weak outputs and confident mistakes.",
    ],
  },
  {
    question: "Are AI agents ready for real work?",
    short: "Agents are useful for narrow workflows, but risky when goals are vague or judgment is high.",
    bullets: [
      "They work best with clear steps, tools, permissions, and success criteria.",
      "They struggle when business intent is hidden or policies are complex.",
      "Start with supervised workflows before background automation.",
    ],
  },
  {
    question: "Should companies allow employees to use AI?",
    short: "Yes, but with boundaries. Blocking AI usually pushes usage into unmanaged tools.",
    bullets: [
      "Employees will use AI when it saves time.",
      "The control point is approved tools, data rules, and use-case guidance.",
      "Companies should define what is allowed, reviewed, and prohibited.",
    ],
  },
  {
    question: "Is prompt engineering still important?",
    short: "Yes, but it is now less about tricks and more about clear work design.",
    bullets: [
      "Better models reduce the need for complicated prompting.",
      "Good prompts still need context, examples, constraints, and quality standards.",
      "The skill is converting messy work into clear instruction.",
    ],
  },
  {
    question: "Why do AI workshops lose momentum?",
    short: "Most workshops create awareness, but they do not create repeated practice inside real work.",
    bullets: [
      "Employees leave without mapped use cases for their role.",
      "There is no follow-up system to push practice or remove friction.",
      "Capability improves through repeated application, not demos alone.",
    ],
  },
  {
    question: "How should companies build AI fluency?",
    short: "Start with role-specific workflows, a safe practice space, and measurement of actual application.",
    bullets: [
      "Generic AI training helps awareness, but not behavior change.",
      "Employees need workflow examples for their actual work.",
      "Companies should measure practice, completion, improvement, and repeat usage.",
    ],
  },
  {
    question: "What should not be automated with AI?",
    short: "Do not automate work where trust, ethics, sensitive data, or final accountability cannot be delegated safely.",
    bullets: [
      "Use AI to prepare, analyze, draft, and check.",
      "Keep high-stakes decisions with accountable humans.",
      "Do not automate empathy-heavy communication without human review.",
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Tools section (filterable + paginated) ────────────────────────────────────

const TOOLS_PAGE_SIZE = 10;

function ToolsSection({ tools, onOpenTool }: { tools: FluencyTool[]; onOpenTool: (t: FluencyTool) => void }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(tools.map(t => t.category_label)))],
    [tools],
  );
  const [filter, setFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(TOOLS_PAGE_SIZE);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(TOOLS_PAGE_SIZE);
    scrollRef.current?.scrollTo({ left: 0 });
  }, [filter]);

  const filtered = useMemo(
    () => filter === "All" ? tools : tools.filter(t => t.category_label === filter),
    [tools, filter],
  );
  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function scroll(dir: "left" | "right") {
    const row = scrollRef.current;
    if (!row) return;
    if (dir === "right") {
      const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 10;
      if (atEnd && hasMore) {
        setVisibleCount(c => Math.min(filtered.length, c + TOOLS_PAGE_SIZE));
        return;
      }
    }
    row.scrollBy({ left: dir === "left" ? -330 : 330, behavior: "smooth" });
  }

  return (
    <section style={{ marginTop: 70 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 22, marginBottom: 16 }}>
        <div style={{ position: "relative", paddingLeft: 22 }}>
          <div style={{
            position: "absolute", left: 0, top: 4, width: 7, height: 58,
            borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(34,29,35,.18)",
          }} />
          <span style={{
            display: "inline-flex", padding: "7px 10px", borderRadius: 999, background: "#221D23",
            color: "#fff", fontSize: 10, fontWeight: 950, textTransform: "uppercase",
            letterSpacing: ".10em", marginBottom: 8,
          }}>Tools</span>
          <h2 className="aif-section-title">Most Useful Tools</h2>
          <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>AI products worth trying for real work.</p>
        </div>
        <a href="/know/tools" style={{ fontSize: 13, fontWeight: 950, color: "#FF4B1F", whiteSpace: "nowrap", textDecoration: "none" }}>Browse tools →</a>
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

      {/* <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#9B9199", letterSpacing: ".04em" }}>
        {visibleItems.length < filtered.length
          ? `Showing ${visibleItems.length} of ${filtered.length}`
          : `${filtered.length}`} tool{filtered.length !== 1 ? "s" : ""}
      </p> */}

      {/* Scroll row */}
      <div className="aif-carousel-rail">
        <button className="aif-arrow-btn" onClick={() => scroll("left")} aria-label="Previous">‹</button>
        <div ref={scrollRef} className="aif-slider" style={{
          display: "grid", gridAutoFlow: "column", gridAutoColumns: 292, gap: 24,
          overflowX: "auto", padding: "4px 0 30px", scrollSnapType: "x mandatory",
          justifyContent: "start",
        }}>
          {visibleItems.map((t, i) => {
            const accent = TOOL_ACCENTS[i % TOOL_ACCENTS.length];
            return (
              <article
                key={t.id}
                className="aif-product-card"
                style={{
                  scrollSnapAlign: "start", height: 220, borderRadius: 20,
                  padding: "16px 16px 14px", color: "#221D23",
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
                  <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "8px 0" }}>
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
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>{t.description}</p>
                </div>

                <div style={{
                  position: "relative", zIndex: 1, paddingTop: 10,
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
                      onClick={() => onOpenTool(t)}
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
        </div>
        <button className="aif-arrow-btn" onClick={() => scroll("right")} aria-label="Next">›</button>
      </div>
    </section>
  );
}

// ── AI at Work questions ──────────────────────────────────────────────────────

function WorkQuestionsSection() {
  const questionRefs = useRef<(HTMLDetailsElement | null)[]>([]);

  function handleToggle(index: number) {
    const current = questionRefs.current[index];
    if (!current?.open) return;
    questionRefs.current.forEach((el, i) => {
      if (el && i !== index) el.open = false;
    });
  }

  return (
    <section className="aif-questions-section" id="questions">
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        gap: 22, marginBottom: 24,
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
          }}>Perspective</span>
          <h2 className="aif-section-title">AI at Work: Questions</h2>
          <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45, maxWidth: 760 }}>
            Practical takes on adoption, automation, and work redesign. Click any question to expand.
          </p>
        </div>
      </div>

      <div className="aif-question-grid">
        {WORK_QUESTIONS.map((item, index) => (
          <details
            key={item.question}
            className="aif-question"
            ref={(el) => { questionRefs.current[index] = el; }}
            onToggle={() => handleToggle(index)}
          >
            <summary>
              <span className="aif-question-num">{index + 1}</span>
              <span>{item.question}</span>
              <span className="aif-question-chev">+</span>
            </summary>
            <div className="aif-question-answer">
              <p className="aif-question-short">{item.short}</p>
              <ul>
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>

      <div className="aif-questions-cta">
        <div>
          <h3>Use updates for awareness. Use workflows for practice.</h3>
          <p>The AI Updates page should inform users. The Workflows page should drive action.</p>
        </div>
        <Link href="/apply" className="aif-hero-btn">Go to Workflows →</Link>
      </div>
    </section>
  );
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
          <h2 className="aif-section-title">{title}</h2>
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
  brief, videos, tools, toolGuides, deepDives, toolLogos,
  isLoggedIn, userName, isAdmin, viewCounts = {},
}: Props) {
  const [selectedTool, setSelectedTool] = useState<FluencyTool | null>(null);

  useEffect(() => {
    recordFluencyView("page", PAGE_IDS.AI_FLUENCY);
  }, []);

  function openToolDetails(tool: FluencyTool) {
    recordFluencyView("tool", tool.id);
    setSelectedTool(tool);
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
      <main style={{ width: PAGE_CONTENT_WIDTH, margin: "34px auto 0" }}>

        {/* ── Hero ── */}
        <section className="aif-hero">
          <div className="aif-hero-left">
            <div className="eyebrow"><span className="eyebrow-dot" /> Updated every week</div>

            <h1>Stay current with AI</h1>

            <p className="aif-hero-desc">
              Latest AI news, tools, videos, and practical updates, curated for people using AI at work.
            </p>

            <div className="aif-hero-actions">
              <a className="aif-hero-btn" href="#videos">Explore latest updates →</a>
            </div>
          </div>

          <div className="aif-hero-right">
            <div className="aif-hero-stack">
              {HERO_MINI_CARDS.map((card) => (
                <div key={card.title} className="aif-hero-mini">
                  <div className="aif-hero-icon">{card.icon}</div>
                  <div>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Latest AI News ── */}
        <section id="latest" style={{ marginTop: 70 }}>
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
              }}>News</span>
              <h2 className="aif-section-title">Latest AI News</h2>
              <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>
                Short, useful updates for people applying AI at work.
              </p>
            </div>
          </div>

          <BriefNewsCard
            items={brief?.fluency_brief_items ?? []}
            publishedDate={brief?.published_date}
          />
        </section>

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
              <h2 className="aif-section-title">Latest Launches</h2>
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
        <ToolsSection tools={tools} onOpenTool={openToolDetails} />

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
              <h2 className="aif-section-title">
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
                const cycle = TOOL_GUIDE_COLORS[i % TOOL_GUIDE_COLORS.length];
                const slug = item.tool ?? "";
                const href = deepDiveHref(item);
                const isExternal = (item.link_type ?? "external") === "external";
                const logoUrl = slug ? resolveToolLogoUrl(slug, toolLogos) : null;
                const desc = deepDiveLabel(item, formatToolLabel);

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

        {/* ── AI at Work questions ── */}
        <WorkQuestionsSection />

      </main>

      <SiteFooter />

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
