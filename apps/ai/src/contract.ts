import {
  ENTITIES,
  isEntity,
  isLanguage,
  type Entity,
  type Language,
} from "./languages";

export const LIMITS = {
  /** Сколько названий можно перевести одним запросом. */
  maxTexts: 20,
  /** Предел длины одного названия: в web maxLength 80 у товара и 60 у категории. */
  maxTextLength: 120,
} as const;

export interface TranslateRequest {
  entity: Entity;
  from: Language;
  to: Language[];
  texts: string[];
}

export type Validated<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

function invalid<T>(message: string): Validated<T> {
  return { ok: false, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Разбирает тело запроса в нормализованный вид: языки — коды, тексты — с обрезанными пробелами. */
export function validateTranslateRequest(
  body: unknown,
): Validated<TranslateRequest> {
  if (!isRecord(body)) return invalid("body must be a JSON object");

  const { entity, from, to, texts } = body;

  if (!isEntity(entity)) {
    return invalid(`entity must be one of: ${ENTITIES.join(", ")}`);
  }
  if (!isLanguage(from)) return invalid("from must be a supported language");
  if (!Array.isArray(to) || to.length === 0) {
    return invalid("to must be a non-empty array of languages");
  }
  if (!to.every(isLanguage)) {
    return invalid("to must contain only supported languages");
  }

  const targets = [...new Set(to)];
  if (targets.length !== to.length) return invalid("to must not contain duplicates");
  if (targets.includes(from)) return invalid("from must not be a target language");

  if (!Array.isArray(texts) || texts.length === 0) {
    return invalid("texts must be a non-empty array of strings");
  }
  if (texts.length > LIMITS.maxTexts) {
    return invalid(`texts must contain at most ${LIMITS.maxTexts} items`);
  }

  const normalized: string[] = [];
  for (const text of texts) {
    if (typeof text !== "string") return invalid("every text must be a string");
    const value = text.trim();
    if (value.length === 0) return invalid("texts must not contain empty strings");
    if (value.length > LIMITS.maxTextLength) {
      return invalid(
        `every text must be at most ${LIMITS.maxTextLength} characters long`,
      );
    }
    normalized.push(value);
  }

  return { ok: true, value: { entity, from, to: targets, texts: normalized } };
}
