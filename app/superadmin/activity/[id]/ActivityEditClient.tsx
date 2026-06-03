"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import type { Profile, Activity, ActivityContent, PromptTemplate, DownloadFile } from "@/lib/supabase/types";

type Props = {
  profile: Profile & { companies: { name: string } | null };
  activity: Activity & { activity_content: ActivityContent | null };
};

type Tab = "slides" | "workflow" | "quiz" | "goals" | "prompts" | "downloads";
const TABS: { id: Tab; label: string }[] = [
  { id: "slides",    label: "📸 Slides"    },
  { id: "workflow",  label: "📋 Workflow"  },
  { id: "quiz",      label: "✓ Quiz"      },
  { id: "goals",     label: "🎯 Goals"    },
  { id: "prompts",   label: "💬 Prompts"  },
  { id: "downloads", label: "📥 Downloads"},
];

export default function ActivityEditClient({ profile, activity }: Props) {
  const supabase   = createClient();
  const content    = activity.activity_content;
  const [tab, setTab] = useState<Tab>("slides");
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Slides
  const [slideFiles,    setSlideFiles]    = useState<FileList | null>(null);
  const [pdfFile,       setPdfFile]       = useState<File | null>(null);
  const [pdfConverting, setPdfConverting] = useState(false);
  const [pdfProgress,   setPdfProgress]   = useState("");
  const [savedSlides,   setSavedSlides]   = useState<ActivityContent["slide_images"]>(content?.slide_images ?? []);

  // Workflow
  const [workflow,     setWorkflow]     = useState(content?.workflow_markdown ?? "");
  const [workflowFile, setWorkflowFile] = useState<File | null>(null);

  // Quiz
  const [quizJson,    setQuizJson]    = useState(JSON.stringify(content?.quiz ?? [], null, 2));
  const [quizMdFile,  setQuizMdFile]  = useState<File | null>(null);
  const [quizParsing, setQuizParsing] = useState(false);
  const [quizMsg,     setQuizMsg]     = useState("");

  // Goals & Access
  const [goalsText,  setGoalsText]  = useState((content?.goals ?? []).join("\n"));
  const [accessText, setAccessText] = useState((content?.access_needed ?? []).join("\n"));

  // Prompts
  const [prompts,         setPrompts]         = useState<PromptTemplate[]>(content?.prompts ?? []);
  const [newPromptLabel,  setNewPromptLabel]  = useState("");
  const [newPromptText,   setNewPromptText]   = useState("");

  // Downloads
  const [downloads,   setDownloads]   = useState<DownloadFile[]>(content?.downloads ?? []);
  const [dlFile,      setDlFile]      = useState<File | null>(null);
  const [dlLabel,     setDlLabel]     = useState("");
  const [uploadingDl, setUploadingDl] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // ── PDF → slides ─────────────────────────────────────────────────────────
  async function convertPdf() {
    if (!pdfFile) return;
    setPdfConverting(true); setPdfProgress(`Converting "${pdfFile.name}"…`);
    const fd = new FormData();
    fd.append("pdf", pdfFile);
    fd.append("activityId", activity.id);
    try {
      const res  = await fetch("/api/pdf-to-slides", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || json.error) { setPdfProgress(`Error: ${json.error}`); return; }
      setSavedSlides(json.slides);
      setPdfProgress(`✓ ${json.slides.length} of ${json.total} page(s) converted`);
      setPdfFile(null);
    } catch (e: any) {
      setPdfProgress(`Error: ${e?.message}`);
    } finally { setPdfConverting(false); }
  }

  // ── Upload images ─────────────────────────────────────────────────────────
  async function uploadImages(): Promise<ActivityContent["slide_images"]> {
    if (!slideFiles?.length) return savedSlides;
    const imgs: ActivityContent["slide_images"] = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const f = slideFiles[i];
      const path = `slides/${activity.id}/${Date.now()}_${i}_${f.name}`;
      const { error } = await supabase.storage.from("activity-slides").upload(path, f, { upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("activity-slides").getPublicUrl(path);
        imgs.push({ url: publicUrl, caption: f.name });
      }
    }
    setSavedSlides(imgs);
    return imgs;
  }

  // ── Load workflow .md ────────────────────────────────────────────────────
  async function loadWorkflowMd() {
    if (!workflowFile) return;
    setWorkflow(await workflowFile.text());
    setWorkflowFile(null);
  }

  // ── Parse quiz .md with Claude ────────────────────────────────────────────
  async function parseQuizMd() {
    if (!quizMdFile) return;
    setQuizParsing(true); setQuizMsg("Sending to Claude…");
    const fd = new FormData();
    fd.append("file", quizMdFile);
    try {
      const res  = await fetch("/api/parse-quiz-md", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || json.error) { setQuizMsg(`Error: ${json.error}`); return; }
      setQuizJson(JSON.stringify(json.questions, null, 2));
      setQuizMsg(`✓ ${json.total} question(s) extracted`);
      setQuizMdFile(null);
    } catch (e: any) {
      setQuizMsg(`Error: ${e?.message}`);
    } finally { setQuizParsing(false); }
  }

  // ── Upload download file ─────────────────────────────────────────────────
  async function uploadDownload() {
    if (!dlFile) return;
    setUploadingDl(true);
    const ext = dlFile.name.split(".").pop()?.toLowerCase() ?? "other";
    const typeMap: Record<string, DownloadFile["type"]> = { pdf:"pdf",ppt:"ppt",pptx:"ppt",xlsx:"xlsx",xls:"xlsx",doc:"doc",docx:"doc" };
    const path = `downloads/${activity.id}/${Date.now()}_${dlFile.name}`;
    const { error } = await supabase.storage.from("activity-downloads").upload(path, dlFile, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("activity-downloads").getPublicUrl(path);
      setDownloads(prev => [...prev, { label: dlLabel || dlFile.name, url: publicUrl, type: typeMap[ext] ?? "other" }]);
      setDlLabel(""); setDlFile(null);
    }
    setUploadingDl(false);
  }

  // ── Save all ──────────────────────────────────────────────────────────────
  async function saveAll() {
    setSaving(true); setSaveMsg("");
    const slides = await uploadImages();
    let quiz = [];
    try { quiz = JSON.parse(quizJson); } catch {}

    const payload = {
      activity_id:      activity.id,
      slide_images:     slides,
      workflow_markdown: workflow || null,
      quiz,
      goals:            goalsText.split("\n").map(s => s.trim()).filter(Boolean),
      access_needed:    accessText.split("\n").map(s => s.trim()).filter(Boolean),
      prompts,
      downloads,
      updated_at:       new Date().toISOString(),
    };

    if (content) {
      await supabase.from("activity_content").update(payload).eq("activity_id", activity.id);
    } else {
      await supabase.from("activity_content").insert(payload);
    }

    setSaveMsg("✓ Saved");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  const stepCount = workflow.split(/\n##\s+/).filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <Topbar profile={profile} role="superadmin" onSignOut={handleSignOut} />

      <main style={{ width: "min(960px,calc(100% - 48px))", margin: "0 auto", padding: "26px 0 60px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: 13, color: "#6B6B6B" }}>
          <Link href="/superadmin" style={{ color: "#6B6B6B", textDecoration: "none" }}>Superadmin</Link>
          <span>/</span>
          <span style={{ color: "#221D23", fontWeight: 600 }}>{activity.title}</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: "-.04em" }}>{activity.title}</h1>
            <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 13 }}>
              {activity.level} · {activity.time_estimate_minutes}m · {activity.points}pts
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saveMsg && <span style={{ fontSize: 13, fontWeight: 700, color: "#17A855" }}>{saveMsg}</span>}
            <button onClick={saveAll} disabled={saving} style={btnAmber}>
              {saving ? "Saving…" : "Save All"}
            </button>
          </div>
        </div>

        {/* Content card */}
        <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(34,29,35,.07)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid #E8E6DC" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "7px 14px", borderRadius: 999, border: "1.5px solid",
                borderColor: tab === t.id ? "#221D23" : "#E8E6DC",
                background: tab === t.id ? "#221D23" : "white",
                color: tab === t.id ? "white" : "#6B6B6B",
                fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>{t.label}</button>
            ))}
          </div>

          {/* ── Slides ──────────────────────────────────────────────────────── */}
          {tab === "slides" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* PDF */}
              <div style={sectionBox}>
                <div style={sectionHead}><span>📄</span><b>Upload PDF</b><span style={{ color: "#B0ABA5", fontWeight: 400, fontSize: 12 }}>Each page becomes a slide</span></div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <input type="file" accept=".pdf" onChange={e => { setPdfFile(e.target.files?.[0] ?? null); setPdfProgress(""); }} style={{ fontSize: 13 }} />
                  {pdfFile && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={convertPdf} disabled={pdfConverting} style={btnAmber}>
                        {pdfConverting ? "Converting…" : `Convert "${pdfFile.name}"`}
                      </button>
                      {pdfProgress && <span style={{ fontSize: 12.5, fontWeight: 700, color: pdfProgress.startsWith("✓") ? "#17A855" : "#EF4444" }}>{pdfProgress}</span>}
                    </div>
                  )}
                </div>
              </div>
              {/* Images */}
              <div style={sectionBox}>
                <div style={sectionHead}><span>🖼</span><b>Upload images directly</b><span style={{ color: "#B0ABA5", fontWeight: 400, fontSize: 12 }}>PNG/JPG — replaces all</span></div>
                <div style={{ padding: 14 }}>
                  <input type="file" accept="image/*" multiple onChange={e => setSlideFiles(e.target.files)} style={{ fontSize: 13 }} />
                </div>
              </div>
              {/* Preview */}
              {savedSlides.length > 0 ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 8 }}>{savedSlides.length} slide(s) saved</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {savedSlides.map((s, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={s.url} alt={`Slide ${i+1}`} style={{ width: 90, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #E8E6DC" }} />
                        <div style={{ position: "absolute", bottom: 3, right: 3, background: "rgba(0,0,0,.55)", color: "white", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>{i+1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={emptyState}>No slides yet — upload a PDF or images above, then Save All</div>
              )}
            </div>
          )}

          {/* ── Workflow ──────────────────────────────────────────────────────── */}
          {tab === "workflow" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={sectionBox}>
                <div style={sectionHead}><span>📝</span><b>Upload workflow .md file</b></div>
                <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="file" accept=".md,.txt" onChange={e => setWorkflowFile(e.target.files?.[0] ?? null)} style={{ fontSize: 13, flex: 1 }} />
                  <button onClick={loadWorkflowMd} disabled={!workflowFile} style={{ ...btnAmber, opacity: workflowFile ? 1 : .4 }}>Load</button>
                </div>
              </div>
              <div>
                <label style={lbl}>Workflow markdown — use <code style={{ background: "#F0EEE8", padding: "1px 5px", borderRadius: 4 }}>## Step title</code> headings</label>
                <textarea value={workflow} onChange={e => setWorkflow(e.target.value)} rows={18}
                  placeholder={"## Step 1: Open Gmail\nGo to mail.google.com and sign in.\n\n## Step 2: Compose\nClick Compose."}
                  style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12.5, marginTop: 6, lineHeight: 1.6 }} />
                <div style={{ fontSize: 11.5, color: "#B0ABA5", marginTop: 5 }}>
                  {stepCount} step(s) detected — each ## heading becomes a step in the learner view
                </div>
              </div>
            </div>
          )}

          {/* ── Quiz ──────────────────────────────────────────────────────────── */}
          {tab === "quiz" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={sectionBox}>
                <div style={sectionHead}><span>🤖</span><b>Upload quiz .md — Claude auto-extracts questions</b></div>
                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="file" accept=".md,.txt" onChange={e => { setQuizMdFile(e.target.files?.[0] ?? null); setQuizMsg(""); }} style={{ fontSize: 13, flex: 1 }} />
                    <button onClick={parseQuizMd} disabled={quizParsing || !quizMdFile} style={{ ...btnAmber, opacity: (!quizMdFile || quizParsing) ? .4 : 1 }}>
                      {quizParsing ? "Parsing…" : "Parse with AI"}
                    </button>
                  </div>
                  {quizMsg && <div style={{ fontSize: 12.5, fontWeight: 700, color: quizMsg.startsWith("✓") ? "#17A855" : "#EF4444" }}>{quizMsg}</div>}
                </div>
              </div>
              {/* Preview */}
              {(() => {
                try {
                  const qs = JSON.parse(quizJson);
                  if (!Array.isArray(qs) || !qs.length) return null;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B" }}>{qs.length} question(s) ready</div>
                      {qs.map((q: any, i: number) => (
                        <div key={i} style={{ border: "1px solid #E8E6DC", borderRadius: 11, padding: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{i+1}. {q.question}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {(q.options ?? []).map((opt: string, oi: number) => (
                              <div key={oi} style={{ fontSize: 12.5, padding: "5px 10px", borderRadius: 8,
                                background: oi === q.correct_index ? "rgba(35,206,104,.1)" : "#FAFAF8",
                                border: `1px solid ${oi === q.correct_index ? "rgba(35,206,104,.3)" : "#E8E6DC"}`,
                                color: oi === q.correct_index ? "#17A855" : "#444",
                                fontWeight: oi === q.correct_index ? 700 : 400,
                                display: "flex", alignItems: "center", gap: 6 }}>
                                {oi === q.correct_index && <span>✓</span>}{opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } catch { return null; }
              })()}
              <details>
                <summary style={{ fontSize: 12, color: "#B0ABA5", cursor: "pointer", fontWeight: 600 }}>Edit raw JSON manually</summary>
                <textarea value={quizJson} onChange={e => setQuizJson(e.target.value)} rows={10}
                  style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 11.5, marginTop: 8 }} />
              </details>
            </div>
          )}

          {/* ── Goals & Access ─────────────────────────────────────────────────── */}
          {tab === "goals" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={lbl}>Goals — one per line (shown in learner sidebar)</label>
                <textarea value={goalsText} onChange={e => setGoalsText(e.target.value)} rows={6}
                  placeholder={"Write an effective AI prompt\nReduce back-and-forth with your chatbot"}
                  style={{ ...inp, resize: "vertical", marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>Access you'll need — one per line</label>
                <textarea value={accessText} onChange={e => setAccessText(e.target.value)} rows={5}
                  placeholder={"ChatGPT (free or Plus)\nA Gmail account"}
                  style={{ ...inp, resize: "vertical", marginTop: 6 }} />
              </div>
            </div>
          )}

          {/* ── Prompts ───────────────────────────────────────────────────────── */}
          {tab === "prompts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {prompts.length === 0 && <div style={emptyState}>No prompts yet</div>}
              {prompts.map((p, i) => (
                <div key={i} style={{ border: "1px solid #E8E6DC", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#FAFAF8", borderBottom: "1px solid #E8E6DC" }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{p.label}</span>
                    <button onClick={() => setPrompts(prev => prev.filter((_, j) => j !== i))} style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>×</button>
                  </div>
                  <pre style={{ margin: 0, padding: "10px 12px", fontSize: 12, fontFamily: "monospace", whiteSpace: "pre-wrap", background: "white" }}>{p.text}</pre>
                </div>
              ))}
              <div style={{ border: "1.5px dashed #E8E6DC", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#6B6B6B" }}>+ Add prompt</div>
                <input value={newPromptLabel} onChange={e => setNewPromptLabel(e.target.value)} placeholder="Label (e.g. 'Draft email prompt')" style={inp} />
                <textarea value={newPromptText} onChange={e => setNewPromptText(e.target.value)} rows={4}
                  placeholder="Act as a professional email writer…" style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
                <button onClick={() => { if (!newPromptLabel.trim() || !newPromptText.trim()) return; setPrompts(p => [...p, { label: newPromptLabel.trim(), text: newPromptText.trim() }]); setNewPromptLabel(""); setNewPromptText(""); }} style={btnAmber}>Add Prompt</button>
              </div>
            </div>
          )}

          {/* ── Downloads ─────────────────────────────────────────────────────── */}
          {tab === "downloads" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {downloads.length === 0 && <div style={emptyState}>No downloads yet</div>}
              {downloads.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #E8E6DC", borderRadius: 12, background: "#FAFAF8" }}>
                  <span style={{ fontSize: 20 }}>{dlIcon(d.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{d.label}</div>
                    <div style={{ fontSize: 11, color: "#B0ABA5" }}>{d.type.toUpperCase()}</div>
                  </div>
                  <button onClick={() => setDownloads(prev => prev.filter((_, j) => j !== i))} style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
              ))}
              <div style={{ border: "1.5px dashed #E8E6DC", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#6B6B6B" }}>+ Upload file</div>
                <input value={dlLabel} onChange={e => setDlLabel(e.target.value)} placeholder="Label (e.g. 'Prompt cheat sheet')" style={inp} />
                <input type="file" accept=".pdf,.ppt,.pptx,.xlsx,.xls,.doc,.docx" onChange={e => setDlFile(e.target.files?.[0] ?? null)} style={{ fontSize: 13 }} />
                <button onClick={uploadDownload} disabled={uploadingDl || !dlFile} style={{ ...btnAmber, opacity: (!dlFile || uploadingDl) ? .4 : 1 }}>
                  {uploadingDl ? "Uploading…" : "Upload & Add"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function dlIcon(type: string) {
  return ({ pdf:"📄",ppt:"📊",xlsx:"📗",doc:"📝",other:"📎" } as Record<string,string>)[type] ?? "📎";
}

const sectionBox: React.CSSProperties = { border: "1.5px solid #E8E6DC", borderRadius: 12, overflow: "hidden" };
const sectionHead: React.CSSProperties = { padding: "10px 14px", background: "#FAFAF8", borderBottom: "1px solid #E8E6DC", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 };
const emptyState: React.CSSProperties = { padding: 24, textAlign: "center", background: "#FAFAF8", borderRadius: 12, color: "#B0ABA5", fontSize: 13 };
const inp: React.CSSProperties = { padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E8E6DC", fontSize: 13.5, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", background: "#FAFAF8" };
const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, color: "#6B6B6B" };
const btnAmber: React.CSSProperties = { padding: "9px 18px", borderRadius: 999, border: 0, background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" };
