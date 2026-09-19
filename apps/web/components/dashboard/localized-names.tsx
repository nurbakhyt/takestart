"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type LanguageCode = "ru" | "kk" | "en";
export type TranslateEntity = "product" | "category";

/** Приоритет исходного языка, если продавец заполнил несколько полей. */
const PRIORITY: LanguageCode[] = ["ru", "kk", "en"];
const LABEL_KEY: Record<LanguageCode, "nameRu" | "nameKk" | "nameEn"> = {
  ru: "nameRu",
  kk: "nameKk",
  en: "nameEn",
};
const PLACEHOLDER: Record<LanguageCode, string> = { ru: "RU *", kk: "KZ", en: "EN" };

function inputName(lang: LanguageCode): string {
  return `name${lang[0].toUpperCase()}${lang.slice(1)}`;
}

/**
 * Название на трёх языках + кнопка AI: переводит с заполненного языка на пустые,
 * ничего не перезаписывает и в базу сама не ходит — только подставляет значения
 * в поля формы (отправляет её обычный server action).
 */
export function LocalizedNames({
  shopId,
  entity,
  defaults,
  maxLength,
  inputClassName,
  labels = true,
  requiredRu = false,
}: {
  shopId: string;
  entity: TranslateEntity;
  defaults?: { ru?: string | null; kk?: string | null; en?: string | null } | null;
  maxLength: number;
  inputClassName: string;
  labels?: boolean;
  requiredRu?: boolean;
}) {
  const t = useTranslations("dashboard");
  const [values, setValues] = useState<Record<LanguageCode, string>>({
    ru: defaults?.ru ?? "",
    kk: defaults?.kk ?? "",
    en: defaults?.en ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const source = PRIORITY.find((lang) => values[lang].trim().length > 0);
  const targets = PRIORITY.filter(
    (lang) => lang !== source && values[lang].trim().length === 0,
  );
  const canFill = Boolean(source) && targets.length > 0 && !busy;

  async function fillEmpty() {
    if (!source || targets.length === 0) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/dashboard/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopId,
          entity,
          from: source,
          to: targets,
          texts: [values[source].trim()],
        }),
      });
      const data = (await res.json()) as { translations?: unknown };
      const row = Array.isArray(data.translations) ? data.translations[0] : undefined;
      if (
        !res.ok ||
        !Array.isArray(row) ||
        row.length !== targets.length ||
        !row.every((v) => typeof v === "string" && v.trim().length > 0)
      ) {
        throw new Error("translate");
      }
      const filled = row as string[];
      setValues((prev) => {
        const next = { ...prev };
        targets.forEach((lang, i) => {
          next[lang] = filled[i].trim().slice(0, maxLength);
        });
        return next;
      });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void fillEmpty()}
        disabled={!canFill}
        aria-label={t("aiFill")}
        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-2 text-[13px] font-medium disabled:opacity-40"
      >
        {busy ? (
          <span
            aria-hidden
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/25 border-t-ink"
          />
        ) : (
          <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="currentColor">
            <path d="M8 1l1.4 4.1L13.5 6.5 9.4 7.9 8 12 6.6 7.9 2.5 6.5l4.1-1.4L8 1z" />
          </svg>
        )}
        <span>{t("aiFill")}</span>
      </button>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {PRIORITY.map((lang) => {
          const input = (
            <input
              name={inputName(lang)}
              required={requiredRu && lang === "ru"}
              maxLength={maxLength}
              placeholder={labels ? undefined : PLACEHOLDER[lang]}
              value={values[lang]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [lang]: e.target.value }))
              }
              className={`${inputClassName} min-w-0`}
            />
          );
          return labels ? (
            <label key={lang} className="flex flex-col gap-1.5">
              <span className="text-[14px] font-medium">
                {t(LABEL_KEY[lang])}
                {requiredRu && lang === "ru" ? " *" : ""}
              </span>
              {input}
            </label>
          ) : (
            <div key={lang} className="min-w-0">
              {input}
            </div>
          );
        })}
      </div>

      {error ? <p className="text-[13px] text-tandoor">{t("errors.ai_failed")}</p> : null}
    </div>
  );
}
