import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { useTranslations } from "next-intl";

const LABEL: Record<Locale, string> = { ru: "RU", kk: "KZ", en: "EN" };

/** Переключатель языка. path — текущий путь без локали (напр. /s/dana-food). */
export function LocaleSwitcher({
  locale,
  path,
}: {
  locale: Locale;
  path: string;
}) {
  const t = useTranslations("storefront");
  return (
    <nav
      aria-label={t("language")}
      className="flex shrink-0 gap-0.5 rounded-lg border border-line bg-paper p-0.5 text-[13px] font-medium"
    >
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={path}
          locale={l}
          aria-current={l === locale ? "true" : undefined}
          className={`rounded-md px-2 py-1 ${
            l === locale ? "bg-ink text-paper" : "text-ink-soft"
          }`}
        >
          {LABEL[l]}
        </Link>
      ))}
    </nav>
  );
}
