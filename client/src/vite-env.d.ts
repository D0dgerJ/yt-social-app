/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOCKET_URL: string;
  // добавляй сюда другие переменные, если нужно
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
