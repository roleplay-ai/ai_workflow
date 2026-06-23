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
Always navigate when your explanation references a particular step's content.

## Suggestions:
At the very end of your response, output exactly 3 follow-up question suggestions the learner might want to ask next, one per line, prefixed with SUGGEST: (e.g. "SUGGEST: How do I share my project?"). These should be specific to the current step context and naturally follow from your answer.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  });

  const raw = response.content[0]?.type === "text" ? response.content[0].text : "";

  const gotoMatch = raw.match(/^GOTO_STEP:(\d+)\n?/);
  let goToStep: number | null = null;
  let cleaned = raw;

  if (gotoMatch) {
    const n = parseInt(gotoMatch[1], 10) - 1;
    if (n >= 0 && n < steps.length) goToStep = n;
    cleaned = raw.slice(gotoMatch[0].length).trim();
  }

  const suggestions: string[] = [];
  const lines = cleaned.split("\n");
  const replyLines: string[] = [];
  for (const line of lines) {
    const suggestMatch = line.match(/^SUGGEST:\s*(.+)/);
    if (suggestMatch) {
      suggestions.push(suggestMatch[1].trim());
    } else {
      replyLines.push(line);
    }
  }
  const reply = replyLines.join("\n").trim();

  return NextResponse.json({ reply, goToStep, suggestions: suggestions.slice(0, 3) });
}
