import { describe, expect, it } from "vitest";

import {
  amountsMatch,
  mapKaspiStatus,
  verifyWebhookSignature,
} from "../lib/kaspi";

// Вектор посчитан независимо: node:crypto, секрет "test-secret".
const BODY = `{"event":"payment.success","paymentId":"789012","type":"qr"}`;
const SIG =
  "sha256=b4e27b3c0d105f934ce0572f263e070e8aa1cac1d9b440dd75c09638fd2ac9a5";

describe("verifyWebhookSignature", () => {
  it("принимает корректную подпись", () => {
    expect(verifyWebhookSignature(BODY, SIG, "test-secret")).toBe(true);
  });

  it("отвергает чужой секрет", () => {
    expect(verifyWebhookSignature(BODY, SIG, "wrong-secret")).toBe(false);
  });

  it("отвергает подменённое тело", () => {
    expect(
      verifyWebhookSignature(BODY + " ", SIG, "test-secret"),
    ).toBe(false);
  });

  it("отвергает мусор вместо подписи", () => {
    expect(verifyWebhookSignature(BODY, null, "test-secret")).toBe(false);
    expect(verifyWebhookSignature(BODY, "", "test-secret")).toBe(false);
    expect(verifyWebhookSignature(BODY, "sha256=zzzz", "test-secret")).toBe(
      false,
    );
    expect(
      verifyWebhookSignature(BODY, SIG.replace("sha256=", ""), "test-secret"),
    ).toBe(false);
  });
});

describe("mapKaspiStatus", () => {
  it("маппит финальные QR-статусы", () => {
    expect(mapKaspiStatus("qr", "Processed")).toBe("success");
    expect(mapKaspiStatus("qr", "CancelledByUser")).toBe("failed");
    expect(mapKaspiStatus("qr", "Rejected")).toBe("failed");
    expect(mapKaspiStatus("qr", "QrTokenDiscarded")).toBe("expired");
    expect(mapKaspiStatus("qr", "Expired")).toBe("expired");
  });

  it("маппит финальные invoice-статусы", () => {
    expect(mapKaspiStatus("invoice", "Processed")).toBe("success");
    expect(mapKaspiStatus("invoice", "RemotePaymentCanceled")).toBe("failed");
    expect(mapKaspiStatus("invoice", "Expired")).toBe("expired");
  });

  it("потерянные сессии — lost", () => {
    expect(mapKaspiStatus("qr", "SessionExpired")).toBe("lost");
    expect(mapKaspiStatus("invoice", "PollingFailed")).toBe("lost");
  });

  it("промежуточные статусы событий не дают", () => {
    expect(mapKaspiStatus("qr", "QrTokenCreated")).toBeNull();
    expect(mapKaspiStatus("qr", "Wait")).toBeNull();
    expect(mapKaspiStatus("invoice", "RemotePaymentCreated")).toBeNull();
  });

  it("неизвестный код — failed, а не исключение", () => {
    expect(mapKaspiStatus("qr", "SomethingNewFromKaspi")).toBe("failed");
  });
});

describe("amountsMatch", () => {
  it("точное совпадение тиынов и тенге", () => {
    expect(amountsMatch(500000, 5000)).toBe(true);
  });

  it("терпит расхождение меньше 100 тиын", () => {
    expect(amountsMatch(500050, 5000)).toBe(true);
  });

  it("расхождение в 100 тиын и больше — на ручную проверку", () => {
    expect(amountsMatch(500100, 5000)).toBe(false);
    expect(amountsMatch(499900, 5000)).toBe(false);
    expect(amountsMatch(400000, 5000)).toBe(false);
  });
});
