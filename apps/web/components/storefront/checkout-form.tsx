"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useCart } from "./cart-context";
import { formatKZT } from "@/lib/locale-text";

type ApiError = { error: string };
type ApiOk = { orderId: string; code: string; totalTiyin: number; waLink: string };

export function CheckoutForm({
  slug,
  locale,
  fulfillmentMode,
  deliveryFeeTiyin,
  minOrderTiyin,
  backHref,
  successBase,
}: {
  slug: string;
  locale: string;
  fulfillmentMode: "delivery" | "pickup" | "both";
  deliveryFeeTiyin: number;
  minOrderTiyin: number;
  backHref: string;
  successBase: string;
}) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const { lines, subtotalTiyin, clear } = useCart();

  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(
    fulfillmentMode === "pickup" ? "pickup" : "delivery",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const deliveryFee = fulfillment === "delivery" ? deliveryFeeTiyin : 0;
  const total = subtotalTiyin + deliveryFee;
  const belowMinimum = subtotalTiyin < minOrderTiyin;

  const errorText = useMemo(() => {
    if (!errorCode) return null;
    const key = `errors.${errorCode}`;
    try {
      return t(key);
    } catch {
      return t("errors.network");
    }
  }, [errorCode, t]);

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-zinc-500">{t("emptyCart")}</p>
        <a
          href={backHref}
          className="rounded-2xl bg-zinc-900 px-5 py-3 text-[15px] font-medium text-white"
        >
          {t("emptyCartCta")}
        </a>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || belowMinimum) return;
    setPending(true);
    setErrorCode(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          locale,
          fulfillment,
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          comment,
        }),
      });
      const data = (await res.json()) as ApiOk | ApiError;
      if (!res.ok || "error" in data) {
        setErrorCode((data as ApiError).error ?? "network");
        setPending(false);
        return;
      }
      clear();
      router.push(`${successBase}?orderId=${(data as ApiOk).orderId}`);
    } catch {
      setErrorCode("network");
      setPending(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-zinc-900";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {fulfillmentMode === "both" ? (
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1.5">
          {(["delivery", "pickup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFulfillment(m)}
              className={`rounded-xl px-3 py-2.5 text-[14px] font-medium ${
                fulfillment === m ? "bg-white shadow-sm" : "text-zinc-500"
              }`}
            >
              {m === "delivery" ? t("fulfillmentDelivery") : t("fulfillmentPickup")}
            </button>
          ))}
        </div>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-medium">{t("name")}</span>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePh")}
          maxLength={80}
          autoComplete="name"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-medium">{t("phone")} *</span>
        <input
          className={inputCls}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("phonePh")}
          inputMode="tel"
          autoComplete="tel"
          required
        />
      </label>

      {fulfillment === "delivery" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium">{t("address")} *</span>
          <textarea
            className={`${inputCls} min-h-20 resize-y`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("addressPh")}
            maxLength={300}
            required
            rows={2}
          />
        </label>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-medium">{t("comment")}</span>
        <input
          className={inputCls}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("commentPh")}
          maxLength={500}
        />
      </label>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-[14px]">
        <div className="flex justify-between text-zinc-600">
          <span>
            {t("summary")} · {lines.length}
          </span>
          <span>{formatKZT(subtotalTiyin, locale)}</span>
        </div>
        {deliveryFee > 0 ? (
          <div className="mt-1 flex justify-between text-zinc-600">
            <span>{t("deliveryFee")}</span>
            <span>{formatKZT(deliveryFee, locale)}</span>
          </div>
        ) : null}
        <div className="mt-1.5 flex justify-between border-t border-zinc-100 pt-2 text-[16px] font-semibold">
          <span>{t("total")}</span>
          <span>{formatKZT(total, locale)}</span>
        </div>
      </div>

      {errorText ? (
        <p className="rounded-xl bg-red-50 px-3.5 py-3 text-[14px] text-red-700">
          {errorText}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || belowMinimum}
        className="rounded-2xl bg-emerald-600 px-4 py-3.5 text-[16px] font-semibold text-white disabled:opacity-50 active:scale-[0.99]"
      >
        {pending ? "…" : t("submit")}
      </button>
    </form>
  );
}
