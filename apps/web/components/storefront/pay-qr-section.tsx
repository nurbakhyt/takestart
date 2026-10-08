"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";

type Phase =
  | { name: "idle" }
  | { name: "creating" }
  | { name: "ready"; qrImage: string; kaspiPaymentId: string }
  | { name: "done"; paymentStatus: string }
  | { name: "unavailable" }
  | { name: "error"; code: string };

const TERMINAL = new Set(["success", "failed", "expired", "lost"]);

/** Оплата заказа Kaspi QR: создание счёта, показ кода, ожидание статуса. */
export function PayQrSection({ orderId }: { orderId: string }) {
  const t = useTranslations("success");
  const [phase, setPhase] = useState<Phase>({ name: "idle" });

  useEffect(() => {
    if (phase.name !== "ready") return;
    const { kaspiPaymentId } = phase;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/status?provider=kaspi-qr&kaspiPaymentId=${encodeURIComponent(kaspiPaymentId)}`,
        );
        const data = (await res.json()) as {
          paymentStatus?: string;
          error?: string;
        };
        if (!res.ok || data.error || !data.paymentStatus) {
          clearInterval(timer);
          setPhase({ name: "error", code: data.error ?? "network" });
          return;
        }
        if (TERMINAL.has(data.paymentStatus)) {
          clearInterval(timer);
          setPhase({ name: "done", paymentStatus: data.paymentStatus });
        }
      } catch {
        clearInterval(timer);
        setPhase({ name: "error", code: "network" });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [phase]);

  async function create() {
    setPhase({ name: "creating" });
    try {
      const res = await fetch("/api/payments/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await res.json()) as {
        qrImage?: string;
        kaspiPaymentId?: string;
        error?: string;
      };
      if (res.status === 503 || data.error === "payments_unavailable") {
        setPhase({ name: "unavailable" });
        return;
      }
      if (!res.ok || !data.qrImage || !data.kaspiPaymentId) {
        setPhase({ name: "error", code: data.error ?? "network" });
        return;
      }
      setPhase({
        name: "ready",
        qrImage: data.qrImage,
        kaspiPaymentId: data.kaspiPaymentId,
      });
    } catch {
      setPhase({ name: "error", code: "network" });
    }
  }

  if (phase.name === "idle") {
    return (
      <button
        type="button"
        onClick={create}
        className="rounded-lg bg-ink px-4 py-3 text-[15px] font-medium text-paper"
      >
        {t("payWithQr")}
      </button>
    );
  }

  if (phase.name === "creating") {
    return <p className="text-[14px] text-ink-soft">{t("payCreating")}</p>;
  }

  if (phase.name === "unavailable") {
    return <p className="text-[14px] text-ink-soft">{t("payUnavailable")}</p>;
  }

  if (phase.name === "error") {
    return (
      <p className="rounded-lg border border-tandoor px-3.5 py-3 text-[14px] text-tandoor">
        {t("payError")}
      </p>
    );
  }

  if (phase.name === "done") {
    return (
      <p className="text-[15px] font-semibold">
        {phase.paymentStatus === "success" ? (
          <span className="text-leaf">{t("paySuccess")}</span>
        ) : phase.paymentStatus === "expired" ? (
          <span className="text-tandoor">{t("payExpired")}</span>
        ) : (
          <span className="text-tandoor">{t("payFailed")}</span>
        )}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-paper p-4">
      <div className="bg-white p-2">
        <QRCodeSVG value={phase.qrImage} size={200} />
      </div>
      <p className="text-[14px] text-ink-soft">{t("payWaiting")}</p>
    </div>
  );
}
