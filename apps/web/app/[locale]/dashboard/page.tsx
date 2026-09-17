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

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2.5 text-[16px] font-semibold">{t("myShops")}</h2>
        {myShops.length === 0 ? (
          <p className="text-[14px] text-zinc-500">{t("noShops")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {myShops.map((s) => (
              <a
                key={s.id}
                href={`/${locale}/dashboard/${s.id}`}
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-medium">{s.name}</div>
                  <div className="truncate text-[13px] text-zinc-500">
                    /s/{s.slug}
                    {s.isActive !== 1 ? ` · ${t("hidden")}` : ""}
                  </div>
                </div>
                <span className="text-zinc-400">→</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-[16px] font-semibold">{t("newShop")}</h2>
        <form action={createShop} className="flex flex-col gap-2.5">
          <input type="hidden" name="locale" value={locale} />
          <input
            name="name"
            required
            maxLength={80}
            placeholder={t("shopNamePh")}
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-[15px] outline-none focus:border-zinc-900"
          />
          <input
            name="slug"
            required
            maxLength={48}
            placeholder={t("slugPh")}
            pattern="[a-z0-9-]{3,48}"
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-[15px] outline-none focus:border-zinc-900"
          />
          <input
            name="whatsapp"
            required
            placeholder={t("whatsappPh")}
            inputMode="tel"
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-[15px] outline-none focus:border-zinc-900"
          />
          {err ? (
            <p className="text-[14px] text-red-600">{t(`errors.${err}`)}</p>
          ) : null}
          <button
            type="submit"
            className="rounded-2xl bg-zinc-900 px-4 py-3 text-[15px] font-medium text-white active:scale-[0.99]"
          >
            {t("create")}
          </button>
        </form>
      </section>
    </div>
  );
}
