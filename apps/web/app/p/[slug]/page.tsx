import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type PublicProfile = {
  slug: string;
  display_name: string;
  root_platform: string;
  root_handle: string | null;
  primary_niche: string | null;
  technical_skills: string[] | null;
  brand_tone: string[] | null;
  content_format: string[] | null;
  audience_size_tier: string | null;
  past_topics: string[] | null;
  bio_summary: string | null;
  confidence: number | null;
  verified_links: Array<{
    platform: string;
    url: string;
    verification_level: number;
    verification_status: string;
  }>;
};

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "demo") {
    return <ProfileView profile={demoProfile} />;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("public_creator_profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) notFound();
  return <ProfileView profile={data as PublicProfile} />;
}

function ProfileView({ profile }: { profile: PublicProfile }) {
  return (
    <main className="page">
      <section className="profile-grid">
        <div className="panel">
          <div className="panel-body">
            <div className="eyebrow">Verified creator</div>
            <h1>{profile.display_name}</h1>
            <p>{profile.bio_summary ?? "Verification is still processing."}</p>
            <div className="chips">
              <span className="badge">{profile.primary_niche ?? "pending"}</span>
              <span className="badge pending">{profile.audience_size_tier ?? "audience pending"}</span>
              <span className="chip">{profile.root_platform}</span>
            </div>
          </div>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <h2>Trust graph</h2>
          </div>
          <div className="panel-body">
            {profile.verified_links?.map((link) => (
              <div className="metric-row" key={`${link.platform}-${link.url}`}>
                <div>
                  <strong>{link.platform}</strong>
                  <p style={{ marginBottom: 0 }}>Level {link.verification_level}</p>
                </div>
                <span className="badge">{link.verification_status}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="workspace" style={{ marginTop: 18 }}>
        <Panel title="Skills" items={profile.technical_skills ?? []} />
        <Panel title="Topics" items={profile.past_topics ?? []} />
        <Panel title="Tone" items={profile.brand_tone ?? []} />
        <Panel title="Formats" items={profile.content_format ?? []} />
      </section>
    </main>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="panel-body chips">
        {items.length ? items.map((item) => <span className="chip" key={item}>{item}</span>) : <p>Pending analysis</p>}
      </div>
    </section>
  );
}

const demoProfile: PublicProfile = {
  slug: "demo",
  display_name: "Demo Creator",
  root_platform: "github",
  root_handle: "demo",
  primary_niche: "devtools",
  technical_skills: ["Next.js", "Supabase", "OSINT", "Automation"],
  brand_tone: ["technical", "direct", "builder-led"],
  content_format: ["tutorials", "case studies", "walkthroughs"],
  audience_size_tier: "emerging",
  past_topics: ["local LLMs", "creator infrastructure", "lead generation"],
  bio_summary: "A technical creator building practical systems for founders and growth teams.",
  confidence: 0.91,
  verified_links: [
    { platform: "github", url: "https://github.com/demo", verification_level: 3, verification_status: "oauth_verified" },
    { platform: "website", url: "https://example.com", verification_level: 2, verification_status: "verified" },
  ],
};

