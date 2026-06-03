"use client";
import { useEffect, useState } from "react";
import { Workflow } from "@/types";
import LearnerView from "./LearnerView";
import Link from "next/link";

export default function LearnerLoader() {
  const [workflow, setWorkflow] = useState<Workflow | null | "loading">("loading");

  useEffect(() => {
    fetch("/api/workflow")
      .then((r) => r.json())
      .then((d) => setWorkflow(d.workflow ?? null))
      .catch(() => setWorkflow(null));
  }, []);

  if (workflow === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm font-semibold">Loading workflow…</div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🎓</div>
          <h1 className="text-2xl font-black tracking-tight mb-2">Guided AI Workbench</h1>
          <p className="text-slate-500 text-sm font-medium mb-6">
            No workflow published yet. Set one up in the Admin panel.
          </p>
          <Link href="/admin"
            className="inline-block px-6 py-3 rounded-2xl text-white text-sm font-black"
            style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
            Go to Admin Panel →
          </Link>
        </div>
      </div>
    );
  }

  return <LearnerView workflow={workflow} />;
}
