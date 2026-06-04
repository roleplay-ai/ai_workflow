import { WorkflowStep } from "@/types";
import { v4 as uuidv4 } from "uuid";

export function parseMarkdownWorkflow(markdown: string): {
  title: string;
  subtitle: string;
  steps: WorkflowStep[];
} {
  const lines = markdown.split("\n");
  let title = "Guided Workflow";
  let subtitle = "AI-powered step-by-step guide";

  if (lines[0]?.trim() === "---") {
    const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (endIdx > 0) {
      for (let i = 1; i < endIdx; i++) {
        const [key, ...rest] = lines[i].split(":");
        const val = rest.join(":").trim();
        if (key.trim() === "title") title = val;
        if (key.trim() === "subtitle") subtitle = val;
      }
      lines.splice(0, endIdx + 1);
    }
  }

  const content = lines.join("\n");
  const stepBlocks = content.split(/^## /m).filter((b) => b.trim());

  const steps: WorkflowStep[] = stepBlocks.map((block, idx) => {
    const [firstLine, ...rest] = block.split("\n");
    const stepTitle = firstLine.replace(/^Step \d+:\s*/i, "").trim();
    const body = rest.join("\n");

    const get = (key: string) => {
      const match = body.match(new RegExp(`\\*\\*${key}:\\*\\*\\s*(.+)`, "i"));
      return match ? match[1].trim() : "";
    };

    const slideVal = get("Slide");
    const slideNumber = slideVal ? Math.max(1, parseInt(slideVal, 10)) : idx + 1;
    const description = get("Description") || rest.filter(l => !l.match(/^\*\*\w[\w ]+:\*\*/) && l.trim()).join("\n").trim();

    return {
      id: uuidv4(),
      step_number: idx + 1,
      slide_number: slideNumber,
      title: stepTitle,
      what_learner_sees: description,
      what_this_means: get("AI Message") || get("AI") || description,
      what_to_do: [],
      if_stuck: "Not specified in this slide.",
      callout: get("Callout") || "",
      coach_next: "",
    };
  });

  return { title, subtitle, steps };
}
