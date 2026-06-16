"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  title: string;
  pageUrl: string;
};

export default function ExplorePageClient({ title, pageUrl }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleBack() {
    startTransition(() => {
      router.push("/apply");
    });
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif" }}>
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
          <button
            type="button"
            onClick={handleBack}
            disabled={isPending}
            aria-busy={isPending}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "0 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#221D23",
              background: "#facc15",
              border: "1px solid #d97706",
              cursor: isPending ? "wait" : "pointer",
              opacity: isPending ? 0.85 : 1,
            }}
          >
            {isPending ? (
              <>
                <span
                  className="card-spinner"
                  aria-hidden
                  style={{
                    width: 14,
                    height: 14,
                    borderWidth: 2,
                    borderColor: "rgba(34,29,35,.2)",
                    borderTopColor: "#221D23",
                  }}
                />
                Loading…
              </>
            ) : (
              "← Apply"
            )}
          </button>
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
