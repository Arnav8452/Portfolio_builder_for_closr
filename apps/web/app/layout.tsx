import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

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
            <nav className="nav">
              <span>Creator Portal</span>
              <a href="/p/demo">Profile</a>
              <span className="system-status" title="Systems operational" />
            </nav>
          </header>
          <Providers>{children}</Providers>
          <footer className="site-footer">
            <p>Closr OSINT Engine 2026. Data is cryptographically verified.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
