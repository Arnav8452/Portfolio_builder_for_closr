"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity } from "lucide-react";

export function MatchmakingCardInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const jobUrl = searchParams.get("job");
  
  const [pitch, setPitch] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!jobUrl) {
      setLoading(false);
      return;
    }

    async function fetchMatch() {
      try {
        const res = await fetch(`/api/matchmake?slug=${encodeURIComponent(slug)}&job=${encodeURIComponent(jobUrl!)}`);
        if (!res.ok) throw new Error("Matchmaking failed");
        const data = await res.json();
        setPitch(data.pitch);
      } catch (err) {
        console.error("Matchmaking error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMatch();
  }, [slug, jobUrl]);

  if (!jobUrl || (error && !pitch)) return null;

  // Extract a readable domain or short string from the jobUrl for the UI
  let displayTarget = "JOB DESCRIPTION";
  try {
    const urlObj = new URL(jobUrl);
    displayTarget = "ROLE AT " + urlObj.hostname.replace('www.', '').toUpperCase();
  } catch (e) {
    // ignore
  }

  return (
    <div 
      className="pixel-border" 
      style={{ 
        backgroundColor: "var(--arcade-ink)", 
        padding: "clamp(24px, 4vw, 32px)",
        marginBottom: "32px",
        borderImageSource: "url('/pixel-border-glow.png')", // optional glow if we had one
        boxShadow: "0 0 20px rgba(127, 255, 0, 0.2)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", borderBottom: "1px dashed var(--arcade-green)", paddingBottom: "12px" }}>
        <span style={{ color: "var(--arcade-green)", fontFamily: "'VT323', monospace", fontSize: "24px", textTransform: "uppercase" }}>
          TARGET: {displayTarget}
        </span>
      </div>
      
      {loading ? (
        <div style={{ display: "flex", gap: "16px", alignItems: "center", color: "var(--arcade-cream)" }}>
          <Activity className="animate-pulse" size={24} color="var(--arcade-green)" />
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "12px", color: "var(--arcade-green)" }}>
            ANALYZING JOB DESCRIPTION...
          </span>
        </div>
      ) : pitch ? (
        <div>
          <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "var(--arcade-cream)", marginBottom: "16px" }}>
            AI RECRUITER MATCH ANALYSIS
          </h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "16px", lineHeight: "1.6", color: "var(--arcade-cream)", opacity: 0.9 }}>
            {pitch}
          </p>
        </div>
      ) : null}
    </div>
  );
}

import { Suspense } from "react";
export function MatchmakingCard({ slug }: { slug: string }) {
  return (
    <Suspense fallback={null}>
      <MatchmakingCardInner slug={slug} />
    </Suspense>
  );
}
