/**
 * load-test-chat.ts
 *
 * Simulates concurrent users hitting POST /api/chat, each sending multiple
 * messages sequentially (message 2 waits for message 1 to finish).
 *
 * Run (dev server must be up):
 *   npm run load-test:chat
 *   npx tsx scripts/load-test-chat.ts --users=100 --messages=2
 *
 * Options:
 *   --base-url=http://localhost:3000   target server
 *   --users=100                        concurrent virtual users (default 100)
 *   --messages=2                       messages per user (default 2)
 *
 * Env (alternative to flags):
 *   BASE_URL, USERS, MESSAGES, LOAD_TEST_COOKIE
 *
 * Note: each request calls Claude. Anthropic rate limits (e.g. 50 req/min on
 * free tiers) will cause 500 errors if you exceed your quota.
 */

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
}

const BASE_URL = readArg("base-url") ?? process.env.BASE_URL ?? "http://localhost:3000";
const USERS = parseInt(readArg("users") ?? process.env.USERS ?? "100", 10);
const MESSAGES_PER_USER = parseInt(readArg("messages") ?? process.env.MESSAGES ?? "2", 10);
const COOKIE = process.env.LOAD_TEST_COOKIE ?? "";

const ACTIVITY_TITLE = "Load Test Activity";

const STEPS = [
  {
    title: "Open the project",
    what_learner_sees: "A welcome slide with a project folder icon.",
    what_this_means: "You will clone and open the starter repo.",
    what_to_do: ["Clone the repo", "Run npm install", "Start the dev server"],
    if_stuck: "Ask for the repo URL or check the README.",
  },
  {
    title: "Explore the codebase",
    what_learner_sees: "A file tree highlighting key folders.",
    what_this_means: "Learn where routes, components, and lib code live.",
    what_to_do: ["Skim app/", "Open lib/anthropic.ts", "Find the chat API route"],
    if_stuck: "Search for 'api/chat' in the repo.",
  },
  {
    title: "Send a test message",
    what_learner_sees: "The chat panel with an input box.",
    what_this_means: "Verify the AI coach responds to learner questions.",
    what_to_do: ["Type a question", "Press send", "Read Nudgie's reply"],
    if_stuck: "Check the browser network tab for /api/chat errors.",
  },
];

const USER_MESSAGES = [
  "What should I focus on in this step?",
  "Can you break down the first action for me?",
  "Where do I find more help if I'm stuck?",
  "What's the most important thing to do here?",
];

type RequestResult = {
  userId: number;
  messageIndex: number;
  ok: boolean;
  status: number;
  latencyMs: number;
  error?: string;
  replyLength?: number;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function sendChat(userId: number, messageIndex: number): Promise<RequestResult> {
  const message = USER_MESSAGES[messageIndex % USER_MESSAGES.length];
  const stepIndex = messageIndex % STEPS.length;
  const started = performance.now();

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (COOKIE) headers.Cookie = COOKIE;

    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: `[User ${userId}] ${message}`,
        stepIndex,
        activityTitle: ACTIVITY_TITLE,
        steps: STEPS,
      }),
    });

    const latencyMs = performance.now() - started;
    const contentType = res.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      const body = await res.text().catch(() => "");
      const hint =
        res.status === 500
          ? "Server error (often Anthropic rate limit — check dev server logs)"
          : res.redirected
            ? "Redirected (auth middleware)"
            : `Unexpected content-type: ${contentType || "none"}`;
      return {
        userId,
        messageIndex,
        ok: false,
        status: res.status,
        latencyMs,
        error: body.includes("rate_limit") ? "Anthropic rate limit (429)" : hint,
      };
    }

    const data = (await res.json()) as { reply?: string; error?: string };

    if (!res.ok) {
      return {
        userId,
        messageIndex,
        ok: false,
        status: res.status,
        latencyMs,
        error: data.error ?? `HTTP ${res.status}`,
      };
    }

    if (!data.reply?.trim()) {
      return {
        userId,
        messageIndex,
        ok: false,
        status: res.status,
        latencyMs,
        error: "Empty reply",
      };
    }

    return {
      userId,
      messageIndex,
      ok: true,
      status: res.status,
      latencyMs,
      replyLength: data.reply.length,
    };
  } catch (err) {
    return {
      userId,
      messageIndex,
      ok: false,
      status: 0,
      latencyMs: performance.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function simulateUser(userId: number): Promise<RequestResult[]> {
  const results: RequestResult[] = [];
  for (let i = 0; i < MESSAGES_PER_USER; i++) {
    results.push(await sendChat(userId, i));
  }
  return results;
}

async function preflight(): Promise<boolean> {
  console.log(`Preflight → ${BASE_URL}/api/chat`);
  const probe = await sendChat(0, 0);
  if (probe.ok) {
    console.log(`  OK (${probe.latencyMs.toFixed(0)} ms, reply ${probe.replyLength} chars)\n`);
    return true;
  }
  console.error(`  FAILED: ${probe.error ?? "unknown"} (status ${probe.status})`);
  console.error("  Fix auth/middleware or set LOAD_TEST_COOKIE before running the full test.\n");
  return false;
}

function printSummary(results: RequestResult[], wallMs: number) {
  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const latencies = ok.map((r) => r.latencyMs).sort((a, b) => a - b);

  console.log("=".repeat(60));
  console.log("Chat API load test summary");
  console.log("=".repeat(60));
  console.log(`Target:           ${BASE_URL}/api/chat`);
  console.log(`Users:            ${USERS}`);
  console.log(`Messages/user:    ${MESSAGES_PER_USER}`);
  console.log(`Total requests:   ${results.length}`);
  console.log(`Wall time:        ${(wallMs / 1000).toFixed(2)}s`);
  console.log(`Throughput:       ${(results.length / (wallMs / 1000)).toFixed(2)} req/s`);
  console.log(`Success:          ${ok.length}/${results.length} (${((ok.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`Failed:           ${failed.length}`);

  if (latencies.length) {
    const avg = latencies.reduce((s, v) => s + v, 0) / latencies.length;
    console.log("\nLatency (ms) — successful requests only:");
    console.log(`  min:  ${latencies[0].toFixed(0)}`);
    console.log(`  avg:  ${avg.toFixed(0)}`);
    console.log(`  p50:  ${percentile(latencies, 50).toFixed(0)}`);
    console.log(`  p95:  ${percentile(latencies, 95).toFixed(0)}`);
    console.log(`  p99:  ${percentile(latencies, 99).toFixed(0)}`);
    console.log(`  max:  ${latencies[latencies.length - 1].toFixed(0)}`);
  }

  if (failed.length) {
    const byError = new Map<string, number>();
    for (const r of failed) {
      const key = `${r.status} ${r.error ?? "unknown"}`;
      byError.set(key, (byError.get(key) ?? 0) + 1);
    }
    console.log("\nFailures:");
    for (const [err, count] of [...byError.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${count}× ${err}`);
    }
  }
  console.log("=".repeat(60));
}

async function main() {
  console.log(`\nLoad test: ${USERS} users × ${MESSAGES_PER_USER} messages = ${USERS * MESSAGES_PER_USER} requests\n`);

  if (!(await preflight())) {
    process.exit(1);
  }

  console.log(`Starting ${USERS} concurrent users…`);
  const wallStart = performance.now();

  const batches = await Promise.all(
    Array.from({ length: USERS }, (_, i) => simulateUser(i + 1))
  );

  const wallMs = performance.now() - wallStart;
  printSummary(batches.flat(), wallMs);

  const anyFailed = batches.flat().some((r) => !r.ok);
  process.exit(anyFailed ? 1 : 0);
}

main();
