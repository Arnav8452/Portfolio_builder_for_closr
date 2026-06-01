"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { refreshPortfolio } from "@/app/creators/actions";

export function RefreshButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await refreshPortfolio(slug);
      if (!result.ok) {
        setError(result.message || "Failed to refresh.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
      <button 
        onClick={handleRefresh}
        disabled={loading || success}
        className="pixel-border hover-lift"
        title="Refresh portfolio data"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          backgroundColor: success ? "var(--arcade-green)" : "var(--arcade-ink)",
          color: success ? "var(--arcade-ink)" : "var(--arcade-cream)",
          fontFamily: "'VT323', monospace",
          fontSize: "16px",
          cursor: (loading || success) ? "not-allowed" : "pointer",
          border: "2px solid var(--arcade-cream)",
          outline: "none"
        }}
      >
        <RefreshCw size={14} style={{ animation: loading ? "spin 2s linear infinite" : "none" }} />
        {loading ? "REFRESHING..." : success ? "QUEUED" : "REFRESH DATA"}
      </button>
      {error && (
        <span style={{ color: "var(--arcade-red)", fontFamily: "'VT323', monospace", fontSize: "14px" }}>
          {error}
        </span>
      )}
    </div>
  );
}
