import { setRequestLocale } from "next-intl/server";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { normalizeLocale } from "@/lib/locale-text";
import { requireShop } from "@/lib/dashboard";
import { ProductForm } from "../product-form";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; shopId: string; productId: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { locale: rawLocale, shopId, productId } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);
  const { err } = await searchParams;

  const shop = await requireShop(locale, shopId);
  const db = getDb();
  const [product, cats] = await Promise.all([
    db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.shopId, shop.id)))
      .limit(1),
    db
      .select()
      .from(categories)
      .where(eq(categories.shopId, shop.id))
      .orderBy(asc(categories.sortOrder)),
  ]);
  if (!product[0]) notFound();

  return (
    <ProductForm
      locale={locale}
      shopId={shop.id}
      categories={cats}
      defaults={product[0]}
      errorCode={err}
    />
  );
}
