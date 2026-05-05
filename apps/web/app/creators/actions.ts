"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { detectPlatform, normalizeUrl } from "@/lib/platforms";
import { getSupabaseAdmin } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

type CustomSession = {
  user?: { name?: string | null; email?: string | null; image?: string | null };
  youtube?: { access_token: string; refresh_token?: string; expires_at?: number };
};

export async function submitCreatorProfile(formData: FormData) {
  const session = (await getServerSession(authOptions)) as CustomSession | null;
  const allowLocalDev = process.env.ALLOW_LOCAL_DEV_AUTH === "true";
  if (!session?.user?.email && !allowLocalDev) {
    return { ok: false, message: "Please sign in first." };
  }
  const userEmail = session?.user?.email ?? "local-dev@closr.test";
  const displayName = String(formData.get("displayName") ?? "").trim();
  const rootPlatform = String(formData.get("rootPlatform") ?? "github");
  const rootUrl = String(formData.get("rootUrl") ?? "").trim();
  const secondaryLinks = formData.getAll("secondaryLinks").map(String).map((v) => v.trim()).filter(Boolean);

  if (!displayName || !rootUrl) {
    return { ok: false, message: "Display name and root OAuth URL are required." };
  }

  const supabase = getSupabaseAdmin();
  const baseSlug = slugify(displayName);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  const normalizedRootUrl = normalizeUrl(rootUrl);
  const rootDetectedPlatform = detectPlatform(rootUrl);
  const root = rootPlatform === "youtube" || rootPlatform === "github" || rootPlatform === "twitch"
    ? rootPlatform
    : rootDetectedPlatform;

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .insert({
      owner_user_id: userEmail,
      owner_email: userEmail,
      slug,
      display_name: displayName,
      root_platform: root,
      root_handle: normalizedRootUrl.split("/").filter(Boolean).at(-1)?.replace("@", "") ?? null,
      onboarding_status: "queued",
    })
    .select("id")
    .single();

  if (creatorError || !creator) {
    return { ok: false, message: creatorError?.message ?? "Could not create creator." };
  }

  if (session?.youtube) {
    await supabase.from("oauth_tokens").insert({
      creator_id: creator.id,
      provider: "youtube",
      access_token: session.youtube.access_token,
      refresh_token: session.youtube.refresh_token,
      expires_at: session.youtube.expires_at,
    });
  }

  const allLinks = [
    { url: normalizedRootUrl, platform: root, level: 3 },
    ...secondaryLinks.map((url) => ({
      url: normalizeUrl(url),
      platform: detectPlatform(url),
      level: 1,
    })),
  ];

  for (const link of allLinks) {
    const { data: creatorLink, error: linkError } = await supabase
      .from("creator_links")
      .insert({
        creator_id: creator.id,
        platform: link.platform,
        url: link.url,
        normalized_url: link.url,
        verification_level: link.level,
        verification_status: link.level === 3 ? "oauth_verified" : "claimed",
      })
      .select("id")
      .single();

    if (linkError || !creatorLink) {
      continue;
    }

    await supabase.from("scraping_queue").insert({
      creator_id: creator.id,
      link_id: creatorLink.id,
      platform: link.platform,
      url: link.url,
      priority: link.level === 3 ? 10 : 0,
    });
  }

  await supabase.from("creator_processing_events").insert({
    creator_id: creator.id,
    event_type: "queued",
    message: "Creator profile queued for verification.",
    payload: { link_count: allLinks.length },
  });

  revalidatePath("/creators");
  return { ok: true, creatorId: creator.id, slug };
}
