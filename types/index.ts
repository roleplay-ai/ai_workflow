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
  title: string;
  description: string;
  aiMessage: string;
  slideIndex: number;   // index into workflow.slides[] — kept for admin UI
  slideUrl?: string;    // direct URL — preferred over slideIndex for rendering
  callout?: string;
  highlight?: { left: number; top: number; width: number; height: number };
  quiz?: Quiz;
}

export interface Workflow {
  id: string;
  title: string;
  subtitle: string;
  rawMarkdown: string;
  steps: WorkflowStep[];
  slides: string[]; // public URLs to slide images
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
