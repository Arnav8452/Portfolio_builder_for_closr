import { getRow } from "./src/supabase-rest.js";

async function main() {
  const creator = await getRow<any[]>("creators", "slug=eq.arnav8452");
  if (!creator || creator.length === 0) {
    console.log("Creator not found");
    return;
  }
  const creatorId = creator[0].id;
  console.log("Creator ID:", creatorId);
  
  const platforms = await getRow<any[]>("platform_data", `creator_id=eq.${creatorId}`);
  console.log("Platform Data:", JSON.stringify(platforms, null, 2));

  const identity = await getRow<any[]>("creator_identities", `creator_id=eq.${creatorId}`);
  console.log("Identities:", JSON.stringify(identity, null, 2));
}

main().catch(console.error);
