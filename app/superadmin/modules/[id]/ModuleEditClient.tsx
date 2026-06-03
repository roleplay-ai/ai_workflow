"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/Topbar";
import type {
  Profile, Module, Activity, ActivityContent, Company,
  PromptTemplate, DownloadFile,
} from "@/lib/supabase/types";

type ActivityWithContent = Activity & { activity_content: ActivityContent | null };

type Props = {
  profile: Profile & { companies: { name: string } | null };
  module: Module;
  activities: ActivityWithContent[];
  companies: Pick<Company, "id" | "name" | "domain">[];
  assignedCompanyIds: string[];
};

const TOOLS = [
  "claude","gemini","chatgpt","copilot","drive","sheets",
  "gmail","calendar","vapi","wati","lovable","napkin","ai-studio","notebooklm",
];

type ContentTab = "slides" | "workflow" | "quiz" | "goals" | "prompts" | "downloads";

const CONTENT_TABS: { id: ContentTab; label: string }[] = [
  { id: "slides",    label: "📸 Slides"     },
  { id: "workflow",  label: "📋 Workflow"    },
  { id: "quiz",      label: "✓ Quiz"        },
  { id: "goals",     label: "🎯 Goals"      },
  { id: "prompts",   label: "💬 Prompts"    },
  { id: "downloads", label: "📥 Downloads"  },
];

export default function ModuleEditClient({ profile, module: mod, activities: initActivities, companies, assignedCompanyIds: initAssigned }: Props) {
  const [activities, setActivities]   = useState(initActivities);
  const [showForm, setShowForm]       = useState(false);
  const [selected, setSelected]       = useState<ActivityWithContent | null>(null);
  const [contentTab, setContentTab]   = useState<ContentTab>("slides");
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set(initAssigned));
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignMsg, setAssignMsg]     = useState("");
  const supabase = createClient();

  // ── Activity create form ──────────────────────────────────────────────────
  const [title, setTitle]   = useState("");
  const [desc, setDesc]     = useState("");
  const [level, setLevel]   = useState<Activity["level"]>("Beginner");
  const [time, setTime]     = useState(15);
  const [points, setPoints] = useState(50);
  const [tools, setTools]   = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // ── Content editor state ─────────────────────────────────────────────────
  const [pdfFile,     setPdfFile]     = useState<File | null>(null);
  const [pdfConverting, setPdfConverting] = useState(false);
  const [pdfProgress,   setPdfProgress]   = useState("");
  const [workflow,      setWorkflow]      = useState("");
  const [workflowFile,  setWorkflowFile]  = useState<File | null>(null);
  const [quizMdFile,    setQuizMdFile]    = useState<File | null>(null);
  const [quizParsing,   setQuizParsing]   = useState(false);
  const [quizParseMsg,  setQuizParseMsg]  = useState("");
  const [quizJson,   setQuizJson]    = useState("[]");
  const [slideFiles, setSlideFiles]  = useState<FileList | null>(null);

  // goals & access
  const [goalsText,  setGoalsText]   = useState("");   // one goal per line
  const [accessText, setAccessText]  = useState("");   // one item per line

  // prompts
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [newPromptLabel, setNewPromptLabel] = useState("");
  const [newPromptText,  setNewPromptText]  = useState("");

  // downloads
  const [downloads,    setDownloads]    = useState<DownloadFile[]>([]);
  const [dlFiles,      setDlFiles]      = useState<FileList | null>(null);
  const [dlLabel,      setDlLabel]      = useState("");
  const [uploadingDl,  setUploadingDl]  = useState(false);

  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState("");

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // ── PDF → slides conversion ───────────────────────────────────────────────
  async function convertPdf() {
    if (!selected || !pdfFile) return;
    setPdfConverting(true);
    setPdfProgress(`Converting "${pdfFile.name}"…`);

    const fd = new FormData();
    fd.append("pdf", pdfFile);
    fd.append("activityId", selected.id);

    try {
      const res  = await fetch("/api/pdf-to-slides", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok || json.error) {
        setPdfProgress(`Error: ${json.error ?? "conversion failed"}`);
        return;
      }

      const newSlides: { url: string; caption: string }[] = json.slides;
      setPdfProgress(`✓ ${newSlides.length} of ${json.total} page(s) converted`);

      // Merge into selected activity content state
      const updated = {
        ...selected,
        activity_content: {
          ...(selected.activity_content ?? {}),
          slide_images: newSlides,
        } as any,
      };
      setSelected(updated);
      setActivities(prev => prev.map(a => a.id === selected.id ? updated : a));
      setPdfFile(null);
    } catch (e: any) {
      setPdfProgress(`Error: ${e?.message ?? "network error"}`);
    } finally {
      setPdfConverting(false);
    }
  }

  // ── Load workflow .md file into textarea ─────────────────────────────────
  async function loadWorkflowMd() {
    if (!workflowFile) return;
    const text = await workflowFile.text();
    setWorkflow(text);
    setWorkflowFile(null);
  }

  // ── Parse quiz .md with Claude ────────────────────────────────────────────
  async function parseQuizMd() {
    if (!quizMdFile) return;
    setQuizParsing(true);
    setQuizParseMsg("Sending to Claude…");

    const fd = new FormData();
    fd.append("file", quizMdFile);

    try {
      const res  = await fetch("/api/parse-quiz-md", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok || json.error) {
        setQuizParseMsg(`Error: ${json.error}`);
        return;
      }

      setQuizJson(JSON.stringify(json.questions, null, 2));
      setQuizParseMsg(`✓ ${json.total} question(s) extracted`);
      setQuizMdFile(null);
    } catch (e: any) {
      setQuizParseMsg(`Error: ${e?.message ?? "network error"}`);
    } finally {
      setQuizParsing(false);
    }
  }

  // ── Save company assignments ──────────────────────────────────────────────
  async function saveAssignments() {
    setAssignSaving(true); setAssignMsg("");
    // Delete existing, re-insert selected
    await supabase.from("module_companies").delete().eq("module_id", mod.id);
    if (assignedIds.size > 0) {
      const rows = Array.from(assignedIds).map(company_id => ({ module_id: mod.id, company_id }));
      await supabase.from("module_companies").insert(rows);
    }
    setAssignMsg("✓ Saved");
    setAssignSaving(false);
    setTimeout(() => setAssignMsg(""), 3000);
  }

  function toggleCompany(id: string) {
    setAssignedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Open activity for editing ─────────────────────────────────────────────
  function openContent(act: ActivityWithContent) {
    setSelected(act);
    setContentTab("slides");
    setSaveMsg("");

    const c = act.activity_content;
    setWorkflow(c?.workflow_markdown ?? "");
    setQuizJson(JSON.stringify(c?.quiz ?? [], null, 2));
    setGoalsText((c?.goals ?? []).join("\n"));
    setAccessText((c?.access_needed ?? []).join("\n"));
    setPrompts(c?.prompts ?? []);
    setDownloads(c?.downloads ?? []);
    setSlideFiles(null);
    setPdfFile(null);
    setPdfProgress("");
    setWorkflowFile(null);
    setQuizMdFile(null);
    setQuizParseMsg("");
    setDlFiles(null);
    setDlLabel("");
  }

  // ── Create activity ───────────────────────────────────────────────────────
  async function createActivity(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await supabase.from("activities").insert({
      module_id: mod.id, title, description: desc, level,
      time_estimate_minutes: time, points, tools,
      position: activities.length,
    }).select().single();
    if (!error && data) {
      const newAct: ActivityWithContent = { ...(data as any), activity_content: null };
      setActivities(prev => [...prev, newAct]);
      setTitle(""); setDesc(""); setTools([]); setShowForm(false);
    }
    setCreating(false);
  }

  async function deleteActivity(id: string) {
    if (!confirm("Delete this activity?")) return;
    await supabase.from("activities").delete().eq("id", id);
    setActivities(prev => prev.filter(a => a.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  // ── Upload slides ─────────────────────────────────────────────────────────
  async function uploadSlides(): Promise<{ url: string; caption?: string }[]> {
    if (!selected || !slideFiles?.length) return selected?.activity_content?.slide_images ?? [];
    const images: { url: string; caption?: string }[] = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const file = slideFiles[i];
      const path = `slides/${selected.id}/${Date.now()}_${i}_${file.name}`;
      const { error } = await supabase.storage.from("activity-slides").upload(path, file, { upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("activity-slides").getPublicUrl(path);
        images.push({ url: publicUrl, caption: file.name });
      }
    }
    return images;
  }

  // ── Upload a single download file ─────────────────────────────────────────
  async function uploadDownload() {
    if (!selected || !dlFiles?.length) return;
    setUploadingDl(true);
    const file = dlFiles[0];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "other";
    const typeMap: Record<string, DownloadFile["type"]> = {
      pdf: "pdf", ppt: "ppt", pptx: "ppt", xlsx: "xlsx", xls: "xlsx",
      doc: "doc", docx: "doc",
    };
    const path = `downloads/${selected.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("activity-downloads").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("activity-downloads").getPublicUrl(path);
      const newDl: DownloadFile = {
        label: dlLabel || file.name,
        url: publicUrl,
        type: typeMap[ext] ?? "other",
      };
      setDownloads(prev => [...prev, newDl]);
      setDlLabel("");
      setDlFiles(null);
    }
    setUploadingDl(false);
  }

  // ── Save all content ──────────────────────────────────────────────────────
  async function saveContent() {
    if (!selected) return;
    setSaving(true); setSaveMsg("");

    const slideImages = await uploadSlides();
    let quiz = [];
    try { quiz = JSON.parse(quizJson); } catch {}

    const payload: Omit<ActivityContent, "id"> = {
      activity_id: selected.id,
      slide_images: slideImages,
      workflow_markdown: workflow || null,
      quiz,
      goals: goalsText.split("\n").map(s => s.trim()).filter(Boolean),
      access_needed: accessText.split("\n").map(s => s.trim()).filter(Boolean),
      prompts,
      downloads,
      updated_at: new Date().toISOString(),
    };

    if (selected.activity_content) {
      await supabase.from("activity_content").update(payload).eq("activity_id", selected.id);
    } else {
      await supabase.from("activity_content").insert(payload);
    }

    const updated: ActivityWithContent = { ...selected, activity_content: { id: selected.activity_content?.id ?? "", ...payload } };
    setActivities(prev => prev.map(a => a.id === selected.id ? updated : a));
    setSelected(updated);
    setSaveMsg("✓ Saved");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  async function togglePublish() {
    await supabase.from("modules").update({ published: !mod.published }).eq("id", mod.id);
    window.location.reload();
  }

  const hasContent = (act: ActivityWithContent) => !!act.activity_content;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <Topbar profile={profile} role="superadmin" onSignOut={handleSignOut} />

      <main style={{ width: "min(1280px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: 13, color: "#6B6B6B" }}>
          <Link href="/superadmin" style={{ color: "#6B6B6B", textDecoration: "none" }}>Superadmin</Link>
          <span>/</span>
          <span style={{ color: "#221D23", fontWeight: 600 }}>{mod.title}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-.04em" }}>{mod.title}</h1>
            {mod.description && <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 13 }}>{mod.description}</p>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={togglePublish} style={{
              padding: "9px 18px", borderRadius: 999, border: "1.5px solid",
              borderColor: mod.published ? "rgba(35,206,104,.3)" : "#E8E6DC",
              background: mod.published ? "rgba(35,206,104,.08)" : "white",
              color: mod.published ? "#17A855" : "#6B6B6B",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>{mod.published ? "✓ Published" : "Draft — publish"}</button>
            <button onClick={() => setShowForm(f => !f)} style={btnAmber}>
              + Add Activity
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selected ? "380px 1fr" : "1fr", gap: 20, alignItems: "start" }}>

          {/* ── Left: activity list ───────────────────────────────────────── */}
          <div>
            {showForm && (
              <div style={{ ...card, marginBottom: 14, borderColor: "#FFCE00" }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>New Activity</div>
                <form onSubmit={createActivity} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Title" style={inp} />
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Short description" style={{ ...inp, resize: "vertical" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={lbl}>Level</label>
                      <select value={level ?? "Beginner"} onChange={e => setLevel(e.target.value as any)} style={inp}>
                        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Time (min)</label>
                      <input type="number" value={time} onChange={e => setTime(+e.target.value)} style={inp} min={1} />
                    </div>
                    <div>
                      <label style={lbl}>Points</label>
                      <input type="number" value={points} onChange={e => setPoints(+e.target.value)} style={inp} min={0} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Tools</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
                      {TOOLS.map(t => (
                        <label key={t} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11.5, cursor: "pointer" }}>
                          <input type="checkbox" checked={tools.includes(t)}
                            onChange={e => setTools(p => e.target.checked ? [...p, t] : p.filter(x => x !== t))} />
                          {t}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" disabled={creating} style={btnAmber}>{creating ? "…" : "Create"}</button>
                    <button type="button" onClick={() => setShowForm(false)} style={btnGhost}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div style={card}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Activities ({activities.length})</div>
              {activities.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: "#6B6B6B", fontSize: 13 }}>
                  No activities yet.
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {activities.map((act, i) => (
                  <div key={act.id}
                    onClick={() => openContent(act)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "11px 13px",
                      border: `1.5px solid ${selected?.id === act.id ? "#FFCE00" : "#E8E6DC"}`,
                      borderRadius: 13, background: selected?.id === act.id ? "#FFFCF0" : "#FAFAF8",
                      cursor: "pointer", transition: ".12s",
                    }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F0EEE8", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{act.title}</div>
                      <div style={{ fontSize: 11, color: "#6B6B6B", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span>{act.level}</span>
                        <span>·</span>
                        <span>{act.time_estimate_minutes}m</span>
                        <span>·</span>
                        <span>{act.points}pts</span>
                        <span style={{ marginLeft: 4, color: hasContent(act) ? "#17A855" : "#F68A29", fontWeight: 700 }}>
                          {hasContent(act) ? "✓" : "⚠"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteActivity(act.id); }}
                      style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 17, lineHeight: 1, padding: "0 2px" }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: content editor ─────────────────────────────────────── */}
          {selected && (
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{selected.title}</div>
                  <div style={{ fontSize: 11.5, color: "#6B6B6B", marginTop: 2 }}>Edit content for this activity</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {saveMsg && <span style={{ fontSize: 12.5, fontWeight: 700, color: "#17A855" }}>{saveMsg}</span>}
                  <button onClick={saveContent} disabled={saving} style={btnAmber}>
                    {saving ? "Saving…" : "Save All"}
                  </button>
                </div>
              </div>

              {/* Content tabs */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #E8E6DC" }}>
                {CONTENT_TABS.map(t => (
                  <button key={t.id} onClick={() => setContentTab(t.id)} style={{
                    padding: "7px 13px", borderRadius: 999, border: "1.5px solid",
                    borderColor: contentTab === t.id ? "#221D23" : "#E8E6DC",
                    background: contentTab === t.id ? "#221D23" : "white",
                    color: contentTab === t.id ? "white" : "#6B6B6B",
                    fontWeight: 700, fontSize: 12, cursor: "pointer",
                  }}>{t.label}</button>
                ))}
              </div>

              {/* ── Slides ──────────────────────────────────────────────────── */}
              {contentTab === "slides" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* PDF upload (primary) */}
                  <div style={{ border: "1.5px solid #E8E6DC", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px", background: "#FAFAF8", borderBottom: "1px solid #E8E6DC", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>📄</span>
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>Upload PDF</span>
                      <span style={{ fontSize: 11.5, color: "#B0ABA5" }}>Each page becomes a slide</span>
                    </div>
                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={e => { setPdfFile(e.target.files?.[0] ?? null); setPdfProgress(""); }}
                        style={{ fontSize: 13 }}
                      />
                      {pdfFile && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            onClick={convertPdf}
                            disabled={pdfConverting}
                            style={btnAmber}
                          >
                            {pdfConverting ? "Converting…" : `Convert "${pdfFile.name}"`}
                          </button>
                          {pdfProgress && (
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: pdfProgress.startsWith("✓") ? "#17A855" : pdfProgress.startsWith("Error") ? "#EF4444" : "#6B6B6B" }}>
                              {pdfProgress}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image upload (secondary) */}
                  <div style={{ border: "1.5px solid #E8E6DC", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px", background: "#FAFAF8", borderBottom: "1px solid #E8E6DC", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🖼</span>
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>Upload images directly</span>
                      <span style={{ fontSize: 11.5, color: "#B0ABA5" }}>PNG / JPG — replaces all existing</span>
                    </div>
                    <div style={{ padding: 14 }}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={e => setSlideFiles(e.target.files)}
                        style={{ fontSize: 13 }}
                      />
                    </div>
                  </div>

                  {/* Current slides preview */}
                  {selected.activity_content?.slide_images?.length ? (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 8 }}>
                        {selected.activity_content.slide_images.length} slide(s) saved
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {selected.activity_content.slide_images.map((s, i) => (
                          <div key={i} style={{ position: "relative" }}>
                            <img
                              src={s.url}
                              alt={`Slide ${i + 1}`}
                              style={{ width: 90, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #E8E6DC", display: "block" }}
                            />
                            <div style={{ position: "absolute", bottom: 3, right: 3, background: "rgba(0,0,0,.55)", color: "white", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>
                              {i + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: "center", background: "#FAFAF8", borderRadius: 12, color: "#B0ABA5", fontSize: 13 }}>
                      No slides yet — upload a PDF or images above
                    </div>
                  )}
                </div>
              )}

              {/* ── Workflow ─────────────────────────────────────────────────── */}
              {contentTab === "workflow" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Upload .md file */}
                  <div style={{ border: "1.5px solid #E8E6DC", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", background: "#FAFAF8", borderBottom: "1px solid #E8E6DC", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>📝</span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>Upload workflow .md file</span>
                    </div>
                    <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="file"
                        accept=".md,.txt"
                        onChange={e => setWorkflowFile(e.target.files?.[0] ?? null)}
                        style={{ fontSize: 13, flex: 1 }}
                      />
                      <button
                        onClick={loadWorkflowMd}
                        disabled={!workflowFile}
                        style={{ ...btnAmber, opacity: workflowFile ? 1 : .4 }}
                      >
                        Load
                      </button>
                    </div>
                  </div>

                  {/* Editable textarea */}
                  <div>
                    <label style={lbl}>
                      Workflow markdown — use{" "}
                      <code style={{ background: "#F0EEE8", padding: "1px 5px", borderRadius: 4 }}>## Step title</code>{" "}
                      to split into steps
                    </label>
                    <textarea
                      value={workflow}
                      onChange={e => setWorkflow(e.target.value)}
                      rows={16}
                      placeholder={"## Step 1: Open Gmail\nGo to mail.google.com and sign in.\n\n## Step 2: Compose\nClick Compose and fill in the recipient."}
                      style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12.5, marginTop: 6, lineHeight: 1.6 }}
                    />
                    <div style={{ fontSize: 11.5, color: "#B0ABA5", marginTop: 5 }}>
                      {workflow.split(/\n##\s+/).filter(Boolean).length} step(s) detected — each ## heading becomes a ticked step in the learner view.
                    </div>
                  </div>
                </div>
              )}

              {/* ── Quiz ─────────────────────────────────────────────────────── */}
              {contentTab === "quiz" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Upload quiz .md and auto-parse with Claude */}
                  <div style={{ border: "1.5px solid #E8E6DC", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", background: "#FAFAF8", borderBottom: "1px solid #E8E6DC", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>🤖</span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>Upload quiz .md — Claude auto-extracts questions</span>
                    </div>
                    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input
                          type="file"
                          accept=".md,.txt"
                          onChange={e => { setQuizMdFile(e.target.files?.[0] ?? null); setQuizParseMsg(""); }}
                          style={{ fontSize: 13, flex: 1 }}
                        />
                        <button
                          onClick={parseQuizMd}
                          disabled={quizParsing || !quizMdFile}
                          style={{ ...btnAmber, opacity: (!quizMdFile || quizParsing) ? .4 : 1 }}
                        >
                          {quizParsing ? "Parsing…" : "Parse with AI"}
                        </button>
                      </div>
                      {quizParseMsg && (
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: quizParseMsg.startsWith("✓") ? "#17A855" : "#EF4444" }}>
                          {quizParseMsg}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Parsed questions preview */}
                  {(() => {
                    try {
                      const questions = JSON.parse(quizJson);
                      if (!Array.isArray(questions) || questions.length === 0) return null;
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B" }}>
                            {questions.length} question(s) ready
                          </div>
                          {questions.map((q: any, i: number) => (
                            <div key={i} style={{ border: "1px solid #E8E6DC", borderRadius: 11, padding: 12 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                                {i + 1}. {q.question}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {(q.options ?? []).map((opt: string, oi: number) => (
                                  <div key={oi} style={{
                                    fontSize: 12.5, padding: "5px 10px", borderRadius: 8,
                                    background: oi === q.correct_index ? "rgba(35,206,104,.1)" : "#FAFAF8",
                                    border: `1px solid ${oi === q.correct_index ? "rgba(35,206,104,.3)" : "#E8E6DC"}`,
                                    color: oi === q.correct_index ? "#17A855" : "#444",
                                    fontWeight: oi === q.correct_index ? 700 : 400,
                                    display: "flex", alignItems: "center", gap: 6,
                                  }}>
                                    {oi === q.correct_index && <span>✓</span>}
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    } catch { return null; }
                  })()}

                  {/* Manual JSON fallback */}
                  <details>
                    <summary style={{ fontSize: 12, color: "#B0ABA5", cursor: "pointer", fontWeight: 600 }}>
                      Edit raw JSON manually
                    </summary>
                    <textarea
                      value={quizJson}
                      onChange={e => setQuizJson(e.target.value)}
                      rows={10}
                      style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 11.5, marginTop: 8 }}
                    />
                  </details>
                </div>
              )}

              {/* ── Goals & Access ───────────────────────────────────────────── */}
              {contentTab === "goals" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label style={lbl}>Goals — one per line</label>
                    <div style={{ fontSize: 11.5, color: "#B0ABA5", marginBottom: 8 }}>
                      What the learner will achieve by completing this activity.
                    </div>
                    <textarea
                      value={goalsText}
                      onChange={e => setGoalsText(e.target.value)}
                      rows={6}
                      placeholder={"Write an effective AI prompt\nReduce back-and-forth with your chatbot\nSave 30 min per day on email"}
                      style={{ ...inp, resize: "vertical" }}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Access you'll need — one per line</label>
                    <div style={{ fontSize: 11.5, color: "#B0ABA5", marginBottom: 8 }}>
                      Tools, accounts, or permissions the learner needs before starting.
                    </div>
                    <textarea
                      value={accessText}
                      onChange={e => setAccessText(e.target.value)}
                      rows={5}
                      placeholder={"Access to ChatGPT (free or Plus)\nA Gmail account\nGoogle Sheets (any plan)"}
                      style={{ ...inp, resize: "vertical" }}
                    />
                  </div>
                </div>
              )}

              {/* ── Prompts ──────────────────────────────────────────────────── */}
              {contentTab === "prompts" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {prompts.length === 0 && (
                    <div style={{ padding: 20, textAlign: "center", background: "#FAFAF8", borderRadius: 12, color: "#B0ABA5", fontSize: 13 }}>
                      No prompts added yet
                    </div>
                  )}
                  {prompts.map((p, i) => (
                    <div key={i} style={{ border: "1px solid #E8E6DC", borderRadius: 12, padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{p.label}</span>
                        <button
                          onClick={() => setPrompts(prev => prev.filter((_, j) => j !== i))}
                          style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>×</button>
                      </div>
                      <pre style={{ margin: 0, fontSize: 12, fontFamily: "monospace", whiteSpace: "pre-wrap", color: "#221D23", background: "#FAFAF8", padding: "8px 12px", borderRadius: 8 }}>
                        {p.text}
                      </pre>
                    </div>
                  ))}

                  <div style={{ border: "1.5px dashed #E8E6DC", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#6B6B6B" }}>+ Add prompt</div>
                    <input
                      value={newPromptLabel}
                      onChange={e => setNewPromptLabel(e.target.value)}
                      placeholder="Label (e.g. 'Draft email prompt')"
                      style={inp}
                    />
                    <textarea
                      value={newPromptText}
                      onChange={e => setNewPromptText(e.target.value)}
                      rows={4}
                      placeholder="Act as a professional email writer. Write a follow-up email for [meeting topic]…"
                      style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                    />
                    <button
                      onClick={() => {
                        if (!newPromptLabel.trim() || !newPromptText.trim()) return;
                        setPrompts(p => [...p, { label: newPromptLabel.trim(), text: newPromptText.trim() }]);
                        setNewPromptLabel(""); setNewPromptText("");
                      }}
                      style={btnAmber}>
                      Add Prompt
                    </button>
                  </div>
                </div>
              )}

              {/* ── Downloads ────────────────────────────────────────────────── */}
              {contentTab === "downloads" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {downloads.length === 0 && (
                    <div style={{ padding: 20, textAlign: "center", background: "#FAFAF8", borderRadius: 12, color: "#B0ABA5", fontSize: 13 }}>
                      No downloads added yet
                    </div>
                  )}
                  {downloads.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #E8E6DC", borderRadius: 12, background: "#FAFAF8" }}>
                      <span style={{ fontSize: 20 }}>{dlIcon(d.type)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{d.label}</div>
                        <div style={{ fontSize: 11, color: "#B0ABA5" }}>{d.type.toUpperCase()}</div>
                      </div>
                      <button
                        onClick={() => setDownloads(prev => prev.filter((_, j) => j !== i))}
                        style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>×</button>
                    </div>
                  ))}

                  <div style={{ border: "1.5px dashed #E8E6DC", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#6B6B6B" }}>+ Upload file</div>
                    <input
                      value={dlLabel}
                      onChange={e => setDlLabel(e.target.value)}
                      placeholder="Label (e.g. 'Prompt cheat sheet')"
                      style={inp}
                    />
                    <input type="file" accept=".pdf,.ppt,.pptx,.xlsx,.xls,.doc,.docx"
                      onChange={e => setDlFiles(e.target.files)}
                      style={{ fontSize: 13 }} />
                    <button onClick={uploadDownload} disabled={uploadingDl || !dlFiles?.length} style={btnAmber}>
                      {uploadingDl ? "Uploading…" : "Upload & Add"}
                    </button>
                    <div style={{ fontSize: 11, color: "#B0ABA5" }}>Click "Save All" after adding all files to persist changes.</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Company assignment panel ──────────────────────────────────── */}
        <div style={{ ...card, marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Assign to Companies</div>
              <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 3 }}>
                {assignedIds.size === 0
                  ? "No companies selected — module is visible to everyone once published."
                  : `Visible to ${assignedIds.size} selected company${assignedIds.size > 1 ? "ies" : ""} only.`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {assignMsg && <span style={{ fontSize: 12.5, fontWeight: 700, color: "#17A855" }}>{assignMsg}</span>}
              <button onClick={saveAssignments} disabled={assignSaving} style={btnAmber}>
                {assignSaving ? "Saving…" : "Save Assignments"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {companies.map(co => {
              const selected = assignedIds.has(co.id);
              return (
                <button
                  key={co.id}
                  onClick={() => toggleCompany(co.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                    border: "1.5px solid",
                    borderColor: selected ? "#FFCE00" : "#E8E6DC",
                    background: selected ? "#FFF6CF" : "white",
                    fontWeight: 700, fontSize: 13, transition: ".12s",
                  }}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: "50%", display: "grid", placeItems: "center",
                    background: selected ? "#FFCE00" : "#F0EEE8",
                    fontSize: 10, fontWeight: 900, color: selected ? "#221D23" : "#B0ABA5",
                    flexShrink: 0, transition: ".12s",
                  }}>{selected ? "✓" : ""}</span>
                  <span>{co.name}</span>
                  {co.domain && <span style={{ fontSize: 11, color: "#B0ABA5", fontWeight: 500 }}>{co.domain}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function dlIcon(type: DownloadFile["type"]) {
  return { pdf: "📄", ppt: "📊", xlsx: "📗", doc: "📝", other: "📎" }[type] ?? "📎";
}

// ── Shared style tokens ─────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "white", border: "1px solid #E8E6DC", borderRadius: 20,
  padding: 20, boxShadow: "0 2px 12px rgba(34,29,35,.07)",
};
const inp: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E8E6DC",
  fontSize: 13.5, outline: "none", width: "100%", boxSizing: "border-box",
  fontFamily: "inherit", background: "#FAFAF8",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 11.5, fontWeight: 700, color: "#6B6B6B", marginBottom: 4,
};
const btnAmber: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 999, border: 0,
  background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 13,
  cursor: "pointer", whiteSpace: "nowrap",
};
const btnGhost: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 999, border: "1.5px solid #E8E6DC",
  background: "white", color: "#6B6B6B", fontWeight: 700, fontSize: 13, cursor: "pointer",
};
