/** Клиент VPS-инстанса kaspi-pos-automation (см. ADR-0005, docs/API.md). */

export interface KaspiSession {
  tokenSN: string;
  vtokenSecret: string;
  profileId?: string;
}

/** Подмножество env, нужное для сессии (структурно совпадает с CloudflareEnv). */
export interface KaspiEnv {
  KASPI_PAY_BASE_URL?: string;
  KASPI_TOKEN_SN?: string;
  KASPI_VTOKEN_SECRET?: string;
  KASPI_PROFILE_ID?: string;
}

export interface KaspiConnection {
  baseUrl: string;
  session: KaspiSession;
}

/** Сессия кассира из env; null — сессии нет, отдаём 503 payments_unavailable. */
export function sessionFromEnv(env: KaspiEnv): KaspiConnection | null {
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

export interface QrData {
  QrToken: string;
  QrOriginalToken?: string;
}

/** Целые тенге вниз: Kaspi принимает только целые суммы. */
export function toKzt(totalTiyin: number): number {
  return Math.floor(totalTiyin / 100);
}

/** Межбанку — QrOriginalToken (Единый QR), иначе fallback на QrToken. */
export function pickQrImage(data: QrData): string {
  return data.QrOriginalToken ?? data.QrToken;
}

export interface KaspiPayClient {
  createQr(amountKzt: number): Promise<{
    qrOperationId: string;
    qrToken: string;
    qrOriginalToken?: string;
    expireDate?: string;
    amount?: number;
  }>;
  qrStatus(qrOperationId: string): Promise<{ status: string }>;
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export function createKaspiPayClient(opts: {
  baseUrl: string;
  session: KaspiSession;
  fetchFn?: FetchFn;
}): KaspiPayClient {
  const fetchFn = (opts.fetchFn ?? fetch) as FetchFn;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Token-SN": opts.session.tokenSN,
    "X-Vtoken-Secret": opts.session.vtokenSecret,
  };
  if (opts.session.profileId) headers["X-Profile-Id"] = opts.session.profileId;

  const call = async (path: string, init?: RequestInit) => {
    const res = await fetchFn(`${opts.baseUrl}${path}`, {
      ...init,
      headers: { ...headers, ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`kaspi_${res.status}`);
    return (await res.json()) as {
      StatusCode?: number;
      Data?: Record<string, unknown>;
    };
  };

  return {
    async createQr(amountKzt) {
      const json = await call("/api/qr/create", {
        method: "POST",
        body: JSON.stringify({ PaymentAmount: amountKzt }),
      });
      const d = (json.Data ?? {}) as {
        QrOperationId?: number | string;
        QrToken?: string;
        QrOriginalToken?: string;
        ExpireDate?: string;
        Amount?: number;
      };
      if (!d.QrOperationId || !d.QrToken) throw new Error("kaspi_bad_qr");
      return {
        qrOperationId: String(d.QrOperationId),
        qrToken: d.QrToken,
        qrOriginalToken: d.QrOriginalToken,
        expireDate: d.ExpireDate,
        amount: d.Amount,
      };
    },
    async qrStatus(qrOperationId) {
      const json = await call(
        `/api/qr/status?qrOperationId=${encodeURIComponent(qrOperationId)}`,
      );
      const d = (json.Data ?? {}) as { Status?: string };
      return { status: d.Status ?? "Unknown" };
    },
  };
}
