import Link from "next/link";
import styles from "./SiteFooter.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Masterclass card */}
        <div className={styles.mastercard}>
          <div>
            <div className={styles.eyebrow}>Start here</div>
            <h2>GenAI Masterclass</h2>
            <p>Learn practical AI in a live workshop, then continue applying it inside the Practice Lab.</p>
          </div>
          <a
            href="https://www.nudgeable.ai"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mastercta}
          >
            Explore Masterclass
          </a>
        </div>

        {/* Nav links */}
        <div className={styles.links}>
          <div className={styles.linkgroup}>
            <h3>Practice Lab</h3>
            <div className={styles.linklist}>
              <Link href="/apply">Workflows</Link>
              <Link href="/learn">Course</Link>
              <Link href="/know">Stay Current</Link>
            </div>
          </div>

          <div className={styles.linkgroup}>
            <h3>Nudgeable Products</h3>
            <div className={styles.linklist}>
              <a href="https://www.nudgeable.ai/ai-role-play" target="_blank" rel="noopener noreferrer">AI Roleplays</a>
              <a href="https://www.nudgeable.ai/nudgeengine" target="_blank" rel="noopener noreferrer">Nudge Engine</a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <span>Nudgeable</span>
        <span>
          <a href="mailto:team@nudgeable.ai">team@nudgeable.ai</a>
          {" · "}
          <a href="https://www.nudgeable.ai" target="_blank" rel="noopener noreferrer">www.nudgeable.ai</a>
        </span>
      </div>
    </footer>
  );
}
