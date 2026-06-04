export const TOOLS = [
  "claude",
  "gemini",
  "chatgpt",
  "copilot",
  "drive",
  "sheets",
  "gmail",
  "calendar",
  "vapi",
  "wati",
  "lovable",
  "napkin",
  "ai-studio",
  "notebooklm",
] as const;

export type ToolId = (typeof TOOLS)[number];
