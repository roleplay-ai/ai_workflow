import { NextResponse } from "next/server";
import { parseMarkdownWorkflow } from "@/lib/parseMarkdown";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const parsed = parseMarkdownWorkflow(text);

  return NextResponse.json(parsed);
}
