export type FoundationIconName =
  | "tokens"
  | "context"
  | "tool"
  | "agent"
  | "api"
  | "branch"
  | "image"
  | "memory"
  | "code"
  | "chart";

export type FoundationCardTheme = {
  soft: string;
  accent: string;
  icon: FoundationIconName;
};

const THEMES_BY_TITLE: Record<string, FoundationCardTheme> = {
  Tokens: { soft: "#FFF6CF", accent: "#F68A29", icon: "tokens" },
  "Context Window": { soft: "#EAF5FF", accent: "#3699FC", icon: "context" },
  "Tool Calling": { soft: "#F1ECFF", accent: "#623CEA", icon: "tool" },
  "AI Agents": { soft: "#E9FFF2", accent: "#23CE6B", icon: "agent" },
  API: { soft: "#FDE4CC", accent: "#F68A29", icon: "api" },
  "GenAI vs Other AI": { soft: "#FFECEF", accent: "#ED4551", icon: "branch" },
  "Image Generation": { soft: "#F1ECFF", accent: "#623CEA", icon: "image" },
  "AI Memory": { soft: "#EAF5FF", accent: "#3699FC", icon: "memory" },
  "Vibe Coding": { soft: "#FDE4CC", accent: "#F68A29", icon: "code" },
  "AI Economics": { soft: "#FFF6CF", accent: "#FFCE00", icon: "chart" },
};

const FALLBACK_THEMES: FoundationCardTheme[] = [
  { soft: "#FFF6CF", accent: "#F68A29", icon: "tokens" },
  { soft: "#EAF5FF", accent: "#3699FC", icon: "context" },
  { soft: "#F1ECFF", accent: "#623CEA", icon: "tool" },
  { soft: "#E9FFF2", accent: "#23CE6B", icon: "agent" },
  { soft: "#FDE4CC", accent: "#F68A29", icon: "api" },
  { soft: "#FFECEF", accent: "#ED4551", icon: "branch" },
  { soft: "#F1ECFF", accent: "#623CEA", icon: "image" },
  { soft: "#EAF5FF", accent: "#3699FC", icon: "memory" },
  { soft: "#FDE4CC", accent: "#F68A29", icon: "code" },
  { soft: "#FFF6CF", accent: "#FFCE00", icon: "chart" },
];

export function getFoundationCardTheme(title: string, index = 0): FoundationCardTheme {
  return THEMES_BY_TITLE[title] ?? FALLBACK_THEMES[index % FALLBACK_THEMES.length];
}
