import type { FoundationIconName } from "./foundationCardThemes";

const ICON_PATHS: Record<FoundationIconName, React.ReactNode> = {
  tokens: (
    <>
      <circle className="aif-foundation-icon-outline" cx="32" cy="32" r="22" />
      <circle className="aif-foundation-icon-outline" cx="32" cy="32" r="12" />
      <path className="aif-foundation-icon-accent-line" d="M32 18v28" />
      <path className="aif-foundation-icon-ink-line" d="M24 24c0-5 16-5 16 1 0 5-16 5-16 12 0 5 16 5 16 0" />
    </>
  ),
  context: (
    <>
      <rect className="aif-foundation-icon-outline" x="12" y="13" width="40" height="36" rx="6" />
      <path className="aif-foundation-icon-ink-line" d="M12 24h40M20 33h24M20 40h18" />
      <circle className="aif-foundation-icon-accent" cx="20" cy="19" r="3" />
      <circle className="aif-foundation-icon-accent" cx="30" cy="19" r="3" />
    </>
  ),
  tool: (
    <>
      <rect className="aif-foundation-icon-outline" x="29" y="14" width="23" height="32" rx="6" />
      <path className="aif-foundation-icon-ink-line" d="M35 24h10M35 32h7M35 40h11" />
      <path className="aif-foundation-icon-accent" d="M12 16v31l9-9 5 13 8-3-6-13h12z" />
    </>
  ),
  agent: (
    <>
      <rect className="aif-foundation-icon-outline" x="13" y="18" width="38" height="27" rx="7" />
      <path className="aif-foundation-icon-ink-line" d="M32 10v8" />
      <circle className="aif-foundation-icon-accent" cx="32" cy="9" r="4" />
      <rect className="aif-foundation-icon-accent" x="20" y="27" width="8" height="8" rx="2" />
      <rect className="aif-foundation-icon-accent" x="37" y="27" width="8" height="8" rx="2" />
      <path className="aif-foundation-icon-ink-line" d="M24 40h16" />
    </>
  ),
  api: (
    <>
      <rect className="aif-foundation-icon-outline" x="8" y="20" width="17" height="25" rx="4" />
      <rect className="aif-foundation-icon-outline" x="39" y="20" width="17" height="25" rx="4" />
      <path className="aif-foundation-icon-accent-line" d="M26 27h10M33 23l4 4-4 4M38 38H28M31 34l-4 4 4 4" />
    </>
  ),
  branch: (
    <>
      <path className="aif-foundation-icon-ink-line" d="M32 50V32M32 32 18 20M32 32l14-12" />
      <circle className="aif-foundation-icon-outline" cx="17" cy="16" r="8" />
      <circle className="aif-foundation-icon-accent" cx="17" cy="16" r="3" />
      <path className="aif-foundation-icon-accent" d="M47 8l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
    </>
  ),
  image: (
    <>
      <rect className="aif-foundation-icon-outline" x="12" y="14" width="39" height="35" rx="6" />
      <circle className="aif-foundation-icon-accent" cx="40" cy="24" r="6" />
      <path className="aif-foundation-icon-ink-line" d="M17 45l13-17 14 17" />
      <path className="aif-foundation-icon-accent-line" d="M8 12v7M4 16h8M55 46v7M51 50h8" />
    </>
  ),
  memory: (
    <>
      <path className="aif-foundation-icon-outline" d="M32 48c-13 0-22-8-22-20 0-9 7-16 16-15 2-6 12-6 14 0 9-1 16 6 16 15 0 12-10 20-24 20z" />
      <path className="aif-foundation-icon-ink-line" d="M20 29c4-5 7 5 10 0M36 29c4-5 7 5 10 0M20 38c4-5 7 5 10 0" />
      <path className="aif-foundation-icon-accent-line" d="M23 17l18 27M42 17 23 44" />
    </>
  ),
  code: (
    <>
      <path className="aif-foundation-icon-accent-line" d="M25 17 12 32l13 15M39 17l13 15-13 15" />
      <path className="aif-foundation-icon-ink-line" d="M37 16 27 48" />
    </>
  ),
  chart: (
    <>
      <rect className="aif-foundation-icon-outline" x="11" y="39" width="10" height="13" rx="2" />
      <rect className="aif-foundation-icon-outline" x="27" y="29" width="10" height="23" rx="2" />
      <rect className="aif-foundation-icon-outline" x="43" y="17" width="10" height="35" rx="2" />
      <path className="aif-foundation-icon-accent-line" d="M16 35 32 24l17-13M43 9l7 2-2 8" />
    </>
  ),
};

type Props = {
  name: FoundationIconName;
};

export default function FoundationCardIcon({ name }: Props) {
  return (
    <span className="aif-foundation-card-icon" aria-hidden="true">
      <svg viewBox="0 0 64 64">{ICON_PATHS[name]}</svg>
    </span>
  );
}
