import { getRow } from "./src/supabase-rest.js";

async function main() {
  // Use HTTP API via node fetch instead of broken env
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
  const url = process.env.SUPABASE_URL || "https://rccaaxxjeocscokfgyaq.supabase.co";

  const res = await fetch(`${url}/rest/v1/creators?slug=eq.arnav8452&select=slug,creator_identities(primary_niche,extraction_confidence)`, {
    headers: {
      "apikey": token,
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
