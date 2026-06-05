/**
 * seed-tags.ts
 *
 * Fetches all activities, asks Claude to suggest 3 tags each,
 * then either writes directly to Supabase (if SUPABASE_SERVICE_ROLE_KEY is set)
 * or outputs a SQL file you can paste into the Supabase SQL editor.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/seed-tags.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

// ── env ──────────────────────────────────────────────────────────────────────
const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ANTHROPIC_API_KEY) {
  console.error("Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and ANTHROPIC_API_KEY are in .env.local");
  process.exit(1);
}

const readClient  = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const writeClient = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  : null;

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ── types ─────────────────────────────────────────────────────────────────────
type Activity = { id: string; title: string; description: string | null; category: string; tools: string[] };
type Suggestion = { id: string; tags: [string, string, string] };

// ── helpers ───────────────────────────────────────────────────────────────────
function escape(s: string) { return s.replace(/'/g, "''"); }

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Fetch activities
  console.log("Fetching activities...");
  const { data: activities, error } = await readClient
    .from("activities")
    .select("id, title, description, category, tools")
    .order("created_at", { ascending: false });

  if (error || !activities || activities.length === 0) {
    console.error("Failed to fetch activities:", error?.message ?? "none found");
    process.exit(1);
  }
  console.log(`  → ${activities.length} activities found\n`);

  // 2. Ask Claude for tag suggestions (single call)
  console.log("Asking Claude to suggest tags...");
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `You are tagging AI workflow learning activities for a learning platform.

For each activity suggest exactly 3 short tags (1–2 words each). Tags should describe:
- The work output type (e.g. "Email", "Report", "Dashboard", "Slides", "Summary", "PDF")
- The skill involved (e.g. "Prompting", "Automation", "Research", "Analysis", "Writing")
- The app or format used (e.g. "Excel", "Gmail", "Docs", "Teams", "Sheets")

Rules:
- Keep tags short and reusable — prefer the same tag name across activities where it fits
- Capitalise each tag (e.g. "Email" not "email")
- Return ONLY a valid JSON array — no markdown, no explanation
- Format: [{"id":"<uuid>","tags":["Tag1","Tag2","Tag3"]}, ...]

Activities:
${JSON.stringify((activities as Activity[]).map(a => ({
  id: a.id,
  title: a.title,
  description: a.description,
  category: a.category,
  tools: a.tools,
})), null, 2)}`,
    }],
  });

  const raw = response.content[0];
  if (raw.type !== "text") { console.error("Unexpected Claude response"); process.exit(1); }

  let suggestions: Suggestion[];
  try {
    const match = raw.text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array in response");
    suggestions = JSON.parse(match[0]);
  } catch {
    console.error("Could not parse Claude response:\n", raw.text);
    process.exit(1);
  }

  // 3. Collect unique tags
  const allTags = [...new Set(suggestions.flatMap(s => s.tags))].sort();
  console.log(`\nSuggested ${allTags.length} unique tags:\n  ${allTags.join(", ")}\n`);

  // 4. Print per-activity summary
  console.log("Per-activity suggestions:");
  for (const s of suggestions) {
    const act = (activities as Activity[]).find(a => a.id === s.id);
    console.log(`  ${act?.title ?? s.id}: ${s.tags.join(", ")}`);
  }
  console.log();

  // 5a. Direct write if service role key is available
  if (writeClient) {
    console.log("Writing directly to Supabase (service role)...");

    const { error: tagErr } = await writeClient
      .from("activity_tags")
      .upsert(allTags.map(name => ({ name, icon_url: null })), { onConflict: "name", ignoreDuplicates: true });

    if (tagErr) { console.error("Tag insert error:", tagErr.message); process.exit(1); }
    console.log("  ✓ Tags upserted");

    for (const s of suggestions) {
      const { error: actErr } = await writeClient
        .from("activities")
        .update({ tags: s.tags })
        .eq("id", s.id);
      if (actErr) {
        const act = (activities as Activity[]).find(a => a.id === s.id);
        console.error(`  ✗ ${act?.title ?? s.id}: ${actErr.message}`);
      }
    }
    console.log("  ✓ Activity tags updated");
    console.log("\nDone! Add logos at /superadmin/tool-logos");
    return;
  }

  // 5b. Generate SQL file
  console.log("No SUPABASE_SERVICE_ROLE_KEY — generating seed-tags.sql instead...");

  const lines: string[] = [
    "-- Generated by scripts/seed-tags.ts",
    "-- Paste this into the Supabase SQL editor and run it.",
    "",
    "-- 1. Insert unique tags (skip duplicates)",
    "INSERT INTO activity_tags (name, icon_url) VALUES",
    allTags.map((t, i) =>
      `  ('${escape(t)}', NULL)${i < allTags.length - 1 ? "," : ""}`
    ).join("\n"),
    "ON CONFLICT (name) DO NOTHING;",
    "",
    "-- 2. Assign tags to each activity",
  ];

  for (const s of suggestions) {
    const arr = `'{${s.tags.map(t => `"${escape(t)}"`).join(",")}}'`;
    lines.push(`UPDATE activities SET tags = ${arr} WHERE id = '${s.id}';`);
  }

  const sqlPath = "scripts/seed-tags.sql";
  writeFileSync(sqlPath, lines.join("\n") + "\n");
  console.log(`  ✓ Written to ${sqlPath}`);
  console.log("\nNext steps:");
  console.log("  1. Open Supabase dashboard → SQL Editor");
  console.log("  2. Paste the contents of scripts/seed-tags.sql and run");
  console.log("  3. Add logos at /superadmin/tool-logos");
}

main().catch(err => { console.error(err); process.exit(1); });
