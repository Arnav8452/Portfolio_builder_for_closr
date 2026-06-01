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

Your task is to write a comprehensive, professional, 3-4 sentence 'bio_summary' that synthesizes ALL of this data into a cohesive narrative written in the third person. 
CRITICAL: Do not just list their accounts or quote them. The bio MUST be a true summary of their career and expertise. DO NOT simply extract a philosophical quote (like "The best systems...") from their README and use it as the summary. Read all the data and write a proper professional summary.

ANTI-HALLUCINATION PROTOCOL FOR OSINT DATA:
Search results often contain information about OTHER PEOPLE with similar names or random text from unrelated pages. You MUST cross-reference any OSINT data with the verified telemetry. If an achievement or bio detail in the OSINT data (e.g. "$868K ARR", "Roblox Developer") does NOT explicitly and unambiguously match the creator's known name, niche, or platforms, you MUST IGNORE IT. Do not attribute random search result achievements to this creator.
CRITICAL: NEVER list generic skills, languages, or tools (like "Docker", "React", or "Python") as achievements. Achievements must be tangible projects, metrics, or milestones.

If you find NEW, VERIFIED achievements in the OSINT data, or if you need to merge them with the existing telemetry, do so.
Your final output MUST contain EXACTLY the top 1 to 10 MOST IMPRESSIVE achievements. Limit to a MAXIMUM of 10. Do not output duplicates or slightly rephrased versions of the same project. You MUST include a 'url' field if a link is present in the OSINT or telemetry data.
Output EXACTLY this JSON format:
{
  "bio_summary": "...",
  "top_10_achievements": [ { "title": "...", "description": "...", "url": "..." } ]
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
      const top10 = parsed.top_10_achievements || achievements;
      
      rawOutput.achievements = top10.slice(0, 10);

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
