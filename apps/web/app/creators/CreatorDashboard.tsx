"use client";

import { useState, useEffect } from "react";
import { signOut, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
  AlertCircle,
  RefreshCw,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { CreatorIntake } from "./CreatorIntake";
import { deleteCreatorProfile } from "./actions";

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

export function CreatorDashboard({ portfolio, missingProviders = [] }: { portfolio: ExistingPortfolio, missingProviders?: string[] }) {
  const [mode, setMode] = useState<"dashboard" | "edit">("dashboard");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const err = searchParams?.get("error");
    if (err === "OAuthAccountNotLinked") {
      setErrorMsg("This account is already connected to another portfolio.");
      // Optional: Clean up URL
      window.history.replaceState(null, "", "/creators");
    }
  }, [searchParams]);

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

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to permanently delete your verified creator portfolio? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    const result = await deleteCreatorProfile(portfolio.id);
    if (!result.ok) {
      setErrorMsg(result.message || "Failed to delete portfolio.");
      setIsDeleting(false);
    } else {
      router.refresh();
    }
  }

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  }

  return (
    <div className="creator-stage compact fade-in" style={{ padding: "48px 24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header bar */}
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Your Portfolio</h1>
          <p className="dashboard-subtitle">
            Manage your verified creator identity
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="secondary-action"
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ gap: "6px" }}
          >
            <RefreshCw size={14} className={isRefreshing ? "spin" : ""} /> Refresh
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={() => signOut()}
            style={{ gap: "6px" }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md mb-6 flex items-center gap-2">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

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
        <div className="dash-actions" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a
            className="primary-action"
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1 }}
          >
            <ExternalLink size={16} /> View Live
          </a>
          <button
            className="primary-action edit-action"
            type="button"
            onClick={() => setMode("edit")}
            style={{ flex: 1 }}
          >
            <Edit3 size={16} /> Edit Portfolio
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{ borderColor: "var(--arcade-red)", color: "var(--arcade-red)" }}
          >
            <Trash2 size={16} /> {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Connect More Accounts */}
      {missingProviders.length > 0 && (
        <div className="share-card" style={{ marginBottom: "24px" }}>
          <h3>Connect More Verified Accounts (Root Nodes)</h3>
          <p className="dashboard-subtitle" style={{ marginBottom: "16px", marginTop: "4px" }}>
            Linking these platforms cryptographically proves your identity.
          </p>
          <div className="share-social-row">
            {missingProviders.includes("github") && (
              <button
                className="secondary-action"
                type="button"
                onClick={() => signIn("github", { callbackUrl: "/api/auth/sync-oauth" })}
              >
                <Github size={14} /> Connect GitHub
              </button>
            )}
            {missingProviders.includes("youtube") && (
              <button
                className="secondary-action"
                type="button"
                onClick={() => signIn("youtube", { callbackUrl: "/api/auth/sync-oauth" })}
              >
                <Youtube size={14} /> Connect YouTube
              </button>
            )}
            {missingProviders.includes("twitch") && (
              <button
                className="secondary-action"
                type="button"
                onClick={() => signIn("twitch", { callbackUrl: "/api/auth/sync-oauth" })}
              >
                <Twitch size={14} /> Connect Twitch
              </button>
            )}
          </div>
        </div>
      )}

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
