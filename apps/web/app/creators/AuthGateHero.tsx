import { Chrome, Fingerprint, Network, ShieldCheck } from "lucide-react";
import { HeroSignInButton } from "./HeroSignInButton";

export function AuthGateHero() {
  return (
    <section className="creator-stage wide fade-in auth-gate-hero">
      <div className="creator-intro">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <div className="avatar-ring" style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)" }}>
            <Fingerprint size={32} style={{ color: "var(--text)" }} />
          </div>
        </div>
        <h1 className="auth-gate-title">The Verified Creator Graph</h1>
        <p className="auth-gate-subtitle">
          Build a cryptographically secure B2B portfolio. We automatically verify your audience, skills, and engagement across the internet.
        </p>
      </div>

      <div className="auth-instruction-grid">
        <div className="step-col">
          <div className="step-icon" style={{ marginBottom: "1rem", color: "var(--text)" }}>
            <Chrome size={28} />
          </div>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>1. Create Account</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: 0 }}>
            Secure your dashboard via Google. We use strict NextAuth sessions to keep your data locked down.
          </p>
        </div>
        
        <div className="step-col">
          <div className="step-icon" style={{ marginBottom: "1rem", color: "var(--youtube)" }}>
            <ShieldCheck size={28} />
          </div>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>2. Connect Root</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: 0 }}>
            Prove ownership of your main channel (YouTube, GitHub, etc). This anchors your identity.
          </p>
        </div>

        <div className="step-col">
          <div className="step-icon" style={{ marginBottom: "1rem", color: "var(--github)" }}>
            <Network size={28} />
          </div>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>3. Build Matrix</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: 0 }}>
            Add secondary links. Our Oracle Workers automatically crawl and cross-reference your total footprint.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <HeroSignInButton />
        <p style={{ fontSize: "0.85rem", color: "var(--muted-2)", display: "flex", alignItems: "center", gap: "0.5rem", textAlign: "center" }}>
          <ShieldCheck size={14} style={{ flexShrink: 0 }} />
          Step 1 only creates your base account. You will connect your platform data in Step 2.
        </p>
      </div>
    </section>
  );
}
