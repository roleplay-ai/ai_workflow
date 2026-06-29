"use client";

import { useRef } from "react";
import FoundationModuleCard, { type FoundationModule } from "./FoundationModuleCard";

const SCROLL_STEP = 442; // ~2 cards (205px + 16px gap)

type Props = {
  modules: FoundationModule[];
  completedIds: string[];
  loadingId: string | null;
  onModuleClick: (mod: FoundationModule) => void;
};

export default function FoundationCardsCarousel({ modules, completedIds, loadingId, onModuleClick }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -SCROLL_STEP : SCROLL_STEP, behavior: "smooth" });

  return (
    <div className="aif-carousel-rail">
      <button
        type="button"
        className="aif-arrow-btn"
        onClick={() => scroll("left")}
        aria-label="Previous topics"
      >‹</button>

      <div ref={scrollRef} className="aif-foundation-scroll">
        <div className="aif-foundation-row">
          {modules.map((mod, i) => (
            <FoundationModuleCard
              key={mod.id}
              module={mod}
              themeIndex={i}
              done={completedIds.includes(mod.id)}
              loading={loadingId === mod.id}
              disabled={mod.is_locked}
              onClick={() => onModuleClick(mod)}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="aif-arrow-btn"
        onClick={() => scroll("right")}
        aria-label="Next topics"
      >›</button>
    </div>
  );
}
