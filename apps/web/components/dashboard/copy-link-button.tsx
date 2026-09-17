"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function CopyLinkButton({ url }: { url: string }) {
  const t = useTranslations("dashboard");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // нет clipboard — ссылку видно рядом
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-[14px] font-medium active:scale-[0.99]"
    >
      {copied ? t("copied") : t("copyLink")}
    </button>
  );
}
