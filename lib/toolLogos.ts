import { formatToolLabel, sortToolSlugs } from "@/lib/tools";

export type ToolLogoRow = { tool: string; logo_url: string };

export type ToolLogoMap = Record<string, string>;

export function rowsToToolLogoMap(rows: ToolLogoRow[] | null | undefined): ToolLogoMap {
  const map: ToolLogoMap = {};
  for (const row of rows ?? []) {
    map[row.tool.toLowerCase()] = row.logo_url;
  }
  return map;
}

export function buildToolSelectOptions(rows: ToolLogoRow[] | null | undefined): {
  name: string;
  displayName: string;
  imageUrl: string | null;
}[] {
  const logos = rowsToToolLogoMap(rows);
  return sortToolSlugs(Object.keys(logos)).map(tool => ({
    name: tool,
    displayName: formatToolLabel(tool),
    imageUrl: logos[tool]?.trim() || null,
  }));
}
