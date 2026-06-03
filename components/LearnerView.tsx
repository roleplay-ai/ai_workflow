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
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: steps[0]?.aiMessage ?? "Welcome! Let's get started." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<import("@/types").Quiz | null>(null);
  const [jumpToast, setJumpToast] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const step = steps[current];
  // Prefer the baked-in URL (set at publish time) over the fragile index lookup
  const slideUrl = step?.slideUrl ?? slides[step?.slideIndex ?? 0] ?? slides[0] ?? null;
  const progress = ((current + 1) / steps.length) * 100;

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const goNext = () => {
    if (current >= steps.length - 1) return;
    const next = current + 1;
    const nextStep = steps[next];
    // Capture quiz from current step BEFORE advancing
    if (step?.quiz) {
      setPendingQuiz(step.quiz);
      setShowQuiz(true);
    }
    setCurrent(next);
    setMessages((m) => [...m, { role: "assistant", content: nextStep.aiMessage }]);
  };

  const goPrev = () => {
    if (current <= 0) return;
    setCurrent((c) => c - 1);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, stepIndex: current }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      }
      if (typeof data.goToStep === "number") {
        setCurrent(data.goToStep);
        const stepTitle = steps[data.goToStep]?.title ?? `Step ${data.goToStep + 1}`;
        setJumpToast(`↗ Jumped to Step ${data.goToStep + 1}: ${stepTitle}`);
        setTimeout(() => setJumpToast(null), 3500);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Topbar */}
      <header className="h-[68px] flex-shrink-0 flex items-center justify-between px-6 border-b"
        style={{ background: "rgba(255,255,255,.82)", borderColor: "#E2E8F0", backdropFilter: "blur(18px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
            style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)", boxShadow: "0 10px 22px rgba(37,99,235,.22)" }}>G</div>
          <div>
            <div className="text-[17px] font-black tracking-tight">{title}</div>
            <div className="text-xs text-slate-500 font-semibold">{workflow.subtitle}</div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 h-[34px] px-3 rounded-full text-xs font-bold text-slate-500 border bg-white"
            style={{ borderColor: "#E2E8F0", boxShadow: "0 8px 22px rgba(15,23,42,.08)" }}>
            <span className="w-2 h-2 rounded-full bg-teal-400" style={{ boxShadow: "0 0 0 4px rgba(20,184,166,.16)" }} />
            Claude Sonnet
          </div>
          <a href="/admin" className="flex items-center gap-2 h-[34px] px-3 rounded-full text-xs font-bold text-blue-600 border bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors">
            Admin ↗
          </a>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 min-h-0 grid gap-4 p-4" style={{ gridTemplateColumns: "minmax(360px,39%) minmax(520px,61%)" }}>
        {/* Left: Chat Panel */}
        <div className="flex flex-col rounded-3xl overflow-hidden border bg-white/92 min-h-0"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 18px 45px rgba(15,23,42,.10)" }}>
          {/* Panel header */}
          <div className="flex-shrink-0 h-[66px] flex items-center justify-between px-4 border-b"
            style={{ borderColor: "#E2E8F0", background: "linear-gradient(180deg,rgba(255,255,255,.94),rgba(248,250,252,.94))" }}>
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-blue-600 mb-0.5">AI Coach</div>
              <div className="text-base font-black tracking-tight">Step {current + 1}: {step?.title}</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-black text-blue-700"
              style={{ background: "#DBEAFE" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Active
            </div>
          </div>

          {/* Chat messages */}
          <div ref={chatRef} className="flex-1 min-h-0 overflow-auto p-5 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 max-w-[95%] ${m.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}>
                <div className={`w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-black mt-0.5 ${m.role === "user" ? "bg-slate-200 text-slate-700" : "text-white"}`}
                  style={m.role === "assistant" ? { background: "linear-gradient(135deg,#2563EB,#14B8A6)" } : {}}>
                  {m.role === "user" ? "U" : "AI"}
                </div>
                <div className={`rounded-[18px] px-4 py-3 border shadow-sm ${m.role === "user" ? "text-white border-blue-600" : "bg-white text-slate-800 border-slate-200"}`}
                  style={m.role === "user" ? { background: "#2563EB", borderTopRightRadius: 8 } : { borderTopLeftRadius: 8 }}>
                  {m.role === "user"
                    ? <span className="text-sm leading-relaxed">{m.content}</span>
                    : <MdText text={m.content} />}
                </div>
              </div>
            ))}
            {loading && (
              <div className="self-start flex gap-2.5">
                <div className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-black text-white"
                  style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)" }}>AI</div>
                <div className="rounded-[18px] px-4 py-3 bg-white border border-slate-200 text-slate-400 text-sm" style={{ borderTopLeftRadius: 8 }}>
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="flex-shrink-0 border-t" style={{ borderColor: "#E2E8F0", background: "rgba(255,255,255,.96)" }}>
            <div className="flex gap-2.5 p-3.5 border-b" style={{ borderColor: "#E2E8F0" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask the AI coach anything…"
                className="flex-1 h-[42px] px-3.5 rounded-[13px] border text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                style={{ borderColor: "#CBD5E1", background: "#F8FAFC" }}
              />
              <button onClick={sendMessage} disabled={loading}
                className="px-4 py-2 rounded-[13px] text-white text-sm font-black border-0 cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
                Ask
              </button>
            </div>
            {/* Navigation */}
            <div className="flex gap-3 p-3.5 items-center">
              <button onClick={goPrev} disabled={current === 0}
                className="px-4 py-2.5 rounded-[13px] text-sm font-black cursor-pointer border disabled:opacity-40 hover:-translate-y-px transition-transform"
                style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#64748B" }}>
                ← Prev
              </button>
              <div className="flex-1 text-xs text-slate-400 font-semibold text-center leading-tight">
                {current < steps.length - 1
                  ? "Advance when ready"
                  : "🎉 You've completed the workflow!"}
              </div>
              <button onClick={goNext} disabled={current >= steps.length - 1}
                className="px-4 py-2.5 rounded-[13px] text-white text-sm font-black cursor-pointer border-0 disabled:opacity-40 hover:-translate-y-px transition-transform"
                style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Right: Workbench */}
        <div className="flex flex-col rounded-3xl overflow-hidden border min-h-0"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 18px 45px rgba(15,23,42,.10)", background: "linear-gradient(180deg,#F8FAFC,#F1F5F9)" }}>
          {/* Workbench content */}
          <div className="flex-1 min-h-0 grid gap-4 p-4" style={{ gridTemplateColumns: "1fr 292px" }}>
            {/* Slide frame */}
            <div className="flex flex-col rounded-[20px] overflow-hidden border bg-white min-h-0"
              style={{ borderColor: "#E2E8F0", boxShadow: "0 10px 28px rgba(15,23,42,.08)" }}>
              {/* Browser bar */}
              <div className="flex-shrink-0 h-9 flex items-center gap-2 px-3 border-b text-xs font-bold text-slate-400"
                style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                <span className="ml-2">Step {current + 1} — {step?.title}</span>
              </div>
              {/* Slide image */}
              <div className="flex-1 min-h-0 overflow-hidden relative bg-slate-50 flex items-center justify-center">
                {slideUrl ? (
                  <>
                    <SlideZoom src={slideUrl} alt={`Step ${current + 1}`} />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[300px] text-slate-400 text-sm font-semibold flex-col gap-3">
                    <div className="text-4xl">🖼️</div>
                    <div>No slide image for this step</div>
                    <div className="text-xs">Upload slides in the Admin panel</div>
                  </div>
                )}
              </div>
            </div>

            {/* Side card */}
            <div className="overflow-auto rounded-[20px] border p-4"
              style={{ borderColor: "#E2E8F0", background: "rgba(255,255,255,.94)", boxShadow: "0 10px 28px rgba(15,23,42,.07)" }}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide text-blue-700 mb-3"
                style={{ background: "#DBEAFE" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Step {current + 1} / {steps.length}
              </div>
              <div className="text-[20px] font-black tracking-tight mb-2">{step?.title}</div>
              <MdText text={step?.description ?? ""} className="text-slate-700" />
              {step?.callout && (
                <div className="mt-3.5 p-3 rounded-2xl border text-[12px] font-bold leading-snug text-teal-900"
                  style={{ background: "#CCFBF1", borderColor: "rgba(20,184,166,.25)" }}>
                  💡 {step.callout}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex-shrink-0 flex items-center gap-3.5 px-4 h-[66px] border-t"
            style={{ borderColor: "#E2E8F0", background: "rgba(255,255,255,.9)" }}>
            <div className="text-xs font-black text-slate-400 whitespace-nowrap min-w-[120px]">
              Step {current + 1} of {steps.length}
            </div>
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-200">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg,#2563EB,#14B8A6)" }} />
            </div>
            <div className="text-xs font-black text-slate-400 text-right min-w-[52px]">
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuiz && pendingQuiz && (
        <QuizModal quiz={pendingQuiz} onClose={() => { setShowQuiz(false); setPendingQuiz(null); }} />
      )}

      {/* Jump toast */}
      {jumpToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)", boxShadow: "0 12px 32px rgba(37,99,235,.35)" }}>
          <span>↗</span>
          {jumpToast.replace("↗ ", "")}
        </div>
      )}
    </div>
  );
}
