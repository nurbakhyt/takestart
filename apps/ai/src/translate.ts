import type { TranslateRequest } from "./contract";
import { INFERENCE_OPTIONS, TRANSLATE_MODEL } from "./model";
import { parseTranslations, type ParseResult } from "./parse";
import { buildMessages } from "./prompt";

export type TranslateOutcome =
  | { ok: true; translations: string[][] }
  | { ok: false; reason: string };

/**
 * Смоук показал, что дефектный ответ модели — не редкость, но и не повод отказывать кнопке:
 * повтор стоит 1–3 с и поднимает успех с ~70% до ~95%.
 */
const ATTEMPTS = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Форма ответа зависит от модели: `choices[0].message.content` (свежие модели), `reasoning`
 * (reasoning-модель с потраченным на размышления бюджетом) и старый `response`, включая
 * разобранный объект. Модель выбирается константой, замена не должна требовать правок здесь.
 */
function readModelText(output: Record<string, unknown>): string | undefined {
  const { choices, response } = output;

  if (Array.isArray(choices)) {
    for (const choice of choices) {
      if (!isRecord(choice) || !isRecord(choice.message)) continue;
      const { content, reasoning } = choice.message;
      if (typeof content === "string" && content.trim() !== "") return content;
      if (typeof reasoning === "string" && reasoning.trim() !== "") return reasoning;
    }
  }

  if (typeof response === "string") return response;
  if (response !== null && typeof response === "object") {
    return JSON.stringify(response);
  }
  return undefined;
}

async function translateOne(
  ai: Ai,
  request: TranslateRequest,
  text: string,
): Promise<ParseResult> {
  const output = await ai.run(TRANSLATE_MODEL, {
    messages: buildMessages({ ...request, texts: [text] }),
    ...INFERENCE_OPTIONS,
  });

  if (!isRecord(output)) return { ok: false, reason: "model returned no object" };

  const raw = readModelText(output);
  if (raw === undefined) {
    const fields = Object.keys(output).join(", ");
    return { ok: false, reason: `model returned no text (fields: ${fields})` };
  }

  return parseTranslations(raw, 1, request.to.length);
}

/**
 * Один вызов модели на одно название. Батч из N названий дал в смоуке деградацию (казахская
 * колонка возвращалась русским исходником) и всё равно занимал 5–14 с — больше, чем N вызовов
 * по одному. Ответы собираются в исходном порядке, частичного результата наружу не отдаём.
 */
export async function translate(
  ai: Ai,
  request: TranslateRequest,
): Promise<TranslateOutcome> {
  const translations: string[][] = [];

  for (const text of request.texts) {
    let attempt: ParseResult = { ok: false, reason: "not attempted" };
    for (let tries = 0; tries < ATTEMPTS; tries += 1) {
      attempt = await translateOne(ai, request, text);
      if (attempt.ok) break;
    }
    if (!attempt.ok) return { ok: false, reason: attempt.reason };
    translations.push(attempt.translations[0]);
  }

  return { ok: true, translations };
}
