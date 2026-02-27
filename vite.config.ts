import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_SUPABASE_PROXY_TARGET || env.VITE_SUPABASE_URL;

  const server: Record<string, any> = {
    host: "::",
    port: 8080,
  };

  // If a proxy target is configured, add a dev proxy so the browser talks to
  // the Vite server (same-origin) which forwards requests to Supabase. This
  // avoids CORS issues during development (no need to change Supabase settings).
  if (proxyTarget) {
    server.proxy = {
      // Proxy any request starting with /supabase to the Supabase project
      // and strip the /supabase prefix when forwarding.
      '^/supabase': {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/supabase/, ''),
      },
    };
  }

  return {
    server,
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
