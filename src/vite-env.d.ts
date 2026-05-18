/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPA_BUILD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
