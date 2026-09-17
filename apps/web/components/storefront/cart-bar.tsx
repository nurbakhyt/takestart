"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "./cart-context";
import { formatKZT } from "@/lib/locale-text";

export function CartBar({
  locale,
  checkoutHref,
  deliveryFeeTiyin,
  deliveryFeeLabel,
}: {
  locale: string;
  checkoutHref: string;
  deliveryFeeTiyin: number;
  deliveryFeeLabel: string | null;
}) {
  const t = useTranslations("cart");
  const { lines, count, subtotalTiyin, setQty } = useCart();
  const [open, setOpen] = useState(false);

  if (count === 0) return null;

  const total = subtotalTiyin + deliveryFeeTiyin;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-1 items-center justify-between rounded-2xl bg-zinc-900 px-4 py-3 text-white active:scale-[0.99]"
          >
            <span className="text-[14px] font-medium">
              {t("title")} · {count}
            </span>
            <span className="text-[15px] font-semibold">
              {formatKZT(total, locale)}
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
          <button
            type="button"
            aria-label="close"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="relative mx-auto flex max-h-[85dvh] w-full max-w-2xl flex-col rounded-t-3xl bg-white p-4 pb-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200" />
            <div className="mb-3 text-lg font-semibold">{t("title")}</div>
            <div className="flex flex-col gap-3 overflow-y-auto">
              {lines.map((l) => (
                <div key={l.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium">
                      {l.name}
                    </div>
                    <div className="text-[13px] text-zinc-500">
                      {formatKZT(l.priceTiyin, locale)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-full bg-zinc-100 px-1.5 py-1">
                    <button
                      type="button"
                      aria-label="−"
                      onClick={() => setQty(l.id, l.qty - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg leading-none shadow-sm active:scale-95"
                    >
                      −
                    </button>
                    <span className="min-w-5 text-center text-[15px] font-semibold">
                      {l.qty}
                    </span>
                    <button
                      type="button"
                      aria-label="+"
                      onClick={() => setQty(l.id, l.qty + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg leading-none shadow-sm active:scale-95"
                    >
                      +
                    </button>
                  </div>
                  <div className="w-20 shrink-0 text-right text-[14px] font-semibold">
                    {formatKZT(l.qty * l.priceTiyin, locale)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-zinc-100 pt-3 text-[14px]">
              {deliveryFeeLabel ? (
                <div className="flex justify-between text-zinc-600">
                  <span>{t("deliveryFee")}</span>
                  <span>{deliveryFeeLabel}</span>
                </div>
              ) : null}
              <div className="mt-1 flex justify-between text-[16px] font-semibold">
                <span>{t("total")}</span>
                <span>{formatKZT(total, locale)}</span>
              </div>
            </div>
            <a
              href={checkoutHref}
              className="mt-4 block rounded-2xl bg-emerald-600 px-4 py-3.5 text-center text-[16px] font-semibold text-white active:scale-[0.99]"
            >
              {t("checkout")}
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
