import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreatorIntake } from "./CreatorIntake";
import { AuthGateHero } from "./AuthGateHero";

export default async function CreatorsPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="creator-page">
      {!session?.user ? <AuthGateHero /> : <CreatorIntake />}
    </main>
  );
}
