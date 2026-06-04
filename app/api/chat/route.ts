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
  const body = await req.json();

  if (body.init) {
    return handleInit(body.activityTitle, body.steps as StepContext[]);
  }

  const { message, stepIndex, activityTitle, steps } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const stepList = (steps as StepContext[])
    .map((s, i) => `[STEP_NUMBER:${i + 1}] ${s.title}`)
    .join("\n");

  const currentStep = (steps as StepContext[])[stepIndex];
  const totalSteps = steps.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  const stepContext = currentStep ? `
## Currently on Step ${stepIndex + 1} of ${totalSteps}: ${currentStep.title}

**What the learner sees:** ${currentStep.what_learner_sees}
**What this means:** ${currentStep.what_this_means}
**What to do:** ${(currentStep.what_to_do ?? []).map(a => `• ${a}`).join(" ")}
**If stuck:** ${currentStep.if_stuck}
`.trim() : "";

  const nextNav = isLast
    ? `When user says "next": tell them they've completed all ${totalSteps} steps. Congratulate them warmly. No GOTO_STEP.`
    : `When user says "next": output GOTO_STEP:${stepIndex + 2} on the very first line, then briefly describe Step ${stepIndex + 2} in 2-3 lines.`;

  const prevNav = isFirst
    ? `When user says "go back to previous step": tell them this is the first step. No GOTO_STEP.`
    : `When user says "go back to previous step": output GOTO_STEP:${stepIndex} on the very first line, then briefly describe Step ${stepIndex} in 2-3 lines.`;

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

## Navigation Commands (CRITICAL — follow exactly):
${nextNav}
${prevNav}
When user says "go to step N": output GOTO_STEP:N on the very first line (use the exact N they said), then describe that step briefly.

GOTO_STEP format: GOTO_STEP:N where N is the STEP_NUMBER from the reference list above.

For non-navigation questions: use GOTO_STEP:N only if your answer clearly belongs to a different specific step.`;

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
    if (n >= 0 && n < steps.length) goToStep = n;
    reply = raw.slice(gotoMatch[0].length).trim();
  }

  return NextResponse.json({ reply, goToStep });
}

async function handleInit(activityTitle: string, steps: StepContext[]) {
  const firstStep = steps[0];

  const systemPrompt = `Generate exactly two short messages to open a guided learning session. Separate them with a line containing only "---".

Message 1: One-line welcome. Example format: "Hi! I'm your AI coach for ${activityTitle}. Look at the slide and ask me anything — I'll guide you through each step."

Message 2: A brief, specific intro to Step 1: "${firstStep?.title ?? "the first step"}". 2-3 lines. Tell them what they'll see and the first action.${firstStep?.what_learner_sees ? `\nContext: ${firstStep.what_learner_sees}` : ""}${firstStep?.what_to_do?.[0] ? `\nFirst action: ${firstStep.what_to_do[0]}` : ""}

Output only the two messages separated by "---". Nothing else.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: "start" }],
  });

  const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
  const [msg1, msg2] = raw.split(/^---$/m).map((p) => p.trim()).filter(Boolean);

  return NextResponse.json({
    initMessages: [
      msg1 || `Hi! I'm your AI coach for ${activityTitle}. Look at the slide and ask me anything — I'll guide you through each step.`,
      msg2 || `Let's start with Step 1: ${firstStep?.title ?? "the first step"}. Check out the slide and follow along!`,
    ],
  });
}
