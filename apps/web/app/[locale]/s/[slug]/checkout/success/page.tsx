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
      <div className="mx-auto min-w-0 max-w-2xl bg-zinc-50 pb-10">
        <main className="flex flex-col gap-4 px-4 pt-8 text-center">
          <div className="text-5xl">✅</div>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="text-[15px] text-zinc-600">
            {t("code")}: <span className="font-semibold">{order.code}</span>
            {" · "}
            {formatKZT(order.totalTiyin, locale)}
          </p>
          <p className="text-[14px] text-zinc-500">{t("note")}</p>
          <div className="text-left">
            <SuccessActions
              slug={shop.slug}
              waLink={waLink}
              receiptText={text}
            />
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-zinc-200 bg-white p-4 text-left text-[13px] leading-6">
            {text}
          </pre>
          <a
            href={`/${locale}/s/${shop.slug}`}
            className="text-[14px] font-medium text-zinc-500"
          >
            {t("backToMenu")}
          </a>
        </main>
      </div>
    </CartProvider>
  );
}

function lineSubtotal(lines: ReceiptLine[]): number {
  return lines.reduce((n, l) => n + l.qty * l.priceTiyin, 0);
}
