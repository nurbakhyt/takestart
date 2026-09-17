import { getTranslations, setRequestLocale } from "next-intl/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { normalizeLocale } from "@/lib/locale-text";
import { requireShop } from "@/lib/dashboard";
import { ProductForm } from "../product-form";

export default async function NewProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; shopId: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { locale: rawLocale, shopId } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);
  const { err } = await searchParams;

  const t = await getTranslations("dashboard");
  const shop = await requireShop(locale, shopId);

  const db = getDb();
  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.shopId, shop.id))
    .orderBy(asc(categories.sortOrder));

  return (
    <div className="flex flex-col gap-3">
      <a
        href={`/${locale}/dashboard/${shop.id}/products`}
        className="text-[13px] text-ink-soft underline underline-offset-4"
      >
        {t("tabs.products")}
      </a>
      <ProductForm
        locale={locale}
        shopId={shop.id}
        categories={cats}
        defaults={null}
        errorCode={err}
      />
    </div>
  );
}
