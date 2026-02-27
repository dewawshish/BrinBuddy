// vite.config.ts
import { defineConfig, loadEnv } from "file:///workspaces/BrinBuddy/node_modules/vite/dist/node/index.js";
import react from "file:///workspaces/BrinBuddy/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///workspaces/BrinBuddy/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/workspaces/BrinBuddy";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_SUPABASE_PROXY_TARGET || env.VITE_SUPABASE_URL;
  const server = {
    host: "::",
    port: 8080
  };
  if (proxyTarget) {
    server.proxy = {
      // Proxy any request starting with /supabase to the Supabase project
      // and strip the /supabase prefix when forwarding.
      "^/supabase": {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
        rewrite: (path2) => path2.replace(/^\/supabase/, "")
      }
    };
  }
  return {
    server,
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlcy9CcmluQnVkZHlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi93b3Jrc3BhY2VzL0JyaW5CdWRkeS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vd29ya3NwYWNlcy9CcmluQnVkZHkvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG4gIGNvbnN0IHByb3h5VGFyZ2V0ID0gZW52LlZJVEVfU1VQQUJBU0VfUFJPWFlfVEFSR0VUIHx8IGVudi5WSVRFX1NVUEFCQVNFX1VSTDtcblxuICBjb25zdCBzZXJ2ZXI6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7XG4gICAgaG9zdDogXCI6OlwiLFxuICAgIHBvcnQ6IDgwODAsXG4gIH07XG5cbiAgLy8gSWYgYSBwcm94eSB0YXJnZXQgaXMgY29uZmlndXJlZCwgYWRkIGEgZGV2IHByb3h5IHNvIHRoZSBicm93c2VyIHRhbGtzIHRvXG4gIC8vIHRoZSBWaXRlIHNlcnZlciAoc2FtZS1vcmlnaW4pIHdoaWNoIGZvcndhcmRzIHJlcXVlc3RzIHRvIFN1cGFiYXNlLiBUaGlzXG4gIC8vIGF2b2lkcyBDT1JTIGlzc3VlcyBkdXJpbmcgZGV2ZWxvcG1lbnQgKG5vIG5lZWQgdG8gY2hhbmdlIFN1cGFiYXNlIHNldHRpbmdzKS5cbiAgaWYgKHByb3h5VGFyZ2V0KSB7XG4gICAgc2VydmVyLnByb3h5ID0ge1xuICAgICAgLy8gUHJveHkgYW55IHJlcXVlc3Qgc3RhcnRpbmcgd2l0aCAvc3VwYWJhc2UgdG8gdGhlIFN1cGFiYXNlIHByb2plY3RcbiAgICAgIC8vIGFuZCBzdHJpcCB0aGUgL3N1cGFiYXNlIHByZWZpeCB3aGVuIGZvcndhcmRpbmcuXG4gICAgICAnXi9zdXBhYmFzZSc6IHtcbiAgICAgICAgdGFyZ2V0OiBwcm94eVRhcmdldCxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoOiBzdHJpbmcpID0+IHBhdGgucmVwbGFjZSgvXlxcL3N1cGFiYXNlLywgJycpLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXIsXG4gICAgcGx1Z2luczogW3JlYWN0KCksIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKV0uZmlsdGVyKEJvb2xlYW4pLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlQLFNBQVMsY0FBYyxlQUFlO0FBQ3ZSLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBQzNDLFFBQU0sY0FBYyxJQUFJLDhCQUE4QixJQUFJO0FBRTFELFFBQU0sU0FBOEI7QUFBQSxJQUNsQyxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUtBLE1BQUksYUFBYTtBQUNmLFdBQU8sUUFBUTtBQUFBO0FBQUE7QUFBQSxNQUdiLGNBQWM7QUFBQSxRQUNaLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLFNBQVMsQ0FBQ0EsVUFBaUJBLE1BQUssUUFBUSxlQUFlLEVBQUU7QUFBQSxNQUMzRDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxpQkFBaUIsZ0JBQWdCLENBQUMsRUFBRSxPQUFPLE9BQU87QUFBQSxJQUM5RSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
