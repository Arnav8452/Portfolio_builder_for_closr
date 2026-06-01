"use client";

import React, { useState, useEffect } from "react";

export function BuildingBanner() {
  const [frame, setFrame] = useState(0);
  const frames = ["|", "/", "-", "\\"];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      backgroundColor: "var(--arcade-ink)", 
      color: "var(--arcade-green)", 
      padding: "12px 24px", 
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontFamily: "'Press Start 2P', monospace", 
      fontSize: "12px",
      borderBottom: "4px solid var(--arcade-green)"
    }}>
      <span>{`> INGESTING TELEMETRY...`}</span>
      <span style={{ color: "var(--arcade-yellow)" }}>{`[ STILL BUILDING ${frames[frame]} ]`}</span>
    </div>
  );
}
