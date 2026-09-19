/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    /** Наш R2-бакет фото (имя IMAGES занято адаптером под image optimization). */
    SHOP_IMAGES: R2Bucket;
    /** Воркер apps/ai (service binding из wrangler.toml). */
    AI_SERVICE: Fetcher;
    AUTH_SECRET?: string;
    AUTH_GOOGLE_ID?: string;
    AUTH_GOOGLE_SECRET?: string;
    AUTH_RESEND_KEY?: string;
    AUTH_RESEND_FROM?: string;
  }
}

export {};
