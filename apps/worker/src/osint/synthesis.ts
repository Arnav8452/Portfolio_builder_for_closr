import { getRow, updateRow } from "../supabase-rest.js";
import { env } from "../env.js";

async function _execute_search(query: string, limit = 3) {
  if (!env.serperApiKey) return [];
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": env.serperApiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ q: query, num: limit })
  });
  if (!res.ok) return [];
  const data = await res.json() as any;
  return data.organic || [];
}

async function scrapeUrlWithJina(url: string): Promise<string> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: { "Accept": "application/json" }
  });
  if (!res.ok) throw new Error(`Jina error: ${res.status}`);
  const data = await res.json() as any;
  return data.data?.content || "";
}

export async function synthesizePortfolio(creatorId: string) {
  try {
    const creatorRows = await getRow<any[]>("creators", `id=eq.${creatorId}`);
    if (!creatorRows || creatorRows.length === 0) return;
    const creator = creatorRows[0];
    const creatorName = creator.display_name || "Unknown Creator";

    const identityRows = await getRow<any[]>("creator_identities", `creator_id=eq.${creatorId}`);
    if (!identityRows || identityRows.length === 0) {
      await updateRow("creators", creatorId, { onboarding_status: "live", updated_at: new Date().toISOString() });
      return;
    }
    const identity = identityRows[0];
    const rawOutput = identity.raw_model_output || {};

    const achievements = Array.isArray(rawOutput.achievements) ? rawOutput.achievements : [];
    const confidence = identity.extraction_confidence || 0;

    const linkRows = await getRow<any[]>("creator_links", `creator_id=eq.${creatorId}`);
    const verifiedLinks = (linkRows || []).filter(l => l.verification_status !== "inconsistent_identity" && l.verification_status !== "challenge_failed" && l.verification_status !== "claimed");

    let osintData = "";

    // Re-Act OSINT trigger
    if (confidence < 0.4 || achievements.length < 2 || verifiedLinks.length <= 1) {
      console.log(`[OSINT Re-Act] Insufficient data for ${creatorName}. Triggering deep web search...`);
      try {
        const query = `${creatorName} (portfolio OR achievements OR news OR developer OR creator)`;
        const searchResults = await _execute_search(query, 3);
        
        let scrapedText = "";
        for (const res of searchResults) {
          if (res.link && !res.error) {
            try {
              const jinaText = await scrapeUrlWithJina(res.link);
              scrapedText += `\n--- OSINT Source: ${res.link} ---\n${jinaText.substring(0, 3000)}`;
            } catch (e) {
              console.error(`[OSINT Re-Act] Failed to scrape Jina URL ${res.link}`, e);
            }
          }
        }
        osintData = scrapedText;
      } catch (err) {
        console.error(`[OSINT Re-Act] Web search failed for ${creatorName}`, err);
      }
    }

    // Call LLM to synthesize final bio
    const systemPrompt = `You are an elite portfolio synthesizer for B2B creators.
The creator's name is "${creatorName}".
You have the following aggregated telemetry from their connected accounts:
${JSON.stringify(rawOutput, null, 2)}

And the following OSINT web search data:
${osintData || "None"}

Your task is to write a comprehensive, professional, 3-4 sentence 'bio_summary' that synthesizes ALL of this data into a cohesive narrative. Do not just list their accounts. Write a compelling summary of who they are, their primary focus, and their biggest achievements across all platforms combined.
If you find new achievements in the OSINT data, return them as well.
Output EXACTLY this JSON format:
{
  "bio_summary": "...",
  "new_achievements": [ { "title": "...", "description": "..." } ]
}`;

    const GATEWAY_URL = env.aiGatewayUrl;
    const GATEWAY_SECRET = env.aiGatewaySecret;

    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GATEWAY_SECRET}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Synthesize the data." }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (response.ok) {
      const data = await response.json() as any;
      const parsed = JSON.parse(data.choices[0].message.content);
      
      const finalBio = parsed.bio_summary || identity.bio_summary;
      const newAchievements = parsed.new_achievements || [];
      
      const mergedAchievements = [...achievements];
      for (const na of newAchievements) {
        if (!mergedAchievements.find(a => a.title === na.title)) {
          mergedAchievements.push(na);
        }
      }
      
      rawOutput.achievements = mergedAchievements;

      await updateRow("creator_identities", identity.creator_id, {
        bio_summary: finalBio,
        raw_model_output: rawOutput
      }, "creator_id");
    } else {
      console.error(`[OSINT Synthesis] LLM request failed: ${await response.text()}`);
    }

    await updateRow("creators", creatorId, {
      onboarding_status: "live",
      updated_at: new Date().toISOString()
    });
    console.log(`[OSINT Synthesis] Completed synthesis for ${creatorName}. Status is now LIVE.`);
  } catch (error) {
    console.error(`[OSINT Synthesis] Unhandled error for ${creatorId}:`, error);
    await updateRow("creators", creatorId, {
      onboarding_status: "live",
      updated_at: new Date().toISOString()
    });
  }
}
