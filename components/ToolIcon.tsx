import type { ToolLogoMap } from "@/lib/toolLogos";

const TOOL_FALLBACK: Record<string, { bg: string; label: string }> = {
  gemini: { bg: "linear-gradient(135deg,#4285f4,#a142f4)", label: "G" },
  chatgpt: { bg: "#10a37f", label: "C" },
  copilot: { bg: "linear-gradient(135deg,#00a4ef,#7fba00)", label: "Co" },
  drive: { bg: "#fbbc04", label: "D" },
  sheets: { bg: "#0f9d58", label: "S" },
  gmail: { bg: "#ea4335", label: "M" },
  calendar: { bg: "#1a73e8", label: "Ca" },
  vapi: { bg: "#111827", label: "V" },
  wati: { bg: "#22c55e", label: "W" },
  lovable: { bg: "#ff477e", label: "L" },
  napkin: { bg: "#8b5cf6", label: "N" },
  "ai-studio": { bg: "#3b82f6", label: "AI" },
  notebooklm: { bg: "#fbbc04", label: "NB" },
  claude: { bg: "#D97757", label: "Cl" },
};

type Props = {
  tool: string;
  size?: number;
  logos?: ToolLogoMap;
  /** Logo size as a fraction of the box (e.g. 0.9 = 90%). */
  insetScale?: number;
};

export default function ToolIcon({ tool, size = 18, logos, insetScale = 1 }: Props) {
  const key = tool.toLowerCase();
  const url = logos?.[key];

  if (url) {
    const imgSize = Math.round(size * insetScale);
    const img = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={tool}
        width={imgSize}
        height={imgSize}
        style={{
          borderRadius: "50%",
          flexShrink: 0,
          display: "block",
          objectFit: insetScale < 1 ? "contain" : "cover",
          background: "transparent",
        }}
      />
    );
    if (insetScale >= 1) return img;
    return (
      <span
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {img}
      </span>
    );
  }

  const logo = TOOL_FALLBACK[key] ?? { bg: "#888", label: tool.slice(0, 2).toUpperCase() };
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-grid",
        placeItems: "center",
        fontSize: Math.max(7, size * 0.44),
        fontWeight: 900,
        color: "white",
        background: logo.bg,
        flexShrink: 0,
      }}
    >
      {logo.label}
    </span>
  );
}
