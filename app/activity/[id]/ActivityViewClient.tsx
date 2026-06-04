"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import QuizModal from "@/components/QuizModal";
import MdText from "@/components/MdText";
import SlideZoom from "@/components/SlideZoom";
import type { WorkflowStep, Quiz } from "@/types";
import type { Profile, Activity, ActivityContent, ActivityStep, UserProgress } from "@/lib/supabase/types";
import panelStyles from "./activity-panel.module.css";

type Props = {
  profile: Profile & { companies: { name: string } | null };
  activity: Activity & { activity_content: ActivityContent | null };
  activitySteps: ActivityStep[];
  progress: UserProgress | null;
};

export default function ActivityViewClient({ profile, activity, activitySteps, progress: initProgress }: Props) {
  const supabase = createClient();
  const content = activity.activity_content;

  // Map DB rows → WorkflowStep (resolve slide URL from slide_images)
  const steps = useMemo((): WorkflowStep[] => {
    const slideImages = content?.slide_images ?? [];
    return activitySteps.map(s => ({
      id: s.id,
      step_number: s.step_number,
      slide_number: s.slide_number,
      title: s.title,
      what_learner_sees: s.what_learner_sees,
      what_this_means: s.what_this_means,
      what_to_do: s.what_to_do,
      if_stuck: s.if_stuck,
      callout: s.callout,
      coach_next: s.coach_next,
      slideUrl: slideImages[s.slide_number - 1]?.url ?? undefined,
    }));
  }, [activitySteps, content?.slide_images]);

  // Map quiz questions to step indices
  const quizForStep = useMemo((): Record<number, Quiz> => {
    const q = content?.quiz ?? [];
    const map: Record<number, Quiz> = {};
    q.forEach((question, i) => {
      map[i] = {
        question: question.question,
        options: question.options,
        correct: question.correct_index,
        successMsg: "Correct! Well done.",
        wrongMsg: "Review this step and try again.",
        badge: "✓ Got it",
      };
    });
    return map;
  }, [content?.quiz]);

  type Msg = { role: "user" | "assistant"; content: string };

  const stepsForAPI = useMemo(() => steps.map(s => ({
    title: s.title,
    what_learner_sees: s.what_learner_sees,
    what_this_means: s.what_this_means,
    what_to_do: s.what_to_do,
    if_stuck: s.if_stuck,
  })), [steps]);

  const [current, setCurrent] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<Quiz | null>(null);
  const [jumpToast, setJumpToast] = useState<string | null>(null);
  const [progress, setProgress] = useState(initProgress);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [slideOpen, setSlideOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const initDone = useRef(false);

  const step = steps[current];
  const slideUrl = step?.slideUrl ?? null;
  const pct = steps.length ? ((current + 1) / steps.length) * 100 : 0;

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Create progress row on first load
  useEffect(() => {
    if (!progress) {
      supabase.from("user_progress").insert({
        user_id: profile.id,
        activity_id: activity.id,
        status: "in_progress",
        completed_steps: [],
        updated_at: new Date().toISOString(),
      }).select().single().then(({ data }) => { if (data) setProgress(data as any); });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch two opening messages from Claude on mount
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ init: true, activityTitle: activity.title, steps: stepsForAPI }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.initMessages) {
          setMessages((data.initMessages as string[]).map(content => ({ role: "assistant" as const, content })));
        }
      })
      .catch(() => {
        setMessages([{ role: "assistant", content: `Hi! I'm your AI coach for **${activity.title}**. Look at the slide and ask me anything — I'll guide you through each step.` }]);
      })
      .finally(() => setInitializing(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const callAI = async (userMessage: string, stepIndexOverride?: number) => {
    const effectiveIndex = stepIndexOverride ?? current;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          stepIndex: effectiveIndex,
          activityTitle: activity.title,
          steps: stepsForAPI,
        }),
      });
      const data = await res.json();
      if (data.reply) setMessages(m => [...m, { role: "assistant", content: data.reply }]);
      if (typeof data.goToStep === "number") {
        setCurrent(data.goToStep);
        const stepTitle = steps[data.goToStep]?.title ?? `Step ${data.goToStep + 1}`;
        setJumpToast(`Jumped to Step ${data.goToStep + 1}: ${stepTitle}`);
        setTimeout(() => setJumpToast(null), 3500);
      }
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const goNext = async () => {
    if (current >= steps.length - 1) {
      const completedSteps = steps.map((_, i) => i);
      const payload = {
        status: "completed" as const,
        completed_steps: completedSteps,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (progress) {
        await supabase.from("user_progress").update(payload).eq("id", progress.id);
      } else {
        await supabase.from("user_progress").insert({ user_id: profile.id, activity_id: activity.id, ...payload });
      }
      window.location.href = "/dashboard";
      return;
    }

    if (loading || initializing) return;

    const quiz = quizForStep[current];
    if (quiz) { setPendingQuiz(quiz); setShowQuiz(true); }
    setSlideOpen(false);

    const completedSteps = Array.from(new Set([...(progress?.completed_steps ?? []), current]));
    if (progress) supabase.from("user_progress").update({ completed_steps: completedSteps, updated_at: new Date().toISOString() }).eq("id", progress.id);

    const msg = "next";
    setMessages(m => [...m, { role: "user", content: msg }]);
    await callAI(msg, current);
  };

  const goPrev = () => {
    if (current <= 0 || loading || initializing) return;
    setSlideOpen(false);
    const msg = "go back to previous step";
    setMessages(m => [...m, { role: "user", content: msg }]);
    callAI(msg, current);
  };

  const goToStep = (stepNum: number) => {
    if (loading || initializing) return;
    const msg = `go to step ${stepNum}`;
    setMessages(m => [...m, { role: "user", content: msg }]);
    callAI(msg, current);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    await callAI(userMsg);
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (steps.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
        <Topbar profile={profile} role={profile.role} onSignOut={handleSignOut} />
        <div style={{ maxWidth: 720, margin: "60px auto", padding: "0 24px", textAlign: "center", color: "#6B6B6B" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
          <h2 style={{ fontWeight: 900, fontSize: 22, color: "#221D23", marginBottom: 8 }}>{activity.title}</h2>
          <p>Content for this activity hasn&apos;t been uploaded yet. Check back soon.</p>
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
            <a href="/dashboard" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#334155", background: "#F8FAFC", border: "1px solid #CBD5E1", textDecoration: "none" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#94A3B8"; e.currentTarget.style.background = "#F1F5F9"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.background = "#F8FAFC"; }}>
              ← Dashboard
            </a>
          </div>
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {steps.map((_, i) => {
              const done   = i < current;
              const active = i === current;
              return (
                <div key={i} style={{
                  width: active ? 22 : 8, height: 8, borderRadius: 999, flexShrink: 0, transition: ".2s",
                  background: active ? "#2563EB" : done ? "#22C55E" : "#E8E4DC",
                }} />
              );
            })}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>
            {current + 1}/{steps.length}
          </span>
        </div>
      </header>

      {/* Main layout */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gap: 16, padding: 16, gridTemplateColumns: "420px 1fr" }}>

        {/* ── LEFT: AI Coach chat ──────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", borderRadius: 24, overflow: "hidden", border: "1px solid #E2E8F0", background: "rgba(255,255,255,.92)", boxShadow: "0 18px 45px rgba(15,23,42,.10)", minHeight: 0 }}>
          {/* Chat header + insight callout */}
          <div style={{ flexShrink: 0, borderBottom: "1px solid #E2E8F0", background: "linear-gradient(180deg,rgba(255,255,255,.94),rgba(248,250,252,.94))" }}>
            <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
              <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-.03em", color: "#0F172A" }}>AI Coach</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 900, color: "#1D4ED8", background: "#DBEAFE" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB" }} />
                Active
              </div>
            </div>
            {step?.callout && step.callout !== "" && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "0 14px 12px" }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#134E4A", lineHeight: 1.45 }}>{step.callout}</span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div ref={chatRef} className={panelStyles.chatScroll}>
            {initializing && (
              <div style={{ display: "flex", gap: 10, alignSelf: "flex-start" }}>
                <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "white", background: "linear-gradient(135deg,#2563EB,#14B8A6)" }}>AI</div>
                <div style={{ borderRadius: 18, borderTopLeftRadius: 4, padding: "10px 14px", background: "white", border: "1px solid #E2E8F0", color: "#94A3B8", fontSize: 13.5 }}>Preparing your session…</div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, maxWidth: "95%", alignSelf: m.role === "user" ? "flex-end" : "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, marginTop: 2, color: "white", background: m.role === "user" ? "#CBD5E1" : "linear-gradient(135deg,#2563EB,#14B8A6)" }}>
                  {m.role === "user" ? <span style={{ color: "#475569" }}>U</span> : "AI"}
                </div>
                <div style={{
                  borderRadius: 18, padding: "10px 14px", border: "1px solid", fontSize: 13.5, lineHeight: 1.5,
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

          {/* Input */}
          <div style={{ flexShrink: 0, borderTop: "1px solid #E2E8F0", background: "rgba(255,255,255,.96)" }}>
            <div style={{ padding: 14 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                height: 44, padding: "0 6px 0 14px", borderRadius: 14,
                border: "1px solid #CBD5E1", background: "#F8FAFC",
              }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Ask the AI coach anything…"
                  suppressHydrationWarning
                  style={{ flex: 1, minWidth: 0, height: "100%", border: 0, background: "transparent", fontSize: 13.5, outline: "none", fontFamily: "inherit" }}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  title="Send"
                  aria-label="Send message"
                  suppressHydrationWarning
                  style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", cursor: input.trim() && !loading ? "pointer" : "default",
                    background: input.trim() && !loading ? "linear-gradient(135deg,#2563EB,#1D4ED8)" : "#CBD5E1",
                    opacity: loading ? .6 : 1, transition: "background .15s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Slide + step card ─────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, display: "grid", gap: 16, gridTemplateColumns: "1fr 320px" }}>

          {/* Slide frame */}
          <div style={{ display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", border: "1px solid #E2E8F0", background: "white", boxShadow: "0 10px 28px rgba(15,23,42,.08)", minHeight: 0 }}>
            <div style={{ flexShrink: 0, height: 36, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 11.5, fontWeight: 700, color: "#94A3B8" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FCA5A5" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FDE68A" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#A7F3D0" }} />
              <span style={{ marginLeft: 8 }}>Step {current + 1} — {step?.title}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {slideUrl ? (
                <SlideZoom src={slideUrl} alt={`Step ${current + 1}`} open={slideOpen} onClose={() => setSlideOpen(false)} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#94A3B8", fontSize: 13.5, fontWeight: 600 }}>
                  <div style={{ fontSize: 40 }}>🖼️</div>
                  <div>No slide for this step</div>
                </div>
              )}
              {slideUrl && (
                <button
                  onClick={() => setSlideOpen(true)}
                  title="Expand"
                  style={{
                    position: "absolute", bottom: 10, right: 10, zIndex: 2,
                    width: 28, height: 28, borderRadius: 7, border: 0, cursor: "pointer",
                    background: "rgba(15,23,42,.42)", backdropFilter: "blur(4px)",
                    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9"/>
                    <polyline points="9 21 3 21 3 15"/>
                    <line x1="21" y1="3" x2="14" y2="10"/>
                    <line x1="3" y1="21" x2="10" y2="14"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ borderRadius: 20, border: "1px solid #E2E8F0", background: "rgba(255,255,255,.97)", boxShadow: "0 10px 28px rgba(15,23,42,.07)", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, height: "100%" }}>
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

              {/* Access needed */}
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
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #E8EEF4" }}>
                <div style={sideHeading}>STEPS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {steps.map((s, i) => {
                    const done = i < current;
                    const active = i === current;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goToStep(i + 1)}
                        disabled={loading || initializing}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderRadius: 8, background: active ? "#EFF6FF" : "transparent", paddingLeft: active ? 8 : 0, paddingRight: active ? 8 : 0, margin: active ? "0 -8px" : 0, transition: ".15s", border: 0, cursor: loading || initializing ? "default" : "pointer", width: "100%", textAlign: "left" }}
                        onMouseEnter={e => { if (!loading && !initializing && !active) e.currentTarget.style.background = "#F8FAFC"; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, background: done ? "#22C55E" : active ? "#2563EB" : "#E2E8F0", color: done || active ? "white" : "#94A3B8", transition: ".2s" }}>
                          {done ? "✓" : i + 1}
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: done ? "#16A34A" : active ? "#1D4ED8" : "#64748B", lineHeight: 1.3, flex: 1 }}>
                          {s.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>


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

            {/* Progress bar + navigation */}
            <div style={{ flexShrink: 0, padding: "10px 16px", borderTop: "1px solid #E8EEF4", background: "#FAFBFC" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <button onClick={goPrev} disabled={current === 0 || loading || initializing} suppressHydrationWarning
                  style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 800, cursor: "pointer", border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#64748B", flexShrink: 0, opacity: current === 0 || loading || initializing ? .4 : 1 }}>
                  ← Prev
                </button>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>{current} of {steps.length} done</span>
                    {progress?.status === "completed" && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#2563EB" }}>+{activity.points} XP</span>
                    )}
                  </div>
                  {/* <div style={{ height: 6, background: "#E2E8F0", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#22C55E,#14B8A6)", width: `${pct}%`, transition: "width .3s" }} />
                  </div> */}
                </div>
                <button onClick={goNext} suppressHydrationWarning
                  style={{ padding: "7px 14px", borderRadius: 10, border: 0, fontSize: 12.5, fontWeight: 800, cursor: "pointer", color: "white", flexShrink: 0, background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
                  {current < steps.length - 1 ? "Next →" : "Finish ✓"}
                </button>
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
          ↗ {jumpToast}
        </div>
      )}
    </div>
  );
}

const sideHeading: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 8,
  display: "flex", alignItems: "center", gap: 5,
  textTransform: "uppercase", letterSpacing: ".06em",
};

function dlIcon(type: string): string {
  return ({ pdf: "📄", ppt: "📊", xlsx: "📗", doc: "📝", other: "📎" } as Record<string, string>)[type] ?? "📎";
}
