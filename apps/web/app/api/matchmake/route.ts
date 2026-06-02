import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const jobUrl = searchParams.get("job");
    const matchId = searchParams.get("match");

    if (!slug || (!jobUrl && !matchId)) {
      return NextResponse.json({ error: "Missing slug or job URL/match ID" }, { status: 400 });
    }

    // 1. Fetch Creator
    const supabase = getSupabaseAdmin();
    const { data: creator } = await supabase
      .from("creators")
      .select("id, display_name, creator_identities(raw_model_output)")
      .eq("slug", slug)
      .single();

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const rawModelOutput = Array.isArray(creator.creator_identities) 
      ? (creator.creator_identities[0] as any)?.raw_model_output 
      : (creator.creator_identities as any)?.raw_model_output;

    if (!rawModelOutput) {
      return NextResponse.json({ error: "No profile data" }, { status: 400 });
    }

    // 2. Check if we already stored this match in raw_model_output to save DB calls
    const existingMatches = rawModelOutput.company_matches || {};
    
    // Check for explicit pre-generated match ID
    if (matchId && existingMatches[matchId]) {
      return NextResponse.json({ 
        pitch: existingMatches[matchId].pitch || existingMatches[matchId],
        company: existingMatches[matchId].companyName || "CUSTOM ROLE"
      });
    }

    // Check for cached URL
    if (jobUrl && existingMatches[jobUrl]) {
      return NextResponse.json({ pitch: existingMatches[jobUrl].pitch || existingMatches[jobUrl] });
    }

    // 3. Scrape the Job Description using Jina
    let jobText = "";
    if (jobUrl) {
      try {
        const cleanUrl = jobUrl.replace(/^https?:\/\//, "");
        const jinaRes = await fetch(`https://r.jina.ai/https://${cleanUrl}`, {
          headers: { "Accept": "application/json" }
        });
        if (jinaRes.ok) {
          const jinaData = await jinaRes.json();
          jobText = jinaData.data?.content || "";
          // Truncate to save tokens (first ~3000 chars should cover most JDs)
          jobText = jobText.substring(0, 3000);
        }
      } catch (e) {
        console.warn("Jina scrape failed for", jobUrl, e);
      }
    }

    if (!jobText) {
       jobText = `Target Job URL: ${jobUrl || 'Unknown'}. No scraping data available.`;
    }

    // 4. Generate Pitch via OpenRouter
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_KEY) {
      return NextResponse.json({ error: "Missing AI Key" }, { status: 500 });
    }

    const systemPrompt = `You are a B2B AI Recruiter Matchmaker. 
    You are analyzing if the creator '${creator.display_name}' is a good fit for the provided Job Description.
    
    Here is the creator's raw profile telemetry data:
    ${JSON.stringify(rawModelOutput)}
    
    Here is the scraped Job Description:
    ${jobText}
    
    Write a highly tailored 3-sentence pitch on why ${creator.display_name} is the perfect candidate for this role.
    CRITICAL ATS INSTRUCTIONS:
    1. Extract the core exact-match keywords (languages, frameworks, methodologies) from the Job Description and seamlessly weave them into the pitch to ensure it scores highly in Applicant Tracking Systems (ATS).
    2. Quantify the creator's impact using metrics from their profile (e.g. followers, repo stars, audience size, years of experience) where applicable.
    3. Do NOT use robotic phrases like "In summary" or "I am an AI". Output only the ATS-optimized pitch text.`;

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.3
      })
    });

    if (!aiRes.ok) {
      throw new Error("AI Gateway failed");
    }

    const aiData = await aiRes.json();
    const pitch = aiData.choices?.[0]?.message?.content || "Could not generate pitch.";

    // 5. Cache the pitch in raw_model_output
    existingMatches[jobUrl] = pitch;
    rawModelOutput.company_matches = existingMatches;

    await supabase
      .from("creator_identities")
      .update({ raw_model_output: rawModelOutput })
      .eq("creator_id", creator.id);

    return NextResponse.json({ pitch });
  } catch (error) {
    console.error("Matchmake error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
