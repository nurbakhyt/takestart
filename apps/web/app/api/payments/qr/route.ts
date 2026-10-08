import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { orders, payments } from "@/db/schema";
import { bad } from "@/lib/payments";
import {
  createKaspiPayClient,
  pickQrImage,
  sessionFromEnv,
  toKzt,
} from "@/lib/kaspiPay";

const bodySchema = z.object({ orderId: z.string().min(1).max(64) });

/**
 * POST /api/payments/qr — выставить Kaspi QR под заказ.
 * Создаёт Payment (pending) и возвращает картинку QR (Единый QR для межбанка).
 * Без живой Kaspi-сессии в env — 503 payments_unavailable (см. ADR-0005).
 */
export async function POST(req: Request) {
  const { env } = getCloudflareContext();
  const cfg = sessionFromEnv(env);
  if (!cfg) {
    return bad("payments_unavailable", 503);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("bad_json");
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return bad("invalid_payload");
  }

  const db = getDb();
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, parsed.data.orderId))
    .limit(1);
  const order = orderRows[0];
  if (!order) {
    return bad("order_not_found", 404);
  }
  if (order.status !== "new") {
    return bad("order_not_payable", 409);
  }

  const amountKzt = toKzt(order.totalTiyin);
  const client = createKaspiPayClient({ ...cfg, fetchFn: fetch });

  let qr: Awaited<ReturnType<typeof client.createQr>>;
  try {
    qr = await client.createQr(amountKzt);
  } catch (err) {
    console.error("qr create failed", {
      orderId: order.id,
      message: err instanceof Error ? err.message : String(err),
    });
    const code =
      err instanceof Error && err.message === "kaspi_401"
        ? "kaspi_session_invalid"
        : "kaspi_error";
    return bad(code, 502);
  }

  const now = Date.now();
  await db.insert(payments).values({
    id: crypto.randomUUID(),
    shopId: order.shopId,
    orderId: order.id,
    provider: "kaspi-qr",
    kaspiPaymentId: qr.qrOperationId,
    amountTiyin: order.totalTiyin,
    kaspiAmountKzt: qr.amount ?? amountKzt,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    ok: true,
    kaspiPaymentId: qr.qrOperationId,
    qrImage: pickQrImage({ QrToken: qr.qrToken, QrOriginalToken: qr.qrOriginalToken }),
    expireDate: qr.expireDate ?? null,
  });
}
