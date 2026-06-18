import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Nudgeable",
  description: "How Nudgeable collects and uses personal information on the AI Work Studio.",
};

const COMPANY = "Nudgeable";
const LEGAL_ENTITY = "Nudgeable";
const CONTACT_EMAIL = "team@nudgeable.ai";
const SITE_URL = "https://www.nudgeable.ai";

const s = {
  page: {
    minHeight: "100vh",
    background: "#221D23",
    color: "#fff",
    padding: "56px 24px 80px",
    fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif",
  } as React.CSSProperties,
  article: {
    width: "100%",
    maxWidth: 680,
    margin: "0 auto",
  } as React.CSSProperties,
  header: {
    marginBottom: 40,
    textAlign: "center" as const,
  } as React.CSSProperties,
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#FFCE00",
    marginBottom: 8,
  } as React.CSSProperties,
  h1: {
    margin: 0,
    fontSize: 32,
    fontWeight: 950,
    letterSpacing: "-0.04em",
    color: "#fff",
  } as React.CSSProperties,
  meta: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    marginTop: 8,
  } as React.CSSProperties,
  card: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    padding: "36px 40px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 32,
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.75)",
  } as React.CSSProperties,
  section: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  } as React.CSSProperties,
  h2: {
    margin: 0,
    fontSize: 14,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "-0.02em",
  } as React.CSSProperties,
  p: {
    margin: 0,
  } as React.CSSProperties,
  ul: {
    margin: 0,
    paddingLeft: 20,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  } as React.CSSProperties,
  a: {
    color: "#FFCE00",
    textDecoration: "none",
    fontWeight: 700,
  } as React.CSSProperties,
  strong: {
    color: "#fff",
    fontWeight: 700,
  } as React.CSSProperties,
  bottom: {
    marginTop: 32,
    textAlign: "center" as const,
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    display: "flex",
    justifyContent: "center",
    gap: 16,
  } as React.CSSProperties,
};

export default function PrivacyPage() {
  return (
    <div style={s.page}>
      <article style={s.article}>

        <header style={s.header}>
          <p style={s.eyebrow}>AI Work Studio</p>
          <h1 style={s.h1}>Privacy policy</h1>
          <p style={s.meta}>{LEGAL_ENTITY} · Effective June 2026</p>
        </header>

        <div style={s.card}>

          <section style={s.section}>
            <h2 style={s.h2}>1. Who we are</h2>
            <p style={s.p}>
              <strong style={s.strong}>{LEGAL_ENTITY}</strong> ("we", "us") operates the website and application
              at{" "}
              <a href={SITE_URL} style={s.a} target="_blank" rel="noopener noreferrer">{SITE_URL}</a>{" "}
              (the "Service"). We are based in <strong style={s.strong}>India</strong>.
            </p>
            <p style={s.p}>
              Privacy inquiries:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={s.a}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Who this policy covers</h2>
            <p style={s.p}>
              This policy describes how we handle personal information about{" "}
              <strong style={s.strong}>end users</strong> of the Service — people who browse or sign in to use{" "}
              {COMPANY}.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Information we collect</h2>
            <ul style={s.ul}>
              <li>
                <strong style={s.strong}>Account details.</strong> When you create an account or sign in
                (including with Google), we process your <strong style={s.strong}>email address</strong> and{" "}
                <strong style={s.strong}>name</strong>, along with identifiers from our authentication provider.
              </li>
              <li>
                <strong style={s.strong}>Learning activity.</strong> When you use learning features, we process
                information such as <strong style={s.strong}>progress</strong>,{" "}
                <strong style={s.strong}>completions</strong>, and <strong style={s.strong}>scores</strong>{" "}
                associated with your account.
              </li>
              <li>
                <strong style={s.strong}>Sign-in &amp; sessions.</strong> We use{" "}
                <strong style={s.strong}>cookies</strong> and similar technologies for secure sign-in and session
                management through Supabase Auth. If you use Google sign-in, Google processes your login
                according to Google&apos;s policies.
              </li>
              <li>
                <strong style={s.strong}>Usage analytics.</strong> We collect limited first-party analytics
                (page views, certain clicks) to understand how the Service is used. This may include event type,
                page path, referring URL, a random session identifier (stored in session storage; does not
                persist), IP address, and timestamps.
              </li>
              <li>
                <strong style={s.strong}>Technical data.</strong> Like most online services, our systems receive
                technical information when you use the Service (e.g. IP address, browser type, request
                timestamps).
              </li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. How we use information</h2>
            <p style={s.p}>We use personal information to:</p>
            <ul style={s.ul}>
              <li>provide, operate, and improve the Service and your account;</li>
              <li>record and display learning progress, completions, and scores;</li>
              <li>maintain security, diagnose issues, and prevent abuse;</li>
              <li>understand aggregate usage through analytics; and</li>
              <li>comply with applicable law and respond to lawful requests.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Legal bases</h2>
            <p style={s.p}>
              Depending on applicable law (including India&apos;s Digital Personal Data Protection Act, 2023,
              where it applies), we process personal data where permitted — for example to perform our contract
              with you, for legitimate interests that are not overridden by your rights, with consent where
              required, or to comply with legal obligations.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Sharing</h2>
            <p style={s.p}>
              We use trusted service providers to host and operate the Service, including{" "}
              <strong style={s.strong}>Supabase</strong> for authentication and database hosting. If you choose{" "}
              <strong style={s.strong}>Google</strong> sign-in, Google processes your login under
              Google&apos;s policies.
            </p>
            <p style={s.p}>
              We do <strong style={s.strong}>not</strong> sell your personal information. We may disclose
              information if required by law or to protect the rights, safety, and integrity of users and the
              Service.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. International transfers</h2>
            <p style={s.p}>
              Your information may be processed in India and in other countries where our service providers
              operate, consistent with applicable law and required safeguards.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Retention</h2>
            <p style={s.p}>
              We retain personal information for as long as needed to provide the Service and for legitimate
              business and legal purposes. Retention periods may vary by data category.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Security</h2>
            <p style={s.p}>
              We implement reasonable technical and organizational measures to protect personal information. No
              method of transmission or storage is completely secure.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Your choices and rights</h2>
            <p style={s.p}>
              Depending on applicable law, you may have rights to access, correct, update, delete, or restrict
              certain processing, or to lodge a complaint with an authority. To exercise these rights, contact us
              at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={s.a}>{CONTACT_EMAIL}</a>{" "}
              from the email address associated with your account where possible.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>11. Children</h2>
            <p style={s.p}>
              The Service is not directed at children under 16. If you believe we have collected personal
              information from a child without appropriate authority, contact us and we will take appropriate
              steps.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>12. Changes</h2>
            <p style={s.p}>
              We may update this policy from time to time. We will post the updated policy on this page with a
              new effective date.
            </p>
          </section>

        </div>

        <div style={s.bottom}>
          <Link href="/apply" style={{ ...s.a, fontSize: 12 }}>← Back to AI Work Studio</Link>
          <span aria-hidden>·</span>
          <Link href="/login" style={{ ...s.a, fontSize: 12 }}>Sign in</Link>
        </div>

      </article>
    </div>
  );
}
