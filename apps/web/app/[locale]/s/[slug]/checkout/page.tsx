import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CartProvider } from "@/components/storefront/cart-context";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { normalizeLocale } from "@/lib/locale-text";
import { getShopBySlug } from "@/lib/shop";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);

  const t = await getTranslations("checkout");
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  return (
    <CartProvider slug={shop.slug}>
      <div className="mx-auto min-w-0 max-w-2xl bg-zinc-50 pb-10">
        <header className="border-b border-zinc-200 bg-white px-4 py-3">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="truncate text-[13px] text-zinc-500">{shop.name}</p>
        </header>
        <main className="px-4 pt-4">
          <CheckoutForm
            slug={shop.slug}
            locale={locale}
            fulfillmentMode={
              shop.fulfillmentMode as "delivery" | "pickup" | "both"
            }
            deliveryFeeTiyin={
              shop.fulfillmentMode === "pickup" ? 0 : shop.deliveryFeeTiyin
            }
            minOrderTiyin={shop.minOrderTiyin}
            backHref={`/${locale}/s/${shop.slug}`}
            successBase={`/${locale}/s/${shop.slug}/checkout/success`}
          />
        </main>
      </div>
    </CartProvider>
  );
}
