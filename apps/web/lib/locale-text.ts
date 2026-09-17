import type { Locale } from "@/i18n/routing";

/** Название/описание товара: kk/en опциональны, fallback на ru (см. Q6). */
export function pickLocale(
  names: { ru: string; kk?: string | null; en?: string | null },
  locale: string,
): string {
  if (locale === "kk" && names.kk) return names.kk;
  if (locale === "en" && names.en) return names.en;
  return names.ru;
}

/** Тиыны → «1 200 ₸». Дробной части у тенге нет. */
export function formatKZT(tiyin: number, locale: string): string {
  const tag =
    locale === "kk" ? "kk-KZ" : locale === "en" ? "en-KZ" : "ru-KZ";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: "KZT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(tiyin / 100);
}

export function normalizeLocale(locale: string): Locale {
  return locale === "kk" || locale === "en" ? locale : "ru";
}
