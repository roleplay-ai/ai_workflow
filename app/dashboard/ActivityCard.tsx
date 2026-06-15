"use client";
import Link from "next/link";
import type { Activity } from "@/lib/supabase/types";
import { normalizeActivityTools } from "@/lib/tools";
import { type ToolLogoMap } from "@/lib/toolLogos";
import RotatingTools from "@/components/RotatingTools";

// ── Scene theme system ─────────────────────────────────────────────────────

type LeftEl = "spreadsheet" | "person-purple" | "person-green" | "person-red" | "doc-stack" | "ticket-cloud";
type RightEl = "deck" | "scorecard" | "result-card" | "tool-ui" | "theme-map";
type SparkV = "s1" | "s2";

export type SceneTheme = {
  posterColor: "green" | "blue" | "purple" | "orange" | "warm";
  left: LeftEl;
  right: RightEl;
  spark?: SparkV;
};

const THEMES: SceneTheme[] = [
  { posterColor: "green", left: "spreadsheet", right: "deck", spark: "s1" },
  { posterColor: "blue", left: "person-purple", right: "scorecard", spark: "s1" },
  { posterColor: "purple", left: "doc-stack", right: "result-card", spark: "s2" },
  { posterColor: "orange", left: "person-green", right: "tool-ui", spark: "s1" },
  { posterColor: "blue", left: "ticket-cloud", right: "theme-map" },
  { posterColor: "green", left: "doc-stack", right: "tool-ui", spark: "s1" },
  { posterColor: "purple", left: "spreadsheet", right: "result-card", spark: "s2" },
];

export function getTheme(id: string): SceneTheme {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = ((h << 5) - h) + id.charCodeAt(i); h |= 0; }
  return THEMES[Math.abs(h) % THEMES.length];
}

export function timeLabel(a: Activity): string {
  if (a.time_estimate_minutes) return `${a.time_estimate_minutes} min`;
  if (a.points) return `${a.points} pts`;
  return "";
}

// ── Illustration sub-components ────────────────────────────────────────────

function Person({ shirt }: { shirt: "red" | "purple" | "green" }) {
  return (
    <div className={`person ${shirt}-shirt`}>
      <span className="hair" /><span className="head" /><span className="body" />
      <span className="arm left" /><span className="arm right" />
      <span className="leg left" /><span className="leg right" />
    </div>
  );
}

export function Scene({ theme }: { theme: SceneTheme }) {
  const left =
    theme.left === "spreadsheet" ? <div className="spreadsheet" /> :
      theme.left === "doc-stack" ? <div className="document-stack"><span className="doc" /><span className="doc" /><span className="doc" /></div> :
        theme.left === "ticket-cloud" ? <div className="ticket-cloud"><span className="ticket" /><span className="ticket" /><span className="ticket" /></div> :
          theme.left === "person-purple" ? <Person shirt="purple" /> :
            theme.left === "person-green" ? <Person shirt="green" /> :
              <Person shirt="red" />;

  const right =
    theme.right === "deck" ? <div className="deck" /> :
      theme.right === "scorecard" ? <div className="scorecard" /> :
        theme.right === "result-card" ? <div className="result-card" /> :
          theme.right === "tool-ui" ? <div className="tool-ui" /> :
            <div className="theme-map"><span /><span /><span /></div>;

  return (
    <div className="scene">
      {left}
      <div className="arrow-flow" />
      {right}
      {theme.spark && <div className={`spark ${theme.spark}`} />}
    </div>
  );
}

// ── ActivityCard ───────────────────────────────────────────────────────────

export type CardVariant = "default" | "dark" | "yellow";

const MAX_VISIBLE_TAGS = 5;

function resolveTagLogoUrl(tag: string, tagLogos: Record<string, string>): string | null {
  return tagLogos[tag.toLowerCase()] ?? null;
}

function TagLogosRow({
  tags,
  tagLogos,
  variant,
}: {
  tags: string[];
  tagLogos: Record<string, string>;
  variant: CardVariant;
}) {
  if (tags.length === 0) return null;

  const visible = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflow = tags.length - MAX_VISIBLE_TAGS;

  return (
    <div className="card-tag-row" aria-label={`${tags.length} tag${tags.length !== 1 ? "s" : ""}`}>
      {visible.map(tag => {
        const url = resolveTagLogoUrl(tag, tagLogos);
        return url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={tag}
            className="card-tag-logo"
            src={url}
            alt={tag}
            title={tag}
          />
        ) : (
          <span key={tag} className="card-tag-fallback" title={tag}>
            {tag.slice(0, 1).toUpperCase()}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className={`card-tag-overflow${variant === "dark" ? " card-tag-overflow--dark" : ""}`}>
          +{overflow}
        </span>
      )}
    </div>
  );
}

export type ActivityCardProps = {
  activity: Activity;
  /** Border-colour style injected by the parent rail (hover/focus state) */
  focusStyle?: React.CSSProperties;
  isLoggedIn: boolean;
  onSignUpRequired: () => void;
  toolLogos: ToolLogoMap;
  tagLogos: Record<string, string>;
  variant?: CardVariant;
};

export default function ActivityCard({
  activity,
  focusStyle,
  isLoggedIn,
  onSignUpRequired,
  toolLogos,
  tagLogos,
  variant = "default",
}: ActivityCardProps) {
  const theme = getTheme(activity.id);
  const tools = normalizeActivityTools(activity.tools);
  const chip = timeLabel(activity);
  const isLocked = !isLoggedIn && !!activity.is_locked;

  const cardClass = `workflow-card${variant === "dark" ? " dark-card" : variant === "yellow" ? " yellow-card" : ""}`;
  const chipBorderColor = variant === "dark" ? "rgba(255,255,255,0.22)" : "#E5E0D8";
  const chipLabelColor = "#221D23"; // RotatingTools always has white bg

  const inner = (
    <>
      {activity.is_featured && <span className="new-badge">New</span>}

      {/* ── Poster ── */}
      <div className={`card-poster ${theme.posterColor}${activity.thumbnail_url ? " has-thumbnail" : ""}`}>
        {activity.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="card-thumbnail"
            src={activity.thumbnail_url}
            alt={activity.title}
          />
        ) : (
          <Scene theme={theme} />
        )}

        {/* Lock overlay */}
        {isLocked && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 4,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(34,29,35,0.52)", backdropFilter: "blur(3px)",
            borderRadius: "inherit", gap: 6,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
            }}>🔒</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: ".02em" }}>
              Sign in to unlock
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="card-body">
        <div className="meta-line">
          {tools.length > 0 && (
            <RotatingTools
              tools={tools}
              toolLogos={toolLogos}
              iconSize={14}
              insetScale={0.9}
              borderColor={chipBorderColor}
              labelColor={chipLabelColor}
              labelSize={10}
              chipStyle={{ padding: "6px 9px 6px 6px", fontWeight: 900 }}
            />
          )}
          {/* {chip && <span className="time-chip">{chip}</span>} */}
        </div>
        <h3 className="card-title">{activity.title}</h3>
        <TagLogosRow tags={activity.tags ?? []} tagLogos={tagLogos} variant={variant} />
        {/* <p className="card-desc">{activity.description}</p> */}
      </div>
    </>
  );

  if (isLocked) {
    return (
      <div
        className={cardClass}
        style={{ ...focusStyle, cursor: "pointer" }}
        onClick={onSignUpRequired}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onSignUpRequired(); }}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link href={`/activity/${activity.id}`} className={cardClass} style={focusStyle}>
      {inner}
    </Link>
  );
}
