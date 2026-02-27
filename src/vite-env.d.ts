/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TURNSTILE_SITE_KEY: string;
  // existing declarations are automatically included by Vite
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
