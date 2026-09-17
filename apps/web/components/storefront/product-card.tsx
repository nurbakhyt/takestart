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
      className={`flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3 ${
        available ? "" : "opacity-60"
      }`}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-2xl font-semibold text-zinc-400"
        >
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate text-[15px] font-medium">{name}</div>
        {desc ? (
          <div className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-zinc-500">
            {desc}
          </div>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="text-[15px] font-semibold">{priceLabel}</div>
          {!available ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-[13px] text-zinc-500">
              {t("unavailable")}
            </span>
          ) : qty === 0 ? (
            <button
              type="button"
              onClick={() => add({ id, name, priceTiyin })}
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-[14px] font-medium text-white active:scale-95"
            >
              {t("add")}
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-full bg-zinc-100 px-1.5 py-1">
              <button
                type="button"
                aria-label="−"
                onClick={() => setQty(id, qty - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg leading-none shadow-sm active:scale-95"
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
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg leading-none shadow-sm active:scale-95"
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
