import { NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";

type StepContext = {
  title: string;
  what_learner_sees: string;
  what_this_means: string;
  what_to_do: string[];
  if_stuck: string;
};

export async function POST(req: Request) {
  const { message, stepIndex, activityTitle, steps } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const stepList = (steps as StepContext[])
    .map((s, i) => `[STEP_NUMBER:${i + 1}] ${s.title}`)
    .join("\n");

  const currentStep = (steps as StepContext[])[stepIndex];

  const stepContext = currentStep ? `
## Currently on Step ${stepIndex + 1}: ${currentStep.title}

**What the learner sees:** ${currentStep.what_learner_sees}

**What this means:** ${currentStep.what_this_means}

**What to do:**
${(currentStep.what_to_do ?? []).map(a => `• ${a}`).join("\n")}

**If stuck:** ${currentStep.if_stuck}
`.trim() : "";

  const systemPrompt = `You are a friendly, sharp AI learning coach. You guide users through workflows step by step.

## Activity: ${activityTitle}

## Step Navigation Reference — use ONLY these numbers for GOTO_STEP
${stepList}

${stepContext}

## Communication rules:
- Short: max 4-5 lines. No essays.
- Structured: use bullets or numbered steps for multi-part answers.
- Direct: start with the answer. Never say "Great question!" or "Of course!".
- Human tone: plain words, helpful colleague.
- One emoji max if it adds clarity. Never decorative.

## Navigation rule — CRITICAL:
If your answer is primarily about a DIFFERENT step, output this on the very first line:
GOTO_STEP:N
where N is the STEP_NUMBER from the "Step Navigation Reference" list above.
Then a blank line, then your reply.
Only use GOTO_STEP when the answer clearly belongs to one specific other step.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  });

  const raw = response.content[0]?.type === "text" ? response.content[0].text : "";

  const gotoMatch = raw.match(/^GOTO_STEP:(\d+)\n?/);
  let goToStep: number | null = null;
  let reply = raw;

  if (gotoMatch) {
    const n = parseInt(gotoMatch[1], 10) - 1;
    if (n >= 0 && n < steps.length && n !== stepIndex) goToStep = n;
    reply = raw.slice(gotoMatch[0].length).trim();
  }

  return NextResponse.json({ reply, goToStep });
}
