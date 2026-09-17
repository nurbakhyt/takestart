import { getTranslations, setRequestLocale } from "next-intl/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CartProvider } from "@/components/storefront/cart-context";
import { SuccessActions } from "@/components/storefront/success-actions";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { formatKZT, normalizeLocale } from "@/lib/locale-text";
import { getShopBySlug } from "@/lib/shop";
import {
  buildOrderText,
  buildWaLink,
  type ReceiptLine,
} from "@/lib/whatsapp";

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const { orderId } = await searchParams;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);

  const t = await getTranslations("success");
  const shop = await getShopBySlug(slug);
  if (!shop || !orderId) notFound();

  const db = getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  const order = rows[0];
  if (!order || order.shopId !== shop.id) notFound();

  const lines = JSON.parse(order.itemsJson) as ReceiptLine[];
  const deliveryFee = Math.max(0, order.totalTiyin - lineSubtotal(lines));
  const text = buildOrderText({
    locale,
    code: order.code,
    shopName: shop.name,
    lines,
    deliveryFeeTiyin: deliveryFee,
    totalTiyin: order.totalTiyin,
    fulfillment: order.customerAddress ? "delivery" : "pickup",
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    comment: order.comment,
  });
  const waLink = buildWaLink(shop.whatsappE164, text);

  return (
    <CartProvider slug={shop.slug}>
      <div className="min-h-dvh bg-fog">
        <div className="ts-tape mx-auto min-w-0 max-w-xl pb-12">
          <main className="ts-enter flex flex-col gap-4 px-4 pt-10 text-center sm:px-6">
            <div
              aria-hidden
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-leaf text-xl font-bold text-leaf"
            >
              ✓
            </div>
            <h1 className="font-display text-[20px] font-semibold">
              {t("title")}
            </h1>
            <p className="text-[15px] text-ink-soft">
              {t("code")}: <span className="font-semibold">{order.code}</span>
              {", "}
              <span className="ts-stamp font-display text-[15px] font-semibold text-ink">
                {formatKZT(order.totalTiyin, locale)}
              </span>
            </p>
            <p className="mx-auto max-w-md text-[14px] text-ink-soft">
              {t("note")}
            </p>
            <div className="text-left">
              <SuccessActions
                slug={shop.slug}
                waLink={waLink}
                receiptText={text}
              />
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-fog p-4 text-left font-body text-[13px] leading-6">
              {text}
            </pre>
            <a
              href={`/${locale}/s/${shop.slug}`}
              className="text-[14px] font-medium text-ink-soft underline underline-offset-4"
            >
              {t("backToMenu")}
            </a>
          </main>
        </div>
      </div>
    </CartProvider>
  );
}

function lineSubtotal(lines: ReceiptLine[]): number {
  return lines.reduce((n, l) => n + l.qty * l.priceTiyin, 0);
}
