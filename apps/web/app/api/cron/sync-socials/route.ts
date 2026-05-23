import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { fetchInstagramGraphData } from "@/lib/services/meta";
import { fetchTwitterProfileData } from "@/lib/services/apify";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Find all Instagram and Twitter links
  const { data: links } = await supabase
    .from("creator_links")
    .select("creator_id, platform, submitted_handle, url")
    .in("platform", ["instagram", "twitter", "x"]);

  if (!links) {
    return NextResponse.json({ success: true, count: 0 });
  }

  let successCount = 0;
  let errors = [];

  for (const link of links) {
    try {
      if (link.platform === "instagram") {
        const data = await fetchInstagramGraphData(link.creator_id);
        await supabase.from("social_cache").upsert({
          creator_id: link.creator_id,
          platform: "instagram",
          handle: link.submitted_handle,
          profile_data: { biography: data.biography, profile_picture_url: data.profile_picture_url, followers_count: data.followers_count },
          recent_media: data.media,
          synced_at: new Date().toISOString()
        }, { onConflict: "creator_id, platform" });
        successCount++;
      } else if (link.platform === "twitter" || link.platform === "x") {
        // Extract handle from url if submitted_handle is missing
        let handle = link.submitted_handle;
        if (!handle) {
           const match = link.url.match(/twitter\.com\/([^\/?]+)/) || link.url.match(/x\.com\/([^\/?]+)/);
           handle = match ? match[1] : null;
        }

        if (handle) {
          const data = await fetchTwitterProfileData(handle);
          if (data) {
            await supabase.from("social_cache").upsert({
              creator_id: link.creator_id,
              platform: link.platform,
              handle: handle,
              profile_data: { biography: data.biography, profile_picture_url: data.profile_picture_url, followers_count: data.followers_count },
              recent_media: data.media,
              synced_at: new Date().toISOString()
            }, { onConflict: "creator_id, platform" });
            successCount++;
          }
        }
      }
    } catch (e: any) {
      errors.push({ creator_id: link.creator_id, platform: link.platform, error: e.message });
    }
  }

  return NextResponse.json({ success: true, count: successCount, errors });
}
