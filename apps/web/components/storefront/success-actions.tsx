"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "./cart-context";

/** Кнопки success-экрана: открыть WA, скопировать чек, чистка корзины при входе. */
export function SuccessActions({
  slug,
  waLink,
  receiptText,
}: {
  slug: string;
  waLink: string;
  receiptText: string;
}) {
  const t = useTranslations("success");
  const { clear } = useCart();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard недоступен (http/старый браузер) — текст виден ниже
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg bg-leaf px-4 py-3.5 text-center text-[16px] font-semibold text-white active:bg-leaf-deep"
      >
        {t("openWhatsapp")}
      </a>
      <button
        type="button"
        onClick={copy}
        className="rounded-lg border border-ink bg-paper px-4 py-3 text-[15px] font-medium text-ink"
      >
        {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}
