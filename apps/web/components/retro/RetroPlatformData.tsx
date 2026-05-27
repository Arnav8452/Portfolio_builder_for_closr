import React from "react";
import { Database, Terminal } from "lucide-react";

type PlatformMetric = {
  platform: string;
  identity_key: string;
  raw_payload: any;
  fetched_at: string;
};

type RetroPlatformDataProps = {
  metrics?: PlatformMetric[];
};

export function RetroPlatformData({ metrics }: RetroPlatformDataProps) {
  if (!metrics || metrics.length === 0) return null;

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
          gap: "16px",
          alignItems: "center"
        }}
      >
        <span>05</span>
        <span>.</span>
        <span>PLATFORM DATA DUMP</span>
        <Database size={16} />
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {metrics.map((metric, idx) => (
          <div key={idx} className="pixel-border" style={{ backgroundColor: "var(--arcade-dark)", padding: "24px" }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", borderBottom: "1px dashed var(--muted)", paddingBottom: "12px" }}>
              <Terminal size={20} color="var(--arcade-green)" />
              <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "var(--arcade-green)", margin: 0, textTransform: "uppercase" }}>
                {metric.platform} API RESPONSE
              </h3>
              <span style={{ marginLeft: "auto", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--muted)", textTransform: "uppercase" }}>
                STATUS: 200 OK
              </span>
            </div>

            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <pre style={{
                fontFamily: "'VT323', monospace",
                fontSize: "18px",
                lineHeight: "1.2",
                color: "var(--arcade-cream)",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}>
                {JSON.stringify(metric.raw_payload, null, 2)}
              </pre>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
