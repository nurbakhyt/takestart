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
      <div className="min-h-dvh bg-fog">
        <div className="ts-tape mx-auto min-w-0 max-w-xl pb-12">
          <header className="border-b border-line px-4 pb-3 pt-4 sm:px-6">
            <a
              href={`/${locale}/s/${shop.slug}`}
              className="text-[13px] text-ink-soft underline underline-offset-4"
            >
              {t("emptyCartCta")}
            </a>
            <h1 className="mt-1.5 font-display text-[19px] font-semibold">
              {t("title")}
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-ink-faint">
              {shop.name}
            </p>
          </header>
          <main className="px-4 pt-5 sm:px-6">
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
      </div>
    </CartProvider>
  );
}
