import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CartBar } from "@/components/storefront/cart-bar";
import { CartProvider } from "@/components/storefront/cart-context";
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

  return (
    <CartProvider slug={shop.slug}>
      <div className="mx-auto min-w-0 max-w-2xl scroll-smooth bg-zinc-50 pb-28">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">{shop.name}</h1>
              {shop.addressText ? (
                <p className="truncate text-[13px] text-zinc-500">
                  {shop.addressText}
                </p>
              ) : null}
            </div>
            <LocaleSwitcher locale={locale} path={`/s/${shop.slug}`} />
          </div>
          {menu.length > 1 ? (
            <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
              {menu.map((c) => (
                <a
                  key={c.id}
                  href={`#cat-${c.id}`}
                  className="shrink-0 rounded-full bg-zinc-100 px-3.5 py-1.5 text-[14px] font-medium"
                >
                  {pickLocale(
                    { ru: c.nameRu, kk: c.nameKk, en: c.nameEn },
                    locale,
                  )}
                </a>
              ))}
            </nav>
          ) : null}
        </header>

        <main className="flex flex-col gap-6 px-4 pt-4">
          {menu.length === 0 ? (
            <p className="py-16 text-center text-zinc-500">{t("emptyMenu")}</p>
          ) : (
            menu.map((c) => (
              <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-32">
                <h2 className="mb-2.5 text-[16px] font-semibold">
                  {pickLocale(
                    { ru: c.nameRu, kk: c.nameKk, en: c.nameEn },
                    locale,
                  )}
                </h2>
                <div className="flex flex-col gap-2.5">
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

        <CartBar
          locale={locale}
          checkoutHref={`/${locale}/s/${shop.slug}/checkout`}
          deliveryFeeTiyin={
            shop.fulfillmentMode === "pickup" ? 0 : shop.deliveryFeeTiyin
          }
          deliveryFeeLabel={deliveryFeeLabel}
        />
      </div>
    </CartProvider>
  );
}
