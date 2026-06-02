"use client";

import { useState } from "react";
import { Copy, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

export function MatchGenerator({ slug }: { slug: string }) {
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!jd.trim() || !company.trim()) {
      setError("Please provide both a company name and the job description.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/generate-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, jobDescription: jd, companyName: company })
      });

      if (!res.ok) {
        throw new Error("Failed to generate match.");
      }

      const data = await res.json();
      if (data.matchId) {
        const url = `${window.location.origin}/p/${slug}?match=${data.matchId}`;
        setGeneratedUrl(url);
      } else {
        throw new Error(data.error || "Failed to generate.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="pixel-border" style={{ padding: "24px", backgroundColor: "var(--arcade-cream-soft)", marginTop: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <Sparkles size={20} color="var(--arcade-green)" />
        <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "var(--arcade-ink)" }}>
          Pitch Link Generator
        </h3>
      </div>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "var(--muted-2)", marginBottom: "24px" }}>
        Targeting a role on LinkedIn or a private job board? Paste the job description below to generate a custom, AI-tailored pitch link to send to the recruiter.
      </p>

      {generatedUrl ? (
        <div style={{ backgroundColor: "var(--arcade-ink)", padding: "24px", borderRadius: "8px", color: "var(--arcade-cream)" }}>
          <h4 style={{ fontFamily: "'VT323', monospace", fontSize: "20px", color: "var(--arcade-green)", marginBottom: "16px" }}>
            LINK GENERATED SUCCESSFULLY!
          </h4>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input 
              readOnly 
              value={generatedUrl} 
              style={{ flex: 1, padding: "12px", backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid var(--arcade-green)", color: "var(--arcade-cream)", fontFamily: "monospace" }} 
            />
            <button 
              onClick={copyUrl}
              className="retro-button"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {copied ? "COPIED!" : "COPY"}
            </button>
          </div>
          <button 
            onClick={() => { setGeneratedUrl(""); setJd(""); setCompany(""); }}
            style={{ marginTop: "16px", background: "none", border: "none", color: "var(--muted-2)", cursor: "pointer", textDecoration: "underline", fontFamily: "'Inter', sans-serif", fontSize: "12px" }}
          >
            Create another link
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontFamily: "'VT323', monospace", fontSize: "18px", color: "var(--arcade-ink)", marginBottom: "8px" }}>
              Company / Role Name
            </label>
            <input 
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Frontend Engineer at Stripe"
              style={{ width: "100%", padding: "12px", border: "2px solid var(--arcade-ink)", backgroundColor: "white", fontFamily: "'Inter', sans-serif" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", fontFamily: "'VT323', monospace", fontSize: "18px", color: "var(--arcade-ink)", marginBottom: "8px" }}>
              Paste Job Description
            </label>
            <textarea 
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description text here..."
              rows={6}
              style={{ width: "100%", padding: "12px", border: "2px solid var(--arcade-ink)", backgroundColor: "white", fontFamily: "'Inter', sans-serif", resize: "vertical" }}
            />
          </div>

          {error && <p style={{ color: "red", fontSize: "14px", fontFamily: "'Inter', sans-serif" }}>{error}</p>}

          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="retro-button" 
            style={{ alignSelf: "flex-start", display: "flex", gap: "8px", alignItems: "center" }}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            {loading ? "GENERATING..." : "GENERATE MATCH LINK"}
          </button>
        </div>
      )}
    </div>
  );
}
