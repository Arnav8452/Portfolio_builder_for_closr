"use client";

import { signIn } from "next-auth/react";
import { Chrome } from "lucide-react";

export function HeroSignInButton() {
  return (
    <button 
      className="primary-action" 
      type="button" 
      onClick={() => signIn("google", { callbackUrl: "/creators" })}
      style={{ padding: "0.8rem 2rem", fontSize: "1.1rem" }}
    >
      <Chrome size={20} style={{ marginRight: "0.5rem" }} />
      Sign in with Google to Start
    </button>
  );
}
