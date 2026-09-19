/**
 * Каталог аккаунта: `@cf/meta/m2m100-1.2b` в нём отсутствует, поэтому переводит instruct-LLM.
 * Победитель смоука на названиях из apps/web/db/seed.sql: казахскую колонку осмысленно
 * заполняет только эта модель. Кандидаты смоука, которые её не обыграли: `nemotron-3-120b`
 * (казахский со словами-ошибками), `llama-3.3-70b`, `mistral-small-3.1-24b`, `granite-4.0-h-micro`,
 * `sea-lion-v4-27b` (подставляли в колонку kk русский исходник), `qwen3-30b` (уводит ответ в reasoning).
 */
export const TRANSLATE_MODEL = "@cf/openai/gpt-oss-120b";

/**
 * gpt-oss-120b — reasoning-модель, и её потолок `max_tokens` делят размышления и ответ.
 * Без `reasoning_effort: "low"` она возвращает пустой `content` (замер: medium — 9–22 с и
 * половина ответов пустых, high — 29–40 с и ни одного валидного). На `max_tokens: 1024`
 * модель обрывала ответ на середине, поэтому 2048.
 */
export const INFERENCE_OPTIONS = {
  max_tokens: 2048,
  temperature: 0.2,
  reasoning_effort: "low",
} as const;
