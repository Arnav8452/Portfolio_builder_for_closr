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

export async function submitCreatorProfile(formData: FormData) {
  if (process.env.ALLOW_LOCAL_DEV_AUTH === 'true' && process.env.NODE_ENV === 'production') {
    throw new Error('ALLOW_LOCAL_DEV_AUTH must not be enabled in production');
  }

  const session = await getServerSession(authOptions);
  const allowLocalDev = process.env.ALLOW_LOCAL_DEV_AUTH === "true";
  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;

  if (!userId && !allowLocalDev) {
    return { ok: false, message: "Please sign in first." };
  }
  
  const finalUserId = userId ?? "local-dev-uuid";
  const finalUserEmail = userEmail ?? "local-dev@closr.test";
  const displayName = (formData.get('displayName') as string || '').trim().replace(/<[^>]*>/g, '').slice(0, 100);
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
  const root = rootPlatform === "youtube" || rootPlatform === "github" || rootPlatform === "twitch" || rootPlatform === "instagram"
    ? rootPlatform
    : rootDetectedPlatform;

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .insert({
      owner_user_id: finalUserId,
      owner_email: finalUserEmail,
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

export async function getUserPortfolio() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return null;

  const supabase = getSupabaseAdmin();
  const { data: creator } = await supabase
    .from("creators")
    .select("id, slug, display_name, root_platform, root_handle, onboarding_status, updated_at")
    .eq("owner_user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (!creator) return null;

  const { data: links } = await supabase
    .from("creator_links")
    .select("platform, url, normalized_url, verification_level, verification_status")
    .eq("creator_id", creator.id)
    .order("verification_level", { ascending: false });

  return { ...creator, links: links ?? [] };
}

export async function updateCreatorProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return { ok: false, message: "Please sign in first." };

  const supabase = getSupabaseAdmin();
  const creatorId = String(formData.get("creatorId") ?? "");
  const displayName = (formData.get('displayName') as string || '').trim().replace(/<[^>]*>/g, '').slice(0, 100);
  const rootPlatform = String(formData.get("rootPlatform") ?? "github");
  const rootUrl = String(formData.get("rootUrl") ?? "").trim();
  const secondaryLinks = formData.getAll("secondaryLinks").map(String).map((v) => v.trim()).filter(Boolean);

  if (!creatorId || !displayName || !rootUrl) {
    return { ok: false, message: "Missing required fields." };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("creators")
    .select("id, slug")
    .eq("id", creatorId)
    .eq("owner_user_id", userId)
    .single();

  if (!existing) return { ok: false, message: "Portfolio not found or not owned by you." };

  // Update creator name
  await supabase
    .from("creators")
    .update({
      display_name: displayName,
      root_platform: rootPlatform === "youtube" || rootPlatform === "github" || rootPlatform === "twitch" || rootPlatform === "instagram"
        ? rootPlatform
        : detectPlatform(rootUrl),
      onboarding_status: "queued",
    })
    .eq("id", creatorId);

  // Get existing links for this creator
  const { data: existingLinks } = await supabase
    .from("creator_links")
    .select("id, normalized_url")
    .eq("creator_id", creatorId);

  const existingUrls = new Set((existingLinks ?? []).map((l) => l.normalized_url));
  const submittedUrls = new Set(secondaryLinks.map(normalizeUrl));
  submittedUrls.add(normalizeUrl(rootUrl));

  // Delete orphaned links that the user removed
  const urlsToDelete = (existingLinks ?? [])
    .filter((l) => !submittedUrls.has(l.normalized_url))
    .map((l) => l.normalized_url);

  if (urlsToDelete.length > 0) {
    await supabase
      .from("creator_links")
      .delete()
      .eq("creator_id", creatorId)
      .in("normalized_url", urlsToDelete);
  }

  // Add new secondary links that don't already exist
  for (const url of secondaryLinks) {
    const normalized = normalizeUrl(url);
    if (existingUrls.has(normalized)) continue;

    const platform = detectPlatform(url);
    const { data: newLink } = await supabase
      .from("creator_links")
      .insert({
        creator_id: creatorId,
        platform,
        url: normalized,
        normalized_url: normalized,
        verification_level: 1,
        verification_status: "claimed",
      })
      .select("id")
      .single();

    if (newLink) {
      await supabase.from("scraping_queue").insert({
        creator_id: creatorId,
        link_id: newLink.id,
        platform,
        url: normalized,
        priority: 0,
      });
    }
  }

  await supabase.from("creator_processing_events").insert({
    creator_id: creatorId,
    event_type: "updated",
    message: "Portfolio updated and re-queued.",
    payload: { new_links: secondaryLinks.length },
  });

  revalidatePath("/creators");
  return { ok: true, creatorId, slug: existing.slug };
}

export async function deleteCreatorProfile(creatorId: string) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return { ok: false, message: "Please sign in first." };

  const supabase = getSupabaseAdmin();

  // Verify ownership
  const { data: existing } = await supabase
    .from("creators")
    .select("id")
    .eq("id", creatorId)
    .eq("owner_user_id", userId)
    .single();

  if (!existing) return { ok: false, message: "Portfolio not found or not owned by you." };

  // Delete the creator profile (this will cascade delete links and queues if foreign keys are set up correctly, 
  // or we can manually delete them first). Supabase usually has cascade on creator_id.
  const { error } = await supabase
    .from("creators")
    .delete()
    .eq("id", creatorId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/creators");
  return { ok: true };
}
