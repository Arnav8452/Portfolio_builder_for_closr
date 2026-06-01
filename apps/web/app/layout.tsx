import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { MobileNav } from "./components/MobileNav";

export const metadata: Metadata = {
  title: "Closr Verified Portfolio Builder",
  description: "Verified creator profiles powered by OAuth, OSINT, and structured inference.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <a className="brand" href="/creators">
              <span className="brand-mark">C</span>
              <span>Closr</span>
            </a>
            <nav className="nav desktop-nav">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span>Creator Portal</span>
                <span className="system-status" title="Systems operational" />
                <span style={{ 
                  fontFamily: "'VT323', monospace", 
                  color: "var(--arcade-green)", 
                  fontSize: "16px", 
                  fontWeight: "bold",
                  animation: "pulse 1.5s infinite"
                }}>
                  LIVE
                </span>
              </div>
            </nav>
            <MobileNav />
          </header>
          <Providers>{children}</Providers>
          <footer className="site-footer">
            <p>Closr OSINT Engine 2026 · Data Cryptographically Verified</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
