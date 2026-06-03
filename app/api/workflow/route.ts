import { NextResponse } from "next/server";
import { getWorkflow, setWorkflow } from "@/lib/store";
import { Workflow } from "@/types";

export async function GET() {
  const workflow = getWorkflow();
  if (!workflow) {
    return NextResponse.json({ workflow: null });
  }
  return NextResponse.json({ workflow });
}

export async function POST(req: Request) {
  const body: Workflow = await req.json();
  setWorkflow(body);
  return NextResponse.json({ ok: true });
}
