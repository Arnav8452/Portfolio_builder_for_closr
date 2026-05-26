import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appId = process.env.META_CLIENT_ID || process.env.META_APP_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/meta/callback`;
  
  if (!appId || !process.env.NEXTAUTH_URL) {
    return NextResponse.json({ error: "Missing META configuration" }, { status: 500 });
  }

  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "instagram_basic,pages_show_list");
  url.searchParams.set("response_type", "code");
  
  return NextResponse.redirect(url.toString());
}
