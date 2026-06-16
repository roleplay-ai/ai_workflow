"use client";

export type FoundationModule = {
  id: string;
  title: string;
  emoji: string;
  description?: string | null;
  concepts: string[];
  sort_order: number;
  is_locked: boolean;
  next_module_hint: string | null;
  html_path: string | null;
};

export const MODULE_CARD_COLORS = [
  "#FFCE00", "#3696FC", "#623CEA", "#23CE68", "#F68A29", "#ED4551",
  "#623CEA", "#3696FC", "#F68A29", "#FFCE00",
];

export function moduleSubtitle(mod: FoundationModule): string {
  if (mod.description?.trim()) return mod.description.trim();
  if (mod.concepts.length > 0) return mod.concepts[0];
  return "";
}

type Props = {
  module: FoundationModule;
  accentColor: string;
  onClick: () => void;
  disabled?: boolean;
  done?: boolean;
};

export default function FoundationModuleCard({ module, accentColor, onClick, disabled, done }: Props) {
  const sub = moduleSubtitle(module);
  const lightTop = accentColor === "#FFCE00";

  return (
    <div className="aif-foundation-card-slot">
      <button
        type="button"
        className="aif-foundation-card"
        onClick={onClick}
        disabled={disabled}
        aria-label={`Learn about ${module.title}`}
      >
      <div className="aif-foundation-card-top" style={{ background: accentColor }}>
        <span
          className="aif-foundation-card-emoji"
          style={{ filter: module.is_locked ? "grayscale(0.4)" : undefined }}
        >
          {module.is_locked ? "🔒" : module.emoji}
        </span>
      </div>
      <div className="aif-foundation-card-body">
        <div className="aif-foundation-card-topic">{module.title}</div>
        <div className="aif-foundation-card-sub">{sub || "\u00A0"}</div>
        <span
          className="aif-foundation-card-cta"
          style={lightTop ? { color: "#221D23" } : undefined}
        >
          {done ? "Done ✓" : "Learn →"}
        </span>
      </div>
      </button>
    </div>
  );
}
