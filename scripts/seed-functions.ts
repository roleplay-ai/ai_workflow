/**
 * seed-functions.ts
 *
 * Fetches all activities, asks Claude to suggest 1–2 job functions each,
 * then either writes directly to Supabase (if SUPABASE_SERVICE_ROLE_KEY is set)
 * or outputs a SQL file you can paste into the Supabase SQL editor.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/seed-functions.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

const CANONICAL_FUNCTIONS = [
  "HR", "Finance", "Marketing", "Sales", "Operations",
  "Legal", "IT", "Product", "Customer Success", "Leadership",
] as const;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ANTHROPIC_API_KEY) {
  console.error("Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and ANTHROPIC_API_KEY are in .env.local");
  process.exit(1);
}

const readClient  = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const writeClient = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  : null;

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

type Activity = { id: string; title: string; description: string | null; category: string; tools: string[]; functions: string[] };
type Suggestion = { id: string; functions: string[] };

function escape(s: string) { return s.replace(/'/g, "''"); }

async function main() {
  console.log("Fetching activities...");
  const client = writeClient ?? readClient;
  const { data: activities, error } = await client
    .from("activities")
    .select("id, title, description, category, tools, functions")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch activities:", error.message);
    process.exit(1);
  }
  if (!activities || activities.length === 0) {
    console.error("No activities found via API (RLS may hide unpublished rows).");
    console.error("Run scripts/seed-functions.sql in the Supabase SQL Editor instead.");
    process.exit(1);
  }

  const toSeed = (activities as Activity[]).filter(
    a => !a.functions || a.functions.length === 0
  );

  if (toSeed.length === 0) {
    console.log("All activities already have functions assigned.");
    return;
  }

  console.log(`  → ${toSeed.length} activities need functions (${activities.length} total)\n`);

  console.log("Asking Claude to suggest functions...");
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `You are assigning job/team functions to AI workflow learning activities.

For each activity suggest 1–2 functions from this exact list only:
${CANONICAL_FUNCTIONS.join(", ")}

Pick the function(s) whose team would most likely use this workflow day-to-day.
Prefer 1 function when one clearly fits; use 2 when the activity spans two teams.

Rules:
- Use exact names from the list (e.g. "Customer Success" not "CS")
- Return ONLY a valid JSON array — no markdown, no explanation
- Format: [{"id":"<uuid>","functions":["Function1"]}, ...]

Activities:
${JSON.stringify(toSeed.map(a => ({
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

  const usedFunctions = [...new Set(suggestions.flatMap(s => s.functions))].sort();
  console.log(`\nAssigned ${usedFunctions.length} unique functions:\n  ${usedFunctions.join(", ")}\n`);

  console.log("Per-activity suggestions:");
  for (const s of suggestions) {
    const act = toSeed.find(a => a.id === s.id);
    console.log(`  ${act?.title ?? s.id}: ${s.functions.join(", ")}`);
  }
  console.log();

  if (writeClient) {
    console.log("Writing directly to Supabase (service role)...");

    const { error: fnErr } = await writeClient
      .from("activity_functions")
      .upsert(CANONICAL_FUNCTIONS.map(name => ({ name, icon_url: null })), { onConflict: "name", ignoreDuplicates: true });

    if (fnErr) { console.error("Function insert error:", fnErr.message); process.exit(1); }
    console.log("  ✓ Functions upserted");

    for (const s of suggestions) {
      const { error: actErr } = await writeClient
        .from("activities")
        .update({ functions: s.functions })
        .eq("id", s.id);
      if (actErr) {
        const act = toSeed.find(a => a.id === s.id);
        console.error(`  ✗ ${act?.title ?? s.id}: ${actErr.message}`);
      }
    }
    console.log("  ✓ Activity functions updated");
    console.log("\nDone! Add icons at /superadmin/tool-logos");
    return;
  }

  console.log("No SUPABASE_SERVICE_ROLE_KEY — generating seed-functions-generated.sql instead...");

  const lines: string[] = [
    "-- Generated by scripts/seed-functions.ts",
    "-- Paste this into the Supabase SQL editor and run it.",
    "",
    "INSERT INTO activity_functions (name, icon_url) VALUES",
    CANONICAL_FUNCTIONS.map((t, i) =>
      `  ('${escape(t)}', NULL)${i < CANONICAL_FUNCTIONS.length - 1 ? "," : ""}`
    ).join("\n"),
    "ON CONFLICT (name) DO NOTHING;",
    "",
  ];

  for (const s of suggestions) {
    const arr = `'{${s.functions.map(t => `"${escape(t)}"`).join(",")}}'`;
    lines.push(`UPDATE activities SET functions = ${arr} WHERE id = '${s.id}';`);
  }

  const sqlPath = "scripts/seed-functions-generated.sql";
  writeFileSync(sqlPath, lines.join("\n") + "\n");
  console.log(`  ✓ Written to ${sqlPath}`);
  console.log("\nNext steps:");
  console.log("  1. Open Supabase dashboard → SQL Editor");
  console.log("  2. Paste the contents and run");
  console.log("  3. Or run scripts/seed-functions.sql for keyword-based matching");
}

main().catch(err => { console.error(err); process.exit(1); });
