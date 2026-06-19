"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function SignupPage() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPw, setShowPw]     = useState(true);

  const supabase = createClient();

  async function handleGoogleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.href = "/";
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#FFF6CF 0%,#F8F8F6 50%,#F0EEFF 100%)",
      fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: "white", borderRadius: 24,
        border: "1px solid #E8E6DC", boxShadow: "0 8px 40px rgba(34,29,35,.1)", padding: 36,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <img src="/icon.png" alt="" width={36} height={36}
            style={{ width: 36, height: 36, borderRadius: 10, display: "block", flexShrink: 0 }} />
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-.03em" }}>Nudgeable AI Practice Lab</span>
        </div>

        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: "-.04em" }}>Create account</h1>
        <p style={{ margin: "0 0 22px", color: "#6B6B6B", fontSize: 13.5 }}>Start your AI learning journey.</p>

        <button onClick={handleGoogleSignIn} disabled={loading} style={{
          width: "100%", padding: "11px 16px", border: "1.5px solid #E8E6DC",
          borderRadius: 999, background: "white", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontWeight: 700, fontSize: 14, marginBottom: 16, transition: "border-color .15s",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "#E8E6DC" }} />
          <span style={{ color: "#B0ABA5", fontSize: 12, fontWeight: 600 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#E8E6DC" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Full name" required style={inputStyle}
          />
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Work email" required style={inputStyle}
          />
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" required minLength={6}
              style={{ ...inputStyle, paddingRight: 44 }}
              suppressHydrationWarning
            />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{
              position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
              border: 0, background: "none", cursor: "pointer", padding: 0,
              color: showPw ? "#221D23" : "#B0ABA5",
              display: "flex", alignItems: "center", transition: "color .15s",
            }} aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOpen /> : <EyeOff />}
            </button>
          </div>

          {error && <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            padding: "12px 24px", borderRadius: 999, border: 0,
            background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 14,
            cursor: "pointer", marginTop: 4, opacity: loading ? .6 : 1,
          }}>
            {loading ? "…" : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#6B6B6B" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#F68A29", fontWeight: 700, textDecoration: "none" }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "11px 14px", borderRadius: 12, border: "1.5px solid #E8E6DC",
  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
  fontFamily: "inherit", background: "#FAFAF8",
};
