import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CartBar } from "@/components/storefront/cart-bar";
import { CartProvider } from "@/components/storefront/cart-context";
import { CategoryNav } from "@/components/storefront/category-nav";
import { PhoneIcon } from "@/components/storefront/icons";
import { LocaleSwitcher } from "@/components/storefront/locale-switcher";
import { ProductCard } from "@/components/storefront/product-card";
import { formatKZT, normalizeLocale, pickLocale } from "@/lib/locale-text";
import { getMenu, getShopBySlug } from "@/lib/shop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return { title: "TakeStart" };
  return {
    title: `${shop.name} — TakeStart`,
    description: pickLocale(
      { ru: shop.addressText ?? "", kk: null, en: null },
      locale,
    ),
  };
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);

  const t = await getTranslations("storefront");
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();
  const menu = await getMenu(shop.id);

  const deliveryFeeLabel =
    shop.fulfillmentMode !== "pickup" && shop.deliveryFeeTiyin > 0
      ? formatKZT(shop.deliveryFeeTiyin, locale)
      : null;

  const modeLabel =
    shop.fulfillmentMode === "pickup"
      ? t("pickup")
      : shop.fulfillmentMode === "delivery"
        ? t("delivery")
        : `${t("delivery")}, ${t("pickup").toLowerCase()}`;
  const metaLine = [
    shop.addressText ?? null,
    deliveryFeeLabel ? `${modeLabel}, ${deliveryFeeLabel}` : modeLabel,
  ]
    .filter(Boolean)
    .join(", ");
  const checkoutHref = `/${locale}/s/${shop.slug}/checkout`;

  return (
    <CartProvider slug={shop.slug}>
      <div className="min-h-dvh bg-fog">
        <div className="ts-tape mx-auto min-w-0 max-w-xl scroll-smooth pb-44">
          <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
            <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4 sm:px-6">
              <div className="min-w-0">
                <h1 className="font-display text-[19px] font-semibold leading-snug">
                  {shop.name}
                </h1>
                {metaLine ? (
                  <p className="mt-1 text-[13px] leading-5 text-ink-faint">
                    {metaLine}
                  </p>
                ) : null}
              </div>
              <LocaleSwitcher locale={locale} path={`/s/${shop.slug}`} />
            </div>
            {menu.length > 1 ? (
              <CategoryNav
                items={menu.map((c) => ({
                  id: c.id,
                  label: pickLocale(
                    { ru: c.nameRu, kk: c.nameKk, en: c.nameEn },
                    locale,
                  ),
                }))}
              />
            ) : null}
          </header>

          <main className="ts-enter px-4 sm:px-6">
            {menu.length === 0 ? (
              <p className="py-16 text-center text-ink-soft">
                {t("emptyMenu")}
              </p>
            ) : (
              menu.map((c) => (
                <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-32">
                  <h2 className="pb-1 pt-6 font-display text-[15px] font-semibold">
                    {pickLocale(
                      { ru: c.nameRu, kk: c.nameKk, en: c.nameEn },
                      locale,
                    )}
                  </h2>
                  <div>
                    {c.items.map((p) => (
                      <ProductCard
                        key={p.id}
                        id={p.id}
                        name={pickLocale(
                          { ru: p.nameRu, kk: p.nameKk, en: p.nameEn },
                          locale,
                        )}
                        desc={pickLocale(
                          {
                            ru: p.descRu ?? "",
                            kk: p.descKk,
                            en: p.descEn,
                          },
                          locale,
                        )}
                        priceLabel={formatKZT(p.priceTiyin, locale)}
                        priceTiyin={p.priceTiyin}
                        photoUrl={
                          p.photoR2Key ? `/api/images/${p.photoR2Key}` : null
                        }
                        available={p.isAvailable === 1}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </main>

          <footer className="px-4 pb-10 pt-8 sm:px-6">
            <div className="rounded-xl border border-line bg-paper p-5 text-center">
              {metaLine ? (
                <p className="text-[13px] leading-5 text-ink-faint">
                  {metaLine}
                </p>
              ) : null}
              <a
                href={checkoutHref}
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-3.5 text-center text-[16px] font-semibold text-white active:bg-leaf-deep"
              >
                <PhoneIcon className="h-5 w-5" />
                {t("footerCta")}
              </a>
              <Link
                href="/"
                className="mt-3 inline-block text-[12px] text-ink-faint hover:text-ink-soft"
              >
                {t("footerPowered")}
              </Link>
            </div>
          </footer>

          <CartBar
            locale={locale}
            checkoutHref={checkoutHref}
            deliveryFeeTiyin={
              shop.fulfillmentMode === "pickup" ? 0 : shop.deliveryFeeTiyin
            }
            deliveryFeeLabel={deliveryFeeLabel}
          />
        </div>
      </div>
    </CartProvider>
  );
}
