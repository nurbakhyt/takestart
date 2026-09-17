import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LABEL: Record<Locale, string> = { ru: "RU", kk: "KZ", en: "EN" };

/** Переключатель языка. path — текущий путь без локали (напр. /s/dana-food). */
export function LocaleSwitcher({
  locale,
  path,
}: {
  locale: Locale;
  path: string;
}) {
  return (
    <nav className="flex gap-1 rounded-full bg-zinc-100 p-1 text-[13px] font-medium">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={path}
          locale={l}
          className={`rounded-full px-2.5 py-1 ${
            l === locale ? "bg-white shadow-sm" : "text-zinc-500"
          }`}
        >
          {LABEL[l]}
        </Link>
      ))}
    </nav>
  );
}
