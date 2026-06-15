"use client";

const GROUP_ACCENT: Record<string, string> = {
  Features:  "#A855F7",
  Apps:      "#EC4899",
  Workflows: "#F68A29",
  Skills:    "#3699FC",
};
const ACCENT_FALLBACK = "#623CEA";

export type ApplyVideo = {
  id: string; title: string; description: string | null; video_url: string | null;
  thumbnail_url: string | null; duration: string | null; order_index: number;
  is_locked: boolean; group_name: string | null; category_tag: string | null;
  platforms?: string | null;
};

function parsePlatforms(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.includes("|")
    ? raw.split("|").map(s => s.trim()).filter(Boolean)
    : raw.split(",").map(s => s.trim()).filter(Boolean);
}

export default function VideoModal({
  video, isLoggedIn, onClose,
}: { video: ApplyVideo; isLoggedIn: boolean; onClose: () => void }) {
  const accent = GROUP_ACCENT[video.group_name ?? ""] ?? ACCENT_FALLBACK;
  const platforms = parsePlatforms(video.platforms);
  const isYouTube = video.video_url?.includes("youtube.com") || video.video_url?.includes("youtu.be");
  const isLocked = !isLoggedIn && video.is_locked;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,.55)", backdropFilter: "blur(5px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: "relative", width: "min(640px,100%)" }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 10,
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(0,0,0,.55)", border: 0, cursor: "pointer",
            color: "#fff", fontSize: 20, fontWeight: 700,
            display: "grid", placeItems: "center",
          }}
        >×</button>

        <div className="aif-modal-scroll" style={{
          background: "#fff", borderRadius: 20, overflow: "hidden",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,.35)",
        }}>
          <div style={{
            position: "relative", background: "#0f0a18",
            aspectRatio: "16 / 9",
          }}>
            {video.video_url && !isLocked ? (
              isYouTube ? (
                <iframe
                  src={video.video_url}
                  title={video.title}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                  allowFullScreen
                />
              ) : (
                <video
                  src={video.video_url}
                  controls
                  autoPlay
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                />
              )
            ) : (
              <>
                {video.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }}
                  />
                )}
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(155deg,${accent} 0%,#1a1030 48%,#0f0a18 100%)`,
                  opacity: video.thumbnail_url ? 0.7 : 1,
                }} />
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 42, position: "relative", zIndex: 1 }}>🔒</span>
                </div>
              </>
            )}
          </div>

          <div style={{ padding: "20px 24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{
                background: accent + "22", color: accent,
                padding: "3px 11px", borderRadius: 999,
                fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase",
              }}>{video.group_name ?? "Feature"}</span>
              {video.category_tag && (
                <span style={{
                  background: "#F5F3F0", color: "#6B6670",
                  padding: "3px 11px", borderRadius: 999,
                  fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                }}>{video.category_tag}</span>
              )}
            </div>

            <h2 style={{
              margin: "0 0 10px", fontSize: 20, fontWeight: 900,
              lineHeight: 1.2, letterSpacing: "-.04em", color: "#221D23",
            }}>{video.title}</h2>

            {video.description && (
              <p style={{
                margin: "0 0 18px", fontSize: 14, lineHeight: 1.65,
                color: "#4A4450", fontWeight: 500,
                whiteSpace: "pre-line",
              }}>
                {video.description.split("\n\n")[0]}
              </p>
            )}

            {platforms.length > 0 && (
              <div>
                <p style={{
                  margin: "0 0 8px", fontSize: 11, fontWeight: 800,
                  letterSpacing: ".1em", textTransform: "uppercase", color: "#9B9199",
                }}>Available in</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {platforms.map(p => (
                    <span key={p} style={{
                      background: "#F5F3F0", padding: "5px 13px", borderRadius: 999,
                      fontSize: 12, fontWeight: 650, color: "#221D23",
                    }}>{p}</span>
                  ))}
                </div>
              </div>
            )}

            {isLocked && (
              <a href="/login" style={{
                display: "inline-block", marginTop: 18,
                background: "#221D23", color: "#FFCE00", fontWeight: 800, fontSize: 14,
                padding: "10px 22px", borderRadius: 999, textDecoration: "none",
              }}>Sign in to unlock</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
