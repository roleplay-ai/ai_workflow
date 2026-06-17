import "./BriefNewsCard.css";

export type BriefNewsItem = { id: string; content: string; sort_order: number };

export function formatBriefNewsDate() {
  const date = new Date();
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function NewsItemIcon({ variant }: { variant: number }) {
  if (variant % 3 === 1) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 6h4" />
        <path d="M9 6a3 3 0 0 1 6 0" />
        <path d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z" />
        <path d="M8 13h8" />
      </svg>
    );
  }
  if (variant % 3 === 2) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 5 6v5c0 4.6 3 8.4 7 10 4-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h12a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z" />
      <path d="M18 9h2v8a2 2 0 0 1-2 2" />
      <path d="M8 9h6" />
      <path d="M8 13h6" />
    </svg>
  );
}

type Props = {
  items: BriefNewsItem[];
  className?: string;
};

export default function BriefNewsCard({ items, className }: Props) {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order).slice(0, 3);

  return (
    <article className={className ? `brief-news-card ${className}` : "brief-news-card"}>
      <div className="brief-news-top">
        <h2>Latest AI News</h2>
        <div className="brief-news-date-pill">{formatBriefNewsDate()}</div>
      </div>

      {sorted.length > 0 ? (
        <div className="brief-news-list">
          {sorted.map((item, i) => (
            <div key={item.id} className="brief-news-item">
              <div className="brief-news-icon">
                <NewsItemIcon variant={i} />
              </div>
              <h3>{item.content}</h3>
            </div>
          ))}
        </div>
      ) : (
        <div className="brief-news-empty">No updates available yet</div>
      )}
    </article>
  );
}
