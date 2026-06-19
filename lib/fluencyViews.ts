// Fire-and-forget view tracking for AI Fluency content items.
export type FluencyEntityType = "video" | "tool" | "tool_guide" | "deep_dive" | "module" | "page";

// Sentinel UUIDs for page-level visits (no DB row to reference).
export const PAGE_IDS = {
  AI_FLUENCY: "00000000-0000-0000-0000-000000000001",
} as const;

export function recordFluencyView(entityType: FluencyEntityType, entityId: string): void {
  if (typeof window === "undefined" || !entityId) return;

  let sessionId = localStorage.getItem("nw_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("nw_session_id", sessionId);
  }

  fetch("/api/fluency/view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityType, entityId, sessionId }),
    keepalive: true,
  }).catch(() => {});
}
