/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_AWS_REGION: 'us-east-1'
    readonly VITE_USER_POOL_ID: 'us-east-1_LBEsIc9K7'
    readonly VITE_USER_POOL_CLIENT_ID: '13338oj3botrapaeu4pnpt2qov'
    readonly VITE_S3_BUCKET_NAME: 'eventique-event-images-dev'
    readonly VITE_API_GATEWAY_URL: string
    readonly VITE_API_NAME: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }