export function parseWorkflowSteps(markdown: string): { title: string; body: string }[] {
  if (!markdown?.trim()) return [];

  const lines = markdown.split("\n");
  const steps: { title: string; body: string }[] = [];
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
