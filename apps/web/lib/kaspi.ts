import crypto from "crypto";

/** Проверка HMAC-подписи вебхука: X-Webhook-Signature: sha256=<hex>. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const m = /^sha256=([0-9a-f]{64})$/.exec(signature);
  if (!m) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export type PaymentTerminal = "success" | "failed" | "expired" | "lost";

/**
 * Маппинг статусов Kaspi в наши терминальные. Зеркало таблиц
 * QR_FINAL_STATUSES / INVOICE_FINAL_STATUSES из kaspi-pos-automation
 * (src/polling.js): неизвестный код — failed, промежуточный — null
 * (событий не даёт, игнорим).
 */
export function mapKaspiStatus(
  type: "qr" | "invoice",
  status: string,
): PaymentTerminal | null {
  if (status === "SessionExpired" || status === "PollingFailed") return "lost";
  if (type === "qr") {
    if (status === "QrTokenCreated" || status === "Wait") return null;
    if (status === "Processed") return "success";
    if (status === "QrTokenDiscarded" || status === "Expired") return "expired";
    return "failed";
  }
  if (status === "RemotePaymentCreated") return null;
  if (status === "Processed") return "success";
  if (status === "Expired") return "expired";
  return "failed";
}

/**
 * Сверка сумм: ожидание (тиыны из Order) против факта Kaspi (целые тенге).
 * Допуск — меньше 100 тиын (округление floor до тенге на создании QR).
 */
export function amountsMatch(
  amountTiyin: number,
  kaspiAmountKzt: number,
): boolean {
  return Math.abs(amountTiyin - kaspiAmountKzt * 100) < 100;
}
