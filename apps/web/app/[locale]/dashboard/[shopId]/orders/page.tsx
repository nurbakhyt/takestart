import { getTranslations, setRequestLocale } from "next-intl/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { formatKZT, normalizeLocale } from "@/lib/locale-text";
import { requireShop } from "@/lib/dashboard";
import type { ReceiptLine } from "@/lib/whatsapp";
import { updateOrderStatus } from "../../actions";

const STATUSES = ["new", "accepted", "done", "cancelled"] as const;

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string; shopId: string }>;
}) {
  const { locale: rawLocale, shopId } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const shop = await requireShop(locale, shopId);

  const db = getDb();
  const list = await db
    .select()
    .from(orders)
    .where(eq(orders.shopId, shop.id))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  if (list.length === 0) {
    return <p className="py-8 text-center text-[14px] text-zinc-500">{t("noOrders")}</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {list.map((o) => {
        const lines = JSON.parse(o.itemsJson) as ReceiptLine[];
        const date = new Date(o.createdAt).toLocaleString(
          locale === "kk" ? "kk-KZ" : locale === "en" ? "en-GB" : "ru-RU",
          { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" },
        );
        return (
          <article
            key={o.id}
            className="rounded-2xl border border-zinc-200 bg-white p-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-[15px] font-semibold">{o.code}</div>
              <div className="text-[13px] text-zinc-500">{date}</div>
            </div>
            <ul className="mt-2 flex flex-col gap-0.5 text-[14px]">
              {lines.map((l, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">
                    {l.name} ×{l.qty}
                  </span>
                  <span className="shrink-0 text-zinc-600">
                    {formatKZT(l.qty * l.priceTiyin, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-1.5 flex justify-between text-[15px] font-semibold">
              <span>{t("total")}</span>
              <span>{formatKZT(o.totalTiyin, locale)}</span>
            </div>
            <div className="mt-1.5 text-[13px] text-zinc-600">
              {o.customerName ? `${o.customerName} · ` : ""}+{o.customerPhone}
              {o.customerAddress ? ` · ${o.customerAddress}` : ""}
              {o.comment ? ` · «${o.comment}»` : ""}
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <form action={updateOrderStatus} className="flex flex-1 items-center gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="shopId" value={shop.id} />
                <input type="hidden" name="id" value={o.id} />
                <select
                  name="status"
                  defaultValue={o.status}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[14px]"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`orderStatus.${s}`)}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-zinc-100 px-3.5 py-2 text-[13px] font-medium"
                >
                  {t("save")}
                </button>
              </form>
              <a
                href={`https://wa.me/${o.customerPhone}?text=${encodeURIComponent(`${shop.name}, ${t("replyPrefix")} ${o.code}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-xl bg-emerald-50 px-3.5 py-2 text-[13px] font-medium text-emerald-700"
              >
                WhatsApp
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
