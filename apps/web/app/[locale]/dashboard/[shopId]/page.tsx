import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { QRCodeSVG } from "qrcode.react";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { normalizeLocale } from "@/lib/locale-text";
import { requireShop } from "@/lib/dashboard";
import { updateShop } from "../actions";

export default async function ShopSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; shopId: string }>;
  searchParams: Promise<{ err?: string; saved?: string }>;
}) {
  const { locale: rawLocale, shopId } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);
  const { err, saved } = await searchParams;

  const t = await getTranslations("dashboard");
  const shop = await requireShop(locale, shopId);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const publicUrl = host ? `${proto}://${host}/${locale}/s/${shop.slug}` : "";

  const inputCls =
    "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] outline-none focus:border-ink";

  return (
    <div className="flex flex-col gap-4">
      {publicUrl ? (
        <section className="flex items-center gap-4 rounded-lg border border-line bg-paper p-4">
          <QRCodeSVG value={publicUrl} size={96} />
          <div className="flex min-w-0 flex-col items-start gap-2">
            <div className="w-full truncate text-[14px] font-medium">
              {publicUrl}
            </div>
            <CopyLinkButton url={publicUrl} />
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-ink-soft underline underline-offset-4"
            >
              {t("openStorefront")}
            </a>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-line bg-paper p-4 sm:p-5">
        <form action={updateShop} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="shopId" value={shop.id} />

          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-medium">{t("shopName")}</span>
            <input name="name" required maxLength={80} defaultValue={shop.name} className={inputCls} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-medium">{t("slug")}</span>
            <input
              name="slug"
              required
              maxLength={48}
              pattern="[a-z0-9-]{3,48}"
              defaultValue={shop.slug}
              className={inputCls}
            />
            <span className="text-[13px] text-ink-faint">{t("slugWarning")}</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-medium">{t("whatsapp")}</span>
            <input
              name="whatsapp"
              required
              inputMode="tel"
              defaultValue={`+${shop.whatsappE164}`}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-medium">{t("address")}</span>
            <input name="addressText" maxLength={200} defaultValue={shop.addressText ?? ""} className={inputCls} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-medium">{t("mode")}</span>
              <select name="fulfillmentMode" defaultValue={shop.fulfillmentMode} className={inputCls}>
                <option value="both">{t("modeBoth")}</option>
                <option value="delivery">{t("modeDelivery")}</option>
                <option value="pickup">{t("modePickup")}</option>
              </select>
            </label>
            <label className="flex items-center gap-2.5 pt-7 text-[14px] font-medium">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={shop.isActive === 1}
                className="h-5 w-5 accent-[#14663b]"
              />
              {t("visible")}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-medium">{t("deliveryFee")}</span>
              <input
                name="deliveryFeeTenge"
                type="number"
                min={0}
                max={1000000}
                defaultValue={Math.round(shop.deliveryFeeTiyin / 100)}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-medium">{t("minOrder")}</span>
              <input
                name="minOrderTenge"
                type="number"
                min={0}
                max={10000000}
                defaultValue={Math.round(shop.minOrderTiyin / 100)}
                className={inputCls}
              />
            </label>
          </div>

          {err ? (
            <p className="text-[14px] text-tandoor">{t(`errors.${err}`)}</p>
          ) : saved ? (
            <p className="text-[14px] font-medium text-leaf">{t("savedHint")}</p>
          ) : null}

          <button
            type="submit"
            className="rounded-lg bg-ink px-4 py-3 text-[15px] font-medium text-paper active:opacity-90"
          >
            {t("save")}
          </button>
        </form>
      </section>
    </div>
  );
}
