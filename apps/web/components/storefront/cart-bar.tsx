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
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="ts-zigzag-top mx-auto max-w-xl border-x border-line bg-paper">
          <div className="px-4 pb-4 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex w-full items-center justify-between rounded-lg bg-ink px-4 py-3.5 text-paper active:opacity-90"
            >
              <span className="text-[14px] font-medium">
                {t("title")}, {count}
              </span>
              <span className="font-display text-[15px] font-semibold">
                {formatKZT(total, locale)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/40">
          <button
            type="button"
            aria-label="close"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="ts-enter relative mx-auto flex max-h-[85dvh] w-full max-w-xl flex-col rounded-t-lg bg-paper px-4 pb-6 pt-3 sm:px-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <div className="mb-2 font-display text-[17px] font-semibold">
              {t("title")}, {count}
            </div>
            <div className="flex flex-col overflow-y-auto">
              {lines.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 border-b border-line py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium">
                      {l.name}
                    </div>
                    <div className="text-[13px] text-ink-soft">
                      {formatKZT(l.priceTiyin, locale)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-line">
                    <button
                      type="button"
                      aria-label="−"
                      onClick={() => setQty(l.id, l.qty - 1)}
                      className="flex h-9 w-9 items-center justify-center text-lg leading-none active:bg-fog"
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
                      className="flex h-9 w-9 items-center justify-center text-lg leading-none active:bg-fog"
                    >
                      +
                    </button>
                  </div>
                  <div className="w-20 shrink-0 text-right font-display text-[13px] font-semibold text-tandoor">
                    {formatKZT(l.qty * l.priceTiyin, locale)}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 text-[14px]">
              {deliveryFeeLabel ? (
                <div className="flex justify-between text-ink-soft">
                  <span>{t("deliveryFee")}</span>
                  <span>{deliveryFeeLabel}</span>
                </div>
              ) : null}
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="font-medium">{t("total")}</span>
                <span className="ts-stamp font-display text-[17px] font-semibold">
                  {formatKZT(total, locale)}
                </span>
              </div>
            </div>
            <a
              href={checkoutHref}
              className="mt-4 block rounded-lg bg-leaf px-4 py-3.5 text-center text-[16px] font-semibold text-white active:bg-leaf-deep"
            >
              {t("checkout")}
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg px-4 py-2.5 text-[14px] font-medium text-ink-soft"
            >
              {t("close")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
