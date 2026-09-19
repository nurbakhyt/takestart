import type { TranslateRequest } from "./contract";
import { LANGUAGE_NAMES } from "./languages";

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/**
 * Собирает промпт под конкретную пару языков. Ничего не знает ни о модели, ни о web:
 * замена `TRANSLATE_MODEL` не должна требовать правок здесь.
 */
export function buildMessages(request: TranslateRequest): ChatMessage[] {
  const targets = request.to.map((language) => LANGUAGE_NAMES[language]);
  const placeholders = targets.map((name) => `<${name}>`).join(", ");
  const count = targets.length;

  const system = [
    `You fill in ${request.entity} names for a shop catalog. Convert each input name from ${LANGUAGE_NAMES[request.from]} into: ${targets.join(", ")}.`,
    "Rules:",
    `- Each input name gets exactly ${count} values: one per target language, in this order — ${targets.join(", ")}.`,
    "- Never repeat the source name and never add any other language.",
    "- Write every name the way it would appear on a menu or a price list: short and natural, not a word-by-word translation.",
    "- Never translate or transliterate brand names, trademarks and proper nouns: keep them exactly as they are written in the source.",
    "- Keep numbers, sizes and units unchanged.",
    "- Never add explanations, quotes, colons, language labels or the word \"translation\".",
    `- Answer with JSON only, exactly this shape: {"translations": [[${placeholders}]]} — one inner array per input name, ${count} strings in each.`,
  ].join("\n");

  const user = JSON.stringify({
    names: request.texts,
    from: request.from,
    to: request.to,
  });

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
