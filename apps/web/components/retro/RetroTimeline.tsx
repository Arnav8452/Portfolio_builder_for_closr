import { Clock } from "lucide-react";

type TimelineEvent = {
  date: string;
  title: string;
  description: string;
};

export function RetroTimeline({ events }: { events?: TimelineEvent[] }) {
  if (!events || events.length === 0) return null;

  return (
    <section className="bento-card col-span-1" style={{ border: "2px solid var(--arcade-yellow)" }}>
      <div className="card-header">
        <h2 style={{ color: "var(--arcade-yellow)" }}>EXPERIENCE</h2>
        <div className="header-decoration" style={{ backgroundColor: "var(--arcade-yellow)" }} />
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "16px", position: "relative" }}>
        {/* Vertical line connecting events */}
        <div style={{ 
          position: "absolute", 
          left: "7px", 
          top: "8px", 
          bottom: "8px", 
          width: "2px", 
          backgroundColor: "var(--arcade-yellow)",
          opacity: 0.3
        }} />

        {events.map((event, idx) => (
          <div key={idx} style={{ display: "flex", gap: "16px", position: "relative" }}>
            {/* Timeline Node */}
            <div style={{ 
              width: "16px", 
              height: "16px", 
              backgroundColor: "var(--arcade-cream)", 
              border: "2px solid var(--arcade-yellow)", 
              boxShadow: "0 0 8px rgba(245, 166, 35, 0.5)",
              flexShrink: 0,
              marginTop: "4px",
              zIndex: 1
            }} />
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "12px", color: "var(--arcade-yellow)", lineHeight: "1.4" }}>
                  {event.title.toUpperCase()}
                </h3>
                <span style={{ 
                  fontFamily: "'VT323', monospace", 
                  fontSize: "16px", 
                  color: "var(--arcade-ink)", 
                  backgroundColor: "var(--arcade-yellow)", 
                  padding: "2px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <Clock size={12} />
                  {event.date}
                </span>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", lineHeight: "1.6", color: "var(--muted-2)" }}>
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
