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
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
      <button 
        onClick={handleRefresh}
        disabled={loading || success}
        className="pixel-border hover-lift"
        title="Refresh portfolio data"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: success ? "var(--arcade-green)" : "var(--arcade-blue)",
          color: "var(--arcade-cream)",
          fontFamily: "'VT323', monospace",
          fontSize: "18px",
          cursor: (loading || success) ? "not-allowed" : "pointer",
          border: "none",
          outline: "none"
        }}
      >
        <RefreshCw size={18} style={{ animation: loading ? "spin 2s linear infinite" : "none" }} />
        {loading ? "REFRESHING..." : success ? "QUEUED" : "REFRESH DATA"}
      </button>
      {error && (
        <span style={{ color: "var(--arcade-red)", fontFamily: "'VT323', monospace", fontSize: "16px" }}>
          {error}
        </span>
      )}
    </div>
  );
}
