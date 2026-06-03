"use client";
import { useState, useRef } from "react";
import { Workflow, WorkflowStep, Quiz } from "@/types";
import { v4 as uuidv4 } from "uuid";

type Phase = "upload" | "slides" | "quizzes" | "publish";

export default function AdminPanel() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [slides, setSlides] = useState<string[]>([]);
  const [slideNames, setSlideNames] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const mdRef = useRef<HTMLInputElement>(null);
  const slideRef = useRef<HTMLInputElement>(null);
  const quizMdRef = useRef<HTMLInputElement>(null);

  // --- Phase 1: Upload Markdown ---
  const handleMarkdownUpload = async (file: File) => {
    setUploading(true);
    setStatus("Parsing workflow…");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-workflow", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) { setStatus("Error: " + data.error); return; }
      const w: Workflow = {
        id: uuidv4(),
        title: data.title,
        subtitle: data.subtitle,
        rawMarkdown: await file.text(),
        steps: data.steps,
        slides: [],
      };
      setWorkflow(w);
      setStatus(`Parsed ${data.steps.length} steps.`);
      setPhase("slides");
    } catch (e) {
      setStatus("Parse failed. Check your markdown format.");
    } finally {
      setUploading(false);
    }
  };

  // --- Phase 2: Upload Slides ---
  const handleSlideUpload = async (files: FileList) => {
    setUploading(true);
    setStatus("Uploading slides…");
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload-slides", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) { setStatus("Error: " + data.error); return; }
      setSlides(data.urls);
      setSlideNames(data.names ?? data.urls.map((_: string, i: number) => `Slide ${i + 1}`));
      setStatus(`Uploaded ${data.urls.length} slide image(s) — sorted by filename.`);
    } catch {
      setStatus("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const assignSlides = () => {
    if (!workflow) return;
    // Auto-assign: step[i] gets slide[i] (clamp to available slides)
    const updated = {
      ...workflow,
      slides,
      steps: workflow.steps.map((s, i) => ({ ...s, slideIndex: Math.min(i, slides.length - 1) })),
    };
    setWorkflow(updated);
    setPhase("quizzes");
    setStatus("");
  };

  // --- Phase 3: Quizzes ---
  const handleQuizMdUpload = async (file: File) => {
    if (!workflow) return;
    setUploading(true);
    setStatus("Asking Claude to parse quizzes…");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("steps", JSON.stringify(workflow.steps.map((s) => ({ id: s.id, title: s.title }))));
      const res = await fetch("/api/parse-quizzes", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) { setStatus("Error: " + data.error); return; }
      // Apply parsed quizzes to workflow steps
      setWorkflow({
        ...workflow,
        steps: workflow.steps.map((s) =>
          data.mapped[s.id] ? { ...s, quiz: data.mapped[s.id] } : s
        ),
      });
      setStatus(`✓ Claude parsed ${data.total} quiz(es) and mapped them to steps.`);
    } catch {
      setStatus("Quiz parse failed. Check your file and try again.");
    } finally {
      setUploading(false);
    }
  };

  const updateStepQuiz = (stepId: string, quiz: Quiz | undefined) => {
    if (!workflow) return;
    setWorkflow({
      ...workflow,
      steps: workflow.steps.map((s) => s.id === stepId ? { ...s, quiz } : s),
    });
  };

  // --- Phase 4: Publish ---
  const publish = async () => {
    if (!workflow) return;
    setUploading(true);
    setStatus("Publishing…");
    // Bake slideUrl directly into every step so LearnerView never has to do an
    // index lookup — this prevents slide/step mismatches on navigation.
    const stepsWithUrls = workflow.steps.map((s) => ({
      ...s,
      slideUrl: slides[s.slideIndex] ?? slides[0] ?? undefined,
    }));
    const finalWorkflow: Workflow = { ...workflow, slides, steps: stepsWithUrls };
    try {
      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalWorkflow),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("Published! Learners can now access the workflow.");
        setPhase("publish");
      }
    } catch {
      setStatus("Publish failed.");
    } finally {
      setUploading(false);
    }
  };

  const stepLabels: Record<Phase, string> = {
    upload: "1. Workflow",
    slides: "2. Slides",
    quizzes: "3. Quizzes",
    publish: "4. Publish",
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Topbar */}
      <header className="h-[68px] flex-shrink-0 flex items-center justify-between px-6 border-b"
        style={{ background: "rgba(255,255,255,.9)", borderColor: "#E2E8F0", backdropFilter: "blur(18px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
            style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)" }}>A</div>
          <div>
            <div className="text-[17px] font-black tracking-tight">Admin Panel</div>
            <div className="text-xs text-slate-500 font-semibold">Configure your guided workflow</div>
          </div>
        </div>
        <a href="/" className="flex items-center gap-2 h-[34px] px-3 rounded-full text-xs font-bold text-teal-700 border bg-teal-50 border-teal-200 hover:bg-teal-100 transition-colors">
          ← Learner View
        </a>
      </header>

      <div className="flex-1 min-h-0 overflow-auto p-6">
        {/* Phase tabs */}
        <div className="flex gap-2 mb-6">
          {(["upload", "slides", "quizzes", "publish"] as Phase[]).map((p, i) => {
            const isActive = phase === p;
            const isDone =
              (p === "upload" && workflow !== null) ||
              (p === "slides" && slides.length > 0) ||
              (p === "quizzes" && phase === "publish");
            return (
              <button key={p} onClick={() => workflow && setPhase(p)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black border transition-all cursor-pointer ${isActive ? "text-white border-blue-600" : isDone ? "text-green-700 bg-green-50 border-green-200" : "text-slate-400 bg-white border-slate-200"}`}
                style={isActive ? { background: "linear-gradient(135deg,#2563EB,#1D4ED8)" } : {}}>
                {isDone && !isActive ? "✓ " : ""}{stepLabels[p]}
              </button>
            );
          })}
        </div>

        {/* Status */}
        {status && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold">
            {status}
          </div>
        )}

        {/* Phase 1: Upload Markdown */}
        {phase === "upload" && (
          <div className="max-w-xl">
            <h2 className="text-xl font-black mb-1">Upload Workflow Document</h2>
            <p className="text-sm text-slate-500 font-medium mb-5">
              Upload a <strong>.md</strong> (Markdown) file describing your workflow steps. See the format guide below.
            </p>
            <div
              className="border-2 border-dashed border-blue-300 rounded-3xl p-10 text-center cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => mdRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleMarkdownUpload(f); }}>
              <div className="text-4xl mb-3">📄</div>
              <div className="text-sm font-bold text-slate-600">Click or drag a <code>.md</code> file here</div>
              <div className="text-xs text-slate-400 mt-1">Markdown workflow document</div>
              <input ref={mdRef} type="file" accept=".md,.txt" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMarkdownUpload(f); }} />
            </div>

            {/* Format guide */}
            <div className="mt-6 rounded-3xl border p-5 bg-slate-50" style={{ borderColor: "#E2E8F0" }}>
              <div className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3">Markdown Format Guide</div>
              <pre className="text-xs text-slate-600 leading-relaxed overflow-auto font-mono">{`---
title: My Workflow Title
subtitle: Short description
---

## Step 1: Open the Tool
**Description:** Navigate to the main dashboard and log in.
**AI Message:** Let's start by opening the tool. Head to the dashboard.
**Callout:** Click the Login button in the top right.
**Slide:** 1

## Step 2: Configure Settings
**Description:** Go to Settings > General and update your preferences.
**AI Message:** Now let's configure your settings for the best experience.
**Callout:** Look for the Settings gear icon.
**Slide:** 2`}</pre>
            </div>
          </div>
        )}

        {/* Phase 2: Upload Slides */}
        {phase === "slides" && workflow && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-black mb-1">Upload Slide Images</h2>

            {/* Upload options */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl border bg-blue-50 border-blue-200">
                <div className="text-xs font-black uppercase tracking-widest text-blue-700 mb-2">✅ Option 1 — PDF (Recommended)</div>
                <div className="text-xs text-blue-800 font-medium leading-relaxed">
                  Export from PowerPoint:<br/>
                  <strong>File → Export → Create PDF/XPS</strong><br/>
                  Then upload the PDF here. Each page becomes one slide image automatically.
                </div>
              </div>
              <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200">
                <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Option 2 — PNG Images</div>
                <div className="text-xs text-slate-600 font-medium leading-relaxed">
                  Export from PowerPoint:<br/>
                  <strong>File → Export → Export to PNG → Every Slide</strong><br/>
                  Upload all PNGs at once — sorted by filename automatically.
                </div>
              </div>
            </div>

            <div
              className="border-2 border-dashed border-teal-300 rounded-3xl p-10 text-center cursor-pointer hover:bg-teal-50 transition-colors"
              onClick={() => slideRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleSlideUpload(e.dataTransfer.files); }}>
              <div className="text-4xl mb-3">📄</div>
              <div className="text-sm font-bold text-slate-600">Click or drag your PDF or PNG images here</div>
              <div className="text-xs text-slate-400 mt-1">PDF (all pages rendered automatically) · PNG · JPG</div>
              <input ref={slideRef} type="file" accept="image/*,.pdf" multiple className="hidden"
                onChange={(e) => { if (e.target.files?.length) handleSlideUpload(e.target.files); }} />
            </div>

            {slides.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {slides.length} slide(s) — sorted by filename ↓
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Position shown on each card</div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {slides.map((url, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="relative rounded-2xl overflow-hidden border bg-slate-100" style={{ borderColor: "#E2E8F0", aspectRatio: "16/9" }}>
                        {/* Position badge */}
                        <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md text-[10px] font-black text-white"
                          style={{ background: "rgba(37,99,235,.85)" }}>
                          #{i + 1}
                        </div>
                        <img src={url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                      {/* Original filename */}
                      <div className="text-[10px] text-slate-400 font-medium truncate px-0.5" title={slideNames[i]}>
                        {slideNames[i] ?? `slide_${i + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide assignment per step */}
            {slides.length > 0 && (
              <div className="mt-5">
                <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Assign Slides to Steps</div>
                <div className="flex flex-col gap-2">
                  {workflow.steps.map((step, si) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border" style={{ borderColor: "#E2E8F0" }}>
                      <div className="text-xs font-black text-slate-500 min-w-[80px]">Step {si + 1}</div>
                      <div className="flex-1 text-sm font-semibold text-slate-700 truncate">{step.title}</div>
                      <select
                        value={step.slideIndex}
                        onChange={(e) => {
                          const idx = parseInt(e.target.value);
                          setWorkflow({ ...workflow, steps: workflow.steps.map((s, i) => i === si ? { ...s, slideIndex: idx } : s) });
                        }}
                        className="px-3 py-1.5 rounded-xl border text-sm font-semibold outline-none" style={{ borderColor: "#CBD5E1" }}>
                        {slides.map((_, i) => (
                          <option key={i} value={i}>Slide {i + 1}</option>
                        ))}
                        <option value={-1}>No slide</option>
                      </select>
                    </div>
                  ))}
                </div>
                <button onClick={assignSlides}
                  className="mt-4 px-6 py-3 rounded-2xl text-white text-sm font-black border-0 cursor-pointer"
                  style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
                  Save & Continue to Quizzes →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Phase 3: Quizzes */}
        {phase === "quizzes" && workflow && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-black mb-1">Add Quizzes</h2>
            <p className="text-sm text-slate-500 font-medium mb-4">
              Upload a <strong>.md</strong> quiz file and Claude will auto-fill all quizzes instantly — or fill them in manually below.
            </p>

            {/* AI Upload Option */}
            <div
              className="mb-6 border-2 border-dashed border-blue-300 rounded-3xl p-6 flex items-center gap-5 cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => quizMdRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleQuizMdUpload(f); }}>
              <div className="text-4xl flex-shrink-0">🤖</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-slate-700 mb-0.5">Auto-fill with AI — Upload quiz .md file</div>
                <div className="text-xs text-slate-400 font-medium">Claude reads your markdown and maps each quiz to the right step automatically.</div>
              </div>
              <div className="flex-shrink-0 px-4 py-2 rounded-2xl text-white text-xs font-black border-0 pointer-events-none"
                style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
                {uploading ? "Parsing…" : "Upload"}
              </div>
              <input ref={quizMdRef} type="file" accept=".md,.txt" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQuizMdUpload(f); }} />
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-bold text-slate-400">or fill in manually</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="flex flex-col gap-4">
              {workflow.steps.map((step, si) => (
                <QuizEditor key={step.id + (step.quiz?.question ?? "")} step={step} stepNum={si + 1}
                  onChange={(quiz) => updateStepQuiz(step.id, quiz)} />
              ))}
            </div>
            <button onClick={publish} disabled={uploading}
              className="mt-6 px-6 py-3 rounded-2xl text-white text-sm font-black border-0 cursor-pointer disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#14B8A6,#0D9488)" }}>
              {uploading ? "Publishing…" : "Publish Workflow →"}
            </button>
          </div>
        )}

        {/* Phase 4: Published */}
        {phase === "publish" && (
          <div className="max-w-md">
            <div className="rounded-3xl border p-8 text-center bg-green-50 border-green-200">
              <div className="text-5xl mb-4">🎉</div>
              <div className="text-xl font-black mb-2">Workflow Published!</div>
              <div className="text-sm text-slate-600 font-medium mb-6">
                The guided learning experience is now live for learners.
              </div>
              <a href="/" className="inline-block px-6 py-3 rounded-2xl text-white text-sm font-black"
                style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
                Open Learner View →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Quiz Editor Component ---
function QuizEditor({ step, stepNum, onChange }: { step: WorkflowStep; stepNum: number; onChange: (q: Quiz | undefined) => void }) {
  const [enabled, setEnabled] = useState(!!step.quiz);
  const emptyQuiz: Quiz = {
    question: "",
    options: ["", "", "", ""],
    correct: 0,
    successMsg: "Well done!",
    wrongMsg: "Review this step and try again.",
    badge: "✓ Got it",
  };
  const [quiz, setQuiz] = useState<Quiz>(step.quiz ?? emptyQuiz);

  const toggle = (val: boolean) => {
    setEnabled(val);
    onChange(val ? quiz : undefined);
  };

  const update = (partial: Partial<Quiz>) => {
    const next = { ...quiz, ...partial };
    setQuiz(next);
    if (enabled) onChange(next);
  };

  return (
    <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: "#E2E8F0" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-black">Step {stepNum}: {step.title}</div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} className="accent-blue-600" />
          <span className="text-xs font-bold text-slate-500">Add quiz</span>
        </label>
      </div>

      {enabled && (
        <div className="flex flex-col gap-3">
          <input placeholder="Quiz question…" value={quiz.question}
            onChange={(e) => update({ question: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border text-sm font-medium outline-none" style={{ borderColor: "#CBD5E1" }} />

          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Options (mark the correct one)</div>
          {quiz.options.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="radio" name={`correct-${step.id}`} checked={quiz.correct === i}
                onChange={() => update({ correct: i })} className="accent-blue-600" />
              <input placeholder={`Option ${i + 1}`} value={opt}
                onChange={(e) => {
                  const opts = [...quiz.options];
                  opts[i] = e.target.value;
                  update({ options: opts });
                }}
                className="flex-1 px-3 py-2 rounded-xl border text-sm font-medium outline-none" style={{ borderColor: "#CBD5E1" }} />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Success message" value={quiz.successMsg}
              onChange={(e) => update({ successMsg: e.target.value })}
              className="px-3 py-2 rounded-xl border text-sm font-medium outline-none" style={{ borderColor: "#CBD5E1" }} />
            <input placeholder="Wrong message" value={quiz.wrongMsg}
              onChange={(e) => update({ wrongMsg: e.target.value })}
              className="px-3 py-2 rounded-xl border text-sm font-medium outline-none" style={{ borderColor: "#CBD5E1" }} />
          </div>
          <input placeholder="Badge text (e.g. ✓ Got it)" value={quiz.badge}
            onChange={(e) => update({ badge: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border text-sm font-medium outline-none" style={{ borderColor: "#CBD5E1" }} />
        </div>
      )}
    </div>
  );
}
