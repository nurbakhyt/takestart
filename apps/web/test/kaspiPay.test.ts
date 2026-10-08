import { describe, expect, it, vi } from "vitest";

import {
  createKaspiPayClient,
  pickQrImage,
  toKzt,
} from "../lib/kaspiPay";

describe("toKzt", () => {
  it("ровные тиыны — в тенге", () => {
    expect(toKzt(500000)).toBe(5000);
  });

  it("копейки отбрасываются вниз (Kaspi берёт целые тенге)", () => {
    expect(toKzt(500050)).toBe(5000);
    expect(toKzt(500099)).toBe(5000);
  });
});

describe("pickQrImage", () => {
  it("межбанку отдаём QrOriginalToken", () => {
    expect(
      pickQrImage({
        QrToken: "https://pay.kaspi.kz/pay/aaa",
        QrOriginalToken: "https://qr.kaspi.kz/bbb",
      }),
    ).toBe("https://qr.kaspi.kz/bbb");
  });

  it("без original — fallback на QrToken", () => {
    expect(pickQrImage({ QrToken: "https://pay.kaspi.kz/pay/aaa" })).toBe(
      "https://pay.kaspi.kz/pay/aaa",
    );
  });
});

describe("createKaspiPayClient", () => {
  const stubOk = (data: unknown) =>
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });

  it("createQr бьёт в /api/qr/create с суммой и сессионными заголовками", async () => {
    const fetchFn = stubOk({
      StatusCode: 0,
      Data: { QrOperationId: 789012, QrToken: "t", Amount: 5000 },
    });
    const client = createKaspiPayClient({
      baseUrl: "https://pay.takestart.cc/s/pilot",
      session: { tokenSN: "SN", vtokenSecret: "VS", profileId: "7" },
      fetchFn,
    });
    await client.createQr(5000);
    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://pay.takestart.cc/s/pilot/api/qr/create");
    const body = JSON.parse(init.body as string) as { PaymentAmount: number };
    expect(body.PaymentAmount).toBe(5000);
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Token-SN"]).toBe("SN");
    expect(headers["X-Vtoken-Secret"]).toBe("VS");
  });

  it("не-ok от VPS — бросает с кодом", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    const client = createKaspiPayClient({
      baseUrl: "https://x",
      session: { tokenSN: "SN", vtokenSecret: "VS" },
      fetchFn,
    });
    await expect(client.createQr(100)).rejects.toThrow("kaspi_401");
  });

  it("qrStatus опрашивает статус операции", async () => {
    const fetchFn = stubOk({ Data: { Status: "Processed" } });
    const client = createKaspiPayClient({
      baseUrl: "https://x",
      session: { tokenSN: "SN", vtokenSecret: "VS" },
      fetchFn,
    });
    const res = await client.qrStatus("789012");
    expect(res.status).toBe("Processed");
    const [url] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("qrOperationId=789012");
  });
});
