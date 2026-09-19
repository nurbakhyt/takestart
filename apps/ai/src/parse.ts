import { LIMITS } from "./contract";

export type ParseResult =
  | { ok: true; translations: string[][] }
  | { ok: false; reason: string };

function fail(reason: string): ParseResult {
  return { ok: false, reason };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Модель отдаёт почти-валидный JSON: markdown-фенс, лишнюю `]` перед закрывающей `}`, висячую
 * запятую. В смоуке такая починка возвращала в строй половину срывов, поэтому пробуем известные
 * виды шума по очереди, а не отвергаем ответ сразу. Форма после починки проверяется так же строго.
 */
function jsonCandidates(raw: string): string[] {
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const open = text.indexOf("{");
  const close = text.lastIndexOf("}");
  let body: string;

  if (open !== -1 && close > open) {
    body = text.slice(open, close + 1);
  } else {
    // Ответ может быть одним массивом строк без обёртки.
    const first = text.indexOf("[");
    const last = text.lastIndexOf("]");
    if (first === -1 || last < first) return [];
    body = `{"translations": ${text.slice(first, last + 1)}}`;
  }

  const settled = body
    .replace(/\]+(\s*)\}$/, "]]$1}")
    .replace(/,(\s*[\]}])/g, "$1");

  return [body, settled, settled.replace(/\]+(\s*)\}$/, "]]$1}")];
}

function readObject(raw: string): Record<string, unknown> | undefined {
  for (const candidate of jsonCandidates(raw)) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (isRecord(parsed)) return parsed;
    } catch {
      // Пробуем следующий вариант починки.
    }
  }
  return undefined;
}

/**
 * Принимает ответ модели, только если он даёт ровно `textCount` строк по `targetCount` непустых
 * переводов. Частичный результат не отдаём: поля формы должны получать либо всё, либо ничего.
 */
export function parseTranslations(
  raw: string,
  textCount: number,
  targetCount: number,
): ParseResult {
  const parsed = readObject(raw);
  if (!parsed) return fail("model did not return a JSON object");

  const { translations } = parsed;
  if (!Array.isArray(translations)) return fail("translations is not an array");
  if (translations.length !== textCount) {
    return fail(`expected ${textCount} rows, got ${translations.length}`);
  }

  const result: string[][] = [];
  for (const [index, row] of translations.entries()) {
    if (!Array.isArray(row)) return fail(`row ${index} is not an array`);
    if (row.length !== targetCount) {
      return fail(`row ${index} has ${row.length} values, expected ${targetCount}`);
    }

    const values: string[] = [];
    for (const value of row) {
      if (typeof value !== "string") {
        return fail(`row ${index} contains a non-string value`);
      }
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return fail(`row ${index} contains an empty translation`);
      }
      if (trimmed.length > LIMITS.maxTextLength) {
        return fail(`row ${index} contains an over-long translation`);
      }
      values.push(trimmed);
    }
    result.push(values);
  }

  return { ok: true, translations: result };
}
