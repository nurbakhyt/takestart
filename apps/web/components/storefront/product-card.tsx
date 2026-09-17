"use client";

import { useTranslations } from "next-intl";
import { useCart } from "./cart-context";

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

  return (
    <div
      className={`flex gap-3 border-b border-line py-3.5 ${
        available ? "" : "opacity-60"
      }`}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-fog font-display text-xl text-ink-faint"
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
              className="rounded-lg border border-ink px-4 py-2 text-[14px] font-semibold text-ink active:bg-ink active:text-paper"
            >
              {t("add")}
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-lg border border-ink">
              <button
                type="button"
                aria-label="−"
                onClick={() => setQty(id, qty - 1)}
                className="flex h-9 w-9 items-center justify-center text-lg leading-none active:bg-fog"
              >
                −
              </button>
              <span className="min-w-5 text-center text-[15px] font-semibold">
                {qty}
              </span>
              <button
                type="button"
                aria-label="+"
                onClick={() => setQty(id, qty + 1)}
                className="flex h-9 w-9 items-center justify-center text-lg leading-none active:bg-fog"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
