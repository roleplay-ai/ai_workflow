import s from "./activity-panel.module.css";

export default function ActivityLoading() {
  return (
    <div className={s.pageWrap}>
      <header className={s.topbar}>
        <div className={s.titleBlock}>
          <div className={s.skeletonCircle} style={{ width: 36, height: 36, borderRadius: 10 }} />
          <div className={s.titleText} style={{ flex: 1 }}>
            <div className={s.skeletonBlock} style={{ height: 18, width: "min(420px, 72%)", marginBottom: 6 }} />
            <div className={s.skeletonBlock} style={{ height: 12, width: 96 }} />
          </div>
        </div>
        <div className={s.topActions}>
          <div className={s.skeletonBlock} style={{ height: 14, width: 36 }} />
          <div className={s.skeletonBlock} style={{ height: 36, width: 88, borderRadius: 10 }} />
        </div>
      </header>

      <main className={s.page}>
        <section className={s.focusCard}>
          <div className={s.focusHead}>
            <div style={{ flex: 1 }}>
              <div className={s.skeletonBlock} style={{ height: 24, width: 140, borderRadius: 999, marginBottom: 10 }} />
              <div className={s.skeletonBlock} style={{ height: 28, width: "min(520px, 88%)" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div className={s.skeletonBlock} style={{ height: 36, width: 92, borderRadius: 8 }} />
              <div className={s.skeletonBlock} style={{ height: 36, width: 118, borderRadius: 8 }} />
            </div>
          </div>

          <div className={s.content}>
            <div className={s.workRow}>
              <aside className={s.instructionCard}>
                <div className={s.label}>What to do</div>
                <div className={s.instructionThinking}>
                  <span className={s.instructionThinkingAvatar}>🤖</span>
                  <div className={s.instructionThinkingBubble}>Loading workflow…</div>
                </div>
              </aside>
              <section className={s.screenCard}>
                <div className={s.browserBar}>
                  <span className={s.traffic} />
                  <span className={s.traffic} />
                  <span className={s.traffic} />
                </div>
                <div className={s.skeletonBlock} style={{ width: "100%", aspectRatio: "16/10", borderRadius: 0 }} />
              </section>
            </div>
          </div>

          <div className={s.belowScreen}>
            <div className={s.skeletonBlock} style={{ height: 40, borderRadius: 10 }} />
            <div style={{ display: "flex", gap: 12 }}>
              <div className={s.skeletonBlock} style={{ height: 36, width: 84, borderRadius: 8 }} />
              <div className={s.skeletonBlock} style={{ height: 36, width: 132, borderRadius: 8 }} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
