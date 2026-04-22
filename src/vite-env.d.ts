/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_ACCESS_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
