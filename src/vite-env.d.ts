/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COGNITO_USER_POOL_ID: string
  readonly VITE_COGNITO_CLIENT_ID: string
  readonly VITE_API_ENDPOINT: string
  readonly VITE_S3_BUCKET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
