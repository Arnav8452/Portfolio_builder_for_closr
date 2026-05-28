import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { CreatorIntake } from "./CreatorIntake";
import { AuthGateHero } from "./AuthGateHero";
import { CreatorDashboard, type ExistingPortfolio } from "./CreatorDashboard";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { CreatorHeader } from "./CreatorHeader";

export default async function CreatorsPage() {
  const session = await getServerSession(authOptions);

  // Phase 1: Not signed in → auth gate
  if (!session?.user) {
    return (
      <main className="creator-page">
        <AuthGateHero />
      </main>
    );
  }

  // Phase 2: Routing fork — check for existing portfolio
  const userId = (session.user as any).id;
  let portfolio: ExistingPortfolio | null = null;
  let missingProviders: string[] = ["github", "youtube", "twitch", "linkedin", "instagram"];

  try {
    const supabase = getSupabaseAdmin();
    const { data: creator } = await supabase
      .from("creators")
      .select("id, slug, display_name, root_platform, root_handle, onboarding_status, updated_at")
      .eq("owner_user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (creator) {
      const { data: links } = await supabase
        .from("creator_links")
        .select("platform, url, normalized_url, verification_level, verification_status")
        .eq("creator_id", creator.id)
        .order("verification_level", { ascending: false });

      portfolio = { ...creator, links: links ?? [] };

      // Fetch NextAuth accounts for this user
      const { data: accounts } = await supabase.schema("next_auth")
        .from("accounts")
        .select("provider")
        .eq("userId", userId);

      if (accounts) {
        const connectedProviders = accounts.map((a) => a.provider.toLowerCase());
        missingProviders = missingProviders.filter(p => !connectedProviders.includes(p));
      }
    }
  } catch {
    // Supabase not configured or no data — show builder
  }

  const hasLinkedinOauth = Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);

  return (
    <main className="creator-page flex flex-col min-h-screen">
      <CreatorHeader user={session.user as any} />
      <div className="flex-grow">
        {portfolio ? (
          <Suspense fallback={<div className="p-8 text-center"><Loader2 className="spin inline mr-2" size={16} /> Loading dashboard...</div>}>
            <CreatorDashboard portfolio={portfolio} missingProviders={missingProviders} hasLinkedinOauth={hasLinkedinOauth} />
          </Suspense>
        ) : (
          <CreatorIntake hasLinkedinOauth={hasLinkedinOauth} />
        )}
      </div>
    </main>
  );
}
