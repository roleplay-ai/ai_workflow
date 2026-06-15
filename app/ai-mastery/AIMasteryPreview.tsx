"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { COURSE_PARTS } from "@/lib/ai-mastery-course";

// Modules available as free preview
const UNLOCKED_IDS = new Set([
  "ch2-m3-the-ai-mindset",
  "ch3-m3-prompting-techniques",
  "ch4-m3-document-analysis",
  "ch5-m1-ai-meets-your-spreadsheet",
  "ch6-m3-vibe-coding",
  "ch8-m1-your-ai-learning-plan",
]);

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

const LOGIN_URL = "/login?redirect=/ai-mastery";

// ── Laptop decorative mockup ───────────────────────────────────────────────────

function LaptopMockup() {
  const barLine = (w: string) => (
    <span style={{ display: "block", height: 8, borderRadius: 999, background: "#E9E5DF", width: w }} />
  );

  return (
    <div style={{ position: "relative", width: "min(100%, 600px)", marginLeft: "auto" }}>
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
                border: "1px solid #E4DDD4", fontSize: 11, fontWeight: 900,
              }}>{t}</span>
            ))}
          </div>

          {/* Layout */}
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 156px", minHeight: 338 }}>
            {/* Sidebar */}
            <div style={{ background: "linear-gradient(180deg,#221D23,#1A171D)", color: "#fff", padding: "12px 10px" }}>
              <div style={{ color: "#A79FA8", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 900, marginBottom: 8 }}>
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
              <div style={{ color: "#FFCE00", fontSize: 10, fontWeight: 950, letterSpacing: ".08em", margin: "12px 0 8px", textTransform: "uppercase" }}>
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
                <div style={{ fontSize: 10, fontWeight: 950, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>
                  Part 6 · Build and Create
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                  {["Ch. 6 · M2", "4 sections", "Guided reader"].map(c => (
                    <span key={c} style={{ padding: "5px 9px", borderRadius: 999, background: "#fff", border: "1px solid rgba(34,29,35,.14)", fontSize: 10, fontWeight: 900 }}>{c}</span>
                  ))}
                </div>
                <h3 style={{ margin: 0, maxWidth: 330, fontSize: 21, lineHeight: .96, letterSpacing: "-.05em" }}>AI Agents – From Chatbots to Action</h3>
                <p style={{ margin: "10px 0 0", maxWidth: 305, fontSize: 10, lineHeight: 1.35, color: "#4B432F", fontWeight: 700 }}>
                  Learn what AI agents are, how they differ from chatbots, and where they can actually help at work.
                </p>
              </div>

              <div style={{ marginTop: 14, background: "#fff", border: "1px solid #E4DDD4", borderRadius: 20, padding: 14 }}>
                <div style={{ height: 6, borderRadius: 999, background: "linear-gradient(90deg,#623CEA,#3699FC,#23CE6B,#FFCE00)", margin: "-2px 0 12px" }} />
                <div style={{ fontSize: 16, fontWeight: 950, letterSpacing: "-.04em", marginBottom: 8 }}>2.1 What Are AI Agents?</div>
                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                  {["92%", "84%", "96%", "78%"].map((w, i) => (
                    <span key={i} style={{ display: "block", height: 8, borderRadius: 999, background: "#E9E5DF", width: w }} />
                  ))}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 999, background: "#FFF6CF", border: "1px solid #EFD46F", fontSize: 10, fontWeight: 950, marginBottom: 10 }}>
                  🤖 Three ways AI works
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {["AI Chatbot", "IT Automation", "AI Agent"].map(label => (
                    <div key={label} style={{ background: "#FAF8F4", border: "1px solid #E7E1D8", borderRadius: 14, padding: 10 }}>
                      <b style={{ display: "block", fontSize: 10, lineHeight: 1.15, marginBottom: 6 }}>{label}</b>
                      {[0, 1, 2].map(j => (
                        <span key={j} style={{ display: "block", height: 6, borderRadius: 999, background: "#E1DCD5", marginTop: 5, width: ["92%","80%","70%"][j] }} />
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

export default function AIMasteryPreview() {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Guest clicked an unlocked preview module — show just that chapter
  if (selectedModuleId) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif" }}>
        <AppNav activePage="ai-mastery" />

        {/* Preview banner */}
        <div style={{
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", height: 48, background: "#221D23", color: "#fff", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              padding: "4px 10px", borderRadius: 999, background: "#FFCE00", color: "#221D23",
              fontSize: 11, fontWeight: 950, letterSpacing: ".06em", textTransform: "uppercase",
            }}>Preview</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,.70)", fontWeight: 650 }}>
              Sign in to access all chapters and track your progress.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href={LOGIN_URL} style={{
              padding: "7px 16px", borderRadius: 999, background: "#FFCE00", color: "#221D23",
              fontSize: 12, fontWeight: 950, textDecoration: "none", whiteSpace: "nowrap",
            }}>Sign in →</a>
            <button
              onClick={() => setSelectedModuleId(null)}
              style={{
                padding: "7px 14px", borderRadius: 999, background: "rgba(255,255,255,.12)",
                color: "#fff", border: "1px solid rgba(255,255,255,.18)",
                fontSize: 12, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap",
              }}
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
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#FEFCFA", color: "#221D23",
      fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif",
      letterSpacing: "-.01em",
    }}>
      <AppNav activePage="ai-mastery" />

      <main style={{ width: "min(1200px,calc(100% - 56px))", margin: "34px auto 0" }}>

        {/* ── Hero ── */}
        <section style={{
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
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 13px",
              borderRadius: 999, background: "#fff", border: "1px solid #EAD993",
              fontSize: 12, fontWeight: 950, color: "#221D23", marginBottom: 26,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FFCE00", outline: "2px solid #221D23", display: "inline-block" }} />
              Self-paced online course
            </div>

            <h1 style={{ margin: 0, maxWidth: 720, fontSize: "clamp(50px,6.4vw,86px)", lineHeight: .94, fontWeight: 950, letterSpacing: "-.075em" }}>
              AI Mastery Online Course.
            </h1>

            <p style={{ maxWidth: 650, margin: "28px 0 24px", fontSize: 19, lineHeight: 1.5, color: "#6B6670", fontWeight: 650 }}>
              Everything from 40+ corporate workshops, now structured as a self-paced online course for practical AI fluency at work.
            </p>

            <ul style={{ display: "grid", gap: 14, margin: "0 0 28px", padding: 0, listStyle: "none" }}>
              {[
                "Built from 40+ corporate workshops, not recycled theory.",
                "30+ lessons, 8 hours, 6 months access.",
                "Covers Prompt Engineering, Data, Writing, Agents, Vibe Coding, and AI Risks.",
                "Updated regularly, no outdated content.",
              ].map(text => (
                <li key={text} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15, lineHeight: 1.35, fontWeight: 750 }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#17B55C", color: "#fff", display: "grid", placeItems: "center", fontWeight: 950, flexShrink: 0 }}>✓</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <a href="#journey" style={{
                display: "inline-flex", alignItems: "center", padding: "12px 18px", borderRadius: 999,
                background: "#FFCE00", color: "#221D23", border: "1px solid rgba(34,29,35,.10)",
                fontWeight: 950, fontSize: 13, textDecoration: "none",
              }}>Explore course →</a>
              <a href={LOGIN_URL} style={{
                display: "inline-flex", alignItems: "center", padding: "12px 18px", borderRadius: 999,
                background: "#fff", color: "#221D23", border: "1px solid #E9E4DC",
                fontWeight: 950, fontSize: 13, textDecoration: "none",
              }}>Get full access</a>
            </div>
            <p style={{ marginTop: 16, color: "#6B6670", fontSize: 13, fontWeight: 700 }}>
              <b style={{ color: "#221D23" }}>Discount available.</b> Email us for access options.
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
            <div style={{ position: "relative", paddingLeft: 22 }}>
              <div style={{
                position: "absolute", left: 0, top: 4, width: 7, height: 58,
                borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(34,29,35,.18)",
              }} />
              <span style={{
                display: "inline-flex", padding: "7px 10px", borderRadius: 999, background: "#221D23",
                color: "#fff", fontSize: 10, fontWeight: 950, textTransform: "uppercase",
                letterSpacing: ".10em", marginBottom: 8,
              }}>Course journey</span>
              <h2 style={{ margin: 0, fontSize: 34, lineHeight: 1.03, fontWeight: 950, letterSpacing: "-.055em" }}>
                Follow the complete AI Mastery sequence
              </h2>
              <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>
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
              const metaLabel = unlockedCount > 0 ? `${unlockedCount} unlocked` : "Full access";

              return (
                <article key={part.number} style={{ position: "relative", display: "grid", gridTemplateColumns: "60px 1fr", gap: 18 }}>
                  {/* Node */}
                  <div style={{ position: "relative", zIndex: 2, width: 60, display: "flex", justifyContent: "center" }}>
                    <span style={{
                      width: 40, height: 40, borderRadius: "50%", background: "#FFCE00",
                      border: "2px solid #221D23", display: "grid", placeItems: "center",
                      fontSize: 12, fontWeight: 950,
                    }}>{String(partIdx + 1).padStart(2, "0")}</span>
                  </div>

                  {/* Card */}
                  <div style={{ background: "#fff", border: "1px solid #E9E4DC", borderRadius: 24, boxShadow: "0 12px 34px rgba(34,29,35,.06)", overflow: "hidden" }}>
                    {/* Part header */}
                    <div style={{
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                      gap: 16, padding: 20, borderBottom: "1px solid #E9E4DC",
                      background: "linear-gradient(180deg,#fff,#FEFCFA)",
                    }}>
                      <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                        <div style={{ width: 46, height: 46, borderRadius: 16, background: "#221D23", color: "#fff", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>
                          {part.icon}
                        </div>
                        <div>
                          <span style={{ display: "block", color: "#6B6670", fontSize: 12, fontWeight: 850 }}>
                            {PART_KICKERS[part.number]}
                          </span>
                          <h3 style={{ margin: "3px 0 0", fontSize: 22, lineHeight: 1.05, letterSpacing: "-.04em", fontWeight: 950 }}>
                            {part.number === 0 ? part.title : `Part ${part.number}: ${part.title}`}
                          </h3>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0 }}>
                        <span style={{ padding: "7px 10px", borderRadius: 999, background: "#FFF6CF", border: "1px solid #F0D978", whiteSpace: "nowrap", fontSize: 12, fontWeight: 900 }}>
                          {part.modules.length} lesson{part.modules.length !== 1 ? "s" : ""}
                        </span>
                        <span style={{ padding: "7px 10px", borderRadius: 999, background: "#FFF6CF", border: "1px solid #F0D978", whiteSpace: "nowrap", fontSize: 12, fontWeight: 900 }}>
                          {metaLabel}
                        </span>
                      </div>
                    </div>

                    {/* Module rows */}
                    <div>
                      {part.modules.map((mod, modIdx) => {
                        const isUnlocked = UNLOCKED_IDS.has(mod.id);
                        return (
                          <div
                            key={mod.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => { isUnlocked ? setSelectedModuleId(mod.id) : (window.location.href = LOGIN_URL); }}
                            onKeyDown={e => { if (e.key === "Enter") { isUnlocked ? setSelectedModuleId(mod.id) : (window.location.href = LOGIN_URL); } }}
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
                              <span style={{ display: "block", color: "#623CEA", fontSize: 12, fontWeight: 900, marginBottom: 4 }}>
                                {part.number === 0 ? "Start Here" : `Ch.${part.number} · M${modIdx + 1}`}
                              </span>
                              <strong style={{ display: "block", lineHeight: 1.24, fontSize: isUnlocked ? 15 : 14, letterSpacing: "-.015em" }}>
                                {mod.title}
                              </strong>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                              {isUnlocked ? (
                                <>
                                  <span style={{ whiteSpace: "nowrap", padding: "7px 10px", borderRadius: 999, background: "#FFCE00", color: "#221D23", border: "1px solid rgba(34,29,35,.10)", fontSize: 11, fontWeight: 950 }}>
                                    Unlocked preview
                                  </span>
                                  <span style={{ whiteSpace: "nowrap", fontSize: 12, fontWeight: 950, color: "#221D23" }}>Preview →</span>
                                </>
                              ) : (
                                <>
                                  <span style={{ whiteSpace: "nowrap", padding: "7px 10px", borderRadius: 999, background: "#F7F5F1", color: "#6B6670", border: "1px solid #E9E4DC", fontSize: 11, fontWeight: 950 }}>
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
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── CTA banner ── */}
        <section style={{
          margin: "42px 0 88px", position: "relative", overflow: "hidden", minHeight: 255,
          display: "grid", gridTemplateColumns: "1.2fr .8fr", borderRadius: 26,
          background: "radial-gradient(circle at 82% 30%,rgba(255,206,0,.20),transparent 26%),radial-gradient(circle at 54% 80%,rgba(98,60,234,.20),transparent 32%),#221D23",
          color: "#fff", boxShadow: "0 28px 65px rgba(34,29,35,.14)", borderLeft: "8px solid #FFCE00",
        }}>
          <div style={{ padding: "36px 34px" }}>
            <div style={{
              width: "fit-content", padding: "8px 12px", borderRadius: 999,
              background: "rgba(255,206,0,.14)", border: "1px solid rgba(255,206,0,.45)",
              color: "#FFCE00", fontSize: 10, fontWeight: 950,
              textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 22,
            }}>Full access</div>
            <h2 style={{ margin: 0, fontSize: "clamp(34px,4vw,50px)", lineHeight: .98, letterSpacing: "-.065em", fontWeight: 950 }}>
              Want the complete course?
            </h2>
            <p style={{ maxWidth: 680, margin: "18px 0 26px", color: "rgba(255,255,255,.75)", fontSize: 15, lineHeight: 1.45, fontWeight: 650 }}>
              Sign in or create an account to unlock all 30+ lessons and track your progress.
            </p>
            <a href={LOGIN_URL} style={{
              display: "inline-flex", alignItems: "center", padding: "12px 18px", borderRadius: 999,
              background: "#FFCE00", color: "#221D23", border: "1px solid rgba(34,29,35,.10)",
              fontWeight: 950, fontSize: 13, textDecoration: "none",
            }}>Sign in to access →</a>
          </div>
          <div style={{ display: "grid", placeItems: "center", padding: 28 }}>
            <div style={{ width: "min(100%,320px)", background: "#fff", color: "#221D23", borderRadius: 22, padding: 22, boxShadow: "0 20px 48px rgba(0,0,0,.20)" }}>
              <strong style={{ display: "block", fontSize: 16, marginBottom: 8 }}>30+ lessons · 8 hours</strong>
              <span style={{ display: "block", color: "#6B6670", fontSize: 13, fontWeight: 650, lineHeight: 1.4 }}>
                Complete AI Mastery course — learn at your own pace with lifetime updates.
              </span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
