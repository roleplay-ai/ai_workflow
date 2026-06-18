"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { COURSE_PARTS } from "@/lib/ai-mastery-course";
import SiteFooter from "@/components/SiteFooter";
import { PAGE_CONTENT_WIDTH } from "@/lib/layout";

// Journey cards 01 and 02 expanded by default; all their modules unlocked for guests
const GUEST_PREVIEW_PART_INDICES = new Set([0, 1]);

const UNLOCKED_IDS = new Set(
  COURSE_PARTS
    .filter((_, idx) => GUEST_PREVIEW_PART_INDICES.has(idx))
    .flatMap(part => part.modules.map(mod => mod.id))
);

const PART_KICKERS: Record<number, string> = {
  0: "Begin the course",
  1: "How AI actually works",
  2: "Accounts, tools, and mindset",
  3: "The most important skill",
  4: "Daily knowledge-work use cases",
  5: "Spreadsheets, insights, and decks",
  6: "Bots, agents, apps, and video",
  7: "Risks, ethics, and boundaries",
  8: "Learning plan and reference guide",
  9: "Future of AI at work",
};

const LOGIN_URL = "/login?redirect=/learn";

const DEFAULT_EXPANDED_PARTS = GUEST_PREVIEW_PART_INDICES;

// ── Access-request popup ───────────────────────────────────────────────────────

function AccessRequestPopup({
  onClose,
  userName,
  userEmail,
}: {
  onClose: () => void;
  userName: string | null;
  userEmail: string | null;
}) {
  const [name,  setName]  = useState(userName  ?? "");
  const [email, setEmail] = useState(userEmail ?? "");

  const subject = encodeURIComponent("AI Mastery Course – Access Request");
  const body = encodeURIComponent(
    `Hi Nudgeable team,\n\nI'd like to request full access to the AI Mastery course.\n\nName: ${name || "[your name]"}\nEmail: ${email || "[your email]"}\n\nPlease review and approve my access.\n\nThank you!`
  );
  const mailtoHref = `mailto:team@nudgeable.ai?subject=${subject}&body=${body}`;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, padding: "36px 32px",
        maxWidth: 480, width: "100%", position: "relative",
        boxShadow: "0 8px 40px rgba(0,0,0,.18)",
        fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none", fontSize: 20,
            cursor: "pointer", color: "#6B6B6B", lineHeight: 1,
          }}
          aria-label="Close"
        >×</button>

        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "#FFFAEB", border: "2px solid #FFCE00",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, marginBottom: 16,
        }}>🔒</div>

        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, letterSpacing: "-.03em" }}>
          Request Full Access
        </h2>
        <p style={{ margin: "0 0 22px", fontSize: 13, color: "#6B6B6B" }}>
          This course is by invitation only. Fill in your details and we'll open your email client with a pre-written message to our team.
        </p>

        <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5, color: "#221D23" }}>
          Your name
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Jane Smith"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 12px", borderRadius: 8,
            border: "1.5px solid #E8DFD2", fontSize: 14,
            marginBottom: 14, outline: "none", fontFamily: "inherit",
          }}
        />

        <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5, color: "#221D23" }}>
          Your email
        </label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="e.g. jane@company.com"
          type="email"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 12px", borderRadius: 8,
            border: "1.5px solid #E8DFD2", fontSize: 14,
            marginBottom: 6, outline: "none", fontFamily: "inherit",
          }}
        />

        <p style={{ fontSize: 11, color: "#B0ABA5", margin: "0 0 22px" }}>
          An email to <strong>team@nudgeable.ai</strong> will open in your mail client with these details pre-filled.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 8,
              border: "1.5px solid #E8DFD2", background: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#221D23",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <a
            href={mailtoHref}
            onClick={onClose}
            style={{
              flex: 2, padding: "11px 0", borderRadius: 8,
              background: "#FFCE00", color: "#221D23", textDecoration: "none",
              fontSize: 14, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              letterSpacing: "-.02em", fontFamily: "inherit",
            }}
          >
            Send Request →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Laptop decorative mockup ───────────────────────────────────────────────────

function LaptopMockup() {
  const barLine = (w: string) => (
    <span style={{ display: "block", height: 8, borderRadius: 999, background: "#E9E5DF", width: w }} />
  );

  return (
    <div className="aim-mockup" style={{ position: "relative", width: "min(100%, 600px)", marginLeft: "auto" }}>
      {/* Lid */}
      <div style={{
        position: "relative", background: "linear-gradient(180deg,#D9D7D2,#CBC8C2)",
        borderRadius: 24, padding: "14px 14px 18px", border: "1px solid #BDB8AF",
        boxShadow: "0 28px 70px rgba(34,29,35,.18)",
      }}>
        {/* Camera */}
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#908B84", margin: "0 auto 10px" }} />

        {/* Screen */}
        <div style={{ background: "#F3F1ED", borderRadius: 16, overflow: "hidden", border: "1px solid #CBC4BA", aspectRatio: "16/10" }}>
          {/* Top bar */}
          <div style={{
            height: 42, borderBottom: "1px solid #E3DDD5", background: "#FAF8F4",
            display: "flex", alignItems: "center", gap: 8, padding: "0 14px",
          }}>
            {["📚 AI for Work", "Ch. 6 · M2"].map(t => (
              <span key={t} style={{
                padding: "7px 12px", borderRadius: 999, background: "#fff",
                border: "1px solid #E4DDD4", fontSize: 11, fontWeight: 700,
              }}>{t}</span>
            ))}
          </div>

          {/* Layout */}
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 156px", minHeight: 338 }}>
            {/* Sidebar */}
            <div style={{ background: "linear-gradient(180deg,#221D23,#1A171D)", color: "#fff", padding: "12px 10px" }}>
              <div style={{ color: "#A79FA8", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>
                Course reader
              </div>
              {[
                { code: "Ch. 5 · M1", title: "AI Meets Your Spreadsheet", secs: 4 },
                { code: "Ch. 5 · M2", title: "The Next Wave – AI Agents", secs: 3 },
                { code: "Ch. 5 · M3", title: "AI for Presentations", secs: 4 },
              ].map(item => (
                <div key={item.code} style={{ padding: "8px 9px", borderRadius: 12, marginBottom: 6, fontSize: 10, color: "rgba(255,255,255,.82)" }}>
                  {item.code}
                  <b style={{ display: "block", color: "#fff", fontSize: 10, lineHeight: 1.2, marginTop: 2 }}>{item.title}</b>
                  <small style={{ display: "block", color: "#A79FA8", marginTop: 3, fontSize: 9 }}>{item.secs} sections</small>
                </div>
              ))}
              <div style={{ color: "#FFCE00", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", margin: "12px 0 8px", textTransform: "uppercase" }}>
                Part 6: Build and Create
              </div>
              {[
                { code: "Ch. 6 · M1", title: "Custom Chatbots", secs: 3, active: false },
                { code: "Ch. 6 · M2", title: "AI Agents – From Chatbots to Action", secs: 4, active: true },
                { code: "Ch. 6 · M3", title: "Vibe Coding", secs: 4, active: false },
              ].map(item => (
                <div key={item.code} style={{
                  padding: "8px 9px", borderRadius: 12, marginBottom: 6, fontSize: 10, color: "rgba(255,255,255,.82)",
                  ...(item.active ? { background: "rgba(255,255,255,.12)", boxShadow: "inset 3px 0 0 #FFCE00" } : {}),
                }}>
                  {item.code}
                  <b style={{ display: "block", color: "#fff", fontSize: 10, lineHeight: 1.2, marginTop: 2 }}>{item.title}</b>
                  <small style={{ display: "block", color: "#A79FA8", marginTop: 3, fontSize: 9 }}>{item.secs} sections</small>
                </div>
              ))}
            </div>

            {/* Main */}
            <div style={{ padding: 12 }}>
              <div style={{
                minHeight: 144, borderRadius: 22, background: "linear-gradient(135deg,#F7D74B,#F2D048)",
                border: "2px solid #221D23", boxShadow: "6px 8px 0 #221D23",
                padding: "16px 16px 14px", position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", right: -28, bottom: -42, width: 138, height: 138, borderRadius: "50%", background: "rgba(255,255,255,.28)" }} />
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>
                  Part 6 · Build and Create
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                  {["Ch. 6 · M2", "4 sections", "Guided reader"].map(c => (
                    <span key={c} style={{ padding: "5px 9px", borderRadius: 999, background: "#fff", border: "1px solid rgba(34,29,35,.14)", fontSize: 10, fontWeight: 700 }}>{c}</span>
                  ))}
                </div>
                <h3 style={{ margin: 0, maxWidth: 330, fontSize: 21, lineHeight: 1.06, letterSpacing: "-.05em", fontWeight: 700 }}>AI Agents – From Chatbots to Action</h3>
                <p style={{ margin: "10px 0 0", maxWidth: 305, fontSize: 10, lineHeight: 1.35, color: "#4B432F", fontWeight: 500 }}>
                  Learn what AI agents are, how they differ from chatbots, and where they can actually help at work.
                </p>
              </div>

              <div style={{ marginTop: 14, background: "#fff", border: "1px solid #E4DDD4", borderRadius: 20, padding: 14 }}>
                <div style={{ height: 6, borderRadius: 999, background: "linear-gradient(90deg,#623CEA,#3699FC,#23CE6B,#FFCE00)", margin: "-2px 0 12px" }} />
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.04em", marginBottom: 8 }}>2.1 What Are AI Agents?</div>
                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                  {["92%", "84%", "96%", "78%"].map((w, i) => (
                    <span key={i} style={{ display: "block", height: 8, borderRadius: 999, background: "#E9E5DF", width: w }} />
                  ))}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 999, background: "#FFF6CF", border: "1px solid #EFD46F", fontSize: 10, fontWeight: 700, marginBottom: 10 }}>
                  🤖 Three ways AI works
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {["AI Chatbot", "IT Automation", "AI Agent"].map(label => (
                    <div key={label} style={{ background: "#FAF8F4", border: "1px solid #E7E1D8", borderRadius: 14, padding: 10 }}>
                      <b style={{ display: "block", fontSize: 10, lineHeight: 1.15, marginBottom: 6 }}>{label}</b>
                      {[0, 1, 2].map(j => (
                        <span key={j} style={{ display: "block", height: 6, borderRadius: 999, background: "#E1DCD5", marginTop: 5, width: ["92%", "80%", "70%"][j] }} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TOC */}
            <div style={{ padding: "12px 10px 12px 0" }}>
              <div style={{ background: "#fff", border: "1px solid #E4DDD4", borderRadius: 20, padding: 12, minHeight: "100%" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 14, letterSpacing: "-.02em" }}>In this module</h4>
                {[
                  { code: "2.1", title: "What Are AI Agents?" },
                  { code: "2.2", title: "What Makes Up an AI Agent?" },
                  { code: "2.3", title: "AI Agents in Action" },
                  { code: "2.4", title: "What Agents Can and Can't Do" },
                ].map(item => (
                  <div key={item.code} style={{ border: "1px solid #E4DDD4", borderRadius: 14, padding: "9px 10px", marginBottom: 8, background: "#FAF8F4" }}>
                    <b style={{ display: "block", color: "#623CEA", fontSize: 10, marginBottom: 4 }}>{item.code}</b>
                    <span style={{ display: "block", fontSize: 10, lineHeight: 1.2, color: "#544E56" }}>{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Base */}
      <div style={{
        width: "112%", height: 14, margin: "0 auto", transform: "translateX(-5.5%)",
        background: "linear-gradient(180deg,#D3D1CC,#BEBAB2)",
        borderRadius: "0 0 28px 28px", boxShadow: "0 8px 22px rgba(34,29,35,.15)",
      }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type AIMasteryPreviewProps = {
  isLoggedIn?: boolean;
  userName?: string | null;
  userEmail?: string | null;
};

export default function AIMasteryPreview({ isLoggedIn = false, userName = null, userEmail = null }: AIMasteryPreviewProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [expandedParts, setExpandedParts] = useState<Set<number>>(() => new Set(DEFAULT_EXPANDED_PARTS));
  const [showAccessPopup, setShowAccessPopup] = useState(false);

  const togglePart = (partIdx: number) => {
    setExpandedParts(prev => {
      const next = new Set(prev);
      if (next.has(partIdx)) next.delete(partIdx);
      else next.add(partIdx);
      return next;
    });
  };

  // Guest clicked an unlocked preview module — show just that chapter
  if (selectedModuleId) {
    return (
      <>
        <AppNav activePage="learn" isLoggedIn={isLoggedIn} userName={userName} />

        <div className="aim-course-shell">
          {/* Preview banner */}
          <div className="aim-preview-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="aim-preview-badge">Preview</span>
              <span className="aim-preview-text">
                Sign in to access all chapters and track your progress.
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <a href={LOGIN_URL} className="aim-btn-primary" style={{ padding: "7px 16px", fontSize: 12 }}>
                Sign in →
              </a>
              <button
                onClick={() => setSelectedModuleId(null)}
                className="aim-preview-back"
              >← Course overview</button>
            </div>
          </div>

          {/* Course iframe — sidebar + bottom-nav hidden, auto-jumped to this module */}
          <iframe
            key={selectedModuleId}
            title="AI Mastery Chapter Preview"
            src={`/api/ai-mastery/content?moduleId=${encodeURIComponent(selectedModuleId)}`}
            style={{ flex: 1, width: "100%", border: 0, background: "#FEFCFA" }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <AppNav activePage="learn" isLoggedIn={isLoggedIn} userName={userName} />

      <main style={{ width: PAGE_CONTENT_WIDTH, margin: "34px auto 0" }}>

        {/* ── Hero ── */}
        <section className="aim-hero" style={{
          position: "relative", display: "grid", gridTemplateColumns: "1fr .98fr",
          gap: 34, padding: 44, border: "1px solid #E9E4DC", borderRadius: 28,
          overflow: "hidden", background: "#fff", boxShadow: "0 1px 0 rgba(34,29,35,.04)",
        }}>
          {/* Decorative circle */}
          <div style={{
            position: "absolute", right: -90, top: -110, width: 420, height: 420,
            borderRadius: "50%", background: "#FFF6CF", zIndex: 0, pointerEvents: "none",
          }} />

          {/* Copy */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="aim-hero-eyebrow">
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FFCE00", outline: "2px solid #221D23", display: "inline-block" }} />
              Self-paced online course
            </div>

            <h1>AI Mastery Online Course.</h1>

            <p className="aim-hero-desc">
              Everything from 40+ corporate workshops, now structured as a self-paced online course for practical AI fluency at work.
            </p>

            <ul className="aim-hero-list">
              {[

                "30+ lessons, 8 hours, 6 months access.",
                "Covers Prompt Engineering, Data, Writing, Agents, Vibe Coding, and AI Risks.",
                "Updated regularly, no outdated content.",
              ].map(text => (
                <li key={text}>
                  <span className="aim-hero-check">✓</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="aim-hero-actions">
              <a href="#journey" className="aim-btn-primary">Explore course →</a>
              {isLoggedIn ? (
                <button
                  onClick={() => setShowAccessPopup(true)}
                  className="aim-btn-secondary"
                  style={{ cursor: "pointer" }}
                >Get full access</button>
              ) : (
                <a href={LOGIN_URL} className="aim-btn-secondary">Get full access</a>
              )}
            </div>
            <p className="aim-hero-footnote">
              <b>Discount available.</b> Email us for access options.
            </p>
          </div>

          {/* Laptop mockup */}
          <div style={{ position: "relative", zIndex: 1, display: "grid", alignContent: "center" }}>
            <LaptopMockup />
          </div>
        </section>

        {/* ── Course Journey ── */}
        <section style={{ marginTop: 72 }} id="journey">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 22, marginBottom: 28 }}>
            <div className="aim-section-head">
              <div className="aim-section-accent" />
              <span className="aim-section-label">Course journey</span>
              <h2 className="aim-section-title">
                Follow the complete AI Mastery sequence
              </h2>
              <p className="aim-section-desc">
                The chapters are arranged as a learning journey. Unlocked preview lessons are highlighted inside their actual part.
              </p>
            </div>
          </div>

          {/* Journey */}
          <div style={{ position: "relative", display: "grid", gap: 22 }}>
            {/* Vertical connector */}
            <div style={{ position: "absolute", left: 29, top: 20, bottom: 20, width: 2, background: "#E5DDD3", zIndex: 0 }} />

            {COURSE_PARTS.map((part, partIdx) => {
              const unlockedCount = part.modules.filter(m => UNLOCKED_IDS.has(m.id)).length;
              const metaLabel = unlockedCount > 0 ? `${unlockedCount} unlocked` : "Need full access";
              const isExpanded = expandedParts.has(partIdx);

              return (
                <article key={part.number} style={{ position: "relative", display: "grid", gridTemplateColumns: "60px 1fr", gap: 18 }}>
                  {/* Node */}
                  <div style={{ position: "relative", zIndex: 2, width: 60, display: "flex", justifyContent: "center" }}>
                    <span className="aim-journey-node">{String(partIdx + 1).padStart(2, "0")}</span>
                  </div>

                  {/* Card */}
                  <div style={{ background: "#fff", border: "1px solid #E9E4DC", borderRadius: 24, boxShadow: "0 12px 34px rgba(34,29,35,.06)", overflow: "hidden" }}>
                    {/* Part header — click to expand/collapse */}
                    <button
                      type="button"
                      className="aim-journey-part-header"
                      aria-expanded={isExpanded}
                      aria-controls={`aim-journey-modules-${part.number}`}
                      onClick={() => togglePart(partIdx)}
                    >
                      <div style={{ display: "flex", gap: 13, alignItems: "flex-start", textAlign: "left" }}>
                        <div style={{ width: 46, height: 46, borderRadius: 16, background: "#221D23", color: "#fff", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>
                          {part.icon}
                        </div>
                        <div>
                          <span className="aim-journey-kicker">
                            {PART_KICKERS[part.number]}
                          </span>
                          <h3 className="aim-journey-part-title">
                            {part.number === 0 ? part.title : `Part ${part.number}: ${part.title}`}
                          </h3>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0, alignItems: "center" }}>
                        <span className="aim-journey-badge">
                          {part.modules.length} lesson{part.modules.length !== 1 ? "s" : ""}
                        </span>
                        <span className="aim-journey-badge">
                          {metaLabel}
                        </span>
                        <span className={`aim-journey-toggle${isExpanded ? " aim-journey-toggle--expanded" : ""}`} aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </div>
                    </button>

                    {/* Module rows */}
                    {isExpanded && (
                      <div id={`aim-journey-modules-${part.number}`}>
                        {part.modules.map((mod, modIdx) => {
                          const isUnlocked = UNLOCKED_IDS.has(mod.id);
                          return (
                            <div
                              key={mod.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                if (isUnlocked) setSelectedModuleId(mod.id);
                                else if (isLoggedIn) setShowAccessPopup(true);
                                else window.location.href = LOGIN_URL;
                              }}
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  if (isUnlocked) setSelectedModuleId(mod.id);
                                  else if (isLoggedIn) setShowAccessPopup(true);
                                  else window.location.href = LOGIN_URL;
                                }
                              }}
                              style={{
                                display: "grid", gridTemplateColumns: "1fr auto", gap: 16,
                                alignItems: "center", padding: "15px 18px",
                                borderBottom: modIdx < part.modules.length - 1 ? "1px solid #E9E4DC" : "none",
                                cursor: "pointer",
                                ...(isUnlocked ? {
                                  background: "linear-gradient(90deg,#FFF6CF 0%,#fff 64%)",
                                  boxShadow: "inset 6px 0 0 #FFCE00",
                                } : {}),
                              }}
                            >
                              <div style={{ minWidth: 0, opacity: isUnlocked ? 1 : 0.74 }}>
                                <span className="aim-journey-module-code">
                                  {part.number === 0 ? "Start Here" : `Ch.${part.number} · M${modIdx + 1}`}
                                </span>
                                <strong className={`aim-journey-module-title ${isUnlocked ? "aim-journey-module-title--unlocked" : "aim-journey-module-title--locked"}`}>
                                  {mod.title}
                                </strong>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                                {isUnlocked ? (
                                  <span className="aim-journey-preview-link">Preview →</span>
                                ) : (
                                  <>
                                    <span className="aim-journey-locked-badge">
                                      Locked
                                    </span>
                                    <span style={{ color: "#A49CA6", fontSize: 14 }}>🔒</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── CTA banner ── */}
        <section className="aim-cta-banner" style={{
          margin: "42px 0 88px", position: "relative", overflow: "hidden", minHeight: 255,
          display: "grid", gridTemplateColumns: "1.2fr .8fr", borderRadius: 26,
          background: "radial-gradient(circle at 82% 30%,rgba(255,206,0,.20),transparent 26%),radial-gradient(circle at 54% 80%,rgba(98,60,234,.20),transparent 32%),#221D23",
          color: "#fff", boxShadow: "0 28px 65px rgba(34,29,35,.14)", borderLeft: "8px solid #FFCE00",
        }}>
          <div style={{ padding: "36px 34px" }}>
            <div className="aim-cta-kicker">Full access</div>
            <h2>Want the complete course?</h2>
            <p className="aim-cta-desc">
              {isLoggedIn
                ? "Request access and our team will approve you shortly."
                : "Sign in or create an account to unlock all 30+ lessons and track your progress."}
            </p>
            {isLoggedIn ? (
              <button
                onClick={() => setShowAccessPopup(true)}
                className="aim-btn-primary"
                style={{ cursor: "pointer" }}
              >Request access →</button>
            ) : (
              <a href={LOGIN_URL} className="aim-btn-primary">Sign in to access →</a>
            )}
          </div>
          <div style={{ display: "grid", placeItems: "center", padding: 28 }}>
            <div style={{ width: "min(100%,320px)", background: "#fff", color: "#221D23", borderRadius: 22, padding: 22, boxShadow: "0 20px 48px rgba(0,0,0,.20)" }}>
              <strong className="aim-cta-stat-title">30+ lessons · 8 hours</strong>
              <span className="aim-cta-stat-desc">
                Complete AI Mastery course — learn at your own pace with lifetime updates.
              </span>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />

      {showAccessPopup && (
        <AccessRequestPopup
          onClose={() => setShowAccessPopup(false)}
          userName={userName}
          userEmail={userEmail}
        />
      )}
    </>
  );
}
