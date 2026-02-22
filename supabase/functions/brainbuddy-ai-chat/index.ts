import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ChatRequest {
  message: string;
  subject?: string;
  learningStyle?: "quick" | "detailed" | "exam-focused";
  difficultyLevel?: "beginner" | "intermediate" | "advanced";
  chatHistory?: Array<{ role: string; content: string }>;
}

async function callLovableAI(messages: { role: string; content: string }[]): Promise<string> {
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch(LOVABLE_AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    console.error("Lovable AI error:", response.status);
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function buildSystemPrompt(
  learningStyle?: "quick" | "detailed" | "exam-focused",
  difficultyLevel?: "beginner" | "intermediate" | "advanced",
  subject?: string
): string {
  let prompt = "You are BrainBuddy, a helpful and supportive AI study companion for students.";

  if (learningStyle === "quick") {
    prompt += " Keep responses concise and use bullet points where possible.";
  } else if (learningStyle === "exam-focused") {
    prompt += " Focus on exam-relevant information and tips for better scores.";
  } else {
    prompt += " Provide comprehensive, detailed explanations.";
  }

  if (difficultyLevel === "beginner") {
    prompt += " Use simple language and explain concepts thoroughly.";
  } else if (difficultyLevel === "advanced") {
    prompt += " Include advanced concepts and technical details.";
  }

  if (subject) {
    prompt += ` You are helping with ${subject}. Provide subject-specific relevant answers.`;
  }

  prompt += " Be encouraging and supportive in your responses.";

  return prompt;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, subject, learningStyle, difficultyLevel, chatHistory } = await req.json() as ChatRequest;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = buildSystemPrompt(learningStyle, difficultyLevel, subject);

    // Build chat messages
    const messages: Array<{ role: string; content: string }> = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Add previous chat history
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      messages.push(...chatHistory.slice(-4)); // Last 4 messages for context
    }

    // Add current message
    messages.push({
      role: "user",
      content: message,
    });

    // Call AI
    const response = await callLovableAI(messages);

    return new Response(
      JSON.stringify({ response }),
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
