# PPTX → Activity JSON Prompt

Paste this entire prompt into Claude, then attach your PPTX file.

---

```
I'm attaching a PPTX file. Convert it into a structured activity JSON file for a learning platform.

---

## STEP 1 — EXTRACT SLIDE CONTENT

Before writing any JSON, read every slide in order.

Rules:
- If a slide has speaker notes with meaningful content → use speaker notes as the primary source.
- If speaker notes are empty or only contain page numbers like ‹#› → use the slide body text.
- Do not summarize at this stage. Preserve the full meaning.

Show the extraction like this:

Slide 1: [source: speaker notes / slide text] → [first 150 chars of content]
Slide 2: [source: speaker notes / slide text] → [first 150 chars of content]
...

---

## STEP 2 — GENERATE JSON FILE

After showing the extraction, output ONE JSON file named: [filename]_activity.json

The JSON must follow this exact structure. Do not add or remove keys.

{
  "activity": {
    "title": "[Workflow title from the PPTX topic]",
    "subtitle": "[One-line description of what this workflow teaches]",
    "source_file": "[PPTX filename]",
    "total_steps": [number — must equal total slides]
  },
  "steps": [
    {
      "step_number": 1,
      "slide_number": 1,
      "title": "[Step title from slide heading or first key idea]",
      "what_learner_sees": "[Describe the visible screen or UI context on this slide — mention buttons, menus, labels, toggles, or visual cues if present. One to three sentences.]",
      "what_this_means": "[Explain the intent, feature behavior, or system logic for this slide. Why does this step exist? What changes when the learner does it? One to three sentences.]",
      "what_to_do": [
        "[Exact learner action 1 — bold important UI labels with **label**]",
        "[Exact learner action 2]"
      ],
      "if_stuck": "[Troubleshooting guidance from speaker notes. If none exists, write: Not specified in this slide.]",
      "callout": "[Single most important tip, warning, or reminder from this slide. Max 12 words. If none, write empty string.]",
      "coach_next": "[Short closing prompt to the learner — confirm they are ready and point to the next action. One sentence. Examples: 'Settings open? Move to the next step.' or 'Toggle blue? Move on.']"
    }
  ]
}

---

## FIELD RULES

what_learner_sees
- Describe what is visually on screen when arriving at this slide.
- Include UI elements: open modals, selected tabs, visible buttons, highlighted rows, toggle states, loading indicators.
- If the slide is a title or intro slide, describe what the learner sees at that stage of the workflow.

what_this_means
- Explain the purpose or system behavior — not just what to click, but WHY this step matters.
- Preserve details about feature behavior, what changes, what the system does in response.
- Do not copy what_to_do here. This is meaning, not action.

what_to_do
- Must be a JSON array of strings — never a single string with bullets inside.
- Each item is one discrete action: click, toggle, select, paste, copy, wait, return.
- Bold UI labels, button names, tab names, toggle names using **label** syntax.
- Keep each item short and imperative.

if_stuck
- If speaker notes mention troubleshooting, edge cases, or what to do when something goes wrong — include it here.
- If nothing exists, write exactly: Not specified in this slide.
- Never write "N/A" or leave it blank.

callout
- The single most important tip or warning for this step.
- Max 12 words. Plain text. No markdown.
- If nothing stands out, write empty string: ""

coach_next
- A short, natural sentence a coach would say to close this step.
- Should confirm the learner is done and signal what comes next.
- Examples: "Both toggles on? Ready for the next step." / "Got the output text? Go back to Claude to paste it."

---

## JSON RULES

- Every string[] field (what_to_do) must be a real JSON array, never a string.
- if_stuck must always be a string — never null or omitted.
- step_number and slide_number must be integers, not strings.
- total_steps must exactly equal the number of objects in the steps array.
- Do not wrap JSON in a markdown code block. Output raw JSON only.
- Do not create any other file or section after the JSON.

---

## TONE AND STYLE

- what_learner_sees and what_this_means: clear, factual, one to three sentences.
- what_to_do: short, direct, imperative. Bold the important labels.
- if_stuck: practical recovery guidance only.
- callout: punchy, memorable, max 12 words.
- coach_next: conversational, warm, closes the step cleanly.
- Do not invent details not present in the slide or speaker notes.
- Do not merge slides or skip title slides.
- Every slide becomes exactly one step. Total steps = total slides.
```
