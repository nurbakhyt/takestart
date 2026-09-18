"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/routing";

type Item = { id: string; name: string; price: number };

/**
 * Живое демо WhatsApp Handoff: покупатель жмёт плюс,
 * чек пересчитывается, итог подсвечен маркером.
 * Единственное смелое место лендинга — всё остальное тихое.
 */
export function ReceiptDemo({
  locale,
  shop,
  meta,
  items,
  totalLabel,
  ctaLabel,
  hint,
  addLabel,
}: {
  locale: Locale;
  shop: string;
  meta: string;
  items: Item[];
  totalLabel: string;
  ctaLabel: string;
  hint: string;
  addLabel: string;
}) {
  const [qty, setQty] = useState<Record<string, number>>({
    [items[0]?.id ?? "a"]: 2,
    [items[1]?.id ?? "b"]: 1,
    [items[2]?.id ?? "c"]: 0,
  });

  const fmt = (v: number) =>
    new Intl.NumberFormat(locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-KZ", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(v) + " ₸";

  const total = items.reduce((s, it) => s + it.price * (qty[it.id] ?? 0), 0);
  const count = Object.values(qty).reduce((s, n) => s + n, 0);

  return (
    <figure aria-label={shop} className="mx-auto w-full max-w-sm">
      <div className="ts-tape ts-zigzag-top ts-zigzag-bottom ts-enter bg-paper shadow-[0_18px_50px_-24px_rgba(32,56,44,0.45)]">
        <div className="px-6 pb-6">
          <p className="font-display text-[17px] font-semibold">{shop}</p>
          <p className="mt-1 text-[13px] text-ink-faint">{meta}</p>

          <ul className="mt-5 space-y-4">
            {items.map((it) => {
              const n = qty[it.id] ?? 0;
              return (
                <li key={it.id} className="flex items-baseline gap-2">
                  <span className="text-[14px] font-medium">
                    {it.name}
                    {n > 1 ? (
                      <span className="ml-1.5 text-[13px] text-ink-faint">× {n}</span>
                    ) : null}
                  </span>
                  <span aria-hidden className="ts-leader" />
                  <span className={`text-[14px] tabular-nums ${n > 0 ? "font-semibold" : "font-medium text-ink-faint"}`}>
                    {fmt(n > 0 ? it.price * n : it.price)}
                  </span>
                  <button
                    type="button"
                    aria-label={`${addLabel}: ${it.name}`}
                    aria-pressed={n > 0}
                    onClick={() =>
                      setQty((q) => ({ ...q, [it.id]: (q[it.id] ?? 0) + 1 }))
                    }
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setQty((q) => ({ ...q, [it.id]: Math.max(0, (q[it.id] ?? 0) - 1) }));
                    }}
                    className={`ml-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[16px] leading-none transition-colors ${
                      n > 0
                        ? "border-leaf bg-leaf text-paper"
                        : "border-line bg-paper text-ink hover:border-leaf"
                    }`}
                  >
                    +
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex items-baseline gap-2 border-t border-dashed border-line pt-4">
            <span className="text-[14px] text-ink-soft">
              {totalLabel} · {count}
            </span>
            <span aria-hidden className="ts-leader" />
            <span key={total} className="ts-stamp ts-enter font-display text-[20px] font-bold tabular-nums">
              {fmt(total)}
            </span>
          </div>

          <span
            aria-live="polite"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-leaf px-4 py-3 text-[15px] font-semibold text-paper"
          >
            <WhatsAppGlyph />
            {ctaLabel}
          </span>
          <p className="mt-3 text-center text-[13px] leading-5 text-ink-faint">{hint}</p>
        </div>
      </div>
    </figure>
  );
}

function WhatsAppGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5c-5.25 0-9.5 4.25-9.5 9.5 0 1.68.44 3.22 1.2 4.57L2.5 21.5l5.05-1.18a9.47 9.47 0 0 0 4.45 1.13c5.25 0 9.5-4.25 9.5-9.5s-4.25-9.45-9.5-9.45Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.8 8.3c.3-.7.6-.7.9-.7l.7.01c.2.01.5.18.6.44l.8 1.85c.1.24.03.52-.17.68l-.5.44c.4.86 1.06 1.53 1.92 1.93l.44-.5c.16-.2.44-.27.68-.17l1.85.8c.26.11.43.4.44.6l.01.7c0 .3 0 .6-.7.9-.6.26-1.86.38-3.6-.36a9.7 9.7 0 0 1-3.2-2.5 9.7 9.7 0 0 1-1.6-2.7c-.74-1.74-.62-3-.36-3.6Z"
        fill="currentColor"
      />
    </svg>
  );
}
