"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type RetroStatsProps = {
  languages?: { name: string; value: number }[];
  heatmapDays?: number; // 0 to 4 activity level
};

const PIE_COLORS = [
  "var(--arcade-red)",
  "var(--arcade-blue)",
  "var(--arcade-green)",
  "var(--arcade-yellow)",
  "var(--arcade-purple)",
  "#999999",
  "#444444"
];

export function RetroStats({ languages }: RetroStatsProps) {
  if (!languages || languages.length === 0) return null;

  // Generate dummy heatmap data for display (365 days)
  const heatmapGrid = Array.from({ length: 7 * 52 }, () => Math.random() > 0.8 ? Math.floor(Math.random() * 4) + 1 : 0);

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 1: return "#a4d3a2";
      case 2: return "#5cb85c";
      case 3: return "#4cae4c";
      case 4: return "var(--arcade-green)";
      default: return "transparent";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h2 
        style={{ 
          fontFamily: "'Press Start 2P', monospace", 
          fontSize: "12px", 
          color: "var(--arcade-red)",
          textTransform: "uppercase",
          marginBottom: "32px",
          display: "flex",
          gap: "16px"
        }}
      >
        <span>03</span>
        <span>.</span>
        <span>STATS</span>
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "stretch" }}>
        {/* Heatmap Panel */}
        <div style={{ flex: "1 1 300px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Press Start 2P', monospace", fontSize: "10px", color: "var(--arcade-ink)", marginBottom: "8px" }}>
            <span>365-DAY COMMIT HEATMAP</span>
            <span>{heatmapGrid.filter(d => d > 0).length} ACTIVE DAYS</span>
          </div>
          <div className="pixel-border" style={{ backgroundColor: "var(--arcade-cream-soft)", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div 
              style={{ 
                display: "grid", 
                gridTemplateRows: "repeat(7, 1fr)", 
                gridAutoFlow: "column", 
                gap: "2px",
                overflowX: "auto"
              }}
            >
              {heatmapGrid.map((level, i) => (
                <div 
                  key={i} 
                  style={{ 
                    width: "12px", 
                    height: "12px", 
                    backgroundColor: getHeatmapColor(level),
                    border: "1px solid var(--arcade-ink)"
                  }} 
                />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Press Start 2P', monospace", fontSize: "8px", color: "var(--muted-2)", marginTop: "8px" }}>
              <span>LESS</span>
              <div style={{ width: 10, height: 10, border: "1px solid var(--arcade-ink)", backgroundColor: "transparent" }} />
              <div style={{ width: 10, height: 10, border: "1px solid var(--arcade-ink)", backgroundColor: getHeatmapColor(1) }} />
              <div style={{ width: 10, height: 10, border: "1px solid var(--arcade-ink)", backgroundColor: getHeatmapColor(2) }} />
              <div style={{ width: 10, height: 10, border: "1px solid var(--arcade-ink)", backgroundColor: getHeatmapColor(3) }} />
              <div style={{ width: 10, height: 10, border: "1px solid var(--arcade-ink)", backgroundColor: getHeatmapColor(4) }} />
              <span>MORE</span>
            </div>
          </div>
        </div>

        {/* Pie Chart Panel */}
        <div 
          className="pixel-border" 
          style={{ 
            flex: "1 1 300px", 
            backgroundColor: "var(--arcade-cream-soft)",
            padding: "clamp(16px, 4vw, 24px)",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "10px", color: "var(--arcade-ink)" }}>
            LANGUAGE DISTRIBUTION
          </div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", height: "100%" }}>
            <div style={{ width: "160px", height: "160px", position: "relative", margin: "0 auto" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languages}
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="var(--arcade-ink)"
                    strokeWidth={2}
                  >
                    {languages.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--arcade-cream)", 
                      border: "2px solid var(--arcade-ink)", 
                      borderRadius: 0,
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: "10px",
                      boxShadow: "4px 4px 0 0 var(--arcade-ink)"
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", fontFamily: "'Press Start 2P', monospace", fontSize: "10px", color: "var(--arcade-ink)" }}>
                <div>{languages.length}</div>
                <div>LANGS</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              {languages.slice(0, 6).map((lang, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Press Start 2P', monospace", fontSize: "9px", color: "var(--arcade-ink)" }}>
                  <div style={{ width: 12, height: 12, border: "2px solid var(--arcade-ink)", backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span style={{ flex: 1, textTransform: "uppercase" }}>{lang.name}</span>
                  <span>{lang.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
