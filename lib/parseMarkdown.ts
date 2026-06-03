import { WorkflowStep } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Parses a markdown workflow document into steps.
 *
 * Expected format:
 * ---
 * title: Workflow Title
 * subtitle: Short subtitle
 * ---
 *
 * ## Step 1: Step Title
 * **Description:** What happens in this step.
 * **AI Message:** What the AI coach says to open this step.
 * **Callout:** Annotation shown on the slide.
 * **Slide:** 1  (1-based slide index)
 *
 * ...repeat for each step
 */
export function parseMarkdownWorkflow(markdown: string): {
  title: string;
  subtitle: string;
  steps: WorkflowStep[];
} {
  const lines = markdown.split("\n");
  let title = "Guided Workflow";
  let subtitle = "AI-powered step-by-step guide";

  // Parse frontmatter
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

  // Split by ## headings
  const stepBlocks = content.split(/^## /m).filter((b) => b.trim());

  const steps: WorkflowStep[] = stepBlocks.map((block) => {
    const [firstLine, ...rest] = block.split("\n");
    const stepTitle = firstLine.replace(/^Step \d+:\s*/i, "").trim();
    const body = rest.join("\n");

    const get = (key: string) => {
      const match = body.match(new RegExp(`\\*\\*${key}:\\*\\*\\s*(.+)`, "i"));
      return match ? match[1].trim() : "";
    };

    const slideVal = get("Slide");
    const slideIndex = slideVal ? Math.max(0, parseInt(slideVal, 10) - 1) : 0;

    // Extract description — everything that isn't a **Key:** line
    const descLines = rest.filter(
      (l) => !l.match(/^\*\*\w[\w ]+:\*\*/) && l.trim() !== ""
    );
    const description = get("Description") || descLines.join("\n").trim();

    return {
      id: uuidv4(),
      title: stepTitle,
      description,
      aiMessage: get("AI Message") || get("AI") || description,
      callout: get("Callout") || undefined,
      slideIndex,
    };
  });

  return { title, subtitle, steps };
}
