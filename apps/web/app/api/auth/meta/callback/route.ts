import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const appId = process.env.META_CLIENT_ID || process.env.META_APP_ID;
  const appSecret = process.env.META_CLIENT_SECRET || process.env.META_APP_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/meta/callback`;

  if (!appId || !appSecret) {
    return NextResponse.json({ error: "Missing META configuration" }, { status: 500 });
  }

  try {
    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`);
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Meta Token Error:", tokenData);
      return NextResponse.json({ error: "Failed to get access token" }, { status: 400 });
    }

    // 2. Exchange short-lived token for long-lived token
    const longTokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`);
    const longTokenData = await longTokenRes.json();
    
    if (!longTokenData.access_token) {
        console.error("Meta Long Token Error:", longTokenData);
        return NextResponse.json({ error: "Failed to get long-lived token" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const userId = (session.user as any).id;
    
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("owner_user_id", userId)
      .single();

    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const expiresAt = longTokenData.expires_in 
        ? new Date(Date.now() + longTokenData.expires_in * 1000).toISOString() 
        : null;

    // 3. Save to database
    const { error } = await supabase.from("external_api_tokens").upsert({
      creator_id: creator.id,
      provider: "meta",
      access_token: longTokenData.access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    }, { onConflict: "creator_id, provider" });

    if (error) {
      console.error("DB Save Error:", error);
      return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/creators?meta=success`);
  } catch (error) {
    console.error("OAuth Exchange Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
