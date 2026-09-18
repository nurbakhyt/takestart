"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "./cart-context";
import { CloseIcon, MinusIcon, PlusIcon, ZoomIcon } from "./icons";

export function ProductCard({
  id,
  name,
  desc,
  priceLabel,
  priceTiyin,
  photoUrl,
  available,
}: {
  id: string;
  name: string;
  desc: string | null;
  priceLabel: string;
  priceTiyin: number;
  photoUrl: string | null;
  available: boolean;
}) {
  const t = useTranslations("storefront");
  const { qtyOf, add, setQty } = useCart();
  const qty = qtyOf(id);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoomed]);

  return (
    <div
      className={`flex gap-3 border-b border-line py-3.5 ${
        available ? "" : "opacity-60"
      }`}
    >
      {photoUrl ? (
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={t("zoomPhoto")}
          className="relative shrink-0 cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={name}
            className="h-28 w-28 rounded-xl object-cover sm:h-32 sm:w-32"
            loading="lazy"
          />
          <span
            aria-hidden
            className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-paper/90 text-ink"
          >
            <ZoomIcon className="h-4 w-4" />
          </span>
        </button>
      ) : (
        <div
          aria-hidden
          className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-fog font-display text-2xl text-ink-faint sm:h-32 sm:w-32"
        >
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline gap-2">
          <div className="truncate text-[15px] font-medium">{name}</div>
          <span aria-hidden className="ts-leader" />
          <div className="shrink-0 font-display text-[13px] font-semibold text-tandoor">
            {priceLabel}
          </div>
        </div>
        {desc ? (
          <div className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-ink-soft">
            {desc}
          </div>
        ) : null}
        <div className="mt-2 flex items-center justify-end">
          {!available ? (
            <span className="text-[13px] font-medium text-tandoor">
              {t("unavailable")}
            </span>
          ) : qty === 0 ? (
            <button
              type="button"
              onClick={() => add({ id, name, priceTiyin })}
              className="flex items-center gap-1.5 rounded-lg border border-ink px-4 py-2 text-[14px] font-semibold text-ink active:bg-ink active:text-paper"
            >
              <PlusIcon className="h-4 w-4" />
              {t("add")}
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-lg border border-ink">
              <button
                type="button"
                aria-label="−"
                onClick={() => setQty(id, qty - 1)}
                className="flex h-9 w-9 items-center justify-center active:bg-fog"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="min-w-5 text-center text-[15px] font-semibold">
                {qty}
              </span>
              <button
                type="button"
                aria-label="+"
                onClick={() => setQty(id, qty + 1)}
                className="flex h-9 w-9 items-center justify-center active:bg-fog"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      {zoomed && photoUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={name}
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-ink/85 p-4"
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label={t("closePhoto")}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-paper text-ink"
          >
            <CloseIcon />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85dvh] w-auto max-w-full cursor-default rounded-xl object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
