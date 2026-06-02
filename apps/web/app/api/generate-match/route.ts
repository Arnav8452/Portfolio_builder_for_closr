import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobDescription, companyName, slug } = await request.json();
    if (!jobDescription || !companyName || !slug) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const supabase = getSupabaseAdmin();

    // 1. Verify ownership
    const { data: creator } = await supabase
      .from("creators")
      .select("id, display_name, owner_user_id, creator_identities(raw_model_output)")
      .eq("slug", slug)
      .single();

    if (!creator || creator.owner_user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rawModelOutput = Array.isArray(creator.creator_identities) 
      ? (creator.creator_identities[0] as any)?.raw_model_output 
      : (creator.creator_identities as any)?.raw_model_output;

    if (!rawModelOutput) {
      return NextResponse.json({ error: "No profile data" }, { status: 400 });
    }

    // 2. Generate Pitch via OpenRouter
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_KEY) {
      return NextResponse.json({ error: "Missing AI Key" }, { status: 500 });
    }

    // Truncate JD to ~5000 chars to save tokens/prevent abuse
    const truncatedJd = jobDescription.substring(0, 5000);

    const systemPrompt = `You are a B2B AI Recruiter Matchmaker. 
    You are analyzing if the creator '${creator.display_name}' is a good fit for a role at '${companyName}'.
    
    Here is the creator's raw profile telemetry data:
    ${JSON.stringify(rawModelOutput)}
    
    Here is the provided Job Description text:
    ${truncatedJd}
    
    Write a punchy, highly tailored 3-sentence pitch on why ${creator.display_name} is the perfect candidate or consultant for this specific role. 
    Highlight overlapping technologies, skills, or domains mentioned in the job description. 
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

    // 3. Cache the pitch
    const matchId = "jd_" + Math.random().toString(36).substring(2, 9);
    
    const existingMatches = rawModelOutput.company_matches || {};
    existingMatches[matchId] = {
      pitch,
      companyName,
      createdAt: new Date().toISOString()
    };
    rawModelOutput.company_matches = existingMatches;

    await supabase
      .from("creator_identities")
      .update({ raw_model_output: rawModelOutput })
      .eq("creator_id", creator.id);

    return NextResponse.json({ matchId, pitch });
  } catch (error) {
    console.error("Generate match error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
