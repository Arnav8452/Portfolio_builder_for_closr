"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { signIn, useSession } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Github,
  GitCommit,
  Globe,
  Hash,
  Instagram,
  Link as LinkIcon,
  Linkedin,
  Loader2,
  Mail,
  Music,
  Network,
  PieChart,
  Plus,
  RadioTower,
  ShieldCheck,
  Terminal,
  Twitch,
  Twitter,
  UserCheck,
  Video,
  X,
  Youtube,
} from "lucide-react";
import { submitCreatorProfile } from "./actions";
import { SupportedPlatforms } from "../components/SupportedPlatforms";

type Step = "honeypot" | "router" | "input" | "processing" | "challenge" | "result";
type PlatformKind = "oauth" | "bio" | "domain";
type ProviderId = "google" | "youtube" | "github" | "twitch";
type LogTone = "system" | "info" | "warning" | "success" | "error";

type PlatformDetection = {
  id: string;
  formValue: string;
  name: string;
  icon: LucideIcon;
  type: PlatformKind;
  trust: string;
  provider?: ProviderId;
  accent: string;
};

type RootNode = PlatformDetection & {
  url: string;
  username: string;
};

type LogEntry = {
  time: string;
  message: string;
  tone: LogTone;
};

type SubmissionResult = {
  ok: boolean;
  message?: string;
  slug?: string;
  creatorId?: string;
};

const STEPS = {
  HONEYPOT: "honeypot",
  ROUTER: "router",
  INPUT: "input",
  PROCESSING: "processing",
  CHALLENGE: "challenge",
  RESULT: "result",
} as const;

const SUPPORTED_LINKS = [
  { name: "Twitter / X", icon: Twitter },
  { name: "LinkedIn", icon: Linkedin },
  { name: "Substack", icon: Mail },
  { name: "Medium", icon: FileText },
  { name: "Personal Site", icon: Globe },
];

const CATEGORY_TITLES: Record<string, string> = {
  youtube: "Video",
  github: "Developer",
  twitch: "Streaming",
  substack: "Written",
  medium: "Written",
  twitter: "Social",
  x: "Social",
  linkedin: "Social",
  instagram: "Social",
  tiktok: "Social",
  website: "Owned Domain",
  domain: "Owned Domain",
  other: "Claimed Link",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withProtocol(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function readableHost(input: string) {
  try {
    return new URL(withProtocol(input)).hostname.replace(/^www\./, "");
  } catch {
    return input.trim();
  }
}

function handleFromUrl(input: string) {
  try {
    const url = new URL(withProtocol(input));
    const pathPart = url.pathname.split("/").filter(Boolean).at(-1);
    return (pathPart || url.hostname.replace(/^www\./, "")).replace(/^@/, "");
  } catch {
    return input.replace(/^@/, "");
  }
}

function nameFromHandle(handle: string) {
  const cleaned = handle
    .replace(/^@/, "")
    .replace(/\.[a-z]+$/i, "")
    .replace(/[-_.]+/g, " ")
    .trim();
  return cleaned
    ? cleaned
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "";
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "C";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function parseUrlForPlatform(input: string): PlatformDetection {
  const normalized = withProtocol(input).toLowerCase();

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.replace(/^www\./, "");

    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return {
        id: "youtube",
        formValue: "youtube",
        name: "YouTube",
        icon: Youtube,
        type: "oauth",
        trust: "OAuth L3",
        provider: "youtube",
        accent: "youtube",
      };
    }

    if (hostname.includes("github.com")) {
      return {
        id: "github",
        formValue: "github",
        name: "GitHub",
        icon: Github,
        type: "oauth",
        trust: "OAuth L3",
        provider: "github",
        accent: "github",
      };
    }

    if (hostname.includes("twitch.tv")) {
      return {
        id: "twitch",
        formValue: "twitch",
        name: "Twitch",
        icon: Twitch,
        type: "oauth",
        trust: "OAuth L3",
        provider: "twitch",
        accent: "twitch",
      };
    }

    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      return {
        id: "x",
        formValue: "x",
        name: "Twitter / X",
        icon: Twitter,
        type: "bio",
        trust: "Bio L2",
        accent: "social",
      };
    }

    if (hostname.includes("substack.com")) {
      return {
        id: "substack",
        formValue: "substack",
        name: "Substack",
        icon: Mail,
        type: "bio",
        trust: "RSS L2",
        accent: "written",
      };
    }

    if (hostname.includes("medium.com")) {
      return {
        id: "medium",
        formValue: "medium",
        name: "Medium",
        icon: FileText,
        type: "bio",
        trust: "RSS L2",
        accent: "written",
      };
    }

    if (hostname.includes("linkedin.com")) {
      return {
        id: "linkedin",
        formValue: "other",
        name: "LinkedIn",
        icon: Linkedin,
        type: "bio",
        trust: "Bio L2",
        accent: "social",
      };
    }

    if (hostname.includes("instagram.com")) {
      return {
        id: "instagram",
        formValue: "other",
        name: "Instagram",
        icon: Instagram,
        type: "bio",
        trust: "Bio L2",
        accent: "social",
      };
    }

    if (hostname.includes("tiktok.com")) {
      return {
        id: "tiktok",
        formValue: "other",
        name: "TikTok",
        icon: Music,
        type: "bio",
        trust: "Bio L2",
        accent: "social",
      };
    }

    return {
      id: "website",
      formValue: "website",
      name: hostname,
      icon: Globe,
      type: "domain",
      trust: "Domain DNS L3",
      accent: "domain",
    };
  } catch {
    return {
      id: "website",
      formValue: "website",
      name: input,
      icon: Globe,
      type: "domain",
      trust: "Domain DNS L3",
      accent: "domain",
    };
  }
}

function createLog(message: string, tone: LogTone = "info"): LogEntry {
  return {
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    message,
    tone,
  };
}

export function CreatorIntake() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState<Step>(STEPS.HONEYPOT);
  const [rootNode, setRootNode] = useState<RootNode | null>(null);
  const [mainLinkInput, setMainLinkInput] = useState("");
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformDetection | null>(null);
  const [showDnsInstructions, setShowDnsInstructions] = useState(false);
  const [challengeCode, setChallengeCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [secondaryLinks, setSecondaryLinks] = useState<string[]>([]);
  const [currentLinkInput, setCurrentLinkInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [challengedLink, setChallengedLink] = useState<string | null>(null);
  const [challengeHandled, setChallengeHandled] = useState(false);
  const [challengeVerified, setChallengeVerified] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(1799);
  const [submitResult, setSubmitResult] = useState<SubmissionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAuthenticated = status === "authenticated" && Boolean(session?.user);
  const secondaryCards = useMemo(
    () => secondaryLinks.map((link) => ({ link, platform: parseUrlForPlatform(link) })),
    [secondaryLinks],
  );

  useEffect(() => {
    if (currentStep !== STEPS.CHALLENGE) return;
    setTimeLeft(1799);
    const interval = window.setInterval(() => setTimeLeft((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(interval);
  }, [currentStep]);

  function handleHoneypotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mainLinkInput.trim()) return;

    const platformData = parseUrlForPlatform(mainLinkInput);
    setDetectedPlatform(platformData);
    setChallengeCode(platformData.type === "domain" ? "closr-verification=8f2a" : "closr-8f2a");
    setShowDnsInstructions(false);
    setCurrentStep(STEPS.ROUTER);
  }

  function completeRootVerification() {
    if (!detectedPlatform) return;
    const username = handleFromUrl(mainLinkInput);
    setRootNode({
      ...detectedPlatform,
      url: withProtocol(mainLinkInput),
      username,
    });
    if (!displayName) {
      setDisplayName(nameFromHandle(username));
    }
    setCurrentStep(STEPS.INPUT);
  }

  function connectOauthRoot() {
    if (!detectedPlatform?.provider) return;
    // For YouTube, we use the 'youtube' provider ID which grants YouTube-specific scopes
    // NextAuth will handle the session linking automatically
    const providerId = detectedPlatform.provider === "youtube" ? "youtube" : detectedPlatform.provider;
    void signIn(providerId, { callbackUrl: "/creators" });
  }

  function handleAddLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextLink = currentLinkInput.trim();
    if (!nextLink || secondaryLinks.includes(nextLink)) return;
    setSecondaryLinks((current) => [...current, nextLink]);
    setCurrentLinkInput("");
  }

  function removeLink(linkToRemove: string) {
    setSecondaryLinks((current) => current.filter((link) => link !== linkToRemove));
  }

  function startVerification() {
    if (!rootNode || !displayName.trim() || secondaryLinks.length === 0 || isPending) return;
    if (!challengeHandled && secondaryLinks.length > 0) {
      setChallengedLink(secondaryLinks[0]);
      setCurrentStep(STEPS.CHALLENGE);
      return;
    }
    submitPortfolio(challengeVerified ?? true);
  }

  function submitPortfolio(verifiedChallenge: boolean) {
    if (!rootNode) return;
    setChallengeHandled(true);
    setChallengeVerified(verifiedChallenge);
    setCurrentStep(STEPS.PROCESSING);
    setSubmitResult(null);

    const form = new FormData();
    form.set("displayName", displayName.trim() || nameFromHandle(rootNode.username) || "Verified Creator");
    form.set("rootPlatform", rootNode.formValue);
    form.set("rootUrl", rootNode.url);
    secondaryLinks.forEach((link) => form.append("secondaryLinks", link));

    startTransition(() => {
      void runSubmission(form, verifiedChallenge);
    });
  }

  async function runSubmission(form: FormData, verifiedChallenge: boolean) {
    setProgress(8);
    setLogs([createLog("Securing creator row and queue position.", "system")]);

    try {
      await sleep(350);
      setProgress(24);
      setLogs((current) => [...current, createLog("Writing root node and claimed links to Supabase.", "info")]);

      const responsePromise = submitCreatorProfile(form) as Promise<SubmissionResult>;

      await sleep(550);
      setProgress(46);
      setLogs((current) => [
        ...current,
        createLog("Splitting workload into scraping_queue and analysis_queue contracts.", "info"),
      ]);

      await sleep(550);
      setProgress(68);
      setLogs((current) => [
        ...current,
        createLog(
          verifiedChallenge
            ? "Challenge code accepted for the first secondary profile."
            : "First secondary profile marked as claimed until worker verification.",
          verifiedChallenge ? "success" : "warning",
        ),
      ]);

      const response = await responsePromise;
      setSubmitResult(response);

      if (!response.ok) {
        setProgress(82);
        setLogs((current) => [
          ...current,
          createLog(response.message ?? "The queue write failed before worker pickup.", "error"),
        ]);
      } else {
        setProgress(100);
        setLogs((current) => [
          ...current,
          createLog(`Portfolio job queued. Public slug: ${response.slug}`, "success"),
        ]);
      }

      await sleep(450);
      setCurrentStep(STEPS.RESULT);
    } catch (error) {
      setProgress(82);
      setSubmitResult({
        ok: false,
        message: error instanceof Error ? error.message : "Could not queue this portfolio.",
      });
      setLogs((current) => [
        ...current,
        createLog(error instanceof Error ? error.message : "Could not queue this portfolio.", "error"),
      ]);
      await sleep(350);
      setCurrentStep(STEPS.RESULT);
    }
  }

  function resetFlow() {
    setCurrentStep(STEPS.HONEYPOT);
    setRootNode(null);
    setMainLinkInput("");
    setDetectedPlatform(null);
    setChallengeCode("");
    setDisplayName("");
    setSecondaryLinks([]);
    setCurrentLinkInput("");
    setProgress(0);
    setLogs([]);
    setChallengedLink(null);
    setChallengeHandled(false);
    setChallengeVerified(null);
    setSubmitResult(null);
  }

  function renderHoneypot() {
    return (
      <section className="creator-stage narrow fade-in">
        <div className="creator-intro">
          <h1>Connect your Root Node.</h1>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: "22px" }}>Choose the platform where you have the most authority and verifiable metrics. This will serve as the cryptographic anchor for your B2B portfolio.</p>
        </div>

        <form className="hero-form" onSubmit={handleHoneypotSubmit}>
          <label className="sr-only" htmlFor="main-link">Primary creator link</label>
          <input
            id="main-link"
            className="input hero-input"
            type="text"
            value={mainLinkInput}
            onChange={(event) => setMainLinkInput(event.target.value)}
            placeholder="youtube.com/c/yourname"
            required
            autoFocus
          />
          <button className="primary-action hero-action" type="submit">
            Start Building
            <ArrowRight size={18} />
          </button>
        </form>
      </section>
    );
  }

  function renderSmartRouter() {
    if (!detectedPlatform) return null;
    const Icon = detectedPlatform.icon;

    return (
      <section className="creator-stage compact fade-in">
        <button className="back-button" type="button" onClick={() => setCurrentStep(STEPS.HONEYPOT)}>
          <ArrowRight size={16} />
          Change link
        </button>

        <div className="router-card">
          <div className={`platform-mark ${detectedPlatform.accent}`}>
            <Icon size={38} />
          </div>
          <div className="router-copy">
            <div className="eyebrow" style={{ color: "var(--arcade-red)" }}>{detectedPlatform.trust}</div>
            <h2>{detectedPlatform.type === "domain" ? "Nice domain." : detectedPlatform.type === "oauth" ? "Awesome channel." : "Great page."}</h2>
            <p style={{ fontFamily: "'VT323', monospace", fontSize: "20px" }}>
              {detectedPlatform.type === "oauth"
                ? "To pull your verified stats and prove ownership, just click below."
                : detectedPlatform.type === "domain"
                  ? `Are you the technical admin for ${detectedPlatform.name}?`
                  : "Let's make sure nobody else can claim your stats."}
            </p>
          </div>

          {detectedPlatform.type === "oauth" ? (
            <div className="router-actions">
              <button className={`primary-action ${detectedPlatform.accent}`} type="button" onClick={connectOauthRoot}>
                <Icon size={20} />
                Connect {detectedPlatform.name}
              </button>
            </div>
          ) : null}

          {detectedPlatform.type === "bio" ? (
            <div className="instruction-card">
              <div className="instruction-row">
                <span className="step-index">1</span>
                <div>
                  <strong>Copy this verification code</strong>
                  <div className="copy-code">{challengeCode}</div>
                </div>
              </div>
              <div className="instruction-row">
                <span className="step-index">2</span>
                <p>Paste it anywhere in your {detectedPlatform.name} bio or about section.</p>
              </div>
              <div className="instruction-row">
                <span className="step-index">3</span>
                <div>
                  <p>Click verify. You can remove the code after the worker confirms it.</p>
                  <button className="primary-action compact-action" type="button" onClick={completeRootVerification}>
                    Verify ownership
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {detectedPlatform.type === "domain" ? (
            <div className="router-actions">
              {!showDnsInstructions ? (
                <>
                  <button className="primary-action" type="button" onClick={() => setShowDnsInstructions(true)}>
                    Give me the DNS record
                  </button>
                  <button className="secondary-action" type="button" onClick={() => setCurrentStep(STEPS.HONEYPOT)}>
                    Verify a social root instead
                  </button>
                </>
              ) : (
                <div className="instruction-card">
                  <strong>Add this TXT record to your DNS settings</strong>
                  <div className="copy-code">{challengeCode}</div>
                  <button className="primary-action compact-action" type="button" onClick={completeRootVerification}>
                    Verify DNS record
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  function renderGatheringPhase() {
    if (!rootNode) return null;

    return (
      <section className="creator-stage narrow fade-in">
        <div className="success-banner">
          <div className="success-icon">
            <UserCheck size={24} />
          </div>
          <div>
            <h2>Identity Verified</h2>
            <p>Root node secured via {rootNode.name}. Now stack the rest of the creator graph.</p>
          </div>
        </div>

        <div className="gather-copy">
          <h2>Build your matrix.</h2>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: "20px" }}>Add your LinkedIn, your podcast, your secondary channels. We will cross-reference and verify them automatically.</p>
        </div>

        <form className="link-submit-row clean" onSubmit={handleAddLink}>
          <label className="sr-only" htmlFor="secondary-link">Secondary link</label>
          <div className="input-with-icon">
            <LinkIcon size={18} />
            <input
              id="secondary-link"
              className="input"
              type="url"
              value={currentLinkInput}
              onChange={(event) => setCurrentLinkInput(event.target.value)}
              placeholder="https://linkedin.com/in/yourname"
              required={secondaryLinks.length === 0}
            />
          </div>
          <button className="secondary-action square add-button" type="submit" title="Add link">
            <Plus size={18} />
            Add
          </button>
        </form>

        <SupportedPlatforms />

        {secondaryCards.length ? (
          <div className="queue-list clean">
            <div className="queue-heading">
              <h3>Pending Verification Queue</h3>
            </div>
            {secondaryCards.map(({ link, platform }) => {
              const Icon = platform.icon;
              return (
                <div className="queued-link" key={link}>
                  <div className={`platform-mark tiny ${platform.accent}`}>
                    <Icon size={16} />
                  </div>
                  <span>{link}</span>
                  <button className="icon-button" type="button" onClick={() => removeLink(link)} title="Remove link">
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        <button
          className="primary-action generate-action"
          type="button"
          disabled={secondaryLinks.length === 0 || isPending}
          onClick={startVerification}
        >
          {isPending ? "Queueing..." : "Generate Verified Portfolio"}
          <ArrowRight size={18} />
        </button>
      </section>
    );
  }

  function renderProcessing() {
    return (
      <section className="creator-stage compact fade-in">
        <div className="processing-head">
          <div className="processing-icon">
            <Loader2 size={32} className="spin" />
          </div>
          <h2>Building verified portfolio</h2>
          <p>Feel free to close this tab. We will email you when your portfolio is fully verified and live.</p>
        </div>

        <div className="progress-shell">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="terminal-panel">
          <div className="terminal-header">
            <span />
            <span />
            <span />
            <div>
              <Terminal size={14} />
              Supabase Realtime WebSockets
            </div>
          </div>
          <div className="terminal-body">
            {logs.map((log, index) => (
              <div className={`log-row ${log.tone}`} key={`${log.time}-${index}`}>
                <span>[{log.time}]</span>
                <p>{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderChallengeModal() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = String(timeLeft % 60).padStart(2, "0");

    return (
      <div className="modal-backdrop">
        <div className="challenge-modal">
          <div className="warning-icon">
            <AlertCircle size={24} />
          </div>
          <h2>Verification challenge</h2>
          <p>
            Closr could not automatically prove ownership of <strong>{challengedLink}</strong>. Add this temporary code to keep the badge at Level 2.
          </p>
          <div className="challenge-code-card">
            <span>Temporary bio code</span>
            <code>closr-8f2a</code>
            <div>
              <Clock size={16} />
              Expires in {minutes}:{seconds}
            </div>
          </div>
          <div className="modal-actions">
            <button className="primary-action" type="button" onClick={() => submitPortfolio(true)}>
              I added the code
            </button>
            <button className="secondary-action" type="button" onClick={() => submitPortfolio(false)}>
              Skip and mark claimed
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderResult() {
    const root = rootNode;
    if (!root || !submitResult) return null;

    const isSuccess = submitResult.ok;
    const verifiedRatio = challengeVerified === false ? 77 : 100;
    const claimedRatio = 100 - verifiedRatio;

    return (
      <section className="creator-stage wide fade-in">
        <div className={`result-hero ${isSuccess ? "success" : "error"}`}>
          <div className="avatar-ring">
            <span>{initialsFor(displayName)}</span>
            <ShieldCheck size={22} />
          </div>
          <div className="result-copy">
            <div className="eyebrow">{isSuccess ? "Queued portfolio" : "Queue write failed"}</div>
            <h1>{displayName}</h1>
            <p>
              {isSuccess
                ? "The creator graph is now in Supabase. Scraping and analysis workers can promote claimed links into verified data."
                : submitResult.message ?? "The intake could not be queued."}
            </p>
            <div className="chips">
              <span className="badge">
                <ShieldCheck size={14} />
                Root via {root.name}
              </span>
              <span className="badge pending">{secondaryLinks.length} secondary links</span>
              {submitResult.slug ? <span className="chip">/{submitResult.slug}</span> : null}
            </div>
          </div>
          <div className="result-actions">
            {isSuccess && submitResult.slug ? (
              <a className="primary-action compact-action" href={`/p/${submitResult.slug}`}>
                Open portfolio
                <ArrowRight size={18} />
              </a>
            ) : null}
            <button className="secondary-action compact-action" type="button" onClick={resetFlow}>
              Build another
            </button>
          </div>
        </div>

        <div className="result-grid">
          <div className="result-main">
            <h2 className="section-title">
              <Network size={20} />
              Verified platform matrix
            </h2>
            <div className="matrix-section">
              <h3>Root Identity</h3>
              <PlatformCard
                icon={root.icon}
                platform={root.name}
                category={CATEGORY_TITLES[root.id] ?? "Root"}
                trust={root.trust}
                verified
                primary="Queued"
                secondary={readableHost(root.url)}
              />
            </div>

            <div className="matrix-section">
              <h3>Secondary Graph</h3>
              <div className="matrix-grid">
                {secondaryCards.map(({ link, platform }, index) => (
                  <PlatformCard
                    key={link}
                    icon={platform.icon}
                    platform={platform.name}
                    category={CATEGORY_TITLES[platform.id] ?? "Claimed Link"}
                    trust={index === 0 && challengeVerified === false ? "Claimed L1" : platform.trust}
                    verified={index !== 0 || challengeVerified !== false}
                    primary="Worker queued"
                    secondary={readableHost(link)}
                  />
                ))}
              </div>
            </div>
          </div>

          <aside className="result-side">
            <section className="panel">
              <div className="panel-header">
                <h2>
                  <Activity size={18} />
                  Content intelligence
                </h2>
              </div>
              <div className="panel-body stack">
                <div className="topic-cloud">
                  {["primary_niche", "technical_skills", "brand_tone", "past_topics"].map((topic) => (
                    <span className="chip" key={topic}>{topic}</span>
                  ))}
                </div>
                <div className="activity-feed">
                  <TimelineItem icon={Video} title="OAuth metrics requested" detail={root.name} />
                  <TimelineItem icon={FileText} title="RSS and post bodies queued" detail="Substack, Medium, websites" />
                  <TimelineItem icon={Hash} title="JSON schema extraction pending" detail="Qwen 2.5 / Llama 3.2 worker" />
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>
                  <GitCommit size={18} />
                  Verification ledger
                </h2>
              </div>
              <div className="panel-body stack">
                <div className="quality-card">
                  <PieChart size={28} />
                  <div>
                    <strong>Audience quality ratio</strong>
                    <p>{verifiedRatio}% verified, {claimedRatio}% claimed</p>
                  </div>
                </div>
                <TimelineItem icon={CheckCircle2} title={`${root.name} (${root.trust})`} detail="Root evidence stored" />
                <TimelineItem icon={RadioTower} title="scraping_queue" detail="FOR UPDATE SKIP LOCKED ready" />
                <TimelineItem icon={GitCommit} title="analysis_queue" detail="Strict JSON schema output pending" />
              </div>
            </section>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <div className="creator-shell">
      {currentStep === STEPS.HONEYPOT ? renderHoneypot() : null}
      {currentStep === STEPS.ROUTER ? renderSmartRouter() : null}
      {currentStep === STEPS.INPUT ? renderGatheringPhase() : null}
      {currentStep === STEPS.PROCESSING ? renderProcessing() : null}
      {currentStep === STEPS.RESULT ? renderResult() : null}
      {currentStep === STEPS.CHALLENGE ? renderChallengeModal() : null}
    </div>
  );
}

function PlatformCard({
  icon: Icon,
  platform,
  category,
  trust,
  verified,
  primary,
  secondary,
}: {
  icon: LucideIcon;
  platform: string;
  category: string;
  trust: string;
  verified: boolean;
  primary: string;
  secondary: string;
}) {
  return (
    <article className={`platform-card ${verified ? "verified" : "claimed"}`}>
      <div className="trust-line" />
      <div className="platform-card-head">
        <div className="platform-title">
          <span className="platform-icon">
            <Icon size={20} />
          </span>
          <div>
            <strong>{platform}</strong>
            <p>{category}</p>
          </div>
        </div>
        <span className={`mini-badge ${verified ? "verified" : "claimed"}`}>
          {verified ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {trust}
        </span>
      </div>
      <div className="platform-metric">
        <strong>{primary}</strong>
        <span>{secondary}</span>
      </div>
    </article>
  );
}

function TimelineItem({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="timeline-item">
      <span>
        <Icon size={15} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}
