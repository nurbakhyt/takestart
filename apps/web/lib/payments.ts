import {
  amountsMatch,
  mapKaspiStatus,
  type PaymentTerminal,
} from "./kaspi";

export type PaymentStatus = PaymentTerminal | "pending";

const KNOWN_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "success",
  "failed",
  "expired",
  "lost",
]);

/** Статус из БД в наш union; чужое значение — в pending на ручную проверку. */
export function parsePaymentStatus(value: string): PaymentStatus {
  return KNOWN_STATUSES.has(value) ? (value as PaymentStatus) : "pending";
}

export interface PaymentRow {
  id: string;
  orderId: string;
  provider: string;
  kaspiPaymentId: string;
  amountTiyin: number;
  kaspiAmountKzt: number;
  status: PaymentStatus;
  updatedAt: number;
}

/** Минимальный шов к хранилищу: реализация на drizzle — в роуте. */
export interface PaymentRepo {
  findByProviderId(
    provider: string,
    kaspiPaymentId: string,
  ): Promise<PaymentRow | null>;
  markTerminal(id: string, status: PaymentTerminal, now: number): Promise<void>;
  getOrderStatus(orderId: string): Promise<string | null>;
  markOrderPaid(orderId: string): Promise<void>;
}

export interface WebhookEvent {
  provider: string;
  type: "qr" | "invoice";
  kaspiPaymentId: string;
  kaspiStatus: string;
  kaspiAmountKzt: number;
  now: number;
}

export type ApplyAction =
  | "applied"
  | "duplicate"
  | "ignored-terminal"
  | "ignored-intermediate"
  | "review-amount"
  | "unknown";

export interface ApplyResult {
  action: ApplyAction;
  paymentStatus?: PaymentTerminal;
}

const TERMINAL: ReadonlySet<PaymentStatus> = new Set([
  "success",
  "failed",
  "expired",
  "lost",
]);

/**
 * Применяет событие вебхука к Payment. Правила (grill #52):
 * - чужой paymentId (строки нет — её создаёт #51 при выставлении QR) → unknown;
 * - промежуточный статус Kaspi → ignored-intermediate;
 * - строка уже терминальна → ignored-terminal (первое терминальное побеждает,
 *   дубль success — тоже сюда как duplicate);
 * - расхождение сумм сверх допуска → review-amount без смены состояния;
 * - иначе фиксируем терминальный статус; заказ переводим в paid только из new
 *   (регрессов accepted/done/cancelled нет).
 */
export async function applyWebhookEvent(
  repo: PaymentRepo,
  event: WebhookEvent,
): Promise<ApplyResult> {
  const mapped = mapKaspiStatus(event.type, event.kaspiStatus);
  if (!mapped) return { action: "ignored-intermediate" };

  const row = await repo.findByProviderId(
    event.provider,
    event.kaspiPaymentId,
  );
  if (!row) return { action: "unknown" };

  if (TERMINAL.has(row.status)) {
    return { action: row.status === mapped ? "duplicate" : "ignored-terminal" };
  }

  if (!amountsMatch(row.amountTiyin, event.kaspiAmountKzt)) {
    return { action: "review-amount" };
  }

  await repo.markTerminal(row.id, mapped, event.now);

  if (mapped === "success") {
    const orderStatus = await repo.getOrderStatus(row.orderId);
    if (orderStatus === "new") {
      await repo.markOrderPaid(row.orderId);
    }
  }

  return { action: "applied", paymentStatus: mapped };
}
