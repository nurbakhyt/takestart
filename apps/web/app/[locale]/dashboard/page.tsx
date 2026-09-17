import { getTranslations, setRequestLocale } from "next-intl/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { shops } from "@/db/schema";
import { normalizeLocale } from "@/lib/locale-text";
import { requireUserId } from "@/lib/dashboard";
import { createShop } from "./actions";

export default async function DashboardHome({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);
  const { err } = await searchParams;

  const t = await getTranslations("dashboard");
  const ownerId = await requireUserId(locale);

  const db = getDb();
  const myShops = await db
    .select()
    .from(shops)
    .where(eq(shops.ownerId, ownerId));

  const inputCls =
    "w-full rounded-none border-0 border-b border-line bg-transparent px-0 py-2.5 text-[15px] outline-none placeholder:text-ink-faint focus:border-ink";

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-1 font-display text-[15px] font-semibold">
          {t("myShops")}
        </h2>
        {myShops.length === 0 ? (
          <p className="py-4 text-[14px] text-ink-soft">{t("noShops")}</p>
        ) : (
          <div>
            {myShops.map((s) => (
              <a
                key={s.id}
                href={`/${locale}/dashboard/${s.id}`}
                className="flex items-baseline gap-2 border-b border-line py-3"
              >
                <span className="truncate text-[15px] font-medium">
                  {s.name}
                </span>
                <span aria-hidden className="ts-leader" />
                <span className="shrink-0 text-[13px] text-ink-faint">
                  /s/{s.slug}
                  {s.isActive !== 1 ? `, ${t("hidden")}` : ""}
                </span>
                <span className="shrink-0 text-[13px] font-medium text-ink underline underline-offset-4">
                  {t("open")}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-line bg-paper p-4 sm:p-5">
        <h2 className="mb-3 font-display text-[15px] font-semibold">
          {t("newShop")}
        </h2>
        <form action={createShop} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <input
            name="name"
            required
            maxLength={80}
            placeholder={t("shopNamePh")}
            className={inputCls}
          />
          <input
            name="slug"
            required
            maxLength={48}
            placeholder={t("slugPh")}
            pattern="[a-z0-9-]{3,48}"
            className={inputCls}
          />
          <input
            name="whatsapp"
            required
            placeholder={t("whatsappPh")}
            inputMode="tel"
            className={inputCls}
          />
          {err ? (
            <p className="text-[14px] text-tandoor">{t(`errors.${err}`)}</p>
          ) : null}
          <button
            type="submit"
            className="rounded-lg bg-ink px-4 py-3 text-[15px] font-medium text-paper active:opacity-90"
          >
            {t("create")}
          </button>
        </form>
      </section>
    </div>
  );
}
