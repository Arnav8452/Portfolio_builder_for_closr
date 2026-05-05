import { Chrome, Fingerprint, Network, ShieldCheck } from "lucide-react";
import { HeroSignInButton } from "./HeroSignInButton";

export function AuthGateHero() {
  return (
    <section className="creator-stage wide fade-in" style={{ marginTop: "8vh" }}>
      <div className="creator-intro" style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <div className="avatar-ring" style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)" }}>
            <Fingerprint size={36} style={{ color: "var(--text-primary)" }} />
          </div>
        </div>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>The Verified Creator Graph</h1>
        <p style={{ maxWidth: 600, margin: "0 auto", fontSize: "1.1rem", color: "var(--text-secondary)" }}>
          Build a cryptographically secure B2B portfolio. We automatically verify your audience, skills, and engagement across the internet.
        </p>
      </div>

      <div className="instruction-card" style={{ maxWidth: 800, margin: "0 auto 3rem auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", padding: "2rem", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
        <div className="step-col">
          <div className="step-icon" style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>
            <Chrome size={28} />
          </div>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>1. Create Account</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Secure your dashboard via Google. We use strict NextAuth sessions to keep your data locked down.
          </p>
        </div>
        
        <div className="step-col">
          <div className="step-icon" style={{ marginBottom: "1rem", color: "var(--youtube-red)" }}>
            <ShieldCheck size={28} />
          </div>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>2. Connect Root</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Prove ownership of your main channel (YouTube, GitHub, etc). This anchors your identity.
          </p>
        </div>

        <div className="step-col">
          <div className="step-icon" style={{ marginBottom: "1rem", color: "var(--github-black)" }}>
            <Network size={28} />
          </div>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>3. Build Matrix</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Add secondary links. Our Oracle Workers automatically crawl and cross-reference your total footprint.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <HeroSignInButton />
        <p style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={14} />
          Step 1 only creates your base account. You will connect your platform data in Step 2.
        </p>
      </div>
    </section>
  );
}
