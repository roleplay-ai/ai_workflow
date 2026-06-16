// Fire-and-forget view tracking for AI Fluency content items.
// Counts are recorded silently for analytics — never surfaced in the UI.
export type FluencyEntityType = "video" | "tool" | "tool_guide" | "deep_dive" | "module";

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
