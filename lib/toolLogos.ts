export type ToolLogoRow = { tool: string; logo_url: string };

export type ToolLogoMap = Record<string, string>;

export function rowsToToolLogoMap(rows: ToolLogoRow[] | null | undefined): ToolLogoMap {
  const map: ToolLogoMap = {};
  for (const row of rows ?? []) {
    map[row.tool.toLowerCase()] = row.logo_url;
  }
  return map;
}
