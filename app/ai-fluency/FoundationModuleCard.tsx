"use client";

import FoundationCardIcon from "./FoundationCardIcon";
import { getFoundationCardTheme } from "./foundationCardThemes";

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

export function moduleSubtitle(mod: FoundationModule): string {
  if (mod.description?.trim()) return mod.description.trim();
  if (mod.concepts.length > 0) return mod.concepts[0];
  return "";
}

type Props = {
  module: FoundationModule;
  themeIndex?: number;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  done?: boolean;
};

export default function FoundationModuleCard({ module, themeIndex = 0, onClick, disabled, loading, done }: Props) {
  const sub = moduleSubtitle(module);
  const theme = getFoundationCardTheme(module.title, themeIndex);

  return (
    <div className="aif-foundation-card-slot">
      <button
        type="button"
        className={`aif-foundation-card${loading ? " is-loading" : ""}`}
        onClick={onClick}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-label={`Learn about ${module.title}`}
        style={{
          ["--aif-foundation-soft" as string]: theme.soft,
          ["--aif-foundation-accent" as string]: theme.accent,
        }}
      >
        <div className="aif-foundation-card-badge">
          {module.is_locked ? (
            <span className="aif-foundation-card-lock" aria-hidden="true">🔒</span>
          ) : (
            <FoundationCardIcon name={theme.icon} />
          )}
        </div>
        <div className="aif-foundation-card-topic">{module.title}</div>
        <div className="aif-foundation-card-sub">{sub || "\u00A0"}</div>
        <span className="aif-foundation-card-cta">
          {loading ? "Loading…" : done ? "Done ✓" : "Learn →"}
        </span>
        {loading && (
          <div className="aif-foundation-card-loading" aria-hidden="true">
            <span className="aif-foundation-card-spinner" />
          </div>
        )}
      </button>
    </div>
  );
}
