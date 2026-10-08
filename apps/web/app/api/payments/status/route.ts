import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { mapKaspiStatus } from "@/lib/kaspi";
import {
  applyWebhookEvent,
  bad,
  drizzlePaymentRepo,
} from "@/lib/payments";
import { createKaspiPayClient, sessionFromEnv } from "@/lib/kaspiPay";

const querySchema = z.object({
  provider: z.enum(["kaspi-qr", "kaspi-invoice"]),
  kaspiPaymentId: z.string().min(1).max(64),
});

/**
 * GET /api/payments/status?provider=&kaspiPaymentId= — статус нашей попытки.
 * Если строка pending и живая сессия есть — освежаем из VPS через тот же
 * applyWebhookEvent, что и вебхуки (единая точка переходов).
 */
export async function GET(req: Request) {
  let url: URL;
  try {
    url = new URL(req.url);
  } catch {
    return bad("invalid_payload");
  }
  const parsed = querySchema.safeParse({
    provider: url.searchParams.get("provider"),
    kaspiPaymentId: url.searchParams.get("kaspiPaymentId"),
  });
  if (!parsed.success) {
    return bad("invalid_payload");
  }
  const { provider, kaspiPaymentId } = parsed.data;

  const { env } = getCloudflareContext();
  const db = getDb();
  const repo = drizzlePaymentRepo(db);

  const row = await repo.findByProviderId(provider, kaspiPaymentId);
  if (!row) {
    return bad("payment_not_found", 404);
  }

  const conn = sessionFromEnv(env);
  if (row.status === "pending" && provider === "kaspi-qr" && conn) {
    try {
      const client = createKaspiPayClient({ ...conn, fetchFn: fetch });
      const { status: kaspiStatus } = await client.qrStatus(kaspiPaymentId);
      const mapped = mapKaspiStatus("qr", kaspiStatus);
      if (mapped) {
        await applyWebhookEvent(repo, {
          provider,
          type: "qr",
          kaspiPaymentId,
          kaspiStatus,
          kaspiAmountKzt: row.kaspiAmountKzt,
          now: Date.now(),
        });
        const fresh = await repo.findByProviderId(provider, kaspiPaymentId);
        return NextResponse.json({
          ok: true,
          paymentStatus: fresh?.status ?? row.status,
        });
      }
    } catch (err) {
      console.error("status refresh failed", {
        kaspiPaymentId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ ok: true, paymentStatus: row.status });
}
