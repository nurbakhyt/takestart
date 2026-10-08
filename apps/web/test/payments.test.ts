import { describe, expect, it } from "vitest";

import {
  applyWebhookEvent,
  type PaymentRepo,
  type PaymentRow,
} from "../lib/payments";

/** In-memory шов вместо D1: то же поведение, без базы. */
function makeRepo(): PaymentRepo & { rows: Map<string, PaymentRow> } {
  const rows = new Map<string, PaymentRow>();
  const key = (provider: string, kaspiPaymentId: string) =>
    `${provider}:${kaspiPaymentId}`;
  const orders = new Map<string, string>([["order-1", "new"]]);
  return {
    rows,
    async findByProviderId(provider, kaspiPaymentId) {
      return rows.get(key(provider, kaspiPaymentId)) ?? null;
    },
    async markTerminal(id, status, now) {
      const row = [...rows.values()].find((r) => r.id === id);
      if (!row) throw new Error("payment_not_found");
      row.status = status;
      row.updatedAt = now;
    },
    async getOrderStatus(orderId) {
      return orders.get(orderId) ?? null;
    },
    async markOrderPaid(orderId) {
      orders.set(orderId, "paid");
    },
  };
}

const pending = (): PaymentRow => ({
  id: "pay-1",
  orderId: "order-1",
  provider: "kaspi-qr",
  kaspiPaymentId: "789012",
  amountTiyin: 500000,
  kaspiAmountKzt: 5000,
  status: "pending",
  updatedAt: 0,
});

const base = {
  provider: "kaspi-qr",
  type: "qr" as const,
  kaspiPaymentId: "789012",
  kaspiStatus: "Processed",
  kaspiAmountKzt: 5000,
  now: 1000,
};

describe("applyWebhookEvent", () => {
  it("первый success переводит платёж и заказ new → paid", async () => {
    const repo = makeRepo();
    repo.rows.set("kaspi-qr:789012", pending());
    const res = await applyWebhookEvent(repo, base);
    expect(res).toEqual({ action: "applied", paymentStatus: "success" });
    expect(repo.rows.get("kaspi-qr:789012")?.status).toBe("success");
    expect(await repo.getOrderStatus("order-1")).toBe("paid");
  });

  it("дубль success идемпотентен", async () => {
    const repo = makeRepo();
    const row = { ...pending(), status: "success" as const };
    repo.rows.set("kaspi-qr:789012", row);
    const res = await applyWebhookEvent(repo, base);
    expect(res.action).toBe("duplicate");
    expect(await repo.getOrderStatus("order-1")).toBe("new");
  });

  it("поздний expired после success игнорируется", async () => {
    const repo = makeRepo();
    repo.rows.set("kaspi-qr:789012", {
      ...pending(),
      status: "success",
    });
    const res = await applyWebhookEvent(repo, {
      ...base,
      kaspiStatus: "QrTokenDiscarded",
    });
    expect(res.action).toBe("ignored-terminal");
    expect(repo.rows.get("kaspi-qr:789012")?.status).toBe("success");
  });

  it("первое терминальное побеждает: success после expired игнорируется", async () => {
    const repo = makeRepo();
    repo.rows.set("kaspi-qr:789012", {
      ...pending(),
      status: "expired",
    });
    const res = await applyWebhookEvent(repo, base);
    expect(res.action).toBe("ignored-terminal");
    expect(await repo.getOrderStatus("order-1")).toBe("new");
  });

  it("неизвестный код Kaspi — failed, заказ new → paid не трогаем", async () => {
    const repo = makeRepo();
    repo.rows.set("kaspi-qr:789012", pending());
    const res = await applyWebhookEvent(repo, {
      ...base,
      kaspiStatus: "SomethingNewFromKaspi",
    });
    expect(res).toEqual({ action: "applied", paymentStatus: "failed" });
    expect(await repo.getOrderStatus("order-1")).toBe("new");
  });

  it("расхождение сумм — на ручную проверку, состояние не меняется", async () => {
    const repo = makeRepo();
    repo.rows.set("kaspi-qr:789012", pending());
    const res = await applyWebhookEvent(repo, {
      ...base,
      kaspiAmountKzt: 4000,
    });
    expect(res.action).toBe("review-amount");
    expect(repo.rows.get("kaspi-qr:789012")?.status).toBe("pending");
    expect(await repo.getOrderStatus("order-1")).toBe("new");
  });

  it("success при уже accepted заказе — платёж фиксируем, заказ не трогаем", async () => {
    const repo = makeRepo();
    repo.rows.set("kaspi-qr:789012", pending());
    // заказ уже ушёл дальше по воронке
    const res = await applyWebhookEvent(
      {
        ...repo,
        getOrderStatus: async () => "accepted",
        markOrderPaid: async () => {
          throw new Error("must_not_regress_order");
        },
      },
      base,
    );
    expect(res).toEqual({ action: "applied", paymentStatus: "success" });
  });

  it("чужой paymentId — unknown, строк не создаём", async () => {
    const repo = makeRepo();
    const res = await applyWebhookEvent(repo, {
      ...base,
      kaspiPaymentId: "000000",
    });
    expect(res.action).toBe("unknown");
    expect(repo.rows.size).toBe(0);
  });

  it("промежуточный статус событий не даёт", async () => {
    const repo = makeRepo();
    repo.rows.set("kaspi-qr:789012", pending());
    const res = await applyWebhookEvent(repo, {
      ...base,
      kaspiStatus: "Wait",
    });
    expect(res.action).toBe("ignored-intermediate");
    expect(repo.rows.get("kaspi-qr:789012")?.status).toBe("pending");
  });
});
