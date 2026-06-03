# Guided AI Workbench — Architecture & Developer Guide

## What This App Does

A two-role web application for **AI-powered guided learning**:

- **Admin** uploads a workflow (Markdown), slide images (PNG/PPTX), and quiz questions (.md file) → publishes a step-by-step learning experience.
- **Learner** follows the published workflow step-by-step, with an AI coach (Claude Sonnet) answering questions in real time and automatically jumping to the relevant step when needed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| AI | Anthropic Claude Sonnet (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| PPTX parsing | `jszip` (reads PPTX as a ZIP archive) |
| State | Node.js `global` in-memory store (session-only, resets on server restart) |
| File storage | `public/uploads/` folder (local disk) |

---

## Project Structure

```
guided-ai-workbench/
│
├── app/                          # Next.js App Router pages & API routes
│   ├── layout.tsx                # Root HTML shell
│   ├── page.tsx                  # Learner entry point (renders LearnerLoader)
│   ├── admin/
│   │   └── page.tsx              # Admin entry point (renders AdminPanel)
│   └── api/
│       ├── workflow/route.ts     # GET/POST the published workflow
│       ├── parse-workflow/route.ts  # Parse uploaded .md into workflow steps
│       ├── upload-slides/route.ts   # Upload images / extract PPTX images
│       ├── parse-quizzes/route.ts   # AI-parse quiz .md into structured JSON
│       └── chat/route.ts         # Claude Sonnet chat with step-navigation
│
├── components/
│   ├── LearnerLoader.tsx         # Client wrapper: fetches workflow, shows LearnerView
│   ├── LearnerView.tsx           # Main learner UI (chat + workbench panels)
│   ├── AdminPanel.tsx            # Multi-step admin setup UI
│   ├── QuizModal.tsx             # Quiz overlay modal
│   └── MdText.tsx                # Lightweight markdown renderer (bold, bullets, numbers)
│
├── lib/
│   ├── store.ts                  # Global in-memory state (workflow + chat history)
│   ├── anthropic.ts              # Anthropic SDK client singleton
│   ├── parseMarkdown.ts          # Parses .md workflow file into WorkflowStep[]
│   └── extractPptx.ts            # Extracts embedded images from .pptx via jszip
│
├── types/
│   └── index.ts                  # Shared TypeScript types
│
├── public/
│   └── uploads/                  # Uploaded slide images served statically
│
└── .env.local                    # ANTHROPIC_API_KEY
```

---

## Data Types (`types/index.ts`)

```ts
// A single step in the workflow
interface WorkflowStep {
  id: string;           // UUID
  title: string;        // Step heading
  description: string;  // Shown in the side panel (supports markdown)
  aiMessage: string;    // Pre-written coach message shown when entering this step
  slideIndex: number;   // Which slide image to show (0-based index into workflow.slides[])
  callout?: string;     // Tip shown below the description
  quiz?: Quiz;          // Optional quiz triggered when leaving this step
}

// A multiple-choice quiz attached to a step
interface Quiz {
  question: string;
  options: string[];    // Exactly 4 options
  correct: number;      // 0-based index of the correct option
  successMsg: string;   // Shown when learner picks the right answer
  wrongMsg: string;     // Shown when learner picks wrong
  badge: string;        // Small badge text e.g. "✓ Got it"
}

// The full published workflow (stored in global memory)
interface Workflow {
  id: string;
  title: string;
  subtitle: string;
  rawMarkdown: string;  // Original .md text — used as Claude's context
  steps: WorkflowStep[];
  slides: string[];     // Public URLs like /uploads/filename.png
}
```

---

## In-Memory Store (`lib/store.ts`)

Stores the currently published workflow and the chat history for the active session.

```
global.__workflowStore = {
  workflow: Workflow | null,
  chatHistory: { role: "user" | "assistant", content: string }[]
}
```

**Why `global`?** In Next.js development mode, API routes and page routes can run as separate module instances. A plain module-level variable would not be shared between them. Attaching to `global` ensures a single shared object across all instances within the same Node.js process.

**Limitation:** This is prototype-only. The store resets on every server restart. For production, replace with a database (e.g. Postgres, Redis, or SQLite via Prisma).

---

## API Routes

### `GET /api/workflow`
Returns the currently published workflow from the in-memory store.

```
Response: { workflow: Workflow | null }
```

### `POST /api/workflow`
Saves a workflow to the in-memory store. Called by the Admin when publishing.

```
Body: Workflow (full JSON object)
Response: { ok: true }
```

---

### `POST /api/parse-workflow`
Parses an uploaded `.md` file into workflow steps.

```
Body: FormData { file: File (.md) }
Response: { title, subtitle, steps: WorkflowStep[] }
```

**How it works (`lib/parseMarkdown.ts`):**
1. Reads optional YAML-style frontmatter (`---`) for `title` and `subtitle`.
2. Splits the file on `## ` headings — each heading becomes one step.
3. Extracts named fields from each block using `**FieldName:**` pattern:
   - `**Description:**` → `step.description`
   - `**AI Message:**` → `step.aiMessage`
   - `**Callout:**` → `step.callout`
   - `**Slide:**` → `step.slideIndex` (1-based in the file, converted to 0-based)

**Expected `.md` format:**
```markdown
---
title: My Workflow
subtitle: Short description
---

## Step 1: Do the first thing
**Description:** What happens here.
**AI Message:** What the coach says when entering this step.
**Callout:** Quick tip shown below the description.
**Slide:** 1
```

---

### `POST /api/upload-slides`
Accepts image files (PNG/JPG/GIF/WEBP) or a `.pptx` file. Returns public URLs.

```
Body: FormData { files: File[] }
Response: { urls: string[] }
```

**How it works:**
- For **images**: writes the file directly to `public/uploads/` and returns `/uploads/filename.ext`.
- For **PPTX** (`lib/extractPptx.ts`):
  1. Loads the `.pptx` as a ZIP using `jszip`.
  2. Finds all files under `ppt/media/` matching image extensions.
  3. Extracts each image as a `Buffer`, writes to `public/uploads/`, returns URLs.
  - Note: PPTX media files are embedded assets (images used inside slides), not rendered slide screenshots. For best results, export slides as PNG directly from PowerPoint.

---

### `POST /api/parse-quizzes`
Sends a quiz `.md` file to Claude and gets back structured quiz JSON mapped to step IDs.

```
Body: FormData {
  file: File (.md quiz file),
  steps: JSON string of [{ id, title }]
}
Response: { mapped: Record<stepId, Quiz>, total: number }
```

**How it works:**
1. Reads the uploaded markdown text.
2. Sends it to Claude Sonnet with a prompt that asks for a JSON array of quiz objects.
3. Claude returns JSON with fields: `stepIndex`, `question`, `options[]`, `correct`, `successMsg`, `wrongMsg`, `badge`.
4. The route extracts the JSON array robustly by finding the first `[` and last `]` in Claude's response (handles accidental markdown fences).
5. Maps each quiz to a step using `stepIndex` (0-based) → `steps[stepIndex].id`.
6. Strips any `✓ CORRECT` markers from option text (used in the human-readable quiz `.md` format).

**Expected quiz `.md` format** (human-readable, Claude understands it):
```markdown
## Step 1 Quiz
Question: Why do we do X?
Options:
  A) Wrong answer
  B) The right reason ✓ CORRECT
  C) Another wrong answer
  D) Also wrong

Success: Correct! Here's why...
Wrong: Not quite. The reason is...
Badge: ✓ Got it
```

---

### `POST /api/chat`
The main AI coach endpoint. Sends a user message to Claude Sonnet and returns a reply, optionally with a step to navigate to.

```
Body: { message: string, stepIndex: number }
Response: { reply: string, goToStep: number | null }
```

**How it works:**

1. Loads the full workflow from the store.
2. Builds a system prompt containing:
   - The full raw markdown workflow (all step content as context)
   - A numbered list of all step titles
   - The current step's title and description
   - Strict communication rules: short, structured, direct, plain language
   - **Navigation rule**: if the answer belongs to a different step, Claude must start the reply with `GOTO_STEP:N` (1-based step number)
3. Sends the full chat history plus the new user message to Claude.
4. Parses the response:
   - If the reply starts with `GOTO_STEP:N`, extracts `N`, converts to 0-based index, strips the token from the reply text.
   - Returns `{ reply, goToStep }` — `goToStep` is `null` if no navigation needed.
5. Saves both the user message and AI reply to the chat history store.

**Navigation example:**
- User is on Step 2, asks "what do I enter as the Calendar ID?"
- Claude knows the answer is in Step 6, prepends `GOTO_STEP:6`
- API returns `{ reply: "Your Calendar ID is your Gmail address...", goToStep: 5 }`
- LearnerView navigates to Step 6 and shows a toast notification

---

## Component Breakdown

### `AdminPanel.tsx`
A 4-phase setup wizard. All state is local to the component (no persistence between page refreshes during setup).

```
Phase 1 — Upload Workflow (.md)
  → POST /api/parse-workflow
  → stores parsed steps in local state

Phase 2 — Upload Slides (images or .pptx)
  → POST /api/upload-slides
  → shows uploaded thumbnails
  → admin assigns each slide to a step via dropdown

Phase 3 — Add Quizzes
  → Option A: Upload quiz .md → POST /api/parse-quizzes → auto-fills quiz editors
  → Option B: Fill in manually via QuizEditor sub-component per step

Phase 4 — Publish
  → POST /api/workflow (saves full Workflow object to global store)
  → redirects to learner view
```

**QuizEditor** (inline sub-component in AdminPanel.tsx):
- Each step gets its own `QuizEditor`.
- Checkbox toggles quiz on/off.
- When toggled on, 4 option inputs appear with radio buttons to mark the correct one.
- Changes propagate up via `onChange(quiz)` callback → updates parent `workflow` state.
- Keyed on `step.id + question` so the component re-initializes when AI auto-fills the quiz data.

---

### `LearnerLoader.tsx`
A client component that runs on mount, fetches `GET /api/workflow`, and renders either:
- A "no workflow" empty state with a link to Admin
- `<LearnerView>` with the fetched workflow

Why a separate loader? The home page (`app/page.tsx`) is a server component. Calling `getWorkflow()` directly there would use a potentially stale server-side module instance. Fetching from the API route on the client ensures fresh data every time.

---

### `LearnerView.tsx`
The main learner UI. Two-panel layout (CSS Grid):

**Left panel — AI Coach chat:**
- Displays a message thread (`messages[]` state).
- First message is the `aiMessage` from `steps[0]` — pre-written, shown immediately.
- When user advances to a new step, the step's `aiMessage` is appended automatically.
- Input box → `POST /api/chat` → appends AI reply → if `goToStep` returned, navigates.
- Prev / Next buttons navigate between steps.
- Next button also triggers the current step's quiz (if any) via `pendingQuiz` state.

**Right panel — Workbench:**
- Shows the slide image for `steps[current].slideIndex`.
- Side card shows `steps[current].title`, `description` (rendered via MdText), and `callout`.
- Progress bar at the bottom: `(current + 1) / steps.length * 100%`.

**Quiz flow:**
- On Next → save `step.quiz` to `pendingQuiz` state BEFORE updating `current`.
- Render `<QuizModal quiz={pendingQuiz}>` — keyed to `pendingQuiz`, not `step.quiz`.
- This avoids a bug where `step` updates to the new step before the modal renders, causing `step.quiz` to be `undefined`.

**Step-jump toast:**
- When `goToStep` is returned from chat API, `setCurrent(goToStep)` + show a toast.
- Toast auto-dismisses after 3.5 seconds.

---

### `MdText.tsx`
A zero-dependency inline markdown renderer. Supports:
- `**bold**` → `<strong>`
- `` `code` `` → `<code>`
- `- bullet` or `• bullet` → dot + text
- `1. numbered` → number + text
- Blank lines → vertical spacer

Used in chat bubbles (AI messages) and the step description side panel.

---

### `QuizModal.tsx`
A full-screen overlay modal with blur backdrop.

- Renders the quiz question and 4 option buttons.
- On option click: marks answered, highlights correct (green) and wrong (red) options.
- Shows `successMsg` or `wrongMsg` feedback.
- "Continue" button calls `onClose()` → clears `pendingQuiz`, hides modal.

---

## End-to-End Flows

### Admin Publishing a Workflow

```
1. Admin opens /admin
2. Uploads workflow.md → POST /api/parse-workflow
   → lib/parseMarkdown splits on ## headings
   → returns { title, subtitle, steps[] }
3. AdminPanel stores steps in local React state

4. Admin uploads slides (PNG or PPTX) → POST /api/upload-slides
   → images saved to public/uploads/
   → if PPTX: lib/extractPptx extracts media files via jszip
   → returns { urls: ["/uploads/img1.png", ...] }
5. Admin assigns slides to steps via dropdown

6. Admin uploads quiz.md → POST /api/parse-quizzes
   → sends markdown + step list to Claude Sonnet
   → Claude returns JSON array of quiz objects
   → route maps quiz[i] → steps[i].id
   → QuizEditor components re-render with parsed data (key trick)

7. Admin clicks Publish → POST /api/workflow
   → global.__workflowStore.workflow = fullWorkflow
   → Admin redirected to /
```

### Learner Using the App

```
1. Learner opens /
2. LearnerLoader mounts → GET /api/workflow
   → returns the published Workflow from global store
3. LearnerView renders:
   - Step 1 slide image displayed
   - Step 1 aiMessage shown in chat
   - Step 1 description + callout in side panel

4. Learner types a question → POST /api/chat
   → Claude receives: full rawMarkdown + all step titles + current step + chat history
   → Claude replies (short, structured, direct)
   → If answer belongs to Step 6: reply starts with GOTO_STEP:6
   → API strips token, returns { reply, goToStep: 5 }
   → LearnerView: appends reply to chat, setCurrent(5), shows toast

5. Learner clicks Next (Step 1 → Step 2)
   → If Step 1 has a quiz: pendingQuiz = step.quiz, setShowQuiz(true)
   → QuizModal appears with Step 1's quiz
   → setCurrent(1) + append Step 2's aiMessage to chat
   → Slide updates to Step 2's assigned image

6. Learner answers quiz
   → Correct/wrong feedback shown
   → Continue → modal closes, pendingQuiz cleared
```

---

## Markdown File Formats Reference

### Workflow `.md`

```markdown
---
title: Workflow Title
subtitle: One-line description
---

## Step 1: Step Title
**Description:** What happens in this step. Supports **bold**, bullet lists, numbered steps.
**AI Message:** Short, punchy coach message shown when entering this step.
**Callout:** Quick tip shown below the description.
**Slide:** 1

## Step 2: Next Step
...
```

### Quiz `.md`

```markdown
## Step 1 Quiz — Topic Name
Question: The quiz question text?
Options:
  A) Wrong option
  B) Correct option ✓ CORRECT
  C) Wrong option
  D) Wrong option

Success: Shown when correct. Explains why.
Wrong: Shown when wrong. Explains the right answer.
Badge: ✓ Got it
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude Sonnet. Set in `.env.local`. |

---

## Known Limitations (Prototype)

| Limitation | Impact | Production Fix |
|---|---|---|
| In-memory store | Resets on server restart | Add Postgres/Redis via Prisma |
| Single workflow | Only one published workflow at a time | Multi-tenant DB model |
| No auth | Anyone can publish or view | Add NextAuth or Clerk |
| Local file storage | Uploads lost on redeploy | Use S3 / Cloudflare R2 |
| PPTX → images | Extracts embedded media, not rendered slides | Use LibreOffice or a render API |
| Chat history | Shared across all learners (same server memory) | Session-based history per user |
