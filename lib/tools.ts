/** Default tools seeded on fresh installs; custom tools are stored in tool_logos. */
export const DEFAULT_TOOLS = [
  "claude",
  "chatgpt",
  "gemini",
  "copilot",
  "agentic-workflows",
] as const;

/** @deprecated Use DEFAULT_TOOLS — kept for imports that expect TOOLS. */
export const TOOLS = DEFAULT_TOOLS;

export type DefaultToolId = (typeof DEFAULT_TOOLS)[number];

const DEFAULT_TOOL_SET = new Set<string>(DEFAULT_TOOLS);

const TOOL_LABELS: Record<DefaultToolId, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  copilot: "Copilot",
  "agentic-workflows": "Agentic workflows",
};

export function normalizeToolSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function formatToolLabel(tool: string): string {
  const key = tool.toLowerCase() as DefaultToolId;
  if (TOOL_LABELS[key]) return TOOL_LABELS[key];
  return key
    .split("-")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Defaults first (in catalog order), then custom tools alphabetically. */
export function sortToolSlugs(tools: Iterable<string>): string[] {
  const unique = [...new Set([...tools].map(t => t.toLowerCase()).filter(Boolean))];
  const defaults = DEFAULT_TOOLS.filter(t => unique.includes(t));
  const custom = unique.filter(t => !DEFAULT_TOOL_SET.has(t)).sort();
  return [...defaults, ...custom];
}

export function collectToolSlugs(
  registeredTools: Iterable<string>,
  activityTools: Iterable<string[]>,
): string[] {
  const all = new Set<string>();
  for (const tool of registeredTools) {
    const slug = normalizeToolSlug(tool);
    if (slug) all.add(slug);
  }
  for (const tools of activityTools) {
    const primary = tools[0];
    if (primary) all.add(normalizeToolSlug(primary));
  }
  return sortToolSlugs(all);
}

export function buildDashboardToolFilters(
  registeredTools: Iterable<string>,
  activityTools: Iterable<string[]>,
): string[] {
  return ["all", ...collectToolSlugs(registeredTools, activityTools)];
}

export function normalizeToolList(tools: string[]): string[] {
  return [...new Set(tools.map(normalizeToolSlug).filter(Boolean))];
}
