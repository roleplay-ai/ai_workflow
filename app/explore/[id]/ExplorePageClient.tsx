"use client";

type Props = {
  title: string;
  pageUrl: string;
};

export default function ExplorePageClient({ title, pageUrl }: Props) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <header style={{
        height: 68, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", background: "rgba(255,255,255,.92)", borderBottom: "1px solid #E2E8F0",
        backdropFilter: "blur(18px)", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-.03em" }}>{title}</div>
            <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>Go deeper with your tools</div>
          </div>
          <a href="/dashboard" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#221D23", background: "#facc15", border: "1px solid #d97706", textDecoration: "none" }}>
            ← Dashboard
          </a>
        </div>
      </header>

      <iframe
        title={title}
        src={pageUrl}
        style={{ flex: 1, width: "100%", border: 0, background: "white" }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}
