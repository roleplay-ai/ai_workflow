"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import ModulePlayer, { type ModuleData } from "../ModulePlayer";
import "../ai-fluency.css";

type FluencyModule = {
  id: string; title: string; emoji: string; concepts: string[];
  sort_order: number; is_locked: boolean; next_module_hint: string | null;
};
type World = { id: string; title: string; emoji: string; color: string; fluency_modules: FluencyModule[] };
type Props = {
  worlds: World[];
  completedModuleIds: string[];
  userName: string | null;
  isAdmin: boolean;
};

export default function FoundationsClient({ worlds, completedModuleIds, userName, isAdmin }: Props) {
  const [openWorldId, setOpenWorldId] = useState<string | null>(worlds[0]?.id ?? null);
  const [completedIds, setCompletedIds] = useState<string[]>(completedModuleIds);
  const [openModule, setOpenModule] = useState<ModuleData | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleModuleClick(mod: FluencyModule) {
    if (mod.is_locked) return;
    setLoadingId(mod.id);
    try {
      const res = await fetch(`/api/fluency/module/${mod.id}`);
      const data = await res.json() as ModuleData;
      setOpenModule(data);
    } finally {
      setLoadingId(null);
    }
  }

  function handleComplete(moduleId: string) {
    setCompletedIds(ids => ids.includes(moduleId) ? ids : [...ids, moduleId]);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#FEFCFA", color: "#221D23",
      fontFamily: '"Visby CF", Inter, system-ui, -apple-system, sans-serif',
      letterSpacing: "-.01em",
    }}>
      <AppNav activePage="ai-fluency" userName={userName} isAdmin={isAdmin} />

      <main style={{ width: "min(780px,calc(100% - 56px))", margin: "34px auto 80px" }}>

        {/* Back + header */}
        <div style={{ marginBottom: 36 }}>
          <a
            href="/ai-fluency"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 18,
              fontSize: 13, fontWeight: 750, color: "#6B6670", textDecoration: "none",
            }}
          >← Back to AI Fluency</a>

          <div style={{ position: "relative", paddingLeft: 22 }}>
            <div style={{
              position: "absolute", left: 0, top: "4px", bottom: "4px", width: 5,
              background: "#221D23", borderRadius: 999,
            }} />
            <span style={{
              fontSize: 12, fontWeight: 800, letterSpacing: ".1em",
              textTransform: "uppercase", color: "#221D23",
            }}>Learn</span>
            <h1 style={{
              margin: "4px 0 0", fontSize: 34, lineHeight: 1.03,
              fontWeight: 950, letterSpacing: "-.055em",
            }}>AI Foundations</h1>
            <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>
              Short explainers that build practical AI fluency, world by world.
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div style={{
          display: "flex", gap: 24, marginBottom: 32,
          padding: "14px 20px", background: "#fff",
          border: "1px solid rgba(34,29,35,.08)", borderRadius: 14,
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: "-.05em" }}>
              {worlds.length}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9199", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Worlds
            </div>
          </div>
          <div style={{ width: 1, background: "rgba(34,29,35,.08)" }} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: "-.05em" }}>
              {worlds.reduce((n, w) => n + w.fluency_modules.length, 0)}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9199", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Modules
            </div>
          </div>
          <div style={{ width: 1, background: "rgba(34,29,35,.08)" }} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: "-.05em" }}>
              {completedIds.length}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9199", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Completed
            </div>
          </div>
        </div>

        {/* Accordion */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {worlds.map((world) => {
            const isOpen = openWorldId === world.id;
            const total = world.fluency_modules.length;
            const doneCount = world.fluency_modules.filter(m => completedIds.includes(m.id)).length;

            return (
              <div
                key={world.id}
                style={{
                  background: "#fff",
                  border: "1px solid rgba(34,29,35,.08)",
                  borderLeft: `4px solid ${world.color}`,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: isOpen ? "0 4px 20px rgba(0,0,0,.07)" : "0 1px 6px rgba(0,0,0,.04)",
                  transition: "box-shadow .2s",
                }}
              >
                {/* World header */}
                <button
                  onClick={() => setOpenWorldId(isOpen ? null : world.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14,
                    padding: "18px 20px", background: "none", border: "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  {/* Emoji box */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: `${world.color}18`,
                    border: `1.5px solid ${world.color}35`,
                    display: "grid", placeItems: "center", fontSize: 26,
                  }}>
                    {world.emoji}
                  </div>

                  {/* Title + badges */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-.03em", color: "#221D23" }}>
                        {world.title}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
                        background: `${world.color}18`, color: world.color,
                        border: `1px solid ${world.color}35`,
                      }}>
                        {total} module{total !== 1 ? "s" : ""}
                      </span>
                      {doneCount > 0 && (
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
                          background: "#F0FFF4", color: "#16a34a", border: "1px solid #BBF7D0",
                        }}>
                          {doneCount}/{total} done
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <span style={{
                    fontSize: 22, fontWeight: 900, color: world.color,
                    transform: isOpen ? "rotate(90deg)" : "none",
                    transition: "transform .2s", flexShrink: 0, lineHeight: 1,
                  }}>›</span>
                </button>

                {/* Expanded module list */}
                {isOpen && (
                  <div style={{
                    borderTop: `1px solid ${world.color}25`,
                    padding: "8px 20px 16px",
                    background: `${world.color}06`,
                  }}>
                    <div style={{ display: "grid", gap: 2 }}>
                      {world.fluency_modules.map((mod, i) => {
                        const done = completedIds.includes(mod.id);
                        const loading = loadingId === mod.id;

                        return (
                          <button
                            key={mod.id}
                            onClick={() => handleModuleClick(mod)}
                            disabled={mod.is_locked || loading}
                            style={{
                              width: "100%", display: "grid",
                              gridTemplateColumns: "32px 1fr 20px", gap: 12, alignItems: "center",
                              padding: "11px 8px", borderRadius: 12,
                              background: "none", border: "none",
                              cursor: mod.is_locked ? "not-allowed" : "pointer",
                              textAlign: "left", transition: "background .12s ease",
                            }}
                            onMouseEnter={e => {
                              if (!mod.is_locked) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.90)";
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = "none";
                            }}
                          >
                            {/* Number / done / lock badge */}
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                              display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900,
                              ...(done
                                ? { background: "rgba(34,197,94,.12)", border: "1.5px solid rgba(34,197,94,.35)", color: "#16a34a" }
                                : mod.is_locked
                                ? { background: "rgba(34,29,35,.07)", border: "1.5px solid rgba(34,29,35,.12)", color: "#9e8e7a" }
                                : { background: `${world.color}18`, border: `1.5px solid ${world.color}35`, color: world.color }
                              ),
                            }}>
                              {done ? "✓" : mod.is_locked ? "🔒" : i + 1}
                            </div>

                            {/* Title + concepts */}
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{
                                  fontSize: 14, fontWeight: 800, lineHeight: 1.3,
                                  color: mod.is_locked ? "#9B9199" : "#221D23",
                                }}>{mod.title}</span>
                                {done && (
                                  <span style={{
                                    fontSize: 9, fontWeight: 900, letterSpacing: ".06em",
                                    padding: "2px 6px", borderRadius: 999,
                                    background: "#F0FFF4", color: "#16a34a", border: "1px solid #BBF7D0",
                                  }}>DONE</span>
                                )}
                              </div>
                              {mod.concepts.length > 0 && (
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 5 }}>
                                  {mod.concepts.slice(0, 3).map(c => (
                                    <span key={c} style={{
                                      fontSize: 10, color: "#6B6670",
                                      background: "rgba(34,29,35,.05)",
                                      padding: "2px 7px", borderRadius: 6,
                                    }}>{c}</span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Arrow / spinner */}
                            <span style={{
                              fontSize: 18, fontWeight: 900,
                              color: loading ? world.color : mod.is_locked ? "rgba(34,29,35,.20)" : "rgba(34,29,35,.35)",
                            }}>{loading ? "…" : "›"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {openModule && (
        <ModulePlayer
          module={openModule}
          isCompleted={completedIds.includes(openModule.id)}
          onClose={() => setOpenModule(null)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
