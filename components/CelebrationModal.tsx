"use client";

import { useMemo } from "react";

type Props = {
  activityTitle: string;
  points: number;
  onContinue: () => void;
};

const CONFETTI_COLORS = ["#FFCE00", "#2563EB", "#14B8A6", "#F68A29", "#22C55E", "#221D23", "#F472B6"];

export default function CelebrationModal({ activityTitle, points, onContinue }: Props) {
  const confetti = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        delay: `${(i % 12) * 0.12}s`,
        duration: `${2.2 + (i % 5) * 0.35}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + (i % 4) * 2,
        rotate: (i * 47) % 360,
        shape: i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0",
      })),
    [],
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 overflow-hidden"
      style={{ background: "rgba(15,23,42,.5)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal
      aria-labelledby="celebration-title"
    >
      <div className="celebration-confetti-layer" aria-hidden>
        {confetti.map((c) => (
          <span
            key={c.id}
            className="celebration-confetti"
            style={{
              left: c.left,
              animationDelay: c.delay,
              animationDuration: c.duration,
              background: c.color,
              width: c.size,
              height: c.shape === "50%" ? c.size : c.size * 0.45,
              borderRadius: c.shape,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <div
        className="celebrate-pop relative z-10 w-full max-w-md rounded-3xl p-8 text-center shadow-2xl border border-white/80"
        style={{ background: "linear-gradient(180deg,#fff 0%,#FFFBEB 100%)" }}
      >
        <div className="celebrate-emoji text-5xl mb-3" aria-hidden>
          🎉
        </div>
        <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#B45309" }}>
          All steps completed
        </div>
        <h2 id="celebration-title" className="text-2xl font-black tracking-tight mb-2" style={{ color: "#221D23" }}>
          You did it!
        </h2>
        <p className="text-sm font-semibold mb-1" style={{ color: "#64748B" }}>
          You finished <strong style={{ color: "#221D23" }}>{activityTitle}</strong>
        </p>
        {points > 0 && (
          <p className="text-sm font-bold mb-6" style={{ color: "#2563EB" }}>
            +{points} points earned
          </p>
        )}
        {points <= 0 && <div className="mb-6" />}
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3.5 rounded-2xl border-0 font-black text-sm cursor-pointer text-[#221D23] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "#FFCE00", boxShadow: "0 10px 28px rgba(255,206,0,.45)" }}
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
