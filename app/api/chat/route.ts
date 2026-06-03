import { NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { getWorkflow, getChatHistory, addChatMessage } from "@/lib/store";

export async function POST(req: Request) {
  const { message, stepIndex } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const workflow = getWorkflow();
  if (!workflow) {
    return NextResponse.json({ error: "No workflow loaded" }, { status: 400 });
  }

  const currentStep = workflow.steps[stepIndex] ?? workflow.steps[0];

  // Numbered step list — these are the ONLY valid N values for GOTO_STEP
  const stepList = workflow.steps
    .map((s, i) => `[STEP_NUMBER:${i + 1}] ${s.title}`)
    .join("\n");

  // Strip **Slide:** lines from markdown — they are slide image indices, NOT step numbers.
  // Keeping them causes Claude to confuse slide numbers with step numbers in GOTO_STEP.
  const cleanMarkdown = workflow.rawMarkdown
    .replace(/^\*\*Slide:\*\*.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const systemPrompt = `You are a friendly, sharp AI learning coach. You guide users through workflows step by step.

## Workflow: ${workflow.title}
${workflow.subtitle}

## Step Navigation Reference — use ONLY these numbers for GOTO_STEP
${stepList}

## Full Workflow Content
${cleanMarkdown}

## Currently on Step ${stepIndex + 1}: ${currentStep.title}
${currentStep.description}

## Communication rules:
- Short: max 4-5 lines. No essays.
- Structured: use bullets or numbered steps for multi-part answers.
- Direct: start with the answer. Never say "Great question!" or "Of course!".
- Human tone: plain words, helpful colleague.
- One emoji max if it adds clarity. Never decorative.

## Navigation rule — CRITICAL:
If your answer is primarily about a DIFFERENT step, output this on the very first line:
GOTO_STEP:N
where N is the STEP_NUMBER from the "Step Navigation Reference" list above — NOT a slide number, NOT a page number, ONLY the STEP_NUMBER in brackets above.
Then a blank line, then your reply.
Only use GOTO_STEP when the answer clearly belongs to one specific other step. Skip it for general questions.`;

  const history = getChatHistory();
  addChatMessage("user", message);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: message },
    ],
  });

  const raw = response.content[0]?.type === "text" ? response.content[0].text : "";

  // Parse optional GOTO_STEP:N prefix
  const gotoMatch = raw.match(/^GOTO_STEP:(\d+)\n?/);
  let goToStep: number | null = null;
  let reply = raw;

  if (gotoMatch) {
    const n = parseInt(gotoMatch[1], 10) - 1; // convert to 0-based
    if (n >= 0 && n < workflow.steps.length && n !== stepIndex) {
      goToStep = n;
    }
    reply = raw.slice(gotoMatch[0].length).trim();
  }

  addChatMessage("assistant", reply);

  return NextResponse.json({ reply, goToStep });
}
