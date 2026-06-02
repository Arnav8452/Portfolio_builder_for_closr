"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity } from "lucide-react";

export function MatchmakingCardInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const jobUrl = searchParams.get("job");
  const matchId = searchParams.get("match");
  
  const [pitch, setPitch] = useState<string | null>(null);
  const [displayedPitch, setDisplayedPitch] = useState<string>("");
  const [targetName, setTargetName] = useState<string>("JOB DESCRIPTION");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Typewriter effect logic
  useEffect(() => {
    if (!pitch) return;
    let i = 0;
    setDisplayedPitch("");
    const timer = setInterval(() => {
      setDisplayedPitch(pitch.substring(0, i));
      i++;
      if (i > pitch.length) clearInterval(timer);
    }, 15); // Adjust speed here
    return () => clearInterval(timer);
  }, [pitch]);

  useEffect(() => {
    if (!jobUrl && !matchId) {
      setLoading(false);
      return;
    }

    async function fetchMatch() {
      try {
        const urlParams = new URLSearchParams({ slug });
        if (jobUrl) urlParams.append("job", jobUrl);
        if (matchId) urlParams.append("match", matchId);
        
        const res = await fetch(`/api/matchmake?${urlParams.toString()}`);
        if (!res.ok) throw new Error("Matchmaking failed");
        const data = await res.json();
        setPitch(data.pitch);
        if (data.company) {
          setTargetName(data.company.toUpperCase());
        }
      } catch (err) {
        console.error("Matchmaking error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMatch();
  }, [slug, jobUrl, matchId]);

  if ((!jobUrl && !matchId) || (error && !pitch)) return null;

  // Extract a readable domain or short string from the jobUrl for the UI if company isn't provided by the match
  let displayTarget = targetName;
  if (displayTarget === "JOB DESCRIPTION" && jobUrl) {
    try {
      const urlObj = new URL(jobUrl);
      displayTarget = "ROLE AT " + urlObj.hostname.replace('www.', '').toUpperCase();
    } catch (e) {
      // ignore
    }
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
          <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "var(--arcade-cream)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={16} color="var(--arcade-green)" /> AI RECRUITER ANALYSIS
          </h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "16px", lineHeight: "1.6", color: "var(--arcade-cream)", opacity: 0.9 }}>
            {displayedPitch}
            {displayedPitch.length < pitch.length && <span style={{ display: "inline-block", width: "8px", height: "16px", backgroundColor: "var(--arcade-green)", marginLeft: "4px", animation: "blink 1s step-end infinite" }} />}
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
