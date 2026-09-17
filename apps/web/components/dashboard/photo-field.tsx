"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

/** Поле фото товара: ресайз на клиенте (≤1600px, JPEG) → upload в R2 → key в форму. */
export function PhotoField({
  shopId,
  initialKey,
  initialUrl,
}: {
  shopId: string;
  initialKey: string | null;
  initialUrl: string | null;
}) {
  const t = useTranslations("dashboard");
  const [key, setKey] = useState<string | null>(initialKey);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setBusy(true);
    setError(false);
    try {
      const jpeg = await resizeToJpeg(file);
      const form = new FormData();
      form.set("shopId", shopId);
      form.set("file", jpeg, "photo.jpg");
      const res = await fetch("/api/dashboard/photos", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { key?: string; url?: string };
      if (!res.ok || !data.key || !data.url) throw new Error("upload");
      setKey(data.key);
      setUrl(data.url);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input type="hidden" name="photoR2Key" value={key ?? ""} />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-16 w-16 rounded-xl object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-100 text-xl text-zinc-400">
          ?
        </div>
      )}
      <div className="flex flex-col items-start gap-1.5">
        <label className="cursor-pointer rounded-xl bg-zinc-100 px-3.5 py-2 text-[14px] font-medium">
          {busy ? "…" : url ? t("photoChange") : t("photoAdd")}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </label>
        {url ? (
          <button
            type="button"
            onClick={() => {
              setKey(null);
              setUrl(null);
            }}
            className="text-[13px] text-red-600"
          >
            {t("photoRemove")}
          </button>
        ) : null}
        {error ? <span className="text-[13px] text-red-600">{t("errors.bad_file")}</span> : null}
      </div>
    </div>
  );
}

function resizeToJpeg(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1600;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("encode"))),
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("decode"));
    };
    img.src = objectUrl;
  });
}
