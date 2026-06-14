/// <reference types="vite/client" />
/// <reference types="@types/w3c-web-usb" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

