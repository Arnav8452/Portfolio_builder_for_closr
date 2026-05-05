"use client";

import { signIn } from "next-auth/react";
import { Fingerprint, ShieldCheck, Zap, BarChart3 } from "lucide-react";

export function AuthGateHero() {
  return (
    <section className="creator-stage wide fade-in auth-gate-hero">
      {/* Hero block */}
      <div className="creator-intro">
        <div className="hero-icon-wrap">
          <Fingerprint size={36} />
        </div>
        <h1 className="auth-gate-title">Verified Creator Portfolios</h1>
        <p className="auth-gate-subtitle">
          Build a cryptographically verified B2B portfolio. We crawl, cross-reference, and prove your audience across every platform.
        </p>
      </div>

      {/* Steps panel — dark ink for contrast */}
      <div className="auth-instruction-grid">
        <div className="step-col">
          <div className="step-num">01</div>
          <h3>Sign In</h3>
          <p className="step-desc">
            Create your secure dashboard with Google. This is your identity anchor.
          </p>
        </div>
        <div className="step-col">
          <div className="step-num red">02</div>
          <h3>Connect Root</h3>
          <p className="step-desc">
            Link your main channel — YouTube, GitHub, or Twitch — via OAuth to prove ownership.
          </p>
        </div>
        <div className="step-col">
          <div className="step-num blue">03</div>
          <h3>Build Matrix</h3>
          <p className="step-desc">
            Add secondary links. Our Oracle Workers crawl and cross-reference your full footprint.
          </p>
        </div>
      </div>

      {/* Single Google sign-in */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", maxWidth: "440px", margin: "0 auto" }}>
        <button
          className="primary-action hero-action google-cta"
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/creators" })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>
        <p className="auth-footer-note">
          <ShieldCheck size={14} />
          Google is for login only. You'll connect your platforms in Step 2.
        </p>
      </div>

      {/* Feature pills */}
      <div className="feature-row">
        <div className="feature-pill">
          <Zap size={14} />
          <span>OAuth Verified</span>
        </div>
        <div className="feature-pill">
          <BarChart3 size={14} />
          <span>Real-Time Analytics</span>
        </div>
        <div className="feature-pill">
          <ShieldCheck size={14} />
          <span>Tamper-Proof</span>
        </div>
      </div>
    </section>
  );
}
