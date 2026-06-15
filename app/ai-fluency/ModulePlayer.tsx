"use client";

import { useState } from "react";
import { APP_FONT } from "@/lib/fonts";

// ── Types ──────────────────────────────────────────────────────────────────────

type ScreenExample = { tone: "neutral" | "good" | "bad"; label: string; text: string; tokens?: string[] };

type ModuleScreen = {
  id: string;
  screen_type: "hook" | "idea" | "example" | "why" | "check" | "unlocked";
  order_index: number;
  label: string | null;
  title: string | null;
  body: string | null;
  examples: ScreenExample[] | null;
  caption: string | null;
  question: string | null;
  options: string[] | null;
  correct_index: number | null;
  feedback: string | null;
  next_text: string | null;
};

export type ModuleData = {
  id: string;
  title: string;
  emoji: string;
  concepts: string[];
  next_module_hint: string | null;
  fluency_module_screens: ModuleScreen[];
};

type Props = {
  module: ModuleData;
  isCompleted: boolean;
  onClose: () => void;
  onComplete: (moduleId: string) => void;
};

// ── Progress dots ──────────────────────────────────────────────────────────────

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 8,
          width: i === step ? 24 : 8,
          borderRadius: 999,
          background: i === step ? "#FFCE00" : i < step ? "#23CE6B" : "rgba(255,255,255,.22)",
          transition: "width .25s ease, background .25s ease",
        }} />
      ))}
    </div>
  );
}

// ── Example card (good / bad / neutral) ────────────────────────────────────────

function ExampleCard({ ex }: { ex: ScreenExample }) {
  const styles = {
    good:    { bg: "#EDFFF4", border: "1.5px solid #23CE6B",  label: "#159E4B" },
    bad:     { bg: "#FFF0F0", border: "1.5px solid #ED4551",  label: "#C62B33" },
    neutral: { bg: "#F2EDFF", border: "1.5px solid #C4B5FD",  label: "#7C5CFC" },
  }[ex.tone] ?? { bg: "#F9F7FF", border: "1.5px solid #E2DEFF", label: "#7C5CFC" };

  return (
    <div style={{
      borderRadius: 12, padding: "12px 14px",
      background: styles.bg, border: styles.border,
    }}>
      <div style={{
        fontSize: 9, fontWeight: 900, letterSpacing: ".10em",
        textTransform: "uppercase", color: styles.label, marginBottom: 7,
      }}>{ex.label}</div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#221D23", lineHeight: 1.45 }}>
        {ex.text}
      </p>
      {ex.tokens && ex.tokens.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
          {ex.tokens.map((t, i) => (
            <span key={i} style={{
              padding: "3px 8px", borderRadius: 6,
              background: "#fff", border: "1px solid #E2DEFF",
              fontSize: 12, fontWeight: 700, color: "#7C5CFC",
            }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ModulePlayer({ module, isCompleted, onClose, onComplete }: Props) {
  const screens = module.fluency_module_screens;
  const total   = screens.length;

  const [step,       setStep]       = useState(0);
  const [answer,     setAnswer]     = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);

  const screen = screens[step];

  // Empty state — module has no screens yet
  if (!screen) {
    return (
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.72)", display: "grid", placeItems: "center", padding: 20,
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          width: "100%", maxWidth: 480, background: "#fff", borderRadius: 28,
          padding: "40px 32px", textAlign: "center",
          boxShadow: "0 32px 80px rgba(0,0,0,.40)",
          fontFamily: APP_FONT,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{module.emoji}</div>
          <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 950, letterSpacing: "-.04em" }}>
            {module.title}
          </h2>
          <p style={{ margin: "0 0 24px", color: "#6B6670", fontSize: 14, lineHeight: 1.5 }}>
            This module&apos;s content is coming soon.
          </p>
          <button onClick={onClose} style={{
            padding: "12px 24px", borderRadius: 999,
            background: "#221D23", color: "#fff", border: "none",
            fontWeight: 900, fontSize: 14, cursor: "pointer",
          }}>Close</button>
        </div>
      </div>
    );
  }

  const isDark  = screen.screen_type === "hook" || screen.screen_type === "unlocked";
  const isWhy   = screen.screen_type === "why";
  const isCheck = screen.screen_type === "check";
  const isLast  = step === total - 1;

  const answered   = answer !== null;
  const isCorrect  = answered && answer === screen.correct_index;

  function next() {
    if (isCheck && !answered) return;
    if (isLast) { finish(); return; }
    setStep(s => s + 1);
    setAnswer(null);
  }

  async function finish() {
    if (isCompleted) { onClose(); return; }
    setCompleting(true);
    try {
      await fetch("/api/fluency/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: module.id }),
      });
      onComplete(module.id);
    } finally {
      setCompleting(false);
      onClose();
    }
  }

  // ── Background ───────────────────────────────────────────────────────────────

  const bgStyle: React.CSSProperties = isDark
    ? { background: "linear-gradient(145deg,#1C1720,#2A2035 60%,#1E1823)" }
    : isWhy
    ? { background: "linear-gradient(145deg,#FFFAED,#F5E8B8)" }
    : screen.screen_type === "example"
    ? { background: "#F9F7FF" }
    : { background: "#fff" };

  const textColor = isDark ? "#fff" : "#221D23";

  const CHIP_STYLES: Record<string, { bg: string; color: string }> = {
    idea:    { bg: "#F2EDFF", color: "#7C5CFC" },
    example: { bg: "#E8F4FF", color: "#2A79C4" },
    why:     { bg: "rgba(34,29,35,.10)", color: "#221D23" },
    check:   { bg: "#EDFFF4", color: "#159E4B" },
  };
  const chip = CHIP_STYLES[screen.screen_type];

  const NextBtn = ({ label, disabled }: { label: string; disabled?: boolean }) => (
    <button
      onClick={next}
      disabled={disabled}
      style={{
        padding: "13px 26px", borderRadius: 999,
        background: disabled ? "#F0ECE7" : "#FFCE00",
        color: disabled ? "#9B9199" : "#221D23",
        border: "1px solid rgba(34,29,35,.08)",
        fontWeight: 950, fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background .15s ease",
      }}
    >{label}</button>
  );

  return (
    /* Overlay */
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.72)",
      display: "grid", placeItems: "center",
      padding: 20,
    }}>
      {/* Modal */}
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 500, maxHeight: "90vh",
        overflowY: "auto", borderRadius: 28,
        boxShadow: "0 32px 80px rgba(0,0,0,.40)",
        fontFamily: APP_FONT,
        letterSpacing: "-.01em",
        ...bgStyle,
      }}>

        {/* ── Top bar ── */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "20px 22px 0",
        }}>
          <button onClick={onClose} aria-label="Close" style={{
            width: 36, height: 36, borderRadius: "50%",
            background: isDark ? "rgba(255,255,255,.12)" : "rgba(34,29,35,.08)",
            border: "none", cursor: "pointer", fontSize: 18,
            color: isDark ? "#fff" : "#221D23",
            display: "grid", placeItems: "center",
          }}>×</button>

          <ProgressDots step={step} total={total} />

          <div style={{
            fontSize: 11, fontWeight: 950,
            color: isDark ? "rgba(255,255,255,.45)" : "rgba(34,29,35,.4)",
          }}>{step + 1}/{total}</div>
        </div>

        {/* ── Screen content ── */}
        <div style={{ padding: "28px 28px 32px" }}>

          {/* HOOK ──────────────────────────────────────────────────────────── */}
          {screen.screen_type === "hook" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 22 }}>{module.emoji}</div>
              <h2 style={{
                margin: "0 0 18px", fontSize: 28, lineHeight: 1.1,
                fontWeight: 950, letterSpacing: "-.055em", color: "#fff",
              }}>{screen.title}</h2>
              <p style={{
                margin: "0 0 32px", fontSize: 15, lineHeight: 1.55,
                color: "rgba(255,255,255,.78)", fontWeight: 600,
              }}>{screen.body}</p>
              <NextBtn label="Let's start →" />
            </div>
          )}

          {/* IDEA / WHY ────────────────────────────────────────────────────── */}
          {(screen.screen_type === "idea" || screen.screen_type === "why") && (
            <>
              {chip && (
                <span style={{
                  display: "inline-flex", padding: "7px 11px", borderRadius: 999,
                  background: chip.bg, color: chip.color,
                  fontSize: 10, fontWeight: 950, letterSpacing: ".09em",
                  textTransform: "uppercase", marginBottom: 20,
                }}>{screen.label ?? (screen.screen_type === "idea" ? "THE IDEA" : "WHY IT MATTERS")}</span>
              )}
              <h2 style={{
                margin: "0 0 16px", fontSize: 22, lineHeight: 1.2,
                fontWeight: 950, letterSpacing: "-.05em", color: textColor,
              }}>{screen.title}</h2>
              <p style={{
                margin: "0 0 30px", fontSize: 15, lineHeight: 1.6,
                color: "#514B53", fontWeight: 600,
              }}>{screen.body}</p>
              <NextBtn label="Next →" />
            </>
          )}

          {/* EXAMPLE ───────────────────────────────────────────────────────── */}
          {screen.screen_type === "example" && (
            <>
              {chip && (
                <span style={{
                  display: "inline-flex", padding: "7px 11px", borderRadius: 999,
                  background: chip.bg, color: chip.color,
                  fontSize: 10, fontWeight: 950, letterSpacing: ".09em",
                  textTransform: "uppercase", marginBottom: 20,
                }}>{screen.label ?? "SEE IT"}</span>
              )}
              {screen.title && (
                <h2 style={{
                  margin: "0 0 18px", fontSize: 22, lineHeight: 1.2,
                  fontWeight: 950, letterSpacing: "-.05em", color: "#221D23",
                }}>{screen.title}</h2>
              )}
              {screen.body && (
                <p style={{ margin: "0 0 16px", fontSize: 14, color: "#514B53", lineHeight: 1.55 }}>
                  {screen.body}
                </p>
              )}
              {screen.examples && (
                <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
                  {screen.examples.map((ex, i) => <ExampleCard key={i} ex={ex} />)}
                </div>
              )}
              {screen.caption && (
                <p style={{
                  margin: "0 0 24px", fontSize: 12, color: "#6B6670",
                  fontStyle: "italic", lineHeight: 1.5,
                }}>{screen.caption}</p>
              )}
              <NextBtn label="Next →" />
            </>
          )}

          {/* CHECK ─────────────────────────────────────────────────────────── */}
          {screen.screen_type === "check" && (
            <>
              {chip && (
                <span style={{
                  display: "inline-flex", padding: "7px 11px", borderRadius: 999,
                  background: chip.bg, color: chip.color,
                  fontSize: 10, fontWeight: 950, letterSpacing: ".09em",
                  textTransform: "uppercase", marginBottom: 20,
                }}>{screen.label ?? "QUICK CHECK"}</span>
              )}
              <h3 style={{
                margin: "0 0 22px", fontSize: 19, lineHeight: 1.25,
                fontWeight: 950, letterSpacing: "-.04em", color: "#221D23",
              }}>{screen.question}</h3>

              <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                {(screen.options ?? []).map((opt, i) => {
                  const isSelected   = answer === i;
                  const isOptCorrect = i === screen.correct_index;
                  let bg = "#F7F5F1", border = "1px solid #E9E4DC", color = "#221D23";
                  let opacity: number | undefined;

                  if (answered) {
                    if (isSelected && isOptCorrect)  { bg = "#EDFFF4"; border = "1.5px solid #23CE6B"; color = "#0D7A3A"; }
                    else if (isSelected)              { bg = "#FFF0F0"; border = "1.5px solid #ED4551"; color = "#C62B33"; }
                    else                              { opacity = 0.45; }
                  }

                  return (
                    <button key={i} disabled={answered} onClick={() => setAnswer(i)} style={{
                      width: "100%", padding: "13px 16px", borderRadius: 14,
                      background: bg, border, color,
                      fontSize: 14, fontWeight: 750, textAlign: "left",
                      cursor: answered ? "default" : "pointer",
                      opacity, transition: "background .15s ease",
                    }}>{opt}</button>
                  );
                })}
              </div>

              {answered && screen.feedback && (
                <div style={{
                  padding: "12px 16px", borderRadius: 12, marginBottom: 22,
                  background: isCorrect ? "#EDFFF4" : "#FFF0F0",
                  border: `1px solid ${isCorrect ? "#23CE6B" : "#ED4551"}`,
                  fontSize: 13, lineHeight: 1.5, fontWeight: 700,
                  color: isCorrect ? "#0D7A3A" : "#C62B33",
                }}>{isCorrect ? "✓ " : "✗ "}{screen.feedback}</div>
              )}

              <NextBtn label="Next →" disabled={!answered} />
            </>
          )}

          {/* UNLOCKED ──────────────────────────────────────────────────────── */}
          {screen.screen_type === "unlocked" && (
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "8px 14px", borderRadius: 999,
                background: "rgba(35,206,107,.15)", border: "1px solid rgba(35,206,107,.35)",
                color: "#23CE6B", fontSize: 11, fontWeight: 950,
                letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 22,
              }}>✓ Module complete</div>

              <div style={{ fontSize: 52, marginBottom: 16 }}>{module.emoji}</div>

              <h2 style={{
                margin: "0 0 14px", fontSize: 30, lineHeight: 1.05,
                fontWeight: 950, letterSpacing: "-.06em", color: "#fff",
              }}>{screen.title ?? "You got it."}</h2>

              {screen.body && (
                <p style={{
                  margin: "0 0 26px", fontSize: 15, lineHeight: 1.55,
                  color: "rgba(255,255,255,.75)", fontWeight: 600,
                }}>{screen.body}</p>
              )}

              {module.concepts.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{
                    margin: "0 0 10px", fontSize: 11, fontWeight: 950,
                    color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".09em",
                  }}>Concepts unlocked</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {module.concepts.map(c => (
                      <span key={c} style={{
                        padding: "7px 12px", borderRadius: 999,
                        background: "rgba(35,206,107,.15)", border: "1px solid rgba(35,206,107,.30)",
                        color: "#23CE6B", fontSize: 12, fontWeight: 850,
                      }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {(screen.next_text ?? module.next_module_hint) && (
                <div style={{
                  padding: "14px 16px", borderRadius: 14, marginBottom: 26,
                  background: "rgba(255,206,0,.08)", border: "1px solid rgba(255,206,0,.22)",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 950, color: "#FFCE00",
                    textTransform: "uppercase", letterSpacing: ".09em",
                  }}>Up next</span>
                  <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                    {screen.next_text ?? module.next_module_hint}
                  </p>
                </div>
              )}

              <button onClick={finish} disabled={completing} style={{
                padding: "13px 26px", borderRadius: 999,
                background: completing ? "#9B9199" : "#FFCE00",
                color: "#221D23", border: "1px solid rgba(34,29,35,.10)",
                fontWeight: 950, fontSize: 14, cursor: completing ? "wait" : "pointer",
              }}>{completing ? "Saving…" : isCompleted ? "Close" : "Finish ✓"}</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
