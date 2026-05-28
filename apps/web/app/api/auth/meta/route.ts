import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

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
  
  // CSRF protection: generate a random state token and store it in a cookie
  const state = crypto.randomBytes(16).toString("hex");
  url.searchParams.set("state", state);
  
  const response = NextResponse.redirect(url.toString());
  response.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  return response;
}
