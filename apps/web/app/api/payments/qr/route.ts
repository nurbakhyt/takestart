import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { orders, payments } from "@/db/schema";
import {
  createKaspiPayClient,
  pickQrImage,
  toKzt,
} from "@/lib/kaspiPay";

const bodySchema = z.object({ orderId: z.string().min(1).max(64) });

function sessionFromEnv(env: CloudflareEnv) {
  if (!env.KASPI_TOKEN_SN || !env.KASPI_VTOKEN_SECRET) return null;
  return {
    baseUrl: env.KASPI_PAY_BASE_URL || "https://pay.takestart.cc/s/pilot",
    session: {
      tokenSN: env.KASPI_TOKEN_SN,
      vtokenSecret: env.KASPI_VTOKEN_SECRET,
      profileId: env.KASPI_PROFILE_ID,
    },
  };
}

/**
 * POST /api/payments/qr — выставить Kaspi QR под заказ.
 * Создаёт Payment (pending) и возвращает картинку QR (Единый QR для межбанка).
 * Без живой Kaspi-сессии в env — 503 payments_unavailable (см. ADR-0005).
 */
export async function POST(req: Request) {
  const { env } = getCloudflareContext();
  const cfg = sessionFromEnv(env);
  if (!cfg) {
    return NextResponse.json(
      { error: "payments_unavailable" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const db = getDb();
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, parsed.data.orderId))
    .limit(1);
  const order = orderRows[0];
  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  if (order.status !== "new") {
    return NextResponse.json({ error: "order_not_payable" }, { status: 409 });
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
    return NextResponse.json({ error: code }, { status: 502 });
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
