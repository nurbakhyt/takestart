import { getTranslations, setRequestLocale } from "next-intl/server";
import { normalizeLocale } from "@/lib/locale-text";
import { requireShop } from "@/lib/dashboard";

const TABS = ["settings", "products", "categories", "orders"] as const;

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; shopId: string }>;
}) {
  const { locale: rawLocale, shopId } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const shop = await requireShop(locale, shopId);
  const base = `/${locale}/dashboard/${shop.id}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0">
        <a
          href={`/${locale}/dashboard`}
          className="text-[13px] text-zinc-500"
        >
          ← {t("myShops")}
        </a>
        <h1 className="truncate text-xl font-semibold">{shop.name}</h1>
      </div>
      <nav className="flex gap-1.5 overflow-x-auto rounded-2xl bg-zinc-100 p-1.5 text-[14px] font-medium">
        {TABS.map((tab) => {
          const href = tab === "settings" ? base : `${base}/${tab}`;
          return (
            <a
              key={tab}
              href={href}
              className="shrink-0 rounded-xl bg-white px-3.5 py-2 shadow-sm"
            >
              {t(`tabs.${tab}`)}
            </a>
          );
        })}
      </nav>
      <div>{children}</div>
    </div>
  );
}
