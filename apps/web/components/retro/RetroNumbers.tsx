import React from "react";

type RetroNumbersProps = {
  stats: {
    label: string;
    subLabel: string;
    value: string | number;
  }[];
};

export function RetroNumbers({ stats }: RetroNumbersProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <div style={{ padding: "48px 24px", backgroundColor: "var(--arcade-cream)" }}>
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
        <span>04</span>
        <span>.</span>
        <span>NUMBERS</span>
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {stats.map((stat, i) => (
          <div 
            key={i}
            className="pixel-border"
            style={{
              flex: "1 1 200px",
              backgroundColor: "var(--arcade-cream-soft)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "10px", color: "var(--arcade-ink)", marginBottom: "4px" }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px", color: "var(--muted-2)" }}>
                {stat.subLabel}
              </div>
            </div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: "42px", color: "var(--arcade-ink)", lineHeight: 1 }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
