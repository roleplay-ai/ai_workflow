export interface Quiz {
  question: string;
  options: string[];
  correct: number;
  successMsg: string;
  wrongMsg: string;
  badge: string;
}

export interface WorkflowStep {
  id: string;
  step_number: number;
  slide_number: number;
  title: string;
  what_learner_sees: string;
  what_this_means: string;
  what_to_do: string[];
  if_stuck: string;
  callout: string;
  coach_next: string;
  try_asking: string[];
  slideUrl?: string;
  quiz?: Quiz;
}

export interface Workflow {
  id: string;
  title: string;
  subtitle: string;
  steps: WorkflowStep[];
  slides: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const NOT_SPECIFIED = "Not specified in this slide.";

export function buildCoachMessage(step: Pick<WorkflowStep,
  "title" |
  "what_to_do" |
  "coach_next"
> | null | undefined): string {
  if (!step) return "Follow along with the activity when you're ready.";

  const lines: string[] = [];

  if (step.what_to_do?.length) {
    step.what_to_do.forEach(b => lines.push(`• ${b}`));
  }

  if (step.coach_next) {
    if (lines.length) lines.push("");
    lines.push(step.coach_next);
  }

  return lines.join("\n").trim() || `Follow the instructions on the slide for **${step.title}**.`;
}

/** Short coach bubble when step content is shown in the center panel. */
export function buildCoachChatMessage(step: Pick<WorkflowStep, "title" | "coach_next"> | null | undefined): string {
  if (!step) return "Follow along with the activity when you're ready.";
  return step.coach_next?.trim() || `Follow the instructions on the slide for **${step.title}**.`;
}
