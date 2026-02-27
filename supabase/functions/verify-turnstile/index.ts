// Deno type declarations
// the supabase functions runtime is based on Deno

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-expect-error - Deno std library import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// simple CORS helper copied from other functions
const ALLOWED_ORIGINS = [
  'https://brainbuddy.app',
  'https://www.brainbuddy.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://lovable.dev',
];

function getCORSHeaders(originHeader: string | null): Record<string, string> {
  const isDevAllowed = originHeader && (
    originHeader.startsWith('http://localhost') ||
    originHeader.startsWith('https://localhost') ||
    originHeader.endsWith('.app.github.dev')
  );

  const allowedOrigin = (originHeader && (ALLOWED_ORIGINS.includes(originHeader) || isDevAllowed))
    ? originHeader
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '3600',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCORSHeaders(req.headers.get('origin')) });
  }

  const headers = getCORSHeaders(req.headers.get('origin'));
  try {
    const body = await req.json();
    const token = body?.token;
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'missing token' }), { status: 400, headers });
    }

    const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (!secret) {
      console.error('Turnstile secret not configured');
      return new Response(JSON.stringify({ success: false, error: 'server misconfiguration' }), { status: 500, headers });
    }

    const verifyResp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });

    const data = await verifyResp.json();
    return new Response(JSON.stringify(data), { headers });
  } catch (err) {
    console.error('Turnstile verification failed', err);
    return new Response(JSON.stringify({ success: false, error: 'internal error' }), { status: 500, headers });
  }
});
