import { and, eq, gte, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { orders, products } from "@/db/schema";
import { getShopBySlug } from "@/lib/shop";
import { pickLocale } from "@/lib/locale-text";
import {
  buildOrderText,
  buildWaLink,
  makeOrderCode,
  normalizeKzPhone,
  type ReceiptLocale,
} from "@/lib/whatsapp";

const orderSchema = z.object({
  slug: z.string().min(1).max(64),
  locale: z.enum(["ru", "kk", "en"]),
  fulfillment: z.enum(["delivery", "pickup"]),
  items: z
    .array(z.object({ id: z.string().min(1).max(64), qty: z.number().int().min(1).max(99) }))
    .min(1)
    .max(50),
  customerName: z.string().max(80).default(""),
  customerPhone: z.string().min(5).max(25),
  customerAddress: z.string().max(300).default(""),
  comment: z.string().max(500).default(""),
});

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Создание заказа (статус new) + wa.me-ссылка с чеком.
 * Цены и наличие всегда перечитываются из D1 — клиентским не доверяем.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("bad_json");
  }
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return bad("invalid_payload");
  const input = parsed.data;

  const shop = await getShopBySlug(input.slug);
  if (!shop) return bad("shop_not_found", 404);

  if (shop.fulfillmentMode === "pickup" && input.fulfillment === "delivery") {
    return bad("delivery_unavailable");
  }
  if (shop.fulfillmentMode === "delivery" && input.fulfillment === "pickup") {
    return bad("pickup_unavailable");
  }
  if (input.fulfillment === "delivery" && !input.customerAddress.trim()) {
    return bad("address_required");
  }

  const phone = normalizeKzPhone(input.customerPhone);
  if (!phone) return bad("invalid_phone");

  const db = getDb();
  const ids = [...new Set(input.items.map((i) => i.id))];
  const rows = await db
    .select()
    .from(products)
    .where(inArray(products.id, ids));

  const byId = new Map(rows.map((r) => [r.id, r]));
  const lines: { productId: string; name: string; qty: number; priceTiyin: number }[] = [];
  for (const item of input.items) {
    const p = byId.get(item.id);
    if (!p || p.shopId !== shop.id || p.isAvailable !== 1) {
      return bad("item_unavailable");
    }
    lines.push({
      productId: p.id,
      name: pickLocale(
        { ru: p.nameRu, kk: p.nameKk, en: p.nameEn },
        input.locale,
      ),
      qty: item.qty,
      priceTiyin: p.priceTiyin,
    });
  }

  const subtotal = lines.reduce((n, l) => n + l.qty * l.priceTiyin, 0);
  if (subtotal < shop.minOrderTiyin) return bad("below_minimum");

  const deliveryFee =
    input.fulfillment === "delivery" ? shop.deliveryFeeTiyin : 0;
  const total = subtotal + deliveryFee;

  const now = new Date();
  const dayStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const todayRows = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.shopId, shop.id), gte(orders.createdAt, dayStart)));
  const code = makeOrderCode(shop.slug, now, todayRows.length + 1);

  const orderId = crypto.randomUUID();
  await db.insert(orders).values({
    id: orderId,
    shopId: shop.id,
    code,
    itemsJson: JSON.stringify(lines),
    totalTiyin: total,
    customerName: input.customerName.trim(),
    customerPhone: phone,
    customerAddress:
      input.fulfillment === "delivery" ? input.customerAddress.trim() : "",
    comment: input.comment.trim(),
    status: "new",
  });

  const text = buildOrderText({
    locale: input.locale as ReceiptLocale,
    code,
    shopName: shop.name,
    lines,
    deliveryFeeTiyin: deliveryFee,
    totalTiyin: total,
    fulfillment: input.fulfillment,
    customerName: input.customerName.trim(),
    customerPhone: phone,
    customerAddress:
      input.fulfillment === "delivery" ? input.customerAddress.trim() : "",
    comment: input.comment.trim(),
  });

  return NextResponse.json({
    orderId,
    code,
    totalTiyin: total,
    waLink: buildWaLink(shop.whatsappE164, text),
  });
}
