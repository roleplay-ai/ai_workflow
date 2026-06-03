import { NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { Quiz } from "@/types";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const stepsJson = formData.get("steps") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const markdownText = await file.text();
  const steps: { id: string; title: string }[] = stepsJson ? JSON.parse(stepsJson) : [];

  const stepsContext = steps.length
    ? `Workflow steps:\n${steps.map((s, i) => `${i + 1}. ${s.title}`).join("\n")}\n\n`
    : "";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${stepsContext}Extract every quiz from the markdown below.

Return a JSON array. Each item:
{
  "stepIndex": 0,
  "question": "...",
  "options": ["opt1", "opt2", "opt3", "opt4"],
  "correct": 0,
  "successMsg": "...",
  "wrongMsg": "...",
  "badge": "✓ Got it"
}

Notes:
- stepIndex is 0-based (first step = 0)
- correct is the 0-based index of the right answer in options[]
- In the markdown, the correct option may be marked with "✓ CORRECT" — strip that marker from the option text
- successMsg / wrongMsg: extract from markdown if present, else write a short one
- Return ONLY the raw JSON array. No explanation, no code fences, no markdown.

Markdown:
${markdownText}`,
      },
    ],
  });

  const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "[]";

  // Robustly extract the JSON array — find first [ and last ]
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");

  if (start === -1 || end === -1) {
    return NextResponse.json(
      { error: "Claude did not return a JSON array", raw: raw.slice(0, 500) },
      { status: 500 }
    );
  }

  let quizzes: Array<{
    stepIndex: number | null;
    question: string;
    options: string[];
    correct: number;
    successMsg: string;
    wrongMsg: string;
    badge: string;
  }> = [];

  try {
    quizzes = JSON.parse(raw.slice(start, end + 1));
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to parse JSON from Claude response", raw: raw.slice(0, 500) },
      { status: 500 }
    );
  }

  // Map quizzes → step IDs
  const mapped: Record<string, Quiz> = {};

  quizzes.forEach((q, i) => {
    const idx = typeof q.stepIndex === "number" ? q.stepIndex : i;
    const step = steps[idx] ?? steps[i];
    if (!step) return;

    mapped[step.id] = {
      question: q.question ?? "",
      options: (q.options ?? []).map((o: string) =>
        o.replace(/\s*✓\s*CORRECT\s*/gi, "").trim()
      ),
      correct: typeof q.correct === "number" ? q.correct : 0,
      successMsg: q.successMsg ?? "Correct!",
      wrongMsg: q.wrongMsg ?? "Review this step and try again.",
      badge: q.badge ?? "✓ Got it",
    };
  });

  return NextResponse.json({ mapped, total: quizzes.length });
}
