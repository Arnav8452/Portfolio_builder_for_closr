"use client";

import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

type RadarScores = {
  impact: number;
  consistency: number;
  quality: number;
  depth: number;
  breadth: number;
  community: number;
};

type RetroRadarProps = {
  scores?: RadarScores;
};

const getGrade = (score: number) => {
  if (score >= 90) return { grade: "S", color: "var(--arcade-purple)" };
  if (score >= 80) return { grade: "A", color: "var(--arcade-green)" };
  if (score >= 70) return { grade: "B", color: "var(--arcade-green)" };
  if (score >= 60) return { grade: "C", color: "var(--arcade-yellow)" };
  if (score >= 50) return { grade: "D", color: "var(--arcade-yellow)" };
  return { grade: "F", color: "var(--arcade-red)" };
};

export function RetroRadar({ scores }: RetroRadarProps) {
  if (!scores) return null;

  const data = [
    { subject: "Impact", A: scores.impact, fullMark: 100 },
    { subject: "Consistency", A: scores.consistency, fullMark: 100 },
    { subject: "Quality", A: scores.quality, fullMark: 100 },
    { subject: "Depth", A: scores.depth, fullMark: 100 },
    { subject: "Breadth", A: scores.breadth, fullMark: 100 },
    { subject: "Community", A: scores.community, fullMark: 100 },
  ];

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
        <span>02</span>
        <span>.</span>
        <span>CATEGORY BREAKDOWN</span>
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        {/* Radar Chart Panel */}
        <div 
          className="pixel-border" 
          style={{ 
            flex: "1 1 400px", 
            backgroundColor: "var(--arcade-cream-soft)",
            padding: "24px",
            height: "400px"
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="var(--line-strong)" strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: "var(--arcade-ink)", fontFamily: "'Press Start 2P', monospace", fontSize: 10 }} 
              />
              <Radar
                name="Score"
                dataKey="A"
                stroke="var(--arcade-red)"
                strokeWidth={3}
                fill="var(--arcade-red)"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Bars Panel */}
        <div 
          className="pixel-border" 
          style={{ 
            flex: "1 1 400px", 
            backgroundColor: "var(--arcade-cream-soft)",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          {data.map((item) => {
            const gradeInfo = getGrade(item.A);
            return (
              <div key={item.subject} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Label */}
                <div style={{ width: "120px", fontFamily: "'Press Start 2P', monospace", fontSize: "10px", color: "var(--arcade-ink)" }}>
                  <div style={{ marginBottom: "4px" }}>{item.subject.toUpperCase()}</div>
                  <div style={{ fontSize: "8px", color: "var(--muted-2)" }}>20% WEIGHT</div>
                </div>
                
                {/* Progress Bar Track */}
                <div className="pixel-border" style={{ flex: 1, height: "20px", backgroundColor: "white", padding: "2px", display: "flex" }}>
                  <div 
                    style={{ 
                      width: `${item.A}%`, 
                      backgroundColor: gradeInfo.color,
                      height: "100%"
                    }} 
                  />
                </div>

                {/* Number */}
                <div style={{ width: "30px", textAlign: "right", fontFamily: "'Press Start 2P', monospace", fontSize: "12px", color: "var(--arcade-ink)" }}>
                  {item.A}
                </div>

                {/* Grade Badge */}
                <div 
                  className="pixel-border" 
                  style={{ 
                    width: "24px", 
                    height: "24px", 
                    backgroundColor: gradeInfo.color,
                    color: item.A >= 70 ? "var(--arcade-ink)" : "var(--arcade-cream)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "10px"
                  }}
                >
                  {gradeInfo.grade}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
