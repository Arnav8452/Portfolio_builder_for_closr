import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function fetchInstagramGraphData(userId: string) {
  const supabase = getSupabaseAdmin();
  
  const { data: tokenRecord } = await supabase
    .from("external_api_tokens")
    .select("access_token")
    .eq("creator_id", userId)
    .eq("provider", "meta")
    .single();

  if (!tokenRecord) {
    throw new Error("No Meta access token found for user");
  }

  const token = tokenRecord.access_token;
  const fields = "id,username,biography,profile_picture_url,followers_count,media.limit(100){id,caption,media_url,media_type,permalink,timestamp}";
  
  try {
    // Attempt the direct /me approach first (if app uses Instagram Login directly)
    const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=${fields}&access_token=${token}`);
    const meData = await meRes.json();
    
    if (!meData.error && (meData.username || meData.followers_count !== undefined)) {
      return {
        biography: meData.biography,
        profile_picture_url: meData.profile_picture_url,
        followers_count: meData.followers_count,
        media: meData.media?.data?.map((m: any) => ({
          media_url: m.media_url,
          caption: m.caption,
          permalink: m.permalink
        })) || []
      };
    }
  } catch (e) {
    // Ignore error and fall through to page method
  }
  
  const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account&access_token=${token}`);
  const pagesData = await pagesRes.json();
  
  const igAccountId = pagesData.data?.find((page: any) => page.instagram_business_account)?.instagram_business_account?.id;
  
  if (!igAccountId) {
    throw new Error("No Instagram Business Account linked to this Meta account");
  }

  const igRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}?fields=biography,profile_picture_url,followers_count,media.limit(100){media_url,caption,permalink}&access_token=${token}`);
  const igData = await igRes.json();

  if (igData.error) {
    throw new Error(`Graph API Error: ${igData.error.message}`);
  }

  return {
    biography: igData.biography,
    profile_picture_url: igData.profile_picture_url,
    followers_count: igData.followers_count,
    media: igData.media?.data?.map((m: any) => ({
      media_url: m.media_url,
      caption: m.caption,
      permalink: m.permalink
    })) || []
  };
}
