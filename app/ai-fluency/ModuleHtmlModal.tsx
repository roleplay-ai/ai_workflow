"use client";

import { APP_FONT } from "@/lib/fonts";

type Props = {
  moduleId: string;
  moduleTitle: string;
  moduleEmoji: string;
  onClose: () => void;
};

export default function ModuleHtmlModal({ moduleId, moduleTitle, moduleEmoji, onClose }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.72)",
        display: "grid", placeItems: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 900, height: "90vh",
          borderRadius: 24, overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,.40)",
          background: "#fff",
          display: "flex", flexDirection: "column",
          fontFamily: APP_FONT,
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 22px", borderBottom: "1px solid #E9E4DC", flexShrink: 0,
        }}>
          <span style={{ fontSize: 22 }}>{moduleEmoji}</span>
          <span style={{ flex: 1, fontWeight: 900, fontSize: 15, letterSpacing: "-.03em", color: "#221D23" }}>
            {moduleTitle}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(34,29,35,.08)", border: "none",
              cursor: "pointer", fontSize: 18, color: "#221D23",
              display: "grid", placeItems: "center", flexShrink: 0,
            }}
          >×</button>
        </div>

        {/* Rendered HTML */}
        <iframe
          src={`/api/fluency/module/${moduleId}/html`}
          style={{ flex: 1, border: "none", width: "100%" }}
          sandbox="allow-scripts allow-same-origin allow-popups"
          title={moduleTitle}
        />
      </div>
    </div>
  );
}
