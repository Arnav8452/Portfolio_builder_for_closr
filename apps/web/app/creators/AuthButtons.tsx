"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Github, LogOut, Twitch, Linkedin } from "lucide-react";

export function AuthButtons() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return <span className="badge pending">checking auth</span>;
  }
  if (session?.user) {
    return (
      <div className="chips">
        <span className="badge">{session.user.email ?? session.user.name}</span>
        <button className="button secondary" type="button" onClick={() => signOut()}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    );
  }
  return (
    <div className="chips">
      <button className="button secondary" type="button" onClick={() => signIn("google")}>
        Google
      </button>
      <button className="button secondary" type="button" onClick={() => signIn("github")}>
        <Github size={16} /> GitHub
      </button>
      <button className="button secondary" type="button" onClick={() => signIn("twitch")}>
        <Twitch size={16} /> Twitch
      </button>
      <button className="button secondary" type="button" onClick={() => signIn("linkedin")}>
        <Linkedin size={16} /> LinkedIn
      </button>
    </div>
  );
}
