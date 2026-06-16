export function formatViewCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

function EyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function ViewCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      className="card-view-count"
      title={`${count} view${count !== 1 ? "s" : ""}`}
      style={{
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        fontWeight: 800,
        color: "#221D23",
        background: "#FFCE00",
        borderRadius: 20,
        padding: "3px 7px 3px 5px",
        letterSpacing: ".01em",
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      <EyeIcon />
      {formatViewCount(count)}
    </span>
  );
}
