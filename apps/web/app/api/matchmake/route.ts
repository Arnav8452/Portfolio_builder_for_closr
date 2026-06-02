import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const company = searchParams.get("company");

    if (!slug || !company) {
      return NextResponse.json({ error: "Missing slug or company" }, { status: 400 });
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
    if (existingMatches[company]) {
      return NextResponse.json({ pitch: existingMatches[company] });
    }

    // 3. Scrape the Company using Jina
    let companyText = "";
    try {
      // Use https to ensure valid Jina API call
      const cleanCompany = company.replace(/^https?:\/\//, "");
      const jinaRes = await fetch(`https://r.jina.ai/https://${cleanCompany}`, {
        headers: { "Accept": "application/json" }
      });
      if (jinaRes.ok) {
        const jinaData = await jinaRes.json();
        companyText = jinaData.data?.content || "";
        // Truncate to save tokens
        companyText = companyText.substring(0, 3000);
      }
    } catch (e) {
      console.warn("Jina scrape failed for", company, e);
    }

    if (!companyText) {
       companyText = `Target domain: ${company}. No scraping data available.`;
    }

    // 4. Generate Pitch via OpenRouter
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_KEY) {
      return NextResponse.json({ error: "Missing AI Key" }, { status: 500 });
    }

    const systemPrompt = `You are a B2B AI Recruiter Matchmaker. 
    You are analyzing if the creator '${creator.display_name}' is a good fit for the company '${company}'.
    
    Here is the creator's raw profile telemetry data:
    ${JSON.stringify(rawModelOutput)}
    
    Here is the company's scraped landing page data:
    ${companyText}
    
    Write a punchy, highly tailored 3-sentence pitch on why ${creator.display_name} is the perfect candidate/consultant for this company. 
    Highlight overlapping technologies or domains. 
    Do NOT use robotic phrases like "In summary" or "I am an AI". Output only the pitch text.`;

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

    // 5. Cache the pitch in raw_model_output (since we didn't add the company_matches table)
    existingMatches[company] = pitch;
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
