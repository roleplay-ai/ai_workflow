"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { recordFluencyView } from "@/lib/fluencyViews";
import ModulePlayer, { type ModuleData } from "../ModulePlayer";
import ModuleHtmlModal from "../ModuleHtmlModal";
import FoundationModuleCard, { MODULE_CARD_COLORS, type FoundationModule } from "../FoundationModuleCard";

type Props = {
  modules: FoundationModule[];
  completedModuleIds: string[];
  userName: string | null;
  isAdmin: boolean;
};

export default function FoundationsClient({ modules, completedModuleIds, userName, isAdmin }: Props) {
  const [completedIds, setCompletedIds] = useState<string[]>(completedModuleIds);
  const [openModule, setOpenModule] = useState<ModuleData | null>(null);
  const [htmlModule, setHtmlModule] = useState<FoundationModule | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleModuleClick(mod: FoundationModule) {
    if (mod.is_locked) return;
    recordFluencyView("module", mod.id);

    if (mod.html_path) {
      setHtmlModule(mod);
      return;
    }

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
    <>
      <AppNav activePage="know" userName={userName} isAdmin={isAdmin} />

      <main style={{ width: "min(1280px,calc(100% - 72px))", margin: "34px auto 80px" }}>

        <div style={{ marginBottom: 36 }}>
          <a
            href="/know"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 18,
              fontSize: 13, fontWeight: 750, color: "#6B6670", textDecoration: "none",
            }}
          >← Back to Know</a>

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
              Short explainers that build practical AI fluency.
            </p>
          </div>
        </div>

        <div style={{
          display: "flex", gap: 24, marginBottom: 32,
          padding: "14px 20px", background: "#fff",
          border: "1px solid rgba(34,29,35,.08)", borderRadius: 14,
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: "-.05em" }}>
              {modules.length}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9199", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Topics
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

        <div className="aif-foundation-grid">
          {modules.map((mod, i) => (
            <FoundationModuleCard
              key={mod.id}
              module={mod}
              accentColor={MODULE_CARD_COLORS[i % MODULE_CARD_COLORS.length]}
              done={completedIds.includes(mod.id)}
              disabled={mod.is_locked || loadingId === mod.id}
              onClick={() => handleModuleClick(mod)}
            />
          ))}
        </div>
      </main>

      {htmlModule && (
        <ModuleHtmlModal
          moduleId={htmlModule.id}
          moduleTitle={htmlModule.title}
          moduleEmoji={htmlModule.emoji}
          onClose={() => setHtmlModule(null)}
        />
      )}

      {openModule && (
        <ModulePlayer
          module={openModule}
          isCompleted={completedIds.includes(openModule.id)}
          onClose={() => setOpenModule(null)}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
