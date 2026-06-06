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

  const currentStep = (steps as StepContext[])[stepIndex];
  const totalSteps = steps.length;

  const stepContext = currentStep ? `
## Currently on Step ${stepIndex + 1} of ${totalSteps}: ${currentStep.title}

**What the learner sees:** ${currentStep.what_learner_sees}
**What this means:** ${currentStep.what_this_means}
**What to do:** ${(currentStep.what_to_do ?? []).map((a: string) => `• ${a}`).join(" ")}
**If stuck:** ${currentStep.if_stuck}
`.trim() : "";

  const allSteps = (steps as StepContext[])
    .map((s, i) => `Step ${i + 1}: ${s.title}`)
    .join("\n");

  const stepList = (steps as StepContext[])
    .map((s, i) => `[STEP_NUMBER:${i + 1}] ${s.title}`)
    .join("\n");

  const systemPrompt = `You are Nudgie, a friendly and sharp AI learning coach. Answer the learner's question concisely.

## Activity: ${activityTitle}

## Step Navigation Reference — use ONLY these numbers for GOTO_STEP
${stepList}

${stepContext}

## Rules:
- Max 4-5 lines. No essays.
- Use bullets or numbered steps for multi-part answers.
- Start with the answer — never say "Great question!" or "Of course!".
- Plain words, helpful colleague tone.
- One emoji max if it adds clarity. Never decorative.

## Navigation:
If your answer is about content that lives in a specific step (even if the learner didn't ask to go there), output GOTO_STEP:N on the very first line (N = step number from the reference list), then your answer.
Always navigate when your explanation references a particular step's content.`;

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
