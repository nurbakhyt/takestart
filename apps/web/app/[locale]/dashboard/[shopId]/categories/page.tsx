import { getTranslations, setRequestLocale } from "next-intl/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { normalizeLocale } from "@/lib/locale-text";
import { requireShop } from "@/lib/dashboard";
import { createCategory, deleteCategory, renameCategory } from "../../actions";

export default async function CategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; shopId: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { locale: rawLocale, shopId } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);
  const { err } = await searchParams;

  const t = await getTranslations("dashboard");
  const shop = await requireShop(locale, shopId);

  const db = getDb();
  const list = await db
    .select()
    .from(categories)
    .where(eq(categories.shopId, shop.id))
    .orderBy(asc(categories.sortOrder));

  const inputCls =
    "rounded-lg border border-line bg-paper px-3 py-2 text-[14px] outline-none focus:border-ink";

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-line bg-paper p-4">
        <h2 className="mb-2.5 font-display text-[14px] font-semibold">{t("newCategory")}</h2>
        <form action={createCategory} className="flex flex-col gap-2.5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="shopId" value={shop.id} />
          <div className="grid grid-cols-3 gap-2">
            <input name="nameRu" required maxLength={60} placeholder="RU *" className={inputCls} />
            <input name="nameKk" maxLength={60} placeholder="KZ" className={inputCls} />
            <input name="nameEn" maxLength={60} placeholder="EN" className={inputCls} />
          </div>
          {err ? <p className="text-[14px] text-tandoor">{t(`errors.${err}`)}</p> : null}
          <button
            type="submit"
            className="rounded-lg bg-ink px-4 py-2.5 text-[14px] font-medium text-paper active:opacity-90"
          >
            {t("add")}
          </button>
        </form>
      </section>

      {list.map((c) => (
        <form
          key={c.id}
          action={renameCategory}
          className="flex items-center gap-2 border-b border-line py-2.5"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="shopId" value={shop.id} />
          <input type="hidden" name="id" value={c.id} />
          <input name="nameRu" required maxLength={60} defaultValue={c.nameRu} className={`${inputCls} min-w-0 flex-1`} />
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-line bg-paper px-3 py-2 text-[13px] font-medium"
          >
            {t("save")}
          </button>
          <button
            type="submit"
            formAction={deleteCategory}
            className="shrink-0 rounded-lg border border-tandoor/40 px-3 py-2 text-[13px] font-medium text-tandoor"
          >
            {t("delete")}
          </button>
        </form>
      ))}
    </div>
  );
}
