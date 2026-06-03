"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import { parseWorkflowSteps } from "@/lib/parseWorkflowSteps";
import type { Profile, Activity, Module, ActivityContent, UserProgress } from "@/lib/supabase/types";

type Props = {
  profile: Profile & { companies: { name: string } | null };
  activity: Activity & { modules: Module; activity_content: ActivityContent | null };
  progress: UserProgress | null;
};

export default function ActivityViewClient({ profile, activity, progress: initProgress }: Props) {
  const supabase = createClient();
  const content  = activity.activity_content;

  // ── Derived content ──────────────────────────────────────────────────────
  const slides    = content?.slide_images  ?? [];
  const quiz      = content?.quiz          ?? [];
  const goals     = content?.goals         ?? [];
  const access    = content?.access_needed ?? [];
  const prompts   = content?.prompts       ?? [];
  const downloads = content?.downloads     ?? [];
  const steps     = useMemo(() => parseWorkflowSteps(content?.workflow_markdown ?? ""), [content?.workflow_markdown]);

  // ── State ────────────────────────────────────────────────────────────────
  const [progress,       setProgress]       = useState(initProgress);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(initProgress?.completed_steps ?? [])
  );
  const [currentSlide,   setCurrentSlide]   = useState(0);
  const [quizAnswers,    setQuizAnswers]     = useState<number[]>([]);
  const [quizSubmitted,  setQuizSubmitted]   = useState(false);
  const [tab,            setTab]             = useState<"slides" | "workflow" | "quiz">("slides");
  const [copiedIdx,      setCopiedIdx]       = useState<number | null>(null);

  // ── Progress helpers ──────────────────────────────────────────────────────
  async function upsertProgress(updates: Partial<UserProgress>) {
    const base = {
      user_id:    profile.id,
      activity_id: activity.id,
      updated_at: new Date().toISOString(),
    };
    if (progress) {
      const { data } = await supabase
        .from("user_progress")
        .update({ ...base, ...updates })
        .eq("id", progress.id)
        .select()
        .single();
      if (data) setProgress(data as any);
    } else {
      const { data } = await supabase
        .from("user_progress")
        .insert({ ...base, status: "in_progress", completed_steps: [], ...updates })
        .select()
        .single();
      if (data) setProgress(data as any);
    }
  }

  async function toggleStep(idx: number) {
    const next = new Set(completedSteps);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setCompletedSteps(next);

    const completedArr = Array.from(next);
    const allDone = steps.length > 0 && completedArr.length === steps.length;
    await upsertProgress({
      status: allDone ? "completed" : "in_progress",
      completed_steps: completedArr,
      ...(allDone ? { completed_at: new Date().toISOString() } : {}),
    });
  }

  async function startActivity() {
    await upsertProgress({ status: "in_progress", completed_steps: [] });
  }

  async function submitQuiz() {
    if (!quiz.length) return;
    const correct = quiz.filter((q, i) => quizAnswers[i] === q.correct_index).length;
    const pct = Math.round((correct / quiz.length) * 100);
    setQuizSubmitted(true);
    if (pct >= 60) {
      await upsertProgress({ status: "completed", quiz_score: pct, completed_at: new Date().toISOString() });
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function copyPrompt(text: string, idx: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }

  // ── Computed values ───────────────────────────────────────────────────────
  const quizScore = quizSubmitted
    ? quiz.filter((q, i) => quizAnswers[i] === q.correct_index).length
    : 0;
  const isCompleted = progress?.status === "completed";
  const isStarted   = !!progress;
  const stepPct     = steps.length ? (completedSteps.size / steps.length) * 100 : 0;

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: 999, border: "1.5px solid",
    borderColor: active ? "#221D23" : "#E8E6DC",
    background: active ? "#221D23" : "white",
    color: active ? "white" : "#6B6B6B",
    fontWeight: 700, fontSize: 13, cursor: "pointer", transition: ".12s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", color: "#221D23" }}>
      <Topbar profile={profile} role={profile.role} onSignOut={handleSignOut} />

      <main style={{ width: "min(1200px,calc(100% - 48px))", margin: "0 auto", padding: "26px 0 60px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: 13, color: "#6B6B6B" }}>
          <Link href="/dashboard" style={{ color: "#6B6B6B", textDecoration: "none" }}>Dashboard</Link>
          <span>/</span>
          <span style={{ color: "#221D23", fontWeight: 600 }}>{activity.title}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 22, alignItems: "start" }}>

          {/* ── Main content area ────────────────────────────────────────── */}
          <div>
            <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 22, overflow: "hidden", boxShadow: "0 2px 16px rgba(34,29,35,.07)" }}>
              {/* Header */}
              <div style={{ padding: "22px 22px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  {[activity.level, `${activity.time_estimate_minutes}m`, `${activity.points} pts`].filter(Boolean).map(tag => (
                    <span key={tag} style={{ padding: "3px 10px", borderRadius: 999, background: "#F0EEE8", fontSize: 11.5, fontWeight: 700, color: "#6B6B6B" }}>{tag}</span>
                  ))}
                </div>
                <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, letterSpacing: "-.04em" }}>{activity.title}</h1>
                {activity.description && (
                  <p style={{ margin: "0 0 18px", color: "#6B6B6B", fontSize: 13.5, lineHeight: 1.5 }}>{activity.description}</p>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={tabBtn(tab === "slides")}   onClick={() => setTab("slides")}>📸 Slides</button>
                  <button style={tabBtn(tab === "workflow")} onClick={() => setTab("workflow")}>📋 Workflow</button>
                  <button style={tabBtn(tab === "quiz")}     onClick={() => setTab("quiz")}>✓ Quiz</button>
                </div>
              </div>

              {/* ── Slides ──────────────────────────────────────────────── */}
              {tab === "slides" && (
                <div style={{ padding: 22 }}>
                  {slides.length === 0 ? (
                    <EmptyState>No slides uploaded for this activity yet.</EmptyState>
                  ) : (
                    <>
                      <div style={{ borderRadius: 14, overflow: "hidden", background: "#111", marginBottom: 12, minHeight: 340, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img
                          src={slides[currentSlide]?.url}
                          alt={`Slide ${currentSlide + 1}`}
                          style={{ maxWidth: "100%", maxHeight: 520, objectFit: "contain", display: "block" }}
                        />
                      </div>
                      {slides[currentSlide]?.caption && (
                        <p style={{ textAlign: "center", fontSize: 12.5, color: "#6B6B6B", marginBottom: 12 }}>
                          {slides[currentSlide].caption}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <button onClick={() => setCurrentSlide(s => Math.max(0, s - 1))} disabled={currentSlide === 0} style={navBtn}>
                          ← Prev
                        </button>
                        <span style={{ fontSize: 13, color: "#6B6B6B", fontWeight: 600 }}>
                          {currentSlide + 1} / {slides.length}
                        </span>
                        <button onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))} disabled={currentSlide === slides.length - 1} style={navBtn}>
                          Next →
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                        {slides.map((s, i) => (
                          <img key={i} src={s.url} alt={`Thumb ${i + 1}`}
                            onClick={() => setCurrentSlide(i)}
                            style={{ width: 64, height: 44, objectFit: "cover", borderRadius: 7, cursor: "pointer", flexShrink: 0, border: i === currentSlide ? "2.5px solid #FFCE00" : "2.5px solid transparent", transition: ".1s" }} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Workflow ─────────────────────────────────────────────── */}
              {tab === "workflow" && (
                <div style={{ padding: 22 }}>
                  {!content?.workflow_markdown ? (
                    <EmptyState>No workflow added for this activity yet.</EmptyState>
                  ) : steps.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {steps.map((step, i) => (
                        <div key={i} style={{
                          borderRadius: 14, border: `1.5px solid ${completedSteps.has(i) ? "rgba(35,206,104,.3)" : "#E8E6DC"}`,
                          background: completedSteps.has(i) ? "rgba(35,206,104,.04)" : "white",
                          overflow: "hidden", transition: ".15s",
                        }}>
                          <div
                            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
                            onClick={() => isStarted && toggleStep(i)}
                          >
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                              display: "grid", placeItems: "center",
                              background: completedSteps.has(i) ? "#23CE68" : "#F0EEE8",
                              color: completedSteps.has(i) ? "white" : "#B0ABA5",
                              fontSize: completedSteps.has(i) ? 14 : 12, fontWeight: 900,
                              border: completedSteps.has(i) ? "none" : "2px solid #E8E6DC",
                              transition: ".15s",
                            }}>
                              {completedSteps.has(i) ? "✓" : i + 1}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14.5, flex: 1 }}>{step.title}</span>
                          </div>
                          {step.body && (
                            <div style={{ padding: "0 16px 14px 56px", fontSize: 13.5, lineHeight: 1.65, color: "#444", whiteSpace: "pre-wrap" }}>
                              {step.body}
                            </div>
                          )}
                        </div>
                      ))}
                      {!isStarted && (
                        <p style={{ textAlign: "center", color: "#B0ABA5", fontSize: 13 }}>
                          Start the activity to tick off steps
                        </p>
                      )}
                    </div>
                  ) : (
                    <pre style={{ fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>
                      {content.workflow_markdown}
                    </pre>
                  )}
                </div>
              )}

              {/* ── Quiz ─────────────────────────────────────────────────── */}
              {tab === "quiz" && (
                <div style={{ padding: 22 }}>
                  {quiz.length === 0 ? (
                    <EmptyState>No quiz added for this activity yet.</EmptyState>
                  ) : quizSubmitted ? (
                    <div style={{ textAlign: "center", padding: "32px 16px" }}>
                      <div style={{ fontSize: 56, marginBottom: 12 }}>
                        {quizScore / quiz.length >= 0.6 ? "🎉" : "💪"}
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
                        {quizScore} / {quiz.length} correct
                      </div>
                      <div style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 24, lineHeight: 1.5 }}>
                        {quizScore / quiz.length >= 0.6
                          ? "Great job! This activity is now marked complete."
                          : "Keep going — you need 60% to pass. Review the workflow and try again."}
                      </div>
                      {quizScore / quiz.length < 0.6 && (
                        <button onClick={() => { setQuizAnswers([]); setQuizSubmitted(false); }} style={primaryBtn}>
                          Try Again
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {quiz.map((q, qi) => (
                        <div key={qi} style={{ marginBottom: 24 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
                            {qi + 1}. {q.question}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {q.options.map((opt, oi) => (
                              <label key={oi} style={{
                                display: "flex", alignItems: "center", gap: 11, padding: "11px 15px",
                                border: "1.5px solid", borderRadius: 12, cursor: "pointer",
                                borderColor: quizAnswers[qi] === oi ? "#FFCE00" : "#E8E6DC",
                                background: quizAnswers[qi] === oi ? "#FFF6CF" : "white",
                                transition: ".12s",
                              }}>
                                <input type="radio" name={`q${qi}`}
                                  checked={quizAnswers[qi] === oi}
                                  onChange={() => setQuizAnswers(prev => { const n = [...prev]; n[qi] = oi; return n; })} />
                                <span style={{ fontSize: 14 }}>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={submitQuiz}
                        disabled={quizAnswers.filter(a => a !== undefined).length < quiz.length}
                        style={{ ...primaryBtn, opacity: quizAnswers.filter(a => a !== undefined).length < quiz.length ? .5 : 1 }}>
                        Submit Quiz
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar ────────────────────────────────────────────── */}
          <aside style={{ position: "sticky", top: 82, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Status / CTA */}
            <div style={sideCard}>
              {isCompleted ? (
                <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(35,206,104,.08)", border: "1px solid rgba(35,206,104,.25)", textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>🎉</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#17A855" }}>Activity completed!</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 3 }}>{activity.points} pts earned</div>
                </div>
              ) : (
                <button
                  onClick={startActivity}
                  style={{ ...primaryBtn, width: "100%", fontSize: 14 }}>
                  {isStarted ? "↻ Resume" : "▶ Start Activity"}
                </button>
              )}

              {/* Step progress bar */}
              {steps.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700, marginBottom: 6, color: "#6B6B6B" }}>
                    <span>Steps</span>
                    <span>{completedSteps.size} / {steps.length}</span>
                  </div>
                  <div style={{ height: 6, background: "#F0EEE8", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${stepPct}%`, background: "linear-gradient(90deg,#23CE68,#3696FC)", borderRadius: 999, transition: ".3s" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Goals */}
            {goals.length > 0 && (
              <div style={sideCard}>
                <SideSection icon="🎯" title="Goals">
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                    {goals.map((g, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, lineHeight: 1.45 }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,206,0,.2)", display: "grid", placeItems: "center", fontSize: 10, flexShrink: 0, marginTop: 1, fontWeight: 900, color: "#7A5F00" }}>✓</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </SideSection>
              </div>
            )}

            {/* Access you'll need */}
            {access.length > 0 && (
              <div style={sideCard}>
                <SideSection icon="🔑" title="Access you'll need">
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {access.map((a, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, lineHeight: 1.45 }}>
                        <span style={{ color: "#3696FC", fontWeight: 900, flexShrink: 0, marginTop: 2, fontSize: 11 }}>→</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </SideSection>
              </div>
            )}

            {/* Steps checklist */}
            {steps.length > 0 && (
              <div style={sideCard}>
                <SideSection icon="📋" title="Steps">
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {steps.map((step, i) => (
                      <button
                        key={i}
                        disabled={!isStarted}
                        onClick={() => isStarted && toggleStep(i)}
                        style={{
                          display: "flex", alignItems: "center", gap: 9,
                          padding: "7px 0", background: "none", border: "none",
                          cursor: isStarted ? "pointer" : "default", textAlign: "left",
                          width: "100%", borderBottom: i < steps.length - 1 ? "1px solid #F0EEE8" : "none",
                          paddingBottom: i < steps.length - 1 ? 10 : 0,
                        }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                          display: "grid", placeItems: "center",
                          background: completedSteps.has(i) ? "#23CE68" : "white",
                          border: completedSteps.has(i) ? "none" : "2px solid #D5D0C8",
                          color: completedSteps.has(i) ? "white" : "transparent",
                          fontSize: 11, fontWeight: 900, transition: ".15s",
                        }}>✓</span>
                        <span style={{
                          fontSize: 12.5, fontWeight: completedSteps.has(i) ? 600 : 500,
                          color: completedSteps.has(i) ? "#17A855" : "#221D23",
                          textDecoration: completedSteps.has(i) ? "line-through" : "none",
                          lineHeight: 1.35,
                        }}>{step.title}</span>
                      </button>
                    ))}
                  </div>
                </SideSection>
              </div>
            )}

            {/* Downloads */}
            {downloads.length > 0 && (
              <div style={sideCard}>
                <SideSection icon="📥" title="Downloads">
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {downloads.map((d, i) => (
                      <a
                        key={i}
                        href={d.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                          borderRadius: 10, border: "1px solid #E8E6DC", background: "#FAFAF8",
                          textDecoration: "none", color: "#221D23", transition: ".12s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "#FFCE00")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "#E8E6DC")}
                      >
                        <span style={{ fontSize: 18 }}>{dlIcon(d.type)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2 }}>{d.label}</div>
                          <div style={{ fontSize: 10.5, color: "#B0ABA5", textTransform: "uppercase" }}>{d.type}</div>
                        </div>
                        <span style={{ fontSize: 12, color: "#B0ABA5" }}>↓</span>
                      </a>
                    ))}
                  </div>
                </SideSection>
              </div>
            )}

            {/* Copy prompts */}
            {prompts.length > 0 && (
              <div style={sideCard}>
                <SideSection icon="💬" title="Copy prompts">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {prompts.map((p, i) => (
                      <div key={i} style={{ border: "1px solid #E8E6DC", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#FAFAF8", borderBottom: "1px solid #E8E6DC" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#221D23" }}>{p.label}</span>
                          <button
                            onClick={() => copyPrompt(p.text, i)}
                            style={{
                              border: "1px solid",
                              borderColor: copiedIdx === i ? "rgba(35,206,104,.3)" : "#E8E6DC",
                              background: copiedIdx === i ? "rgba(35,206,104,.08)" : "white",
                              color: copiedIdx === i ? "#17A855" : "#6B6B6B",
                              borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: ".15s",
                            }}>
                            {copiedIdx === i ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                        <pre style={{
                          margin: 0, padding: "10px 12px", fontSize: 11.5, fontFamily: "monospace",
                          whiteSpace: "pre-wrap", lineHeight: 1.5, color: "#444",
                          maxHeight: 120, overflow: "auto", background: "white",
                        }}>{p.text}</pre>
                      </div>
                    ))}
                  </div>
                </SideSection>
              </div>
            )}

          </aside>
        </div>
      </main>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 48, textAlign: "center", color: "#B0ABA5", background: "#FAFAF8", borderRadius: 14, fontSize: 13.5 }}>
      {children}
    </div>
  );
}

function SideSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: 13.5 }}>{title}</span>
      </div>
      {children}
    </>
  );
}

function dlIcon(type: string) {
  return ({ pdf: "📄", ppt: "📊", xlsx: "📗", doc: "📝", other: "📎" } as Record<string, string>)[type] ?? "📎";
}

// ── Style tokens ──────────────────────────────────────────────────────────────
const sideCard: React.CSSProperties = {
  background: "white", border: "1px solid #E8E6DC", borderRadius: 18,
  padding: 16, boxShadow: "0 2px 12px rgba(34,29,35,.06)",
};
const primaryBtn: React.CSSProperties = {
  padding: "11px 22px", borderRadius: 999, border: 0,
  background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 13.5,
  cursor: "pointer", display: "block",
};
const navBtn: React.CSSProperties = {
  padding: "7px 16px", borderRadius: 999, border: "1px solid #E8E6DC",
  background: "white", cursor: "pointer", fontWeight: 700, fontSize: 13,
};
