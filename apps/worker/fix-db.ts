import { getRow, updateRow } from "./src/supabase-rest.js";

async function main() {
  const creator = await getRow<any[]>("creators", "slug=eq.arnav8452");
  if (!creator || creator.length === 0) {
    console.log("Creator not found");
    return;
  }
  const creatorId = creator[0].id;
  
  const links = await getRow<any[]>("creator_links", `creator_id=eq.${creatorId}`);
  if (links) {
    for (const link of links) {
      if (link.verification_status === "inconsistent_identity" || link.verification_status === "challenge_failed") {
        console.log(`Fixing link ${link.platform} for ${link.url}`);
        await updateRow("creator_links", link.id, {
          verification_status: "claimed"
        });
      }
    }
  }
  console.log("Done fixing DB.");
}

main().catch(console.error);
