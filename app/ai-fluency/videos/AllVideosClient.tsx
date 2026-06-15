"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";

const GROUP_ACCENT: Record<string, string> = {
  Features:  "#A855F7",
  Apps:      "#EC4899",
  Workflows: "#F68A29",
  Skills:    "#3699FC",
};
const GROUP_ORDER = ["Features", "Apps", "Workflows", "Skills"] as const;
const ACCENT_FALLBACK = "#623CEA";

type ApplyVideo = {
  id: string; title: string; description: string | null; video_url: string | null;
  thumbnail_url: string | null; duration: string | null; order_index: number;
  is_locked: boolean; group_name: string | null; category_tag: string | null;
  platforms: string | null;
};

type Props = {
  videos: ApplyVideo[];
  isLoggedIn: boolean;
  userName: string | null;
  isAdmin: boolean;
};

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function AutoVideoThumbnail({ videoUrl }: { videoUrl: string }) {
  const ytId = extractYouTubeId(videoUrl);
  if (ytId) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
  }
  return (
    <video
      src={videoUrl}
      preload="metadata"
      muted
      playsInline
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 1; }}
    />
  );
}

function parsePlatforms(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.includes("|")
    ? raw.split("|").map(s => s.trim()).filter(Boolean)
    : raw.split(",").map(s => s.trim()).filter(Boolean);
}

function VideoModal({ video, isLoggedIn, onClose }: { video: ApplyVideo; isLoggedIn: boolean; onClose: () => void }) {
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
      {/* Outer wrapper: position:relative so close btn can float above overflow:hidden inner */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: "relative", width: "min(640px,100%)" }}
      >
        {/* Close button */}
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

        {/* Scrollable content */}
        <div className="aif-modal-scroll" style={{
          background: "#fff", borderRadius: 20, overflow: "hidden",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,.35)",
        }}>
          {/* Video player */}
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

          {/* Info */}
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

export default function AllVideosClient({ videos, isLoggedIn, userName, isAdmin }: Props) {
  const [filter, setFilter] = useState<string>("All");
  const [selectedVideo, setSelectedVideo] = useState<ApplyVideo | null>(null);

  const filtered = filter === "All" ? videos : videos.filter(v => v.group_name === filter);

  // Locked videos (for guests) always appear last
  const displayVideos = [...filtered].sort((a, b) => {
    const aLocked = !isLoggedIn && a.is_locked ? 1 : 0;
    const bLocked = !isLoggedIn && b.is_locked ? 1 : 0;
    return aLocked - bLocked;
  });

  return (
    <>
      <AppNav activePage="ai-fluency" userName={userName} isAdmin={isAdmin} />

      <main style={{ width: "min(1200px,calc(100% - 56px))", margin: "34px auto 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a
            href="/ai-fluency"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 18,
              fontSize: 13, fontWeight: 750, color: "#6B6670", textDecoration: "none",
            }}
          >
            ← Back to AI Fluency
          </a>

          <div style={{ position: "relative", paddingLeft: 22 }}>
            <div style={{
              position: "absolute", left: 0, top: "4px", bottom: "4px", width: 5,
              background: "#FF4B1F", borderRadius: 999,
            }} />
            <span style={{
              fontSize: 12, fontWeight: 800, letterSpacing: ".1em",
              textTransform: "uppercase", color: "#FF4B1F",
            }}>Apply</span>
            <h1 style={{
              margin: "4px 0 0", fontSize: 34, lineHeight: 1.03,
              fontWeight: 950, letterSpacing: "-.055em",
            }}>All Videos</h1>
            <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>
              Short demos of AI features across the tools you use every day.
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {(["All", ...GROUP_ORDER] as string[]).map(g => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              style={{
                padding: "8px 18px", borderRadius: 999, fontSize: 12, fontWeight: 750,
                border: "1px solid", cursor: "pointer", transition: "all .15s",
                background: filter === g ? "#221D23" : "#fff",
                color: filter === g ? "#FFCE00" : "#221D23",
                borderColor: filter === g ? "#221D23" : "#E9E4DC",
              }}
            >{g}</button>
          ))}
        </div>

        <p style={{ margin: "0 0 24px", fontSize: 11, fontWeight: 700, color: "#9B9199", letterSpacing: ".04em" }}>
          {filtered.length} video{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p style={{ color: "#9B9199", fontSize: 14, textAlign: "center", paddingTop: 60 }}>
            No videos in this category. Try "All" or pick another filter.
          </p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}>
            {displayVideos.map(v => {
              const accent = GROUP_ACCENT[v.group_name ?? ""] ?? ACCENT_FALLBACK;
              const isLocked = !isLoggedIn && v.is_locked;
              const blurb = v.description
                ? v.description.split("\n")[0].slice(0, 96) + (v.description.length > 96 ? "…" : "")
                : null;

              return (
                <article
                  key={v.id}
                  onClick={() => setSelectedVideo(v)}
                  style={{
                    borderRadius: 18, overflow: "hidden",
                    background: "#fff", border: "1px solid rgba(34,29,35,.06)",
                    boxShadow: "0 2px 12px rgba(0,0,0,.06)",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    opacity: isLocked ? 0.65 : 1,
                    transition: "transform .15s, box-shadow .15s",
                  }}
                  onMouseEnter={e => {
                    if (!isLocked) {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,.10)";
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,.06)";
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    position: "relative", height: 148, flexShrink: 0, overflow: "hidden",
                    background: v.thumbnail_url
                      ? "transparent"
                      : `linear-gradient(155deg,${accent} 0%,#1a1030 48%,#0f0a18 100%)`,
                  }}>
                    {v.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumbnail_url}
                        alt=""
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                    {v.thumbnail_url && (
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.25) 100%)",
                      }} />
                    )}

                    {/* Auto-thumbnail: extract a frame from the video when no uploaded thumbnail */}
                    {!v.thumbnail_url && v.video_url && (
                      <>
                        <AutoVideoThumbnail videoUrl={v.video_url} />
                        <div style={{
                          position: "absolute", inset: 0,
                          background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.25) 100%)",
                        }} />
                      </>
                    )}

                    {/* Play / lock */}
                    <div style={{
                      position: "absolute", left: "50%", top: "50%",
                      transform: "translate(-50%,-50%)", zIndex: 2,
                      width: 52, height: 52, borderRadius: "50%",
                      background: isLocked ? "rgba(0,0,0,.3)" : "#fff",
                      backdropFilter: isLocked ? "blur(4px)" : undefined,
                      boxShadow: isLocked ? undefined : "0 6px 24px rgba(0,0,0,.20)",
                      display: "grid", placeItems: "center",
                    }}>
                      {isLocked ? (
                        <span style={{ fontSize: 18 }}>🔒</span>
                      ) : (
                        <span style={{
                          width: 0, height: 0, marginLeft: 3,
                          borderTop: "9px solid transparent",
                          borderBottom: "9px solid transparent",
                          borderLeft: "14px solid #221D23",
                          display: "block",
                        }} />
                      )}
                    </div>

                    {/* Duration */}
                    {!isLocked && v.duration && (
                      <span style={{
                        position: "absolute", bottom: 8, right: 8, zIndex: 2,
                        background: "rgba(0,0,0,.80)", color: "#fff",
                        padding: "2px 6px", borderRadius: 4,
                        fontFamily: "monospace", fontSize: 11, fontWeight: 500,
                      }}>{v.duration}</span>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: "12px 14px 14px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7, overflow: "hidden" }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                        background: accent, display: "inline-block",
                      }} />
                      <span style={{
                        fontSize: 10, fontWeight: 800, letterSpacing: ".12em",
                        textTransform: "uppercase", color: "#6B6670",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{v.category_tag ?? v.group_name ?? "Feature"}</span>
                    </div>
                    <h3 className="card-title">{v.title}</h3>
                    {blurb && !isLocked && (
                      <p style={{
                        margin: 0, fontSize: 12, lineHeight: 1.5, color: "#6B6670", fontWeight: 650,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                      }}>{blurb}</p>
                    )}
                    {isLocked && (
                      <p style={{ margin: 0, fontSize: 12, color: "#9B9199", fontStyle: "italic" }}>
                        Login to unlock
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {selectedVideo && (
        <VideoModal video={selectedVideo} isLoggedIn={isLoggedIn} onClose={() => setSelectedVideo(null)} />
      )}
    </>
  );
}
