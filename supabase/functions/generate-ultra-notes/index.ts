// @ts-expect-error - Deno module imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// @ts-expect-error - Deno global
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions"; // still using Lovable's gateway for gemini requests

interface NotesRequest {
  prompt: string;
  subject: string;
  chapter: string;
  classLevel: string;
}

async function callGeminiAI(messages: { role: string; content: string }[]): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GEMINI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      temperature: 0.7,
      max_tokens: 2500,
    }),
  });

  if (!response.ok) {
    console.error("AI gateway error:", response.status);
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json() as NotesRequest;
    const { prompt, subject, chapter, classLevel } = body;

    if (!prompt || !subject || !chapter) {
      return new Response(
        JSON.stringify({ error: "prompt, subject, and chapter are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Generating ultra-fast notes for: ${subject} - ${chapter} (${classLevel})`);

    const messages = [
      {
        role: "system",
        content: `You are an expert educational content creator specializing in ultra-fast, high-quality student notes. 

Your notes must be:
- Structured and well-organized
- Suitable for students at the ${classLevel} level
- Focused and concise without losing important details
- Easy to understand and retain

Always respond with ONLY valid JSON in this exact format, no markdown:
{
  "quickOverview": "2-3 line overview of the topic",
  "keyConcepts": ["concept1", "concept2", "concept3"],
  "detailedExplanation": "Paragraph-form detailed explanation",
  "examplesAndApplications": ["example1 with context", "example2 with context"],
  "formulasAndFacts": ["fact1", "fact2"],
  "examTipsAndTraps": ["tip1", "trap1"],
  "quickRevision": "One-paragraph quick revision summary"
}`,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await callGeminiAI(messages);

    // Try to parse and clean the JSON response
    let notes = response;
    try {
      // Extract JSON if it's wrapped in markdown code blocks
      let jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        notes = jsonMatch[1];
      } else {
        jsonMatch = response.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          notes = jsonMatch[1];
        }
      }

      // Validate JSON
      JSON.parse(notes);
    } catch (e) {
      console.error("JSON parsing error:", e);
      // If parsing fails, still return the response
      // The client will handle fallback
    }

    return new Response(
      JSON.stringify({ notes }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
