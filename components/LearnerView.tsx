"use client";
import { useState, useRef, useEffect } from "react";
import { Workflow, ChatMessage } from "@/types";
import QuizModal from "./QuizModal";
import MdText from "./MdText";
import SlideZoom from "./SlideZoom";

interface Props {
  workflow: Workflow;
}

export default function LearnerView({ workflow }: Props) {
  const { steps, slides, title } = workflow;
  const [current, setCurrent] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<import("@/types").Quiz | null>(null);
  const [jumpToast, setJumpToast] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const initDone = useRef(false);

  const [slideOpen, setSlideOpen] = useState(false);
  const step = steps[current];
  const slideUrl = step?.slideUrl ?? slides[step?.slide_number ? step.slide_number - 1 : 0] ?? slides[0] ?? null;
  const progress = ((current + 1) / steps.length) * 100;

  const stepsForAPI = steps.map((s) => ({
    title: s.title,
    what_learner_sees: s.what_learner_sees,
    what_this_means: s.what_this_means,
    what_to_do: s.what_to_do,
    if_stuck: s.if_stuck,
  }));

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Fetch two initial messages from Claude on mount
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ init: true, activityTitle: title, steps: stepsForAPI }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.initMessages) {
          setMessages(
            (data.initMessages as string[]).map((content) => ({ role: "assistant" as const, content }))
          );
        }
      })
      .catch(() => {
        setMessages([
          {
            role: "assistant",
            content: `Hi! I'm Nudgie, your AI coach for ${title}. Look at the slide and ask me anything — I'll guide you through each step.`,
          },
        ]);
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
          activityTitle: title,
          steps: stepsForAPI,
        }),
      });
      const data = await res.json();
      if (data.reply) setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (typeof data.goToStep === "number") {
        setCurrent(data.goToStep);
        const stepTitle = steps[data.goToStep]?.title ?? `Step ${data.goToStep + 1}`;
        setJumpToast(`Jumped to Step ${data.goToStep + 1}: ${stepTitle}`);
        setTimeout(() => setJumpToast(null), 3500);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (current >= steps.length - 1 || loading) return;
    if (step?.quiz) { setPendingQuiz(step.quiz); setShowQuiz(true); }
    const msg = "next";
    setMessages((m) => [...m, { role: "user", content: msg }]);
    callAI(msg, current);
  };

  const goPrev = () => {
    if (current <= 0 || loading) return;
    const msg = "go back to previous step";
    setMessages((m) => [...m, { role: "user", content: msg }]);
    callAI(msg, current);
  };

  const goToStep = (stepNum: number) => {
    if (loading) return;
    const msg = `go to step ${stepNum}`;
    setMessages((m) => [...m, { role: "user", content: msg }]);
    callAI(msg, current);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    await callAI(userMsg);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Topbar */}
      <header
        className="h-[68px] flex-shrink-0 flex items-center justify-between px-6 border-b"
        style={{ background: "rgba(255,255,255,.82)", borderColor: "#E2E8F0", backdropFilter: "blur(18px)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
            style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)", boxShadow: "0 10px 22px rgba(37,99,235,.22)" }}
          >
            G
          </div>
          <div>
            <div className="text-[17px] font-black tracking-tight">{title}</div>
            <div className="text-xs text-slate-500 font-semibold">{workflow.subtitle}</div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div
            className="flex items-center gap-2 h-[34px] px-3 rounded-full text-xs font-bold text-slate-500 border bg-white"
            style={{ borderColor: "#E2E8F0", boxShadow: "0 8px 22px rgba(15,23,42,.08)" }}
          >
            <span className="w-2 h-2 rounded-full bg-teal-400" style={{ boxShadow: "0 0 0 4px rgba(20,184,166,.16)" }} />
            Claude Sonnet
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 min-h-0 grid gap-4 p-4" style={{ gridTemplateColumns: "minmax(360px,39%) minmax(520px,61%)" }}>
        {/* Left: Chat Panel */}
        <div
          className="flex flex-col rounded-3xl overflow-hidden border bg-white/92 min-h-0"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 18px 45px rgba(15,23,42,.10)" }}
        >
          <div
            className="flex-shrink-0 h-[66px] flex items-center justify-between px-4 border-b"
            style={{ borderColor: "#E2E8F0", background: "linear-gradient(180deg,rgba(255,255,255,.94),rgba(248,250,252,.94))" }}
          >
            <div>
              <div className="text-[15px] tracking-tight text-slate-900 mb-0.5">
                <span className="font-black">Nudgie</span>
                <span className="font-medium"> — your AI coach</span>
              </div>
              <div className="text-base font-black tracking-tight">Step {current + 1}: {step?.title}</div>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-black text-blue-700"
              style={{ background: "#DBEAFE" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Active
            </div>
          </div>

          <div ref={chatRef} className="flex-1 min-h-0 overflow-auto p-5 flex flex-col gap-3">
            {initializing ? (
              <div className="self-start flex gap-2.5">
                <div
                  className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-black text-white"
                  style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)" }}
                >
                  AI
                </div>
                <div
                  className="rounded-[18px] px-4 py-3 bg-white border border-slate-200 text-slate-400 text-sm"
                  style={{ borderTopLeftRadius: 8 }}
                >
                  Preparing your session…
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 max-w-[95%] ${m.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
                >
                  <div
                    className={`w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-black mt-0.5 ${m.role === "user" ? "bg-slate-200 text-slate-700" : "text-white"}`}
                    style={m.role === "assistant" ? { background: "linear-gradient(135deg,#2563EB,#14B8A6)" } : {}}
                  >
                    {m.role === "user" ? "U" : "AI"}
                  </div>
                  <div
                    className={`rounded-[18px] px-4 py-3 border shadow-sm ${m.role === "user" ? "text-white border-blue-600" : "bg-white text-slate-800 border-slate-200"}`}
                    style={m.role === "user" ? { background: "#2563EB", borderTopRightRadius: 8 } : { borderTopLeftRadius: 8 }}
                  >
                    {m.role === "user" ? (
                      <span className="text-sm leading-relaxed">{m.content}</span>
                    ) : (
                      <MdText text={m.content} />
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="self-start flex gap-2.5">
                <div
                  className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-black text-white"
                  style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)" }}
                >
                  AI
                </div>
                <div
                  className="rounded-[18px] px-4 py-3 bg-white border border-slate-200 text-slate-400 text-sm"
                  style={{ borderTopLeftRadius: 8 }}
                >
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t" style={{ borderColor: "#E2E8F0", background: "rgba(255,255,255,.96)" }}>
            <div className="flex gap-2.5 p-3.5 border-b" style={{ borderColor: "#E2E8F0" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask Nudgie anything…"
                className="flex-1 h-[42px] px-3.5 rounded-[13px] border text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                style={{ borderColor: "#CBD5E1", background: "#F8FAFC" }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || initializing}
                className="px-4 py-2 rounded-[13px] text-white text-sm font-black border-0 cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
              >
                Ask
              </button>
            </div>
            <div className="flex gap-3 p-3.5 items-center">
              <button
                onClick={goPrev}
                disabled={current === 0 || loading || initializing}
                className="px-4 py-2.5 rounded-[13px] text-sm font-black cursor-pointer border disabled:opacity-40 hover:-translate-y-px transition-transform"
                style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#64748B" }}
              >
                ← Prev
              </button>
              <div className="flex-1 text-xs text-slate-400 font-semibold text-center leading-tight">
                {current < steps.length - 1 ? "Advance when ready" : "🎉 You've completed the workflow!"}
              </div>
              <button
                onClick={goNext}
                disabled={current >= steps.length - 1 || loading || initializing}
                className="px-4 py-2.5 rounded-[13px] text-white text-sm font-black cursor-pointer border-0 disabled:opacity-40 hover:-translate-y-px transition-transform"
                style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Right: Workbench */}
        <div
          className="flex flex-col rounded-3xl overflow-hidden border min-h-0"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 18px 45px rgba(15,23,42,.10)", background: "linear-gradient(180deg,#F8FAFC,#F1F5F9)" }}
        >
          <div className="flex-1 min-h-0 grid gap-4 p-4" style={{ gridTemplateColumns: "1fr 292px" }}>
            {/* Slide frame */}
            <div
              className="flex flex-col rounded-[20px] overflow-hidden border bg-white min-h-0"
              style={{ borderColor: "#E2E8F0", boxShadow: "0 10px 28px rgba(15,23,42,.08)" }}
            >
              <div
                className="flex-shrink-0 h-9 flex items-center gap-2 px-3 border-b text-xs font-bold text-slate-400"
                style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                <span className="ml-2">Step {current + 1} — {step?.title}</span>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden relative bg-slate-50 flex items-center justify-center">
                {slideUrl ? (
                  <SlideZoom src={slideUrl} alt={`Step ${current + 1}`} open={slideOpen} onClose={() => setSlideOpen(false)} />
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[300px] text-slate-400 text-sm font-semibold flex-col gap-3">
                    <div className="text-4xl">🖼️</div>
                    <div>No slide image for this step</div>
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
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Side panel — step list */}
            <div
              className="flex flex-col rounded-[20px] border overflow-hidden"
              style={{ borderColor: "#E2E8F0", background: "rgba(255,255,255,.94)", boxShadow: "0 10px 28px rgba(15,23,42,.07)" }}
            >
              <div
                className="flex-shrink-0 px-4 py-3 border-b"
                style={{ borderColor: "#E2E8F0", background: "linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,252,.98))" }}
              >
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">All Steps</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">{steps.length} steps total</div>
              </div>
              <div className="flex-1 overflow-auto p-2 flex flex-col gap-1">
                {steps.map((s, i) => {
                  const isActive = current === i;
                  const isDone = i < current;
                  return (
                    <button
                      key={s.id ?? i}
                      onClick={() => goToStep(i + 1)}
                      disabled={loading || initializing}
                      className="w-full text-left px-3 py-2.5 rounded-[14px] transition-all disabled:cursor-not-allowed group"
                      style={
                        isActive
                          ? { background: "#DBEAFE", border: "1.5px solid #BFDBFE" }
                          : { background: "transparent", border: "1.5px solid transparent" }
                      }
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
                          style={
                            isActive
                              ? { background: "#2563EB", color: "white" }
                              : isDone
                              ? { background: "#14B8A6", color: "white" }
                              : { background: "#E2E8F0", color: "#94A3B8" }
                          }
                        >
                          {isDone ? "✓" : i + 1}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="text-[11px] font-black uppercase tracking-wide mb-0.5"
                            style={{ color: isActive ? "#2563EB" : "#94A3B8" }}
                          >
                            Step {i + 1}
                          </div>
                          <div
                            className="text-xs font-semibold leading-snug"
                            style={{ color: isActive ? "#1E3A8A" : isDone ? "#475569" : "#64748B" }}
                          >
                            {s.title}
                          </div>
                        </div>
                      </div>
                      {isActive && s.callout && s.callout !== "" && (
                        <div
                          className="mt-2 p-2 rounded-xl text-[11px] font-semibold leading-snug text-teal-900"
                          style={{ background: "#CCFBF1", border: "1px solid rgba(20,184,166,.25)" }}
                        >
                          💡 {s.callout}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="flex-shrink-0 flex items-center gap-3.5 px-4 h-[66px] border-t"
            style={{ borderColor: "#E2E8F0", background: "rgba(255,255,255,.9)" }}
          >
            <div className="text-xs font-black text-slate-400 whitespace-nowrap min-w-[120px]">
              Step {current + 1} of {steps.length}
            </div>
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-200">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg,#2563EB,#14B8A6)" }}
              />
            </div>
            <div className="text-xs font-black text-slate-400 text-right min-w-[52px]">
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </div>

      {showQuiz && pendingQuiz && (
        <QuizModal quiz={pendingQuiz} onClose={() => { setShowQuiz(false); setPendingQuiz(null); }} />
      )}

      {jumpToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)", boxShadow: "0 12px 32px rgba(37,99,235,.35)" }}
        >
          <span>↗</span>
          {jumpToast.replace("↗ ", "")}
        </div>
      )}
    </div>
  );
}
