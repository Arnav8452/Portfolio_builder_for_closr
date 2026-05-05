"use client";

import { signIn } from "next-auth/react";
import { Github, Twitch } from "lucide-react";

export function HeroSignInButton() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
      <button 
        className="primary-action" 
        type="button" 
        onClick={() => signIn("google", { callbackUrl: "/creators" })}
        style={{ padding: "0.8rem 1.5rem", flex: "1 1 auto", background: "var(--arcade-blue)", color: "var(--arcade-cream)" }}
      >
        Google
      </button>
      <button 
        className="primary-action github" 
        type="button" 
        onClick={() => signIn("github", { callbackUrl: "/creators" })}
        style={{ padding: "0.8rem 1.5rem", flex: "1 1 auto" }}
      >
        <Github size={16} />
        GitHub
      </button>
      <button 
        className="primary-action twitch" 
        type="button" 
        onClick={() => signIn("twitch", { callbackUrl: "/creators" })}
        style={{ padding: "0.8rem 1.5rem", flex: "1 1 auto" }}
      >
        <Twitch size={16} />
        Twitch
      </button>
    </div>
  );
}
