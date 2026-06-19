/**
 * provision-aimastery-users.ts
 *
 * Creates Supabase auth accounts for AI Mastery course participants,
 * sets aimastery_approved on their profiles, and writes credentials to CSV.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/provision-aimastery-users.ts
 *
 * Options:
 *   --csv <path>     Input CSV (default: scripts/data/aimastery-users.csv)
 *   --out <path>     Output credentials CSV (default: scripts/output/aimastery-credentials.csv)
 *   --dry-run        Print actions without writing to Supabase
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import type { Database } from "../lib/supabase/types";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

type AdminClient = SupabaseClient<Database>;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const PASSWORD_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";

type UserRow = { name: string; email: string };

function parseArgs(argv: string[]) {
  const args = { csv: "", out: "", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--csv" && argv[i + 1]) args.csv = argv[++i];
    else if (a === "--out" && argv[i + 1]) args.out = argv[++i];
  }
  return args;
}

function parseCsv(text: string): UserRow[] {
  const lines = text.trim().split(/\r?\n/).slice(1);
  const users: UserRow[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const comma = line.indexOf(",");
    if (comma === -1) continue;

    const name = line.slice(0, comma).trim();
    const rest = line.slice(comma + 1);
    const email = rest.split(",")[0]?.trim().toLowerCase();
    if (!name || !email) continue;

    users.push({ name, email });
  }

  return users;
}

function generatePassword(length = 6): string {
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  }
  return pw;
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

async function findProfileByEmail(
  admin: AdminClient,
  email: string,
): Promise<{ id: string } | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (error) throw new Error(`Profile lookup failed for ${email}: ${error.message}`);
  return data;
}

async function provisionUser(
  admin: AdminClient,
  user: UserRow,
  password: string,
): Promise<"created" | "updated"> {
  const existing = await findProfileByEmail(admin, user.email);

  if (existing) {
    const { error: authErr } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: user.name },
    });
    if (authErr) throw new Error(`Auth update failed for ${user.email}: ${authErr.message}`);

    const { error: profileErr } = await admin
      .from("profiles")
      .update({
        full_name: user.name,
        aimastery_approved: true,
        aimastery_requested: true,
      })
      .eq("id", existing.id);

    if (profileErr) throw new Error(`Profile update failed for ${user.email}: ${profileErr.message}`);
    return "updated";
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: user.name },
  });

  if (error || !data.user) {
    throw new Error(`Create failed for ${user.email}: ${error?.message ?? "no user returned"}`);
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      full_name: user.name,
      aimastery_approved: true,
      aimastery_requested: true,
    })
    .eq("id", data.user.id);

  if (profileErr) throw new Error(`Profile update failed for ${user.email}: ${profileErr.message}`);
  return "created";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const csvPath = resolve(args.csv || resolve(SCRIPT_DIR, "data/aimastery-users.csv"));
  const outPath = resolve(args.out || resolve(SCRIPT_DIR, "output/aimastery-credentials.csv"));

  if (!SUPABASE_URL) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
    process.exit(1);
  }
  if (!args.dryRun && !SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local (required unless --dry-run)");
    process.exit(1);
  }

  const users = parseCsv(readFileSync(csvPath, "utf8"));
  if (users.length === 0) {
    console.error(`No users found in ${csvPath}`);
    process.exit(1);
  }

  console.log(`Loaded ${users.length} users from ${csvPath}`);
  if (args.dryRun) {
    for (const user of users) {
      const password = generatePassword(6);
      console.log(`  [dry-run] create/update ${user.email} (${user.name}) pw=${password}`);
    }
    console.log(`\nDry run complete — ${users.length} users ready to provision`);
    return;
  }

  const admin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const credentials: Array<{ name: string; email: string; password: string; status: string }> = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const user of users) {
    const password = generatePassword(6);
    process.stdout.write(`→ ${user.email} ... `);

    try {
      const status = await provisionUser(admin, user, password);
      if (status === "created") created++;
      else updated++;
      credentials.push({ ...user, password, status });
      console.log(status);
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      credentials.push({ ...user, password: "", status: `error: ${message}` });
      console.log(`ERROR: ${message}`);
    }
  }

  mkdirSync(dirname(outPath), { recursive: true });
  const header = "Name,Email,Password,Status\n";
  const body = credentials
      .map((r) => [r.name, r.email, r.password, r.status].map(escapeCsv).join(","))
      .join("\n");
  writeFileSync(outPath, header + body + "\n", "utf8");
  console.log(`\nCredentials written to ${outPath}`);

  console.log(`\nDone: ${created} created, ${updated} updated, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
