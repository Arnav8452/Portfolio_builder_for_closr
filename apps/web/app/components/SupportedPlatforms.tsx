import React from "react";
import { Youtube, Github, Twitch, Twitter, Mail, FileText, Globe, Linkedin, Instagram, Activity } from "lucide-react";

type PlatformTier = {
  id: string;
  title: string;
  description: string;
  items: { name: string; icon: React.FC<any>; color: string; note?: string }[];
};

const TIERS: PlatformTier[] = [
  {
    id: "tier-1",
    title: "01 · OAuth Data",
    description: "Absolute Trust. Deep analytics directly from the source.",
    items: [
      { name: "YouTube", icon: Youtube, color: "var(--arcade-red)", note: "Brand Acct recommended" },
      { name: "GitHub", icon: Github, color: "var(--arcade-cream)" },
      { name: "Twitch", icon: Twitch, color: "var(--arcade-purple)" },
      { name: "X / Twitter", icon: Twitter, color: "var(--arcade-blue)" },
      { name: "Instagram", icon: Instagram, color: "var(--arcade-red)", note: "Requires FB Page & Pro Acct" },
    ],
  },
  {
    id: "tier-2",
    title: "02 · RSS & Topological",
    description: "High Trust. Content verified via domain challenges and feeds.",
    items: [
      { name: "Substack", icon: Mail, color: "var(--arcade-yellow)" },
      { name: "Medium", icon: FileText, color: "var(--arcade-cream)" },
      { name: "Podcasts", icon: Activity, color: "var(--arcade-blue)" },
      { name: "Domains", icon: Globe, color: "var(--arcade-green)" },
    ],
  },
  {
    id: "tier-3",
    title: "03 · Scraped Links",
    description: "Variable Trust. Headless browsing fallback for closed platforms.",
    items: [
      { name: "LinkedIn", icon: Linkedin, color: "var(--arcade-blue)" },
      { name: "Patreon", icon: Activity, color: "var(--arcade-red)" },
    ],
  },
];

export function SupportedPlatforms() {
  return (
    <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto", padding: "32px 0" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h2>Supported Platforms</h2>
        <p style={{ marginTop: "8px" }}>
          We categorize integrations by their cryptographic trust layer.
        </p>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        {TIERS.map((tier) => (
          <div key={tier.id} style={{ border: "3px solid var(--arcade-ink)", background: "var(--arcade-cream-soft)", boxShadow: "4px 4px 0 0 var(--arcade-ink)", padding: "20px" }}>
            <div style={{ borderBottom: "2px solid var(--arcade-ink)", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ marginBottom: "4px", color: "var(--arcade-yellow)" }}>{tier.title}</h3>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: 0 }}>{tier.description}</p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "12px" }}>
              {tier.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 8px", border: "2px solid var(--arcade-ink)", background: "var(--arcade-cream)", boxShadow: "2px 2px 0 0 var(--arcade-ink)", transition: "transform 60ms, box-shadow 60ms", cursor: "default" }}>
                    <Icon style={{ width: 28, height: 28, marginBottom: 8, color: item.color }} />
                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px", color: "var(--arcade-ink)", textAlign: "center", textTransform: "uppercase" }}>
                      {item.name}
                    </span>
                    {item.note && (
                      <span style={{ fontFamily: "'VT323', monospace", fontSize: "12px", color: "var(--muted)", textAlign: "center", marginTop: "8px", lineHeight: 1.1 }}>
                        *{item.note}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
