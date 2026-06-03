import { Workflow } from "@/types";

interface Store {
  workflow: Workflow | null;
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

// Attach to Node.js global so the same object is shared across all
// Next.js module instances (API routes + page routes) in development.
declare global {
  // eslint-disable-next-line no-var
  var __workflowStore: Store | undefined;
}

const store: Store = (global.__workflowStore ??= {
  workflow: null,
  chatHistory: [],
});

export function getWorkflow(): Workflow | null {
  return store.workflow;
}

export function setWorkflow(w: Workflow) {
  store.workflow = w;
  store.chatHistory = [];
}

export function getChatHistory() {
  return store.chatHistory;
}

export function addChatMessage(role: "user" | "assistant", content: string) {
  store.chatHistory.push({ role, content });
}

export function clearChatHistory() {
  store.chatHistory = [];
}
