"use client";

import { useRef, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { TOTAL_MODULES } from "@/lib/ai-mastery-course";

type Props = {
  completedModules: string[];
};

export default function AIMasteryClient({ completedModules: initial }: Props) {
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
      {/* Top bar */}
      <header style={{
        height: 60, flexShrink: 0, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 20px",
        background: "rgba(255,255,255,.96)", borderBottom: "1px solid #E8DFD2",
        backdropFilter: "blur(18px)", zIndex: 10, gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              height: 32, padding: "0 14px", borderRadius: 999,
              fontSize: 13, fontWeight: 700, color: "#221D23",
              background: "#FFCE00", border: "1px solid #d4a900",
              textDecoration: "none", flexShrink: 0,
            }}
          >
            ← Dashboard
          </Link>
          <span style={{
            fontSize: 15, fontWeight: 900, letterSpacing: "-.03em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            AI Mastery Course
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {saving && (
            <span style={{ fontSize: 12, color: "#746F78" }}>Saving…</span>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: "#221D23", whiteSpace: "nowrap" }}>
            {completed.length} / {TOTAL_MODULES}
          </span>
          <div style={{
            width: 96, height: 8, background: "#E8DFD2", borderRadius: 999, overflow: "hidden",
          }}>
            <div style={{
              width: `${pct}%`, height: "100%", background: "#FFCE00",
              borderRadius: 999, transition: "width .4s ease",
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#623CEA", minWidth: 34 }}>
            {pct}%
          </span>
        </div>
      </header>

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
