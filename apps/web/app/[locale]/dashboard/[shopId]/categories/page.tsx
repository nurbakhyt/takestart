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
    "rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[14px] outline-none focus:border-zinc-900";

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-2.5 text-[15px] font-semibold">{t("newCategory")}</h2>
        <form action={createCategory} className="flex flex-col gap-2">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="shopId" value={shop.id} />
          <div className="grid grid-cols-3 gap-2">
            <input name="nameRu" required maxLength={60} placeholder="RU *" className={inputCls} />
            <input name="nameKk" maxLength={60} placeholder="KZ" className={inputCls} />
            <input name="nameEn" maxLength={60} placeholder="EN" className={inputCls} />
          </div>
          {err ? <p className="text-[14px] text-red-600">{t(`errors.${err}`)}</p> : null}
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-[14px] font-medium text-white active:scale-[0.99]"
          >
            {t("add")}
          </button>
        </form>
      </section>

      {list.map((c) => (
        <form
          key={c.id}
          action={renameCategory}
          className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="shopId" value={shop.id} />
          <input type="hidden" name="id" value={c.id} />
          <input name="nameRu" required maxLength={60} defaultValue={c.nameRu} className={`${inputCls} min-w-0 flex-1`} />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-zinc-100 px-3 py-2 text-[13px] font-medium"
          >
            {t("save")}
          </button>
          <button
            type="submit"
            formAction={deleteCategory}
            className="shrink-0 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700"
          >
            {t("delete")}
          </button>
        </form>
      ))}
    </div>
  );
}
