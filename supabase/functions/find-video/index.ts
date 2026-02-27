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

interface YouTubeVideo {
  videoId: string;
  title: string;
  channel: string;
  viewCount: string;
  publishedAt: string;
  duration: string;
  durationFormatted: string;
  thumbnail: string;
  engagementScore: number;
  likeCount?: number;
  viewCountNum?: number;
  engagementRate?: number;
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}


function calculateAdvancedEngagementScore(
  viewCount: number,
  likeCount: number,
  publishedAt: string
): { score: number; engagementRate: number } {
  // Calculate engagement rate (likes per 1000 views)
  const engagementRate = viewCount > 0 ? (likeCount / viewCount) * 100 : 0;

  // Publish date recency score
  const publishDate = new Date(publishedAt).getTime();
  const daysSincePublish = Math.max(1, (Date.now() - publishDate) / (1000 * 60 * 60 * 24));
  const recencyScore = Math.max(0, 100 - Math.log10(daysSincePublish + 1) * 20);

  // View count score (logarithmic normalization)
  const viewScore = Math.min(100, Math.log10(Math.max(1, viewCount)) * 15);

  // Engagement rate score (likes per view percentage)
  const engagementRateScore = Math.min(100, engagementRate * 20);


  const likeCountScore = Math.min(100, (likeCount / 100) * 5);


  const compositeScore = Math.round(
    engagementRateScore * 0.4 +
    viewScore * 0.25 +
    recencyScore * 0.2 +
    likeCountScore * 0.15
  );

  return {
    score: Math.min(100, Math.max(1, compositeScore)),
    engagementRate: Math.round(engagementRate * 100) / 100,
  };
}

async function searchYouTube(query: string, apiKey: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  console.log(`Searching YouTube for: "${query}"`);
  
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=medium&videoEmbeddable=true&order=relevance&maxResults=${maxResults * 2}&key=${apiKey}`;
  
  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    console.error('YouTube search error:', searchResponse.status);
    throw new Error(`YouTube API error: ${searchResponse.status}`);
  }
  
  const searchData = await searchResponse.json();
  interface VideoItem {
    id: { videoId: string };
    [key: string]: unknown;
  }
  const videoIds = searchData.items?.map((item: VideoItem) => item.id.videoId).join(',');
  
  if (!videoIds) {
    return [];
  }
  
  const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${apiKey}`;
  
  const detailsResponse = await fetch(detailsUrl);
  if (!detailsResponse.ok) {
    console.error('YouTube details error:', detailsResponse.status);
    throw new Error('Failed to get video details');
  }
  
  const detailsData = await detailsResponse.json();
  
  interface VideoDetailsItem {
    id: string;
    snippet: {
      title: string;
      description: string;
      thumbnails: { medium?: { url: string }; default?: { url: string } };
      channelTitle: string;
      publishedAt: string;
    };
    contentDetails?: { duration: string };
    statistics?: { viewCount: string; likeCount: string };
    [key: string]: unknown;
  }
  const videos: YouTubeVideo[] = detailsData.items?.map((item: VideoDetailsItem) => {
    const viewCount = parseInt(item.statistics?.viewCount || '0');
    const likeCount = parseInt(item.statistics?.likeCount || '0');
    
    const { score: engagementScore, engagementRate } = calculateAdvancedEngagementScore(
      viewCount,
      likeCount,
      item.snippet.publishedAt
    );
    
    const thumbnails = item.snippet.thumbnails;
    const thumbnail = thumbnails?.medium?.url || thumbnails?.default?.url || '';
    
    console.log(`Video: ${item.snippet.title} | Views: ${viewCount} | Likes: ${likeCount} | Engagement Rate: ${engagementRate}% | Score: ${engagementScore}`);
    
    return {
      videoId: item.id,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      viewCount: formatViewCount(viewCount),
      publishedAt: item.snippet.publishedAt,
      duration: item.contentDetails?.duration || "PT0S",
      durationFormatted: formatDuration(item.contentDetails?.duration || "PT0S"),
      thumbnail,
      engagementScore,
      likeCount,
      viewCountNum: viewCount,
      engagementRate,
    };
  }) || [];
  
  // Sort by advanced engagement score
  videos.sort((a, b) => b.engagementScore - a.engagementScore);
  
  return videos.slice(0, maxResults);
}

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

// Optional Gemini (Google) API key - prefer this for direct Gemini calls when present
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

async function callGeminiAI(messages: { role: string; content: string }[], model = "google/gemini-3-flash-preview"): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  const url = `https://generativeai.googleapis.com/v1/models/${encodeURIComponent(model)}:generateMessage?key=${encodeURIComponent(
    GEMINI_API_KEY
  )}`;

  const payload = {
    messages: messages.map((m) => ({ author: m.role === 'assistant' ? 'assistant' : m.role, content: [{ type: 'text', text: m.content }] })),
    temperature: 0.2,
    maxOutputTokens: 800,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${txt}`);
  }

  const data = await res.json();

  // Try common response shapes
  if (data?.candidates && data.candidates.length > 0 && data.candidates[0].content) {
    return data.candidates[0].content.map((c: any) => c.text || '').join('');
  }
  if (data?.output) {
    return JSON.stringify(data.output);
  }
  return JSON.stringify(data);
}

// wrapper maintained for backwards compatibility
async function callLovableAI(messages: { role: string; content: string }[]): Promise<string> {
  // simply delegate to the direct Gemini call
  return callGeminiAI(messages);
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

    const YOUTUBE_API_KEY = Deno.env.get('youtube_api_key');
    
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key is not configured');
    }

    console.log('Finding videos for topic:', sanitizedTopic);

    const content = await callLovableAI([
      {
        role: "system",
        content: `You are an educational content planner. Break down learning topics into 3-5 logical subtasks/subtopics that someone would need to learn to master the main topic.

You must respond with ONLY a valid JSON object, no markdown, no code blocks.
The JSON must have this exact structure:
{
  "subtasks": [
    {
      "title": "Subtask title",
      "searchQuery": "optimized YouTube search query for this subtask"
    }
  ],
  "mainSearchQuery": "best YouTube search query for the main topic"
}

Add "tutorial", "explained", or "for beginners" to make searches more educational.`
      },
      {
        role: "user",
        content: `Topic: "${sanitizedTopic}"

Break this into 3-5 subtasks and provide optimized YouTube search queries for educational videos on each.`
      }
    ]);

    console.log('AI response received');

    let parsedData;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
      parsedData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      parsedData = {
        subtasks: [
          { title: `Introduction to ${sanitizedTopic}`, searchQuery: `${sanitizedTopic} introduction tutorial` },
          { title: `Core concepts of ${sanitizedTopic}`, searchQuery: `${sanitizedTopic} explained for beginners` },
          { title: `Practice ${sanitizedTopic}`, searchQuery: `${sanitizedTopic} examples practice` }
        ],
        mainSearchQuery: `${sanitizedTopic} tutorial explained`
      };
    }

    const mainVideos = await searchYouTube(parsedData.mainSearchQuery || `${sanitizedTopic} tutorial`, YOUTUBE_API_KEY, 5);
    const primaryVideo = mainVideos[0];

    if (!primaryVideo) {
      throw new Error('No videos found for this topic');
    }

    interface Subtask {
      id: string;
      title: string;
      searchQuery?: string;
      description?: string;
      [key: string]: unknown;
    }

    const subtasksWithVideos = await Promise.all(
      (parsedData.subtasks || []).slice(0, 5).map(async (subtask: Subtask, idx: number) => {
        try {
          const videos = await searchYouTube(subtask.searchQuery || `${sanitizedTopic} ${subtask.title}`, YOUTUBE_API_KEY, 5);
          return {
            title: subtask.title || `Part ${idx + 1}`,
            description: subtask.searchQuery || '',
            videos: videos.map((v: any, i: number) => ({
              videoId: v.videoId,
              title: v.title,
              channel: v.channel,
              views: v.viewCount,
              duration: v.durationFormatted,
              thumbnail: v.thumbnail,
              engagementScore: v.engagementScore,
              reason: i === 0 ? 'Highest engagement for this topic' : `Recommended video #${i + 1}`
            }))
          };
        } catch (err) {
          console.error(`Error searching for subtask ${subtask.title}:`, err);
          return {
            title: subtask.title || `Part ${idx + 1}`,
            description: subtask.searchQuery || '',
            videos: []
          };
        }
      })
    );

    console.log(`Found ${mainVideos.length} main videos and ${subtasksWithVideos.length} subtasks`);

    // Format main video with quality metrics
    const mainVideoQuality = {
      videoId: primaryVideo.videoId,
      title: primaryVideo.title,
      channel: primaryVideo.channel,
      views: primaryVideo.viewCount,
      engagement: primaryVideo.engagementRate ? `${primaryVideo.engagementRate}%` : 'N/A',
      quality: primaryVideo.engagementScore,
      reason: `Best educational video for "${sanitizedTopic}" - ${primaryVideo.viewCount} views, ${primaryVideo.engagementRate ? primaryVideo.engagementRate + '% engagement rate' : 'excellent quality'}`
    };

    return new Response(
      JSON.stringify({
        ...mainVideoQuality,
        subtasks: subtasksWithVideos.map(subtask => ({
          ...subtask,
          videos: subtask.videos.map((v: any, i: number) => ({
            videoId: v.videoId,
            title: v.title,
            channel: v.channel,
            views: v.views,
            engagement: (v as { engagement?: string }).engagement || `${(v as { engagementRate?: number }).engagementRate}%` || 'N/A',
            quality: v.engagementScore,
            duration: v.duration,
            thumbnail: v.thumbnail,
            reason: i === 0 ? `Highest quality video for this topic (Score: ${v.engagementScore}/100)` : `Recommended video #${i + 1}`
          }))
        }))
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
