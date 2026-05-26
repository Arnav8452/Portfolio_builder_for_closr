import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.redirect(new URL("/creators", request.url));
  }

  const supabase = getSupabaseAdmin();

  // 1. Get the user's creator portfolio
  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("owner_user_id", userId)
    .single();

  if (!creator) {
    return NextResponse.redirect(new URL("/creators", request.url));
  }

  // 2. Get their NextAuth accounts
  const { data: accounts } = await supabase
    .from("accounts")
    .select("provider, providerAccountId")
    .eq("userId", userId);

  // 3. Get their existing creator_links
  const { data: existingLinks } = await supabase
    .from("creator_links")
    .select("platform, verification_level")
    .eq("creator_id", creator.id);

  if (!accounts || !existingLinks) {
    return NextResponse.redirect(new URL("/creators", request.url));
  }

  const existingPlatforms = new Set(
    existingLinks.filter(l => l.verification_level === 3).map((l) => l.platform.toLowerCase())
  );

  // 4. Sync missing accounts to creator_links
  for (const account of accounts) {
    const platform = account.provider.toLowerCase();
    
    // We only care about root node platforms
    if (!["github", "youtube", "twitch"].includes(platform)) continue;
    
    if (!existingPlatforms.has(platform)) {
      // Create a deterministic unique URL for the OAuth identity since we only have the ID
      const oauthUrl = `https://${platform}.com/oauth-id/${account.providerAccountId}`;

      const { data: newLink } = await supabase
        .from("creator_links")
        .insert({
          creator_id: creator.id,
          platform: platform,
          url: oauthUrl,
          normalized_url: oauthUrl,
          verification_level: 3,
          verification_status: "oauth_verified",
        })
        .select("id")
        .single();

      if (newLink) {
        // Queue it for scraping so the background worker can fetch their stats (and real username) using the ID/token
        await supabase.from("scraping_queue").insert({
          creator_id: creator.id,
          link_id: newLink.id,
          platform: platform,
          url: oauthUrl,
          priority: 10,
        });
      }
    }
  }

  // Record the sync event
  await supabase.from("creator_processing_events").insert({
    creator_id: creator.id,
    event_type: "updated",
    message: "Multi-Root OAuth Sync completed.",
    payload: { accounts_checked: accounts.length },
  });

  return NextResponse.redirect(new URL("/creators", request.url));
}
