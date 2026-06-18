"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import SiteFooter from "@/components/SiteFooter";

type Props = {
  userName: string | null;
  userEmail: string | null;
};

export default function AIMasteryAccessRequest({ userName, userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName]   = useState(userName ?? "");
  const [email, setEmail] = useState(userEmail ?? "");

  const subject = encodeURIComponent("AI Mastery Course – Access Request");
  const body = encodeURIComponent(
    `Hi Nudgeable team,\n\nI'd like to request full access to the AI Mastery course.\n\nName: ${name || "[your name]"}\nEmail: ${email || "[your email]"}\n\nPlease review and approve my access.\n\nThank you!`
  );
  const mailtoHref = `mailto:team@nudgeable.ai?subject=${subject}&body=${body}`;

  return (
    <>
      <AppNav activePage="learn" userName={userName} />

      <main style={{
        minHeight: "calc(100vh - 64px)",
        background: "#F8F8F6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif",
        padding: "40px 20px",
      }}>
        <div style={{
          background: "#fff",
          border: "1.5px solid #E8DFD2",
          borderRadius: 16,
          padding: "48px 44px",
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,.06)",
        }}>
          {/* Lock icon */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#FFFAEB", border: "2px solid #FFCE00",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: 28,
          }}>🔒</div>

          <h1 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 900, letterSpacing: "-.04em" }}>
            AI Mastery Course
          </h1>
          <p style={{ margin: "0 0 28px", color: "#6B6B6B", fontSize: 15, lineHeight: 1.55 }}>
            This course is by invitation only. Request access and a team member will review and approve you shortly.
          </p>

          <button
            onClick={() => setOpen(true)}
            style={{
              background: "#FFCE00", color: "#221D23", border: "none",
              borderRadius: 8, padding: "12px 28px",
              fontWeight: 800, fontSize: 15, cursor: "pointer",
              letterSpacing: "-.02em",
            }}
          >
            Get Full Access
          </button>
        </div>
      </main>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: 16, padding: "36px 32px",
            maxWidth: 480, width: "100%", position: "relative",
            boxShadow: "0 8px 40px rgba(0,0,0,.18)",
            fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif",
          }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "none", border: "none", fontSize: 20,
                cursor: "pointer", color: "#6B6B6B", lineHeight: 1,
              }}
              aria-label="Close"
            >×</button>

            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, letterSpacing: "-.03em" }}>
              Request Full Access
            </h2>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: "#6B6B6B" }}>
              Fill in your details below. Clicking "Send Request" will open your email client with a pre-written message to our team.
            </p>

            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5, color: "#221D23" }}>
              Your name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Jane Smith"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "10px 12px", borderRadius: 8,
                border: "1.5px solid #E8DFD2", fontSize: 14,
                marginBottom: 14, outline: "none",
              }}
            />

            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5, color: "#221D23" }}>
              Your email
            </label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. jane@company.com"
              type="email"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "10px 12px", borderRadius: 8,
                border: "1.5px solid #E8DFD2", fontSize: 14,
                marginBottom: 6, outline: "none",
              }}
            />

            <p style={{ fontSize: 11, color: "#B0ABA5", margin: "0 0 22px" }}>
              An email to <strong>team@nudgeable.ai</strong> will open in your mail client with these details pre-filled.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 8,
                  border: "1.5px solid #E8DFD2", background: "#fff",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#221D23",
                }}
              >
                Cancel
              </button>
              <a
                href={mailtoHref}
                onClick={() => setOpen(false)}
                style={{
                  flex: 2, padding: "11px 0", borderRadius: 8,
                  background: "#FFCE00", color: "#221D23", textDecoration: "none",
                  fontSize: 14, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  letterSpacing: "-.02em",
                }}
              >
                Send Request →
              </a>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </>
  );
}
