import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import { SupabaseAdapter } from "@auth/supabase-adapter";

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder",
  }) as any,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      id: "google",
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
    GoogleProvider({
      id: "youtube",
      name: "YouTube",
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID ?? "",
      clientSecret: process.env.TWITCH_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
  },
};


