import React from "react";
import { Briefcase, FolderGit2, ExternalLink } from "lucide-react";

type Experience = {
  company: string;
  role: string;
  timeframe: string;
  description: string;
};

type Project = {
  name: string;
  description: string;
  url?: string;
};

type LiveResumeProps = {
  experience?: Experience[];
  projects?: Project[];
};

export function LiveResume({ experience = [] }: LiveResumeProps) {
  if (experience.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
      {/* EXPERIENCE SECTION */}
      {experience.length > 0 && (
        <section className="bento-card" style={{ border: "2px solid var(--arcade-yellow)" }}>
          <div className="card-header">
            <h2 style={{ color: "var(--arcade-yellow)", display: "flex", gap: "12px", alignItems: "center" }}>
              <Briefcase size={16} /> EXPERIENCE
            </h2>
            <div className="header-decoration" style={{ backgroundColor: "var(--arcade-yellow)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginTop: "16px" }}>
            {experience.map((exp, idx) => (
              <div key={idx} style={{ position: "relative", paddingLeft: "16px", borderLeft: "2px solid var(--arcade-yellow)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "12px", color: "var(--arcade-yellow)", lineHeight: "1.4" }}>
                    {exp.role.toUpperCase()} <span style={{ color: "var(--arcade-ink)", opacity: 0.5 }}>@</span> {exp.company.toUpperCase()}
                  </h3>
                  <span style={{ 
                    fontFamily: "'VT323', monospace", 
                    fontSize: "16px", 
                    color: "var(--arcade-ink)", 
                    backgroundColor: "var(--arcade-yellow)", 
                    padding: "2px 8px",
                  }}>
                    {exp.timeframe}
                  </span>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", lineHeight: "1.6", color: "var(--muted-2)", whiteSpace: "pre-line" }}>
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
