"use client";

import { useRef, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { TOTAL_MODULES } from "@/lib/ai-mastery-course";
import AppNav from "@/components/AppNav";

type Props = {
  completedModules: string[];
  userName?:        string | null;
  isAdmin?:         boolean;
};

export default function AIMasteryClient({ completedModules: initial, userName, isAdmin }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [completed, setCompleted] = useState<string[]>(initial);
  const [saving, startSave] = useTransition();

  // Track the previous set of completions so we only save truly new ones
  const prevCompletedRef = useRef<Set<string>>(new Set(initial));

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type !== "ai-mastery-progress") return;
      const incoming: string[] = e.data.completedModules ?? [];

      // Diff: find IDs that are new (present in incoming, absent in prev)
      const added = incoming.filter(id => !prevCompletedRef.current.has(id));
      // Diff: find IDs that were removed (toggle off)
      const removed = [...prevCompletedRef.current].filter(id => !incoming.includes(id));

      // Update local state immediately for the header progress bar
      setCompleted(incoming);
      prevCompletedRef.current = new Set(incoming);

      // Persist changes to Supabase
      startSave(async () => {
        await Promise.all([
          ...added.map(id =>
            fetch("/api/ai-mastery/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleId: id }),
            })
          ),
          ...removed.map(id =>
            fetch("/api/ai-mastery/progress", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleId: id }),
            })
          ),
        ]);
      });
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const pct = Math.round((completed.length / TOTAL_MODULES) * 100);

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    }}>
      <AppNav activePage="ai-mastery" userName={userName} isAdmin={isAdmin} />

      {/* Progress bar */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 36px", height: 44, background: "#fff", borderBottom: "1px solid #E8DFD2",
        gap: 16,
      }}>
        <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: "-.03em" }}>
          AI Mastery Course
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saving && <span style={{ fontSize: 12, color: "#746F78" }}>Saving…</span>}
          <span style={{ fontSize: 13, fontWeight: 700, color: "#221D23", whiteSpace: "nowrap" }}>
            {completed.length} / {TOTAL_MODULES}
          </span>
          <div style={{ width: 96, height: 8, background: "#E8DFD2", borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, height: "100%", background: "#FFCE00",
              borderRadius: 999, transition: "width .4s ease",
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#623CEA", minWidth: 34 }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Course iframe */}
      <iframe
        ref={iframeRef}
        title="AI Mastery Course"
        src="/api/ai-mastery/content"
        style={{ flex: 1, width: "100%", border: 0, background: "#FEFCFA" }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}
