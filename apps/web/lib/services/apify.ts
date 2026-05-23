import { ApifyClient } from "apify-client";

export async function fetchTwitterProfileData(handle: string) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("Missing APIFY_API_TOKEN");
  }

  const client = new ApifyClient({ token });
  
  const run = await client.actor("apidojo/twitter-scraper-lite").call({
    searchTerms: [],
    twitterHandles: [handle],
    maxItems: 30, // get profile + some recent tweets
    sort: "Latest"
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    return null;
  }

  // Find the profile details (apidojo format typically includes author on tweets)
  const profile: any = items[0]?.author || items.find((item: any) => item.type === "user") || {};
  const tweets = items.filter((item: any) => item.type === "tweet" || item.text);

  return {
    biography: profile?.description || profile?.bio || "",
    profile_picture_url: profile?.profilePicture || profile?.avatar || "",
    followers_count: profile?.followers || profile?.followersCount || 0,
    media: tweets.map((t: any) => ({
      media_url: t.media && t.media.length ? t.media[0].url : "",
      caption: t.text,
      permalink: t.url
    }))
  };
}
