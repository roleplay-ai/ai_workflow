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
  "what_learner_sees" |
  "what_this_means" |
  "what_to_do" |
  "if_stuck" |
  "coach_next"
>): string {
  const lines: string[] = [];

  if (step.what_learner_sees && step.what_learner_sees !== NOT_SPECIFIED) {
    lines.push("👀 **What you're seeing**");
    lines.push(`• ${step.what_learner_sees}`);
    lines.push("");
  }

  if (step.what_to_do?.length) {
    lines.push("✅ **What to do**");
    step.what_to_do.forEach(b => lines.push(`• ${b}`));
    lines.push("");
  }

  if (step.what_this_means && step.what_this_means !== NOT_SPECIFIED) {
    lines.push("💡 **Why it matters**");
    lines.push(`• ${step.what_this_means}`);
    lines.push("");
  }

  if (step.if_stuck && step.if_stuck !== NOT_SPECIFIED) {
    lines.push("⚠️ **If stuck**");
    lines.push(`• ${step.if_stuck}`);
    lines.push("");
  }

  if (step.coach_next) {
    lines.push(`➡️ ${step.coach_next}`);
  }

  return lines.join("\n").trim() || `**${step.title}** — follow the instructions on the slide.`;
}
