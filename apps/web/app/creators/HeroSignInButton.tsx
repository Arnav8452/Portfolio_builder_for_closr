"use client";

import { signIn } from "next-auth/react";
import { Chrome, Github, Twitch } from "lucide-react";

export function HeroSignInButton() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
      <button 
        className="primary-action" 
        type="button" 
        onClick={() => signIn("google", { callbackUrl: "/creators" })}
        style={{ padding: "0.8rem 1.5rem", fontSize: "1rem", flex: "1 1 auto" }}
      >
        <Chrome size={18} style={{ marginRight: "0.5rem" }} />
        Google
      </button>
      <button 
        className="primary-action" 
        type="button" 
        onClick={() => signIn("github", { callbackUrl: "/creators" })}
        style={{ padding: "0.8rem 1.5rem", fontSize: "1rem", background: "var(--github)", flex: "1 1 auto" }}
      >
        <Github size={18} style={{ marginRight: "0.5rem" }} />
        GitHub
      </button>
      <button 
        className="primary-action" 
        type="button" 
        onClick={() => signIn("twitch", { callbackUrl: "/creators" })}
        style={{ padding: "0.8rem 1.5rem", fontSize: "1rem", background: "var(--twitch)", flex: "1 1 auto" }}
      >
        <Twitch size={18} style={{ marginRight: "0.5rem" }} />
        Twitch
      </button>
    </div>
  );
}
