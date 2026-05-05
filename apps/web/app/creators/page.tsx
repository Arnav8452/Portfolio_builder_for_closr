import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreatorIntake } from "./CreatorIntake";
import { AuthGateHero } from "./AuthGateHero";
import { CreatorDashboard, type ExistingPortfolio } from "./CreatorDashboard";
import { getSupabaseAdmin } from "@/lib/supabase/server";

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
    }
  } catch {
    // Supabase not configured or no data — show builder
  }

  return (
    <main className="creator-page">
      {portfolio ? (
        <CreatorDashboard portfolio={portfolio} />
      ) : (
        <CreatorIntake />
      )}
    </main>
  );
}
