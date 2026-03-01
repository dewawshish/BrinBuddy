// Deno type declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-expect-error - Deno module imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno module imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://brainbuddy.app',
  'https://www.brainbuddy.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://lovable.dev',
];

function getCORSHeaders(originHeader: string | null): Record<string, string> {
  const allowedOrigin = (originHeader && ALLOWED_ORIGINS.includes(originHeader))
    ? originHeader
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '3600',
  };
}

const MAX_TOPIC_LENGTH = 200;
const FORBIDDEN_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?previous/i,
  /system\s*:\s*/i,
  /\[\s*INST\s*\]/i,
  /<\s*\|\s*im_start\s*\|\s*>/i,
  /<\s*\|\s*im_end\s*\|\s*>/i,
  /\{\{\s*system/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+if/i,
  /you\s+are\s+now/i,
  /new\s+instructions/i,
  /override\s+instructions/i,
];

function sanitizeInput(input: string, maxLength: number = MAX_TOPIC_LENGTH): { isValid: boolean; sanitized: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { isValid: false, sanitized: '', error: 'Input must be a non-empty string' };
  }

  let sanitized = input.trim();
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Input cannot be empty' };
  }
  if (sanitized.length > maxLength) {
    return { isValid: false, sanitized: '', error: `Input exceeds maximum length of ${maxLength} characters` };
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('Potential prompt injection detected');
      return { isValid: false, sanitized: '', error: 'Invalid input detected' };
    }
  }

  // deno-lint-ignore no-control-regex
  const controlCharPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
  sanitized = sanitized
    .replace(controlCharPattern, '')
    .replace(/[<>]/g, '')
    .replace(/\\/g, '')
    .trim();

  return { isValid: true, sanitized };
}

interface InvidiousVideo {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  viewCount: number;
  publishedText: string;
  thumbnail: string;
  engagementScore: number;
}

// Groq API call for generating search queries
async function callGroqAI(messages: { role: string; content: string }[]): Promise<string> {
  const GROQ_API_KEY = Deno.env.get("VITE_GROQ_API_KEY");

  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY not configured, using fallback queries');
    return JSON.stringify({
      subtasks: [],
      mainSearchQuery: ""
    });
  }

  console.log("Calling Groq API for video discovery...");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq API call failed:", error);
    throw error;
  }
}

// Search videos using Invidious API (completely free, no auth required)
async function searchInvidious(query: string, maxResults: number = 5): Promise<InvidiousVideo[]> {
  console.log(`Searching Invidious for: "${query}"`);

  try {
    const searchUrl = `https://invidious.io/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort=relevance&limit=${maxResults}`;

    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error('Invidious search error:', response.status);
      throw new Error(`Invidious API error: ${response.status}`);
    }

    const results = await response.json() as unknown;

    if (!Array.isArray(results)) {
      console.error('Unexpected Invidious response format');
      return [];
    }

    const videos: InvidiousVideo[] = results
      .filter((item: unknown) => {
        const video = item as Record<string, unknown>;
        return video.type === 'video' && video.videoId;
      })
      .map((item: unknown) => {
        const video = item as Record<string, unknown>;
        const viewCount = parseInt(String(video.viewCountText || '0').replace(/[^0-9]/g, '')) || 0;

        // Calculate engagement score based on views and recency
        const engagementScore = Math.min(100, Math.max(1, Math.log(viewCount + 1) * 10));

        return {
          videoId: String(video.videoId || ''),
          title: String(video.title || ''),
          author: String(video.author || ''),
          lengthSeconds: parseInt(String(video.lengthSeconds || '0')) || 0,
          viewCount,
          publishedText: String(video.publishedText || ''),
          thumbnail: String(video.thumbnail || ''),
          engagementScore,
        };
      });

    return videos.sort((a, b) => b.engagementScore - a.engagementScore);
  } catch (error) {
    console.error('Invidious search failed:', error);
    return [];
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

interface Subtask {
  title: string;
  searchQuery?: string;
  [key: string]: unknown;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    const corsHeaders = getCORSHeaders(req.headers.get('origin'));
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const corsHeaders = getCORSHeaders(req.headers.get('origin'));

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing request for user ${user.id}`);

    const { topic } = await req.json();
    
    const validation = sanitizeInput(topic);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.error || 'Invalid topic' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const sanitizedTopic = validation.sanitized;

    console.log('Finding videos for topic:', sanitizedTopic);

    // Try to use Groq for query generation, fall back to defaults if not available
    let parsedData: { subtasks?: Subtask[]; mainSearchQuery?: string } = {
      subtasks: [],
      mainSearchQuery: `${sanitizedTopic} tutorial explained`,
    };

    try {
      const groqResponse = await callGroqAI([
        {
          role: "system",
          content: `You are an educational content planner. Break down learning topics into 3-5 logical subtasks/subtopics.
Return ONLY a valid JSON object with this structure:
{
  "subtasks": [
    {"title": "Subtask title", "searchQuery": "optimized search query"}
  ],
  "mainSearchQuery": "best search query for main topic"
}`,
        },
        {
          role: "user",
          content: `Topic: "${sanitizedTopic}"\n\nBreak into 3-5 subtasks with educational search queries.`,
        }
      ]);

      let cleanContent = groqResponse.trim();
      if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);

      const parsed = JSON.parse(cleanContent.trim());
      if (parsed.mainSearchQuery && Array.isArray(parsed.subtasks)) {
        parsedData = parsed;
      }
    } catch (parseError) {
      console.warn('Failed to parse Groq response, using fallback queries:', parseError);
      parsedData = {
        subtasks: [
          { title: `Introduction to ${sanitizedTopic}`, searchQuery: `${sanitizedTopic} introduction tutorial` },
          { title: `Core concepts of ${sanitizedTopic}`, searchQuery: `${sanitizedTopic} explained for beginners` },
          { title: `Advanced ${sanitizedTopic}`, searchQuery: `${sanitizedTopic} advanced concepts` }
        ],
        mainSearchQuery: `${sanitizedTopic} tutorial explained`
      };
    }

    // Search for main video using Invidious (completely free)
    console.log('Searching for main videos with query:', parsedData.mainSearchQuery);
    const mainVideos = await searchInvidious(parsedData.mainSearchQuery || `${sanitizedTopic} tutorial`, 5);

    if (!mainVideos || mainVideos.length === 0) {
      console.error('No videos found for:', sanitizedTopic);
      return new Response(
        JSON.stringify({
          error: `No educational videos found for "${sanitizedTopic}". Try a more specific topic.`,
          videoId: null,
          title: null,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const primaryVideo = mainVideos[0];
    console.log('Found primary video:', primaryVideo.title);

    // Search for subtask videos in parallel
    const subtasksWithVideos = await Promise.all(
      (parsedData.subtasks || []).slice(0, 5).map(async (subtask: Subtask, idx: number) => {
        try {
          const searchQuery = subtask.searchQuery || `${sanitizedTopic} ${subtask.title}`;
          const videos = await searchInvidious(searchQuery, 5);

          return {
            title: subtask.title || `Part ${idx + 1}`,
            searchQuery: searchQuery || '',
            videos: videos.map((v, i) => ({
              videoId: v.videoId,
              title: v.title,
              channel: v.author,
              views: v.viewCount.toLocaleString(),
              duration: formatDuration(v.lengthSeconds),
              thumbnail: v.thumbnail,
              engagementScore: v.engagementScore,
              reason: i === 0 ? 'Most relevant for this topic' : `Recommended video #${i + 1}`,
              url: `https://invidious.io/watch?v=${v.videoId}`
            }))
          };
        } catch (err) {
          console.error(`Error searching for subtask ${subtask.title}:`, err);
          return {
            title: subtask.title || `Part ${idx + 1}`,
            searchQuery: subtask.searchQuery || '',
            videos: []
          };
        }
      })
    );

    console.log(`Found ${mainVideos.length} main videos and ${subtasksWithVideos.length} subtasks`);

    return new Response(
      JSON.stringify({
        videoId: primaryVideo.videoId,
        title: primaryVideo.title,
        channel: primaryVideo.author,
        views: primaryVideo.viewCount.toLocaleString(),
        duration: formatDuration(primaryVideo.lengthSeconds),
        thumbnail: primaryVideo.thumbnail,
        url: `https://invidious.io/watch?v=${primaryVideo.videoId}`,
        reason: `Best educational video for "${sanitizedTopic}" with ${primaryVideo.viewCount.toLocaleString()} views`,
        subtasks: subtasksWithVideos,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in find-video function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCorsHeaders = getCORSHeaders(null);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...errorCorsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
