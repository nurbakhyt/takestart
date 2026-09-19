/** Языки, между которыми переводит сервис. Порядок — приоритет заполнения полей в web-форме. */
export const LANGUAGES = ["ru", "kk", "en"] as const;

export type Language = (typeof LANGUAGES)[number];

/** Тип сущности влияет только на промпт: как называются переводимые строки. */
export const ENTITIES = ["product", "category"] as const;

export type Entity = (typeof ENTITIES)[number];

/** Модели полезнее полные названия языков, чем двухбуквенные коды. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  ru: "Russian",
  kk: "Kazakh",
  en: "English",
};

export function isLanguage(value: unknown): value is Language {
  return (
    typeof value === "string" && (LANGUAGES as readonly string[]).includes(value)
  );
}

export function isEntity(value: unknown): value is Entity {
  return (
    typeof value === "string" && (ENTITIES as readonly string[]).includes(value)
  );
}
