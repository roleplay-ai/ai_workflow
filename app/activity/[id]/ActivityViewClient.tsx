"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import QuizModal from "@/components/QuizModal";
import MdText from "@/components/MdText";
import SlideZoom from "@/components/SlideZoom";
import { parseMarkdownWorkflow } from "@/lib/parseMarkdown";
import type { Profile, Activity, ActivityContent, UserProgress } from "@/lib/supabase/types";
import type { Quiz } from "@/types";
import panelStyles from "./activity-panel.module.css";

type Props = {
  profile: Profile & { companies: { name: string } | null };
  activity: Activity & { activity_content: ActivityContent | null };
  progress: UserProgress | null;
};

export default function ActivityViewClient({ profile, activity, progress: initProgress }: Props) {
  const supabase = createClient();
  const content  = activity.activity_content;

  // Parse workflow markdown into steps
  const parsed = useMemo(() => {
    if (!content?.workflow_markdown) return { title: activity.title, subtitle: "", steps: [] };
    return parseMarkdownWorkflow(content.workflow_markdown);
  }, [content?.workflow_markdown]);

  const steps  = parsed.steps;
  const slides = content?.slide_images ?? [];

  // Map quiz questions to steps (question[i] shows when leaving step[i])
  const quizForStep = useMemo((): Record<number, Quiz> => {
    const q = content?.quiz ?? [];
    const map: Record<number, Quiz> = {};
    q.forEach((question, i) => {
      map[i] = {
        question:   question.question,
        options:    question.options,
        correct:    question.correct_index,
        successMsg: "Correct! Well done.",
        wrongMsg:   "Review this step and try again.",
        badge:      "✓ Got it",
      };
    });
    return map;
  }, [content?.quiz]);

  const [current,     setCurrent]     = useState(0);
  type Msg = { role: "user" | "assistant"; content: string };
  const [messages,    setMessages]    = useState<Msg[]>([
    { role: "assistant", content: steps[0]?.aiMessage ?? `Welcome! Let's get started with "${activity.title}".` },
  ]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [showQuiz,    setShowQuiz]    = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<Quiz | null>(null);
  const [jumpToast,   setJumpToast]   = useState<string | null>(null);
  const [progress,    setProgress]    = useState(initProgress);
  const [copiedIdx,   setCopiedIdx]   = useState<number | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const step     = steps[current];
  const slideUrl = step?.slideUrl ?? slides[step?.slideIndex ?? current]?.url ?? slides[current]?.url ?? slides[0]?.url ?? null;
  const pct      = steps.length ? ((current + 1) / steps.length) * 100 : 0;

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Mark progress on first load
  useEffect(() => {
    if (!progress) {
      supabase.from("user_progress").insert({
        user_id:     profile.id,
        activity_id: activity.id,
        status:      "in_progress",
        completed_steps: [],
        updated_at:  new Date().toISOString(),
      }).select().single().then(({ data }) => { if (data) setProgress(data as any); });
    }
  }, []);

  const goNext = async () => {
    if (current >= steps.length - 1) {
      // Mark all steps done + completed status, then go to dashboard
      const completedSteps = steps.map((_, i) => i);
      const payload = {
        status: "completed" as const,
        completed_steps: completedSteps,
        completed_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      };
      if (progress) {
        await supabase.from("user_progress").update(payload).eq("id", progress.id);
      } else {
        await supabase.from("user_progress").insert({
          user_id:     profile.id,
          activity_id: activity.id,
          ...payload,
        });
      }
      window.location.href = "/dashboard";
      return;
    }
    const quiz = quizForStep[current];
    if (quiz) { setPendingQuiz(quiz); setShowQuiz(true); }
    const next = current + 1;
    setCurrent(next);
    setMessages(m => [...m, { role: "assistant", content: steps[next]?.aiMessage ?? steps[next]?.description ?? `Now on step ${next + 1}: ${steps[next]?.title}` }]);
    // Save completed steps
    const completedSteps = Array.from(new Set([...(progress?.completed_steps ?? []), current]));
    if (progress) supabase.from("user_progress").update({ completed_steps: completedSteps, updated_at: new Date().toISOString() }).eq("id", progress.id);
  };

  const goPrev = () => {
    if (current <= 0) return;
    setCurrent(c => c - 1);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:          userMsg,
          stepIndex:        current,
          activityTitle:    activity.title,
          workflowMarkdown: content?.workflow_markdown ?? "",
          steps:            steps.map(s => ({ title: s.title, description: s.description })),
        }),
      });
      const data = await res.json();
      if (data.reply) setMessages(m => [...m, { role: "assistant", content: data.reply }]);
      if (typeof data.goToStep === "number") {
        setCurrent(data.goToStep);
        const title = steps[data.goToStep]?.title ?? `Step ${data.goToStep + 1}`;
        setJumpToast(`↗ Jumped to Step ${data.goToStep + 1}: ${title}`);
        setTimeout(() => setJumpToast(null), 3500);
      }
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // If no workflow, show simple content view
  if (steps.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
        <Topbar profile={profile} role={profile.role} onSignOut={handleSignOut} />
        <div style={{ maxWidth: 720, margin: "60px auto", padding: "0 24px", textAlign: "center", color: "#6B6B6B" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
          <h2 style={{ fontWeight: 900, fontSize: 22, color: "#221D23", marginBottom: 8 }}>{activity.title}</h2>
          <p>Content for this activity hasn't been uploaded yet. Check back soon.</p>
          <a href="/dashboard" style={{ display: "inline-block", marginTop: 24, padding: "10px 24px", borderRadius: 999, background: "#FFCE00", color: "#221D23", fontWeight: 800, textDecoration: "none" }}>← Back to dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      {/* Topbar */}
      <header style={{
        height: 68, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", background: "rgba(255,255,255,.82)", borderBottom: "1px solid #E2E8F0",
        backdropFilter: "blur(18px)", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 14, background: "linear-gradient(135deg,#2563EB,#14B8A6)", boxShadow: "0 10px 22px rgba(37,99,235,.22)", flexShrink: 0 }}>
            {(activity.title?.trim()[0] ?? "A").toUpperCase()}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-.03em" }}>{activity.title}</div>
              <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>{activity.level} · {activity.time_estimate_minutes}m</div>
            </div>
            <a
              href="/dashboard"
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 5,
                height: 32,
                padding: "0 10px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                background: "#F8FAFC",
                border: "1px solid #CBD5E1",
                textDecoration: "none",
                transition: "border-color .15s, background .15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#94A3B8";
                e.currentTarget.style.background = "#F1F5F9";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#CBD5E1";
                e.currentTarget.style.background = "#F8FAFC";
              }}
            >
              ← Dashboard
            </a>
          </div>
        </div>
        {steps.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {steps.map((_, i) => {
                const done = i < current;
                const active = i === current;
                if (active) {
                  return (
                    <div
                      key={i}
                      style={{ width: 22, height: 8, borderRadius: 999, background: "#2563EB", flexShrink: 0 }}
                    />
                  );
                }
                return (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: done ? "#22C55E" : "#E8E4DC",
                    }}
                  />
                );
              })}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>
              {current + 1}/{steps.length}
            </span>
          </div>
        )}
      </header>

      {/* Main layout — narrower chat, bigger slide area */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gap: 16, padding: 16, gridTemplateColumns: "360px 1fr" }}>

        {/* ── LEFT: AI Coach chat ─────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", borderRadius: 24, overflow: "hidden", border: "1px solid #E2E8F0", background: "rgba(255,255,255,.92)", boxShadow: "0 18px 45px rgba(15,23,42,.10)", minHeight: 0 }}>
          {/* Chat header */}
          <div style={{ flexShrink: 0, height: 66, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid #E2E8F0", background: "linear-gradient(180deg,rgba(255,255,255,.94),rgba(248,250,252,.94))" }}>
            <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-.03em", color: "#0F172A" }}>AI Coach</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 900, color: "#1D4ED8", background: "#DBEAFE" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB" }} />
              Active
            </div>
          </div>

          {/* Messages */}
          <div ref={chatRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, maxWidth: "95%", alignSelf: m.role === "user" ? "flex-end" : "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, marginTop: 2, color: "white", background: m.role === "user" ? "#CBD5E1" : "linear-gradient(135deg,#2563EB,#14B8A6)" }}>
                  {m.role === "user" ? <span style={{ color: "#475569" }}>U</span> : "AI"}
                </div>
                <div style={{ borderRadius: 18, padding: "10px 14px", border: "1px solid", fontSize: 13.5, lineHeight: 1.5,
                  ...(m.role === "user"
                    ? { background: "#2563EB", borderColor: "#2563EB", color: "white", borderTopRightRadius: 4 }
                    : { background: "white", borderColor: "#E2E8F0", color: "#1E293B", borderTopLeftRadius: 4 })
                }}>
                  {m.role === "user" ? m.content : <MdText text={m.content} />}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignSelf: "flex-start" }}>
                <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "white", background: "linear-gradient(135deg,#2563EB,#14B8A6)" }}>AI</div>
                <div style={{ borderRadius: 18, borderTopLeftRadius: 4, padding: "10px 14px", background: "white", border: "1px solid #E2E8F0", color: "#94A3B8", fontSize: 13.5 }}>Thinking…</div>
              </div>
            )}
          </div>

          {/* Input + nav */}
          <div style={{ flexShrink: 0, borderTop: "1px solid #E2E8F0", background: "rgba(255,255,255,.96)" }}>
            <div style={{ display: "flex", gap: 10, padding: 14, borderBottom: "1px solid #E2E8F0" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask the AI coach anything…"
                suppressHydrationWarning
                style={{ flex: 1, height: 42, padding: "0 14px", borderRadius: 13, border: "1px solid #CBD5E1", fontSize: 13.5, background: "#F8FAFC", outline: "none", fontFamily: "inherit" }}
              />
              <button onClick={sendMessage} disabled={loading} suppressHydrationWarning style={{ padding: "0 16px", height: 42, borderRadius: 13, border: 0, color: "white", fontSize: 13.5, fontWeight: 900, cursor: "pointer", background: "linear-gradient(135deg,#2563EB,#1D4ED8)", opacity: loading ? .6 : 1 }}>
                Ask
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, padding: 14, alignItems: "center" }}>
              <button onClick={goPrev} disabled={current === 0} suppressHydrationWarning style={{ padding: "9px 16px", borderRadius: 13, fontSize: 13, fontWeight: 900, cursor: "pointer", border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#64748B", opacity: current === 0 ? .4 : 1 }}>
                ← Prev
              </button>
              <div style={{ flex: 1, fontSize: 11.5, color: "#94A3B8", fontWeight: 600, textAlign: "center" }}>
                {current < steps.length - 1 ? "Advance when ready" : "🎉 You've completed the workflow!"}
              </div>
              <button onClick={goNext} suppressHydrationWarning style={{ padding: "9px 16px", borderRadius: 13, border: 0, fontSize: 13, fontWeight: 900, cursor: "pointer", color: "white", background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
                {current < steps.length - 1 ? "Next →" : "Finish ✓"}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Slide + step card ─────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, display: "grid", gap: 16, gridTemplateColumns: "1fr 320px" }}>
            {/* Slide frame */}
            <div style={{ display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", border: "1px solid #E2E8F0", background: "white", boxShadow: "0 10px 28px rgba(15,23,42,.08)", minHeight: 0 }}>
              {/* Browser bar */}
              <div style={{ flexShrink: 0, height: 36, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 11.5, fontWeight: 700, color: "#94A3B8" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FCA5A5" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FDE68A" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#A7F3D0" }} />
                <span style={{ marginLeft: 8 }}>Step {current + 1} — {step?.title}</span>
              </div>
              {/* Slide */}
              <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {slideUrl ? (
                  <SlideZoom src={slideUrl} alt={`Step ${current + 1}`} />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#94A3B8", fontSize: 13.5, fontWeight: 600 }}>
                    <div style={{ fontSize: 40 }}>🖼️</div>
                    <div>No slide for this step</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right panel — matches prototype: activity info, access, steps checklist, downloads, prompts, progress */}
            <div style={{ borderRadius: 20, border: "1px solid #E2E8F0", background: "rgba(255,255,255,.97)", boxShadow: "0 10px 28px rgba(15,23,42,.07)", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, height: "100%" }}>

              {/* Scrollable body */}
              <div className={panelStyles.sidebarScroll}>

                {/* Activity header */}
                <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #E8EEF4" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#94A3B8", marginBottom: 4 }}>ACTIVITY</div>
                  <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-.03em", color: "#0F172A", lineHeight: 1.2 }}>{activity.title}</div>
                  {activity.description && (
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 5, lineHeight: 1.4 }}>{activity.description}</div>
                  )}
                </div>

                {/* Goals */}
                {content?.goals && content.goals.length > 0 && (
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #E8EEF4" }}>
                    <div style={sideHeading}>🎯 GOALS</div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                      {content.goals.map((g, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, lineHeight: 1.4, color: "#334155" }}>
                          <span style={{ color: "#16A34A", flexShrink: 0, marginTop: 1 }}>✓</span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Access you'll need */}
                {content?.access_needed && content.access_needed.length > 0 && (
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #E8EEF4" }}>
                    <div style={sideHeading}>🔑 ACCESS YOU&apos;LL NEED</div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                      {content.access_needed.map((a, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, lineHeight: 1.4, color: "#334155" }}>
                          <span style={{ color: "#64748B", flexShrink: 0, marginTop: 1 }}>·</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Steps checklist */}
                {steps.length > 0 && (
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #E8EEF4" }}>
                    <div style={sideHeading}>STEPS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {steps.map((s, i) => {
                        const done    = i < current;
                        const active  = i === current;
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderRadius: 8, background: active ? "#EFF6FF" : "transparent", paddingLeft: active ? 8 : 0, paddingRight: active ? 8 : 0, margin: active ? "0 -8px" : 0, transition: ".15s" }}>
                            {/* Circle */}
                            <div style={{
                              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                              display: "grid", placeItems: "center",
                              fontSize: done ? 11 : 11, fontWeight: 800,
                              background: done ? "#22C55E" : active ? "#2563EB" : "#E2E8F0",
                              color: done || active ? "white" : "#94A3B8",
                              transition: ".2s",
                            }}>
                              {done ? "✓" : i + 1}
                            </div>
                            <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: done ? "#16A34A" : active ? "#1D4ED8" : "#64748B", lineHeight: 1.3, flex: 1 }}>
                              {s.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Downloads */}
                {content?.downloads && content.downloads.length > 0 && (
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #E8EEF4" }}>
                    <div style={sideHeading}>📥 DOWNLOADS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {content.downloads.map((d, i) => (
                        <a key={i} href={d.url} download target="_blank" rel="noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 9, border: "1px solid #E2E8F0", background: "#F8FAFC", textDecoration: "none", color: "#0F172A", transition: ".12s" }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = "#2563EB")}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = "#E2E8F0")}>
                          <span style={{ fontSize: 15 }}>{dlIcon(d.type)}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.label}</div>
                            <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase" }}>{d.type}</div>
                          </div>
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>↓</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy prompts */}
                {content?.prompts && content.prompts.length > 0 && (
                  <div style={{ padding: "12px 16px" }}>
                    <div style={sideHeading}>💬 COPY PROMPTS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {content.prompts.map((p, i) => (
                        <div key={i} style={{ border: "1px solid #E2E8F0", borderRadius: 9, overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#334155" }}>{p.label}</span>
                            <button
                              onClick={() => { navigator.clipboard.writeText(p.text).then(() => { setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }); }}
                              suppressHydrationWarning
                              style={{ border: "1px solid", borderColor: copiedIdx === i ? "rgba(35,206,104,.3)" : "#E2E8F0", background: copiedIdx === i ? "rgba(35,206,104,.08)" : "white", color: copiedIdx === i ? "#16A34A" : "#64748B", borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: ".15s" }}>
                              {copiedIdx === i ? "✓ Copied" : "Copy"}
                            </button>
                          </div>
                          <pre style={{ margin: 0, padding: "7px 10px", fontSize: 11, fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.5, color: "#475569", maxHeight: 88, overflowY: "auto", background: "white" }}>{p.text}</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom: progress + XP */}
              <div style={{ flexShrink: 0, padding: "10px 16px", borderTop: "1px solid #E8EEF4", background: "#FAFBFC" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>{current} of {steps.length} done</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#2563EB" }}>+{activity.points} XP</span>
                </div>
                <div style={{ height: 6, background: "#E2E8F0", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#22C55E,#14B8A6)", width: `${pct}%`, transition: "width .3s" }} />
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Quiz modal */}
      {showQuiz && pendingQuiz && (
        <QuizModal quiz={pendingQuiz} onClose={() => { setShowQuiz(false); setPendingQuiz(null); }} />
      )}

      {/* Jump toast */}
      {jumpToast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 16, color: "white", fontSize: 13.5, fontWeight: 700, background: "linear-gradient(135deg,#2563EB,#14B8A6)", boxShadow: "0 12px 32px rgba(37,99,235,.35)" }}>
          ↗ {jumpToast.replace("↗ ", "")}
        </div>
      )}
    </div>
  );
}

const sideHeading: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 8,
  display: "flex", alignItems: "center", gap: 5,
};

function dlIcon(type: string): string {
  return ({ pdf: "📄", ppt: "📊", xlsx: "📗", doc: "📝", other: "📎" } as Record<string, string>)[type] ?? "📎";
}
