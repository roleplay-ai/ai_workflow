"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import AppNav from "@/components/AppNav";
import QuizModal from "@/components/QuizModal";
import CelebrationModal from "@/components/CelebrationModal";
import VideoModal from "@/components/VideoModal";
import RotatingTools from "@/components/RotatingTools";
import type { ToolLogoMap } from "@/lib/toolLogos";
import { normalizeActivityTools } from "@/lib/tools";
import MdText from "@/components/MdText";
import SlideZoom from "@/components/SlideZoom";
import type { WorkflowStep, Quiz } from "@/types";
import { buildCoachChatMessage } from "@/types";
import type { Profile, Activity, ActivityContent, ActivityStep, UserProgress } from "@/lib/supabase/types";
import panelStyles from "./activity-panel.module.css";

type Props = {
  profile: (Profile & { companies: { name: string } | null }) | null;
  activity: Activity & { activity_content: ActivityContent | null };
  activitySteps: ActivityStep[];
  progress: UserProgress | null;
  toolLogos: ToolLogoMap;
};

export default function ActivityViewClient({ profile, activity, activitySteps, progress: initProgress, toolLogos }: Props) {
  const supabase = createClient();
  const content = activity.activity_content;

  const whatYouGet = content?.what_you_will_get ?? [];

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
      try_asking: s.try_asking ?? [],
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

  const [current, setCurrent] = useState(-1); // -1 = overview
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<Quiz | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showVideo,  setShowVideo]  = useState(false);
  const [videoThumb, setVideoThumb] = useState<string | null>(null);
  const finishPendingRef = useRef(false);
  const [jumpToast, setJumpToast] = useState<string | null>(null);
  const [progress, setProgress] = useState(initProgress);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [slideOpen, setSlideOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [chipsDismissed, setChipsDismissed] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const initDone = useRef(false);

  const isOverview = current === -1;
  const step = isOverview ? null : steps[current];
  const slideUrl = step?.slideUrl ?? null;
  const activityTools = normalizeActivityTools(activity.tools);
  const pct = steps.length ? (Math.max(0, current + 1) / steps.length) * 100 : 0;
  const currentChips = isOverview
    ? (steps[0]?.try_asking ?? [])
    : (suggestions.length > 0 ? suggestions : (step?.try_asking ?? []));

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setChipsDismissed(false);
  }, [current, suggestions]);

  // Record a view (fire-and-forget; works for guests and logged-in users)
  useEffect(() => {
    let sessionId = localStorage.getItem("nw_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("nw_session_id", sessionId);
    }
    fetch(`/api/activity/${activity.id}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id]);

  // Auto-generate thumbnail from the video URL
  useEffect(() => {
    const url = content?.video_url;
    if (!url) return;

    // YouTube — use their public thumbnail CDN
    const ytMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      setVideoThumb(`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`);
      return;
    }

    // Direct video — capture frame with a hidden <video> + canvas
    const vid = document.createElement("video");
    vid.crossOrigin  = "anonymous";
    vid.preload      = "metadata";
    vid.muted        = true;
    vid.playsInline  = true;

    vid.onloadeddata = () => { vid.currentTime = 1; };
    vid.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width  = vid.videoWidth  || 640;
        canvas.height = vid.videoHeight || 360;
        canvas.getContext("2d")?.drawImage(vid, 0, 0, canvas.width, canvas.height);
        setVideoThumb(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        // CORS taint — canvas blocked; leave thumb null, fallback gradient shows
      }
      vid.src = "";
    };

    vid.src = url;
    return () => { vid.src = ""; };
  }, [content?.video_url]);

  // Create progress row on first load (only for authenticated users)
  useEffect(() => {
    if (!progress && profile) {
      supabase.from("user_progress").insert({
        user_id: profile.id,
        activity_id: activity.id,
        status: "in_progress",
        completed_steps: [],
        updated_at: new Date().toISOString(),
      }).select().single().then(({ data }) => { if (data) setProgress(data as any); });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build opening messages from DB step data — no API call needed
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    const welcome = `Hi, I'm Nudgie 👋 Stuck on a step, or not sure why you're doing it? Just ask — I'm right here the whole way through.`;
    setMessages([{ role: "assistant", content: welcome }]);
    setInitializing(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const askCoach = async (userMessage: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          stepIndex: current,
          activityTitle: activity.title,
          steps: stepsForAPI,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(m => [...m, { role: "assistant", content: data.reply }]);
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
        // Fire-and-forget log — never blocks the UI (skip for guests)
        if (profile) supabase.from("chat_logs").insert({
          user_id: profile.id,
          activity_id: activity.id,
          step_index: current,
          step_title: steps[current]?.title ?? "",
          user_message: userMessage,
          ai_response: data.reply,
          navigated_to_step: typeof data.goToStep === "number" ? data.goToStep : null,
        });
      }
      if (typeof data.goToStep === "number") {
        setCurrent(data.goToStep);
        setSlideOpen(false);
        const jumped = steps[data.goToStep];
        const toastText = jumped?.callout && jumped.callout !== ""
          ? jumped.callout
          : jumped?.title ?? `Step ${data.goToStep + 1}`;
        setJumpToast(toastText);
        setTimeout(() => setJumpToast(null), 4000);
      }
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const hasInput = !!input.trim();
  const prevEnabled = !hasInput && current > 0 && !loading && !stepLoading && !initializing;
  const nextEnabled = !hasInput && !loading && !stepLoading && !initializing && !showCelebration;

  const startActivity = () => {
    setSuggestions([]);
    setStepLoading(true);
    setLoading(true);
    setTimeout(() => {
      setCurrent(0);
      setMessages(m => [...m, { role: "assistant", content: buildCoachChatMessage(steps[0]) }]);
      setStepLoading(false);
      setLoading(false);
    }, 1500);
  };

  const finishActivity = async () => {
    const completedSteps = steps.map((_, i) => i);
    const payload = {
      status: "completed" as const,
      completed_steps: completedSteps,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (progress) {
      const { data } = await supabase.from("user_progress").update(payload).eq("id", progress.id).select().single();
      if (data) setProgress(data as UserProgress);
    } else if (profile) {
      const { data } = await supabase.from("user_progress").insert({ user_id: profile.id, activity_id: activity.id, ...payload }).select().single();
      if (data) setProgress(data as UserProgress);
    }
    setShowCelebration(true);
  };

  // Called by VideoModal when learner hits 80% watch threshold or clicks "Mark as watched"
  const handleVideoCompleted = async () => {
    setShowVideo(false);
    const payload = {
      status: "completed" as const,
      video_watched: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (progress) {
      const { data } = await supabase.from("user_progress").update(payload).eq("id", progress.id).select().single();
      if (data) setProgress(data as UserProgress);
    } else if (profile) {
      const { data } = await supabase.from("user_progress")
        .insert({ user_id: profile.id, activity_id: activity.id, ...payload })
        .select().single();
      if (data) setProgress(data as UserProgress);
    }
    setShowCelebration(true);
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
    setPendingQuiz(null);
    if (finishPendingRef.current) {
      finishPendingRef.current = false;
      void finishActivity();
    }
  };

  const goNext = async () => {
    if (current >= steps.length - 1) {
      if (loading || stepLoading || initializing || hasInput || showCelebration) return;
      const quiz = quizForStep[current];
      if (quiz) {
        finishPendingRef.current = true;
        setPendingQuiz(quiz);
        setShowQuiz(true);
        return;
      }
      await finishActivity();
      return;
    }

    if (loading || stepLoading || initializing || hasInput) return;

    const quiz = quizForStep[current];
    if (quiz) { setPendingQuiz(quiz); setShowQuiz(true); }
    setSlideOpen(false);

    const completedSteps = Array.from(new Set([...(progress?.completed_steps ?? []), current]));
    if (progress) supabase.from("user_progress").update({ completed_steps: completedSteps, updated_at: new Date().toISOString() }).eq("id", progress.id);

    const nextIndex = current + 1;
    setSuggestions([]);
    setMessages(m => [...m, { role: "user", content: "next" }]);
    setStepLoading(true);
    setLoading(true);
    setTimeout(() => {
      setCurrent(nextIndex);
      setMessages(m => [...m, { role: "assistant", content: buildCoachChatMessage(steps[nextIndex]) }]);
      setStepLoading(false);
      setLoading(false);
    }, 1500);
  };

  const goPrev = () => {
    if (current <= 0 || loading || stepLoading || initializing || hasInput) return;
    setSlideOpen(false);
    const prevIndex = current - 1;
    setSuggestions([]);
    setMessages(m => [...m, { role: "user", content: "previous" }]);
    setStepLoading(true);
    setLoading(true);
    setTimeout(() => {
      setCurrent(prevIndex);
      setMessages(m => [...m, { role: "assistant", content: buildCoachChatMessage(steps[prevIndex]) }]);
      setStepLoading(false);
      setLoading(false);
    }, 1500);
  };

  const goToStep = (stepNum: number) => {
    if (loading || stepLoading || initializing) return;
    const targetIndex = stepNum - 1;
    if (targetIndex < 0 || targetIndex >= steps.length || targetIndex === current) return;
    setSlideOpen(false);
    setSuggestions([]);
    setMessages(m => [...m, { role: "user", content: `go to step ${stepNum}` }]);
    setStepLoading(true);
    setLoading(true);
    setTimeout(() => {
      setCurrent(targetIndex);
      setMessages(m => [...m, { role: "assistant", content: buildCoachChatMessage(steps[targetIndex]) }]);
      setStepLoading(false);
      setLoading(false);
    }, 1500);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    await askCoach(userMsg);
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (steps.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif" }}>
        <AppNav
          activePage="apply"
          userName={profile?.full_name}
          isAdmin={profile?.role === "admin" || profile?.role === "superadmin"}
        />
        <div style={{ maxWidth: 720, margin: "60px auto", padding: "0 24px", textAlign: "center", color: "#6B6B6B" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
          <h2 style={{ fontWeight: 900, fontSize: 22, color: "#221D23", marginBottom: 8 }}>{activity.title}</h2>
          <p>Content for this activity hasn&apos;t been uploaded yet. Check back soon.</p>
          <a href="/apply" style={{ display: "inline-block", marginTop: 24, padding: "10px 24px", borderRadius: 999, background: "#FFCE00", color: "#221D23", fontWeight: 800, textDecoration: "none" }}>← Back to Apply</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif" }}>
      {/* Topbar */}
      <header className={panelStyles.activityHeader} style={{
        height: 68, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", background: "rgba(255,255,255,.82)", borderBottom: "1px solid #E2E8F0",
        backdropFilter: "blur(18px)", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {activityTools.length > 0 ? (
            <RotatingTools tools={activityTools} toolLogos={toolLogos} variant="icon" iconSize={36} insetScale={0.9} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 14, background: "linear-gradient(135deg,#2563EB,#14B8A6)", boxShadow: "0 10px 22px rgba(37,99,235,.22)", flexShrink: 0 }}>
              {(activity.title?.trim()[0] ?? "A").toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div style={{ minWidth: 0 }}>
              <div className={panelStyles.headerTitle} style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-.03em" }}>{activity.title}</div>
              <div className={panelStyles.headerSubtitle} style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>{activity.level} · {activity.time_estimate_minutes}m</div>
            </div>
          </div>
        </div>

        {/* Step dots + counter + back to Apply */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div className={panelStyles.stepDots} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {steps.map((_, i) => {
              const done = !isOverview && i < current;
              const active = !isOverview && i === current;
              return (
                <div key={i} style={{
                  width: active ? 22 : 8, height: 8, borderRadius: 999, flexShrink: 0, transition: ".2s",
                  background: active ? "#2563EB" : done ? "#22C55E" : "#E8E4DC",
                }} />
              );
            })}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>
            {isOverview ? 0 : current + 1}/{steps.length}
          </span>
          <a href="/apply" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#221D23", background: "#facc15", border: "1px solid #d97706", textDecoration: "none", transition: "background .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fbbf24"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#facc15"; }}>
            ← Apply
          </a>
        </div>
      </header>

      {/* Mobile progress bar */}
      <div className={panelStyles.mobileProgressBar}>
        <div className={panelStyles.mobileProgressFill} style={{ width: `${pct}%` }} />
      </div>

      {/* Main layout */}
      <div className={panelStyles.mainLayout}>

        {/* ── AI Coach panel ──────────────────────────────────────── */}
        <div className={`${panelStyles.panelWrap} ${panelStyles.chatWrap}`}>
        <div style={{ display: "flex", flexDirection: "column", borderRadius: 24, overflow: "hidden", border: "1px solid #E2E8F0", background: "rgba(255,255,255,.92)", boxShadow: "0 18px 45px rgba(15,23,42,.10)", minHeight: 0 }}>
          {/* Coach header */}
          <div style={{ flexShrink: 0, borderBottom: "1px solid #E2E8F0", background: "linear-gradient(180deg,rgba(255,255,255,.94),rgba(248,250,252,.94))" }}>
            <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#FFCE00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-.03em", color: "#0F172A" }}>Nudgie</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
                    {isOverview ? "ready when you are 👋" : `watching your progress · step ${current + 1}`}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 900, color: "#16A34A", background: "#DCFCE7" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
                  Active
                </div>
                <button className={panelStyles.detailsBtn} onClick={() => setShowDetails(true)} aria-label="Activity details">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={chatRef} className={panelStyles.chatScroll}>
            {initializing && (
              <div style={{ display: "flex", gap: 10, alignSelf: "flex-start" }}>
                <div style={aiChatAvatarStyle}>AI</div>
                <div style={{ borderRadius: 18, borderTopLeftRadius: 4, padding: "10px 14px", background: "white", border: "1px solid #E2E8F0", color: "#94A3B8", fontSize: 13.5 }}>Preparing your session…</div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, maxWidth: "95%", alignSelf: m.role === "user" ? "flex-end" : "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ ...aiChatAvatarStyle, marginTop: 2, ...(m.role === "user" ? { background: "#CBD5E1", color: "#475569" } : {}) }}>
                  {m.role === "user" ? "U" : "AI"}
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
                <div style={aiChatAvatarStyle}>AI</div>
                <div style={{ borderRadius: 18, borderTopLeftRadius: 4, padding: "10px 14px", background: "white", border: "1px solid #E2E8F0", color: "#94A3B8", fontSize: 13.5 }}>Thinking…</div>
              </div>
            )}

          </div>

          {/* Your Steps — below chat */}
          <div style={{ flexShrink: 0, padding: "10px 16px", borderTop: "1px solid #F1F5F9", maxHeight: 220, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em", color: "#0F172A" }}>YOUR STEPS</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
                {isOverview ? 0 : current + 1} / {steps.length}
              </span>
            </div>
            <div className={panelStyles.stepsScroll} style={{ flex: 1, minHeight: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {steps.map((s, i) => {
                const done = !isOverview && i < current;
                const active = isOverview ? i === 0 : i === current;
                if (isOverview) {
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: active ? "#EFF6FF" : "transparent" }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, background: active ? "#2563EB" : "#F1F5F9", color: active ? "white" : "#94A3B8" }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#0F172A" : "#94A3B8", lineHeight: 1.3 }}>
                        {s.title}
                      </span>
                    </div>
                  );
                }
                return (
                  <button key={i} type="button" onClick={() => goToStep(i + 1)} disabled={loading || stepLoading || initializing}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: active ? "#EFF6FF" : "transparent", border: 0, cursor: loading || stepLoading || initializing ? "default" : "pointer", width: "100%", textAlign: "left", transition: ".15s" }}
                    onMouseEnter={e => { if (!loading && !stepLoading && !initializing && !active) e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, background: done ? "#22C55E" : active ? "#2563EB" : "#F1F5F9", color: done || active ? "white" : "#94A3B8", transition: ".2s" }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: done ? "#16A34A" : active ? "#0F172A" : "#64748B", lineHeight: 1.3, flex: 1 }}>
                      {s.title}
                    </span>
                  </button>
                );
              })}
              </div>
            </div>
          </div>

          {/* Input */}
          <div style={{ flexShrink: 0, borderTop: "1px solid #E2E8F0", background: "rgba(255,255,255,.96)" }}>
            {inputFocused && !chipsDismissed && currentChips.length > 0 && !loading && (
              <div style={{ padding: "12px 14px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#94A3B8" }}>
                    {isOverview ? "TRY ASKING…" : "OR ASK ME TO…"}
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss suggestions"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setChipsDismissed(true)}
                    style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", border: "1px solid #E2E8F0", background: "white", color: "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: ".15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.color = "#64748B"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#94A3B8"; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {currentChips.map((chip, i) => (
                    <button key={i} type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { setInput(""); setMessages(m => [...m, { role: "user", content: chip }]); askCoach(chip); }}
                      style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: 999, border: "1px solid #E2E8F0", background: "white", color: "#2563EB", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: ".15s", lineHeight: 1.3 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.background = "#EFF6FF"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "white"; }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ padding: 14 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                height: 44, padding: "0 10px", borderRadius: 14,
                border: `1px solid ${inputFocused ? "#93C5FD" : "#CBD5E1"}`, background: "#F8FAFC",
                transition: "border-color .15s",
              }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setTimeout(() => { setInputFocused(false); setChipsDismissed(false); }, 120)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Ask Nudgie anything…"
                  suppressHydrationWarning
                  style={{ flex: 1, minWidth: 0, height: "100%", border: 0, background: "transparent", fontSize: 13.5, outline: "none", fontFamily: "inherit", padding: "0 4px" }}
                />
                <button type="button" onClick={sendMessage} disabled={!hasInput || loading}
                  style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: hasInput && !loading ? "pointer" : "default", background: hasInput && !loading ? "#2563EB" : "#CBD5E1", transition: "background .15s" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* ── Center panel ────────────────────────────────────────── */}
        <div className={`${panelStyles.panelWrap} ${panelStyles.slideWrap}`}>
          <div style={{ display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", border: "1px solid #E2E8F0", background: "white", boxShadow: "0 10px 28px rgba(15,23,42,.08)", minHeight: 0 }}>

            {isOverview ? (
              /* ── Overview content ──────────────────────────────────── */
              <>
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "48px 40px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 999, background: "#FEF9C3", fontSize: 12, fontWeight: 800, color: "#92400E", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 20 }}>
                    🔥 WORKFLOW OVERVIEW
                  </div>
                  <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-.04em", color: "#0F172A", lineHeight: 1.15, marginBottom: 14, maxWidth: 560 }}>
                    {activity.title}
                  </h1>
                  {activity.description && (
                    <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.55, maxWidth: 520, marginBottom: whatYouGet.length > 0 ? 16 : 0 }}>
                      {activity.description}
                    </p>
                  )}

                  {/* What you'll walk away with */}
                  {whatYouGet.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#94A3B8", marginBottom: 14, marginTop: activity.description ? 4 : 0 }}>
                        WHAT YOU&apos;LL WALK AWAY WITH
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 20, textAlign: "left", maxWidth: 480, width: "100%" }}>
                        {whatYouGet.map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                              {item.icon || "✨"}
                            </div>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>{item.title}</div>
                              <div style={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.45 }}>{item.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Overview bottom bar */}
                <div style={{ flexShrink: 0, padding: "14px 24px", borderTop: "1px solid #E2E8F0", background: "#FAFBFC", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#64748B", lineHeight: 1.4 }}>
                    {steps.length} steps · about {activity.time_estimate_minutes ?? "?"} minutes · I&apos;ll guide you through each one.
                  </span>
                  <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    {content?.video_url && (
                      <button type="button" onClick={() => setShowVideo(true)}
                        style={{ display: "flex", alignItems: "center", gap: 6, height: 42, padding: "0 18px", borderRadius: 12, border: "1px solid #E2E8F0", background: "white", fontSize: 14, fontWeight: 700, color: "#0F172A", cursor: "pointer", transition: ".15s", whiteSpace: "nowrap", flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "#94A3B8")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "#E2E8F0")}>
                        ▶ 2-min overview
                      </button>
                    )}
                    <button type="button" onClick={startActivity}
                      style={{ display: "flex", alignItems: "center", gap: 6, height: 42, padding: "0 24px", borderRadius: 12, border: 0, background: "#2563EB", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer", transition: "background .15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#1D4ED8")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#2563EB")}>
                      Let&apos;s start — Step 1 →
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* ── Step content ──────────────────────────────────────── */
              <>
                <div className={panelStyles.centerScroll} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "28px 32px 20px" }}>
                  {stepLoading ? (
                    <StepCenterSkeleton />
                  ) : (
                  <>
                  {/* Step badge */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, background: "#EFF6FF", marginBottom: 14 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563EB" }} />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: ".06em" }}>
                      STEP {current + 1} OF {steps.length}
                    </span>
                  </div>

                  {/* Step title */}
                  <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.03em", color: "#0F172A", lineHeight: 1.2, marginBottom: 16 }}>
                    {step?.title}
                  </h2>

                  {/* Numbered instructions (what_to_do) */}
                  {step?.what_to_do && step.what_to_do.length > 0 && (
                    <ol style={{ margin: "0 0 24px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                      {step.what_to_do.map((item, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#3B82F6,#2563EB)", color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, marginTop: 2 }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: 15, color: "#334155", lineHeight: 1.55 }}>
                            <MdText text={item} />
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* Slide image */}
                  {slideUrl ? (
                    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                      <div style={{ height: 32, display: "flex", alignItems: "center", gap: 6, padding: "0 12px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FCA5A5" }} />
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FDE68A" }} />
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#A7F3D0" }} />
                      </div>
                      <div style={{ position: "relative", background: "#F1F5F9" }}>
                        <SlideZoom src={slideUrl} alt={`Step ${current + 1}`} open={slideOpen} onClose={() => setSlideOpen(false)} />
                        <button onClick={() => setSlideOpen(true)} title="Expand"
                          style={{ position: "absolute", bottom: 8, right: 8, zIndex: 2, width: 28, height: 28, borderRadius: 7, border: 0, cursor: "pointer", background: "rgba(15,23,42,.42)", backdropFilter: "blur(4px)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#94A3B8", fontSize: 13.5, fontWeight: 600, padding: "32px 0" }}>
                      <div style={{ fontSize: 40 }}>🖼️</div>
                      <div>No slide for this step</div>
                    </div>
                  )}
                  </>
                  )}
                </div>

                {/* Step bottom action bar */}
                <div style={{ flexShrink: 0, padding: "12px 24px", borderTop: "1px solid #E2E8F0", background: "#FAFBFC", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.35, flex: 1 }}>
                    {step?.callout || "Tried it? Mark it done to continue."}
                  </span>
                  <div style={{ display: "flex", gap: 10 }}>
                    {/* Prev button */}
                    <button type="button" onClick={goPrev} disabled={!prevEnabled}
                      style={{ display: "flex", alignItems: "center", gap: 6, height: 42, padding: "0 16px", borderRadius: 12, border: "1px solid #E2E8F0", background: prevEnabled ? "white" : "#F8FAFC", fontSize: 14, fontWeight: 700, color: prevEnabled ? "#0F172A" : "#CBD5E1", cursor: prevEnabled ? "pointer" : "default", transition: ".15s" }}>
                      ← Back
                    </button>
                    {/* Next / Finish button */}
                    <button type="button" onClick={goNext} disabled={!nextEnabled}
                      style={{ display: "flex", alignItems: "center", gap: 6, height: 42, padding: "0 24px", borderRadius: 12, border: 0, background: nextEnabled ? "#2563EB" : "#94A3B8", color: "white", fontSize: 14, fontWeight: 800, cursor: nextEnabled ? "pointer" : "default", opacity: nextEnabled ? 1 : .6, transition: "background .15s" }}
                      onMouseEnter={e => { if (nextEnabled) e.currentTarget.style.background = "#1D4ED8"; }}
                      onMouseLeave={e => { if (nextEnabled) e.currentTarget.style.background = "#2563EB"; }}>
                      {current < steps.length - 1 ? "✓ I did it — Next step →" : "✓ Finish activity"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right panel ─────────────────────────────────────────── */}
        <div className={`${panelStyles.panelWrap} ${panelStyles.detailsWrap}`} data-details-open={showDetails ? "true" : undefined}>
          <div style={{ borderRadius: 20, border: "1px solid #E2E8F0", background: "rgba(255,255,255,.97)", boxShadow: "0 10px 28px rgba(15,23,42,.07)", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, height: "100%" }}>
            <div className={panelStyles.sidebarScroll}>
              {/* Video — top of right panel */}
              <div style={{ flexShrink: 0, padding: "12px 16px", borderBottom: "1px solid #E8EEF4" }}>
                <div onClick={content?.video_url ? () => setShowVideo(true) : undefined}
                  style={{
                    position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden",
                    cursor: content?.video_url ? "pointer" : "default",
                    background: videoThumb ? "#000" : content?.video_url ? "linear-gradient(135deg,#1E1B4B,#312E81)" : "#F1F5F9",
                    border: content?.video_url ? "none" : "1.5px dashed #E2E8F0", flexShrink: 0,
                  }}>
                  {videoThumb && <img src={videoThumb} alt="Video thumbnail" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: progress?.video_watched ? "brightness(.55) saturate(.5)" : "brightness(.65)" }} />}
                  {content?.video_url && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 100%)" }} />}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {content?.video_url ? (
                      progress?.video_watched ? (
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#22C55E,#14B8A6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(34,197,94,.45)" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,.45)" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#1E1B4B" style={{ marginLeft: 2 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                      )
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        <span style={{ fontSize: 10, color: "#CBD5E1", fontWeight: 600 }}>No video yet</span>
                      </div>
                    )}
                  </div>
                  {content?.video_url && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,.9)" }}>{progress?.video_watched ? "✓ Watched" : "Activity Video"}</span>
                      <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 999, background: "rgba(124,58,237,.75)", color: "white" }}>AI Feature</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity title & description — hidden on overview preview */}
              {!isOverview && (
              <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #E8EEF4" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#94A3B8" }}>ACTIVITY</div>
                  {activityTools.length > 0 && (
                    <RotatingTools tools={activityTools} toolLogos={toolLogos} iconSize={18} insetScale={0.9} borderColor="#E2E8F0" labelColor="#475569" labelSize={10.5} chipStyle={{ height: 26, padding: "0 8px 0 4px" }} />
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-.03em", color: "#0F172A", lineHeight: 1.2 }}>{activity.title}</div>
                {activity.description && (
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 5, lineHeight: 1.4 }}>{activity.description}</div>
                )}
              </div>
              )}

              {/* Goals — always visible */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #E8EEF4" }}>
                <div style={sideHeading}>🎯 GOALS</div>
                {(content?.goals?.length ?? 0) > 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                    {content!.goals.map((g, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, lineHeight: 1.4, color: "#334155" }}>
                        <span style={{ color: "#16A34A", flexShrink: 0, marginTop: 1 }}>✓</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "#94A3B8", lineHeight: 1.4 }}>No goals set yet.</p>
                )}
              </div>

              {/* Access — always visible */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #E8EEF4" }}>
                <div style={sideHeading}>🔑 ACCESS YOU&apos;LL NEED</div>
                {(content?.access_needed?.length ?? 0) > 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                    {content!.access_needed.map((a, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, lineHeight: 1.4, color: "#334155" }}>
                        <span style={{ color: "#64748B", flexShrink: 0, marginTop: 1 }}>·</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "#94A3B8", lineHeight: 1.4 }}>No special access required.</p>
                )}
              </div>

              {/* Downloads — always visible */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #E8EEF4" }}>
                <div style={sideHeading}>📥 DOWNLOADS</div>
                {(content?.downloads?.length ?? 0) > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {content!.downloads.map((d, i) => (
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
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "#94A3B8", lineHeight: 1.4 }}>No files for this workflow yet.</p>
                )}
              </div>

              {/* Prompts — always visible */}
              <div style={{ padding: "12px 16px" }}>
                <div style={sideHeading}>💬 COPY PROMPTS</div>
                {(content?.prompts?.length ?? 0) > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {content!.prompts.map((p, i) => (
                      <div key={i} style={{ border: "1px solid #E2E8F0", borderRadius: 9, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#334155" }}>{p.label}</span>
                          <button onClick={() => { navigator.clipboard.writeText(p.text).then(() => { setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }); }}
                            suppressHydrationWarning
                            style={{ border: "1px solid", borderColor: copiedIdx === i ? "rgba(35,206,104,.3)" : "#E2E8F0", background: copiedIdx === i ? "rgba(35,206,104,.08)" : "white", color: copiedIdx === i ? "#16A34A" : "#64748B", borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: ".15s" }}>
                            {copiedIdx === i ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                        <pre style={{ margin: 0, padding: "7px 10px", fontSize: 11, fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.5, color: "#475569", maxHeight: 88, overflowY: "auto", background: "white" }}>{p.text}</pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "#94A3B8", lineHeight: 1.4 }}>No prompts yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: details overlay backdrop + close bar */}
      {showDetails && (
        <>
          <div className={panelStyles.detailsOverlay} onClick={() => setShowDetails(false)} />
          <div className={panelStyles.detailsCloseBar}>
            <span className={panelStyles.detailsCloseTitle}>Activity Details</span>
            <button className={panelStyles.detailsCloseBtn} onClick={() => setShowDetails(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Close
            </button>
          </div>
        </>
      )}

      {showQuiz && pendingQuiz && <QuizModal quiz={pendingQuiz} onClose={handleQuizClose} />}
      {showCelebration && <CelebrationModal activityTitle={activity.title} points={activity.points} onContinue={() => { window.location.href = "/apply"; }} />}
      {showVideo && content?.video_url && <VideoModal src={content.video_url} activityTitle={activity.title} alreadyWatched={!!progress?.video_watched} onClose={() => setShowVideo(false)} onCompleted={handleVideoCompleted} />}

      {jumpToast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 18px", borderRadius: 16, color: "white", fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#0F172A,#1E3A5F)", boxShadow: "0 12px 32px rgba(15,23,42,.45)", maxWidth: "min(420px, 90vw)", lineHeight: 1.45 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          {jumpToast}
        </div>
      )}
    </div>
  );
}

function StepCenterSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} aria-hidden="true">
      <div className={panelStyles.skeletonBlock} style={{ width: 140, height: 28, borderRadius: 999 }} />
      <div className={panelStyles.skeletonBlock} style={{ width: "72%", height: 32 }} />
      <div className={panelStyles.skeletonBlock} style={{ width: "48%", height: 24 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div className={panelStyles.skeletonCircle} style={{ width: 20, height: 20, marginTop: 2 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 2 }}>
              <div className={panelStyles.skeletonBlock} style={{ width: "100%", height: 14 }} />
              <div className={panelStyles.skeletonBlock} style={{ width: i === 2 ? "60%" : "88%", height: 14 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #E2E8F0", marginTop: 8 }}>
        <div style={{ height: 32, display: "flex", alignItems: "center", gap: 6, padding: "0 12px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#E2E8F0" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#E2E8F0" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#E2E8F0" }} />
        </div>
        <div className={panelStyles.skeletonBlock} style={{ width: "100%", aspectRatio: "16/10", borderRadius: 0 }} />
      </div>
    </div>
  );
}

const aiChatAvatarStyle: React.CSSProperties = {
  width: 32, height: 32, flexShrink: 0, borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 11, fontWeight: 900, background: "#FFCE00", color: "#221D23",
};

const sideHeading: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 8,
  display: "flex", alignItems: "center", gap: 5,
  textTransform: "uppercase", letterSpacing: ".06em",
};

function dlIcon(type: string): string {
  return ({ pdf: "📄", ppt: "📊", xlsx: "📗", doc: "📝", other: "📎" } as Record<string, string>)[type] ?? "📎";
}
