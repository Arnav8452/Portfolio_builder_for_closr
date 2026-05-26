"use client";

import { signOut } from "next-auth/react";

type CreatorHeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  };
};

export function CreatorHeader({ user }: CreatorHeaderProps) {
  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 24px",
      borderBottom: "3px solid var(--arcade-ink)",
      background: "var(--arcade-cream-soft)",
      fontFamily: "'VT323', monospace"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {user.image ? (
          <img
            src={user.image}
            alt="Profile Picture"
            style={{ width: "48px", height: "48px", border: "3px solid var(--arcade-ink)" }}
          />
        ) : (
          <div style={{
            width: "48px",
            height: "48px",
            background: "var(--arcade-blue)",
            color: "var(--arcade-cream)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            border: "3px solid var(--arcade-ink)"
          }}>
            {user.name?.[0]?.toUpperCase() || "C"}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "24px", color: "var(--arcade-ink)", lineHeight: 1.2 }}>
            {user.name || "Creator"}
          </span>
          {user.id && (
            <span style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.2 }}>
              ID: {user.id.slice(0, 8)}...
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/creators" })}
        className="secondary-action"
        style={{ color: "var(--arcade-red)", borderColor: "var(--arcade-red)", boxShadow: "3px 3px 0 0 var(--arcade-red)" }}
      >
        Sign Out
      </button>
    </header>
  );
}
