"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import ViewCountBadge from "@/components/ViewCountBadge";
import { recordFluencyView } from "@/lib/fluencyViews";
import VideoModal, { type ApplyVideo as ModalApplyVideo } from "../VideoModal";

const GROUP_ACCENT: Record<string, string> = {
  Features:  "#A855F7",
  Apps:      "#EC4899",
  Workflows: "#F68A29",
  Skills:    "#3699FC",
};
const GROUP_ORDER = ["Features", "Apps", "Workflows", "Skills"] as const;
const ACCENT_FALLBACK = "#623CEA";

type ApplyVideo = ModalApplyVideo & { platforms: string | null };

type Props = {
  videos: ApplyVideo[];
  isLoggedIn: boolean;
  userName: string | null;
  isAdmin: boolean;
  viewCounts?: Record<string, number>;
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

export default function AllVideosClient({ videos, isLoggedIn, userName, isAdmin, viewCounts = {} }: Props) {
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
      <AppNav activePage="know" userName={userName} isAdmin={isAdmin} />

      <main style={{ width: "min(1280px,calc(100% - 72px))", margin: "34px auto 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a
            href="/know"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 18,
              fontSize: 13, fontWeight: 750, color: "#6B6670", textDecoration: "none",
            }}
          >
            ← Back to Know
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
                  onClick={() => { recordFluencyView("video", v.id); setSelectedVideo(v); }}
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
                        flex: 1, minWidth: 0,
                      }}>{v.category_tag ?? v.group_name ?? "Feature"}</span>
                      <ViewCountBadge count={viewCounts[v.id] ?? 0} />
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
