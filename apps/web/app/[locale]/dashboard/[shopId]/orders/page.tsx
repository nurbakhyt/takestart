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
    return <p className="py-8 text-center text-[14px] text-ink-soft">{t("noOrders")}</p>;
  }

  return (
    <div>
      {list.map((o) => {
        const lines = JSON.parse(o.itemsJson) as ReceiptLine[];
        const date = new Date(o.createdAt).toLocaleString(
          locale === "kk" ? "kk-KZ" : locale === "en" ? "en-GB" : "ru-RU",
          { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" },
        );
        const contact = [
          o.customerName || null,
          `+${o.customerPhone}`,
          o.customerAddress || null,
          o.comment ? `«${o.comment}»` : null,
        ]
          .filter(Boolean)
          .join(", ");
        return (
          <article
            key={o.id}
            className="border-b border-line py-3.5 first:pt-1"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-display text-[14px] font-semibold">{o.code}</div>
              <div className="shrink-0 text-[13px] text-ink-faint">{date}</div>
            </div>
            <ul className="mt-2 flex flex-col text-[14px]">
              {lines.map((l, i) => (
                <li key={i} className="flex items-baseline gap-2 py-0.5">
                  <span className="min-w-0 truncate">
                    {l.name}, ×{l.qty}
                  </span>
                  <span aria-hidden className="ts-leader" />
                  <span className="shrink-0 text-ink-soft">
                    {formatKZT(l.qty * l.priceTiyin, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-[15px] font-semibold">{t("total")}</span>
              <span className="font-display text-[14px] font-semibold text-tandoor">
                {formatKZT(o.totalTiyin, locale)}
              </span>
            </div>
            <div className="mt-1 text-[13px] text-ink-soft">{contact}</div>
            <div className="mt-2.5 flex items-center gap-2">
              <form action={updateOrderStatus} className="flex flex-1 items-center gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="shopId" value={shop.id} />
                <input type="hidden" name="id" value={o.id} />
                <select
                  name="status"
                  defaultValue={o.status}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-[14px] outline-none focus:border-ink"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`orderStatus.${s}`)}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-line bg-paper px-3.5 py-2 text-[13px] font-medium"
                >
                  {t("save")}
                </button>
              </form>
              <a
                href={`https://wa.me/${o.customerPhone}?text=${encodeURIComponent(`${shop.name}, ${t("replyPrefix")} ${o.code}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-leaf px-3.5 py-2 text-[13px] font-medium text-white"
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
