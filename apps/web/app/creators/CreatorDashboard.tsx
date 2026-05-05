"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  ExternalLink,
  Edit3,
  Youtube,
  Github,
  Twitch,
  Clock,
  CheckCircle2,
  Loader2,
  Copy,
  Twitter,
  Linkedin,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { CreatorIntake } from "./CreatorIntake";

type PortfolioLink = {
  platform: string;
  url: string;
  normalized_url: string;
  verification_level: number;
  verification_status: string;
};

export type ExistingPortfolio = {
  id: string;
  slug: string;
  display_name: string;
  root_platform: string;
  root_handle: string | null;
  onboarding_status: string;
  updated_at: string;
  links: PortfolioLink[];
};

const PLATFORM_ICON: Record<string, LucideIcon> = {
  youtube: Youtube,
  github: Github,
  twitch: Twitch,
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
};

function statusConfig(status: string) {
  switch (status) {
    case "completed":
    case "analysis_completed":
      return { label: "Live", className: "status-live" };
    case "queued":
    case "processing":
      return { label: "Processing", className: "status-processing" };
    default:
      return { label: "Draft", className: "status-draft" };
  }
}

function timeSince(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CreatorDashboard({ portfolio }: { portfolio: ExistingPortfolio }) {
  const [mode, setMode] = useState<"dashboard" | "edit">("dashboard");
  const [copied, setCopied] = useState(false);

  if (mode === "edit") {
    return <CreatorIntake existingPortfolio={portfolio} />;
  }

  const status = statusConfig(portfolio.onboarding_status);
  const RootIcon = PLATFORM_ICON[portfolio.root_platform] ?? Github;
  const liveUrl = `/p/${portfolio.slug}`;
  const fullUrl = typeof window !== "undefined"
    ? `${window.location.origin}${liveUrl}`
    : liveUrl;
  const rootLink = portfolio.links.find(
    (l) => l.verification_level === 3 || l.platform === portfolio.root_platform,
  );
  const secondaryLinks = portfolio.links.filter((l) => l !== rootLink);

  function copyLink() {
    void navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my verified creator portfolio on Closr ✅\n${fullUrl}`)}`,
      "_blank",
    );
  }

  function shareLinkedIn() {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
      "_blank",
    );
  }

  return (
    <div className="creator-shell fade-in">
      {/* Header bar */}
      <div className="dashboard-header">
        <div>
          <h1>Your Portfolio</h1>
          <p className="dashboard-subtitle">
            Manage your verified creator identity
          </p>
        </div>
        <button
          className="secondary-action"
          type="button"
          onClick={() => signOut()}
          style={{ gap: "6px" }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Main portfolio card */}
      <div className="portfolio-dash-card">
        <div className="dash-card-top">
          <div className="dash-card-identity">
            <div className="dash-avatar">
              <RootIcon size={28} />
            </div>
            <div>
              <h2 className="dash-card-name">{portfolio.display_name}</h2>
              <span className="dash-card-handle">
                {portfolio.root_handle ? `@${portfolio.root_handle}` : portfolio.root_platform}
                {" · "}
                <span className={`status-badge ${status.className}`}>
                  {status.label === "Processing" && <Loader2 size={12} className="spin" />}
                  {status.label === "Live" && <CheckCircle2 size={12} />}
                  {status.label === "Draft" && <Clock size={12} />}
                  {status.label}
                </span>
              </span>
            </div>
          </div>
          <span className="dash-card-updated">
            <Clock size={12} /> Updated {timeSince(portfolio.updated_at)}
          </span>
        </div>

        {/* Links grid */}
        <div className="dash-links-grid">
          {rootLink && (
            <div className="dash-link-item root">
              <span className="dash-link-platform">{rootLink.platform}</span>
              <span className="badge">Root · L{rootLink.verification_level}</span>
            </div>
          )}
          {secondaryLinks.map((link) => (
            <div className="dash-link-item" key={link.normalized_url}>
              <span className="dash-link-platform">{link.platform}</span>
              <span className="badge">L{link.verification_level}</span>
            </div>
          ))}
        </div>

        {/* Action row */}
        <div className="dash-actions">
          <a
            className="primary-action"
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={16} /> View Live
          </a>
          <button
            className="primary-action edit-action"
            type="button"
            onClick={() => setMode("edit")}
          >
            <Edit3 size={16} /> Edit Portfolio
          </button>
        </div>
      </div>

      {/* Share card */}
      <div className="share-card">
        <h3>Share your portfolio</h3>
        <div className="share-url-row">
          <input
            className="input share-url-input"
            value={fullUrl}
            readOnly
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            className="primary-action copy-btn"
            type="button"
            onClick={copyLink}
          >
            <Copy size={14} /> {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="share-social-row">
          <button className="secondary-action" type="button" onClick={shareTwitter}>
            <Twitter size={14} /> Twitter
          </button>
          <button className="secondary-action" type="button" onClick={shareLinkedIn}>
            <Linkedin size={14} /> LinkedIn
          </button>
        </div>
      </div>
    </div>
  );
}
