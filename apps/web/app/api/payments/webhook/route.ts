import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { verifyWebhookSignature } from "@/lib/kaspi";
import {
  applyWebhookEvent,
  drizzlePaymentRepo,
} from "@/lib/payments";

/** Подмножество payload kaspi-pos-automation, нужное нам (docs/API.md). */
const webhookSchema = z.object({
  event: z.string(),
  paymentId: z.string().min(1).max(64),
  type: z.enum(["qr", "invoice"]),
  status: z.string().min(1).max(64),
  amount: z.number().nullable().optional(),
});

const providerOf = (type: "qr" | "invoice") =>
  type === "qr" ? "kaspi-qr" : "kaspi-invoice";

/**
 * POST /api/payments/webhook — приёмник событий kaspi-pos-automation
 * (payment.success/failed/expired/lost). Проверка HMAC обязательна;
 * идемпотентность и терминальность — в lib/payments.
 */
export async function POST(req: Request) {
  const { env } = getCloudflareContext();
  const secret = env.KASPI_WEBHOOK_SECRET;
  if (!secret) {
    console.error("webhook: KASPI_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  const raw = await req.text();
  const sig = req.headers.get("x-webhook-signature");
  if (!verifyWebhookSignature(raw, sig, secret)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const input = parsed.data;

  const db = getDb();
  const result = await applyWebhookEvent(drizzlePaymentRepo(db), {
    provider: providerOf(input.type),
    type: input.type,
    kaspiPaymentId: input.paymentId,
    kaspiStatus: input.status,
    kaspiAmountKzt: typeof input.amount === "number" ? input.amount : NaN,
    now: Date.now(),
  });

  if (result.action === "unknown") {
    return NextResponse.json({ error: "payment_not_found" }, { status: 404 });
  }
  if (result.action === "review-amount") {
    console.warn("webhook: amount mismatch, manual review", {
      paymentId: input.paymentId,
      status: input.status,
      amount: input.amount,
    });
  }
  return NextResponse.json({ ok: true, ...result });
}
