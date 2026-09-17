import { getTranslations, setRequestLocale } from "next-intl/server";
import { normalizeLocale } from "@/lib/locale-text";
import { requireShop } from "@/lib/dashboard";
import { ShopTabs } from "@/components/dashboard/shop-tabs";

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
          className="text-[13px] text-ink-soft underline underline-offset-4"
        >
          {t("myShops")}
        </a>
        <h1 className="mt-1 truncate font-display text-[20px] font-semibold">
          {shop.name}
        </h1>
      </div>
      <ShopTabs
        tabs={TABS.map((tab) => ({
          key: tab,
          label: t(`tabs.${tab}`),
          href: tab === "settings" ? base : `${base}/${tab}`,
        }))}
      />
      <div>{children}</div>
    </div>
  );
}
