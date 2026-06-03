"use client";
import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  src: string;
  alt: string;
}

export default function SlideZoom({ src, alt }: Props) {
  const [open, setOpen]       = useState(false);
  const [scale, setScale]     = useState(1);
  const [pos, setPos]         = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart             = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const containerRef          = useRef<HTMLDivElement>(null);

  const MIN = 1;
  const MAX = 5;

  // ── Reset when slide changes ──────────────────────────────────────────────
  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [src]);

  // ── Close on Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const close = () => {
    setOpen(false);
    setScale(1);
    setPos({ x: 0, y: 0 });
  };

  // ── Scroll to zoom ─────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(MAX, Math.max(MIN, s - e.deltaY * 0.001)));
  }, []);

  // ── Drag to pan ────────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPos({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  };

  const onMouseUp = () => setDragging(false);

  const zoom = (delta: number) =>
    setScale((s) => {
      const next = Math.min(MAX, Math.max(MIN, s + delta));
      if (next === MIN) setPos({ x: 0, y: 0 });
      return next;
    });

  const resetZoom = () => { setScale(1); setPos({ x: 0, y: 0 }); };

  return (
    <>
      {/* Slide thumbnail — always 120% zoomed, vertically centred */}
      <div
        className="relative group cursor-zoom-in w-full h-full flex items-center justify-center overflow-hidden"
        onClick={() => setOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-auto block transition-transform duration-300 ease-out"
          style={{ transform: "scale(1.2)", transformOrigin: "center center" }}
        />
        {/* Zoom hint overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            🔍 Click to zoom
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(10,12,20,.92)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          {/* Zoom controls */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-2 rounded-2xl"
            style={{ background: "rgba(255,255,255,.12)", backdropFilter: "blur(12px)" }}>
            <button onClick={() => zoom(-0.5)}
              className="w-8 h-8 rounded-xl text-white font-black text-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer border-0 bg-transparent">
              −
            </button>
            <button onClick={resetZoom}
              className="px-3 h-8 rounded-xl text-white text-xs font-black hover:bg-white/20 transition-colors cursor-pointer border-0 bg-transparent min-w-[52px]">
              {Math.round(scale * 100)}%
            </button>
            <button onClick={() => zoom(0.5)}
              className="w-8 h-8 rounded-xl text-white font-black text-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer border-0 bg-transparent">
              +
            </button>
          </div>

          {/* Close button */}
          <button onClick={close}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl text-white font-black text-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer border-0 bg-transparent"
            style={{ background: "rgba(255,255,255,.12)" }}>
            ✕
          </button>

          {/* Image canvas */}
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center overflow-hidden select-none"
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: dragging ? "none" : "transform 0.15s ease",
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: 12,
                boxShadow: "0 24px 80px rgba(0,0,0,.6)",
                userSelect: "none",
              }}
            />
          </div>

          {/* Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs font-medium">
            Scroll to zoom · Drag to pan · Esc to close
          </div>
        </div>
      )}
    </>
  );
}
