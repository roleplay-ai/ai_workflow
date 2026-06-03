import type { WorkflowStep } from "./supabase/types";

/**
 * Splits a workflow markdown document into steps.
 * A step begins at any line starting with ## or a numbered heading like "Step 1".
 * Everything before the first heading is treated as an intro (skipped from step list).
 */
export function parseWorkflowSteps(markdown: string): WorkflowStep[] {
  if (!markdown?.trim()) return [];

  const lines = markdown.split("\n");
  const steps: WorkflowStep[] = [];
  let currentTitle = "";
  let currentBody: string[] = [];

  const isStepHeading = (line: string) =>
    /^##\s+/.test(line) || /^#\s+Step\s+\d+/i.test(line);

  for (const line of lines) {
    if (isStepHeading(line)) {
      if (currentTitle) {
        steps.push({ title: currentTitle, body: currentBody.join("\n").trim() });
      }
      currentTitle = line.replace(/^#{1,3}\s+/, "").trim();
      currentBody = [];
    } else if (currentTitle) {
      currentBody.push(line);
    }
  }

  if (currentTitle) {
    steps.push({ title: currentTitle, body: currentBody.join("\n").trim() });
  }

  return steps;
}
