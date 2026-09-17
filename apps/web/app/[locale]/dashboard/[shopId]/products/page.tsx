import { getTranslations, setRequestLocale } from "next-intl/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { formatKZT, normalizeLocale } from "@/lib/locale-text";
import { requireShop } from "@/lib/dashboard";
import { deleteProduct } from "../../actions";

export default async function ProductsPage({
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
    .from(products)
    .where(eq(products.shopId, shop.id))
    .orderBy(asc(products.sortOrder));

  return (
    <div className="flex flex-col gap-2.5">
      <a
        href={`/${locale}/dashboard/${shop.id}/products/new`}
        className="rounded-lg bg-ink px-4 py-3 text-center text-[15px] font-medium text-paper active:opacity-90"
      >
        + {t("newProduct")}
      </a>
      {list.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-ink-soft">{t("noProducts")}</p>
      ) : (
        <div>
          {list.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 border-b border-line py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-medium">
                  {p.nameRu}
                  {p.isAvailable !== 1 ? (
                    <span className="text-tandoor">, {t("stopped")}</span>
                  ) : null}
                </div>
                <div className="font-display text-[13px] font-medium text-ink-soft">
                  {formatKZT(p.priceTiyin, locale)}
                </div>
              </div>
              <a
                href={`/${locale}/dashboard/${shop.id}/products/${p.id}`}
                className="shrink-0 rounded-lg border border-line bg-paper px-3.5 py-2 text-[13px] font-medium"
              >
                {t("edit")}
              </a>
              <form action={deleteProduct}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="shopId" value={shop.id} />
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-tandoor/40 px-3.5 py-2 text-[13px] font-medium text-tandoor"
                >
                  {t("delete")}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
