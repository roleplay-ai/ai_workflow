"use client";

import Link from "next/link";
import { recordFluencyView } from "@/lib/fluencyViews";
import { formatToolLabel, normalizeToolSlug } from "@/lib/tools";
import { resolveToolLogoUrl, type ToolLogoMap } from "@/lib/toolLogos";

export type ToolGuide = {
  id: string;
  name: string;
  logo_letter: string;
  description: string;
  accent_color: string;
  bg_color: string;
  border_color: string;
  guide_url: string | null;
  company_name?: string | null;
  strengths?: string[] | null;
  update_label?: string | null;
  update_date?: string | null;
  theme_key?: string | null;
};

const THEME_KEYS = ["claude", "gpt", "gemini", "copilot"] as const;
type ThemeKey = (typeof THEME_KEYS)[number];

const THEME_TO_SLUG: Record<string, string> = {
  claude: "claude",
  gpt: "chatgpt",
  gemini: "gemini",
  copilot: "copilot",
};

function resolveThemeKey(themeKey: string | null | undefined, sortIndex: number): ThemeKey {
  if (themeKey && THEME_KEYS.includes(themeKey as ThemeKey)) return themeKey as ThemeKey;
  return THEME_KEYS[sortIndex % THEME_KEYS.length];
}

function resolveGuideToolSlug(guide: ToolGuide): string {
  if (guide.theme_key && THEME_TO_SLUG[guide.theme_key]) return THEME_TO_SLUG[guide.theme_key];
  return normalizeToolSlug(guide.name);
}

export { resolveGuideToolSlug };

function guideInitials(slug: string): string {
  const label = formatToolLabel(slug);
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return label.slice(0, 2);
}

type Props = {
  guide: ToolGuide;
  sortIndex: number;
  toolLogos: ToolLogoMap;
  deepDiveId?: string | null;
  linkExternal?: boolean;
};

export default function ToolGuideCard({ guide, sortIndex, toolLogos, deepDiveId, linkExternal }: Props) {
  const theme = resolveThemeKey(guide.theme_key, sortIndex);
  const slug = resolveGuideToolSlug(guide);
  const logoUrl = resolveToolLogoUrl(slug, toolLogos);
  const strengths = guide.strengths?.filter(Boolean) ?? [];
  const showUpdate = guide.update_label || guide.update_date;

  return (
    <article className={`aif-tool-guide-card aif-tool-guide-card--${theme}`}>
      <div className="aif-tool-guide-card-header">
        <div className={`aif-tool-guide-logo${logoUrl ? " aif-tool-guide-logo--img" : ""}`}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" />
          ) : (
            guideInitials(slug)
          )}
        </div>
        <div>
          <div className="aif-tool-guide-name">{guide.name}</div>
          {guide.company_name && (
            <div className="aif-tool-guide-by">by {guide.company_name}</div>
          )}
        </div>
      </div>

      <div className="aif-tool-guide-body">
        {guide.description && (
          <p className="aif-tool-guide-desc">{guide.description}</p>
        )}
        {strengths.length > 0 && (
          <div className="aif-tool-guide-strengths">
            {strengths.map((s) => (
              <div key={s} className="aif-tool-guide-str">
                <span className="aif-tool-guide-str-dot" aria-hidden />
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="aif-tool-guide-footer">
        {showUpdate && (
          <span className="aif-tool-guide-pill">
            <span className="aif-tool-guide-pill-sym" aria-hidden>↻</span>
            {guide.update_label}
            {guide.update_label && guide.update_date && (
              <span className="aif-tool-guide-pill-sep" aria-hidden>·</span>
            )}
            {guide.update_date && (
              <span className="aif-tool-guide-pill-date">{guide.update_date}</span>
            )}
          </span>
        )}
        {guide.guide_url ? (
          linkExternal ? (
            <a
              href={guide.guide_url}
              className="aif-tool-guide-explore"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordFluencyView(deepDiveId ? "deep_dive" : "tool_guide", deepDiveId ?? guide.id)}
            >
              Explore guide <span aria-hidden>→</span>
            </a>
          ) : (
            <Link
              href={guide.guide_url}
              className="aif-tool-guide-explore"
              onClick={() => recordFluencyView(deepDiveId ? "deep_dive" : "tool_guide", deepDiveId ?? guide.id)}
            >
              Explore guide <span aria-hidden>→</span>
            </Link>
          )
        ) : (
          <span className="aif-tool-guide-explore aif-tool-guide-explore--disabled">
            Guide coming soon
          </span>
        )}
      </div>
    </article>
  );
}
