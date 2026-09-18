import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { LocaleSwitcher } from "@/components/storefront/locale-switcher";
import { ReceiptDemo } from "@/components/landing/receipt-demo";
import { SiteFooter } from "@/components/site-footer";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Home locale={locale} />;
}

function Home({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const loginHref = `/${locale}/login`;
  const ty = (locale === "kk" || locale === "en" ? locale : "ru") as
    | "ru"
    | "kk"
    | "en";

  return (
    <main className="flex flex-1 flex-col bg-fog text-ink">
      <header className="border-b border-line bg-fog">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <p className="font-display text-[15px] font-semibold tracking-tight">
            TakeStart
          </p>
          <div className="flex items-center gap-3">
            <a
              href={loginHref}
              className="hidden text-[14px] font-medium text-ink-soft underline-offset-4 hover:underline sm:inline"
            >
              {t("final_secondary")}
            </a>
            <LocaleSwitcher locale={ty} path="/" />
          </div>
        </div>
      </header>

      {/* 1. Hero: копия слева, живой чек справа */}
      <section
        id="hero"
        className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-16"
      >
        <div className="max-w-xl">
          <p className="inline-block rounded-full border border-line bg-paper px-3 py-1 text-[13px] font-medium text-ink-soft">
            {t("hero_badge")}
          </p>
          <h1 className="mt-4 font-display text-[clamp(30px,4.5vw,44px)] font-semibold leading-[1.12] tracking-tight">
            {t("hero_title")}
          </h1>
          <p className="mt-4 max-w-[52ch] text-[16px] leading-7 text-ink-soft">
            {t("hero_subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={loginHref}
              className="rounded-xl bg-ink px-5 py-3 text-[15px] font-semibold text-paper"
            >
              {t("hero_primary")}
            </a>
            <a
              href={`/${locale}/s/dala-food`}
              className="rounded-xl border border-line bg-paper px-5 py-3 text-[15px] font-semibold"
            >
              {t("hero_secondary")}
            </a>
          </div>
          <p className="mt-4 max-w-[52ch] text-[13px] leading-5 text-ink-faint">
            {t("hero_note")}
          </p>
        </div>

        <ReceiptDemo
          locale={ty}
          shop={t("demo_shop")}
          meta={t("demo_meta")}
          items={[
            { id: "demo-1", name: t("demo_item1"), price: 1200 },
            { id: "demo-2", name: t("demo_item2"), price: 400 },
            { id: "demo-3", name: t("demo_item3"), price: 350 },
          ]}
          totalLabel={t("demo_total")}
          ctaLabel={t("demo_cta")}
          hint={t("demo_hint")}
          addLabel={t("demo_add")}
        />
      </section>

      {/* 2. Для кого: два листа с разной верхней линейкой */}
      <section id="for-whom" className="border-t border-line bg-paper">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
          <h2 className="font-display text-[22px] font-semibold tracking-tight">
            {t("for_title")}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="border-t-4 border-leaf bg-fog px-6 py-6">
              <h3 className="font-display text-[16px] font-semibold">
                {t("for_1_title")}
              </h3>
              <p className="mt-2 max-w-[52ch] text-[15px] leading-6 text-ink-soft">
                {t("for_1_text")}
              </p>
            </article>
            <article className="border-t-4 border-tandoor bg-fog px-6 py-6">
              <h3 className="font-display text-[16px] font-semibold">
                {t("for_2_title")}
              </h3>
              <p className="mt-2 max-w-[52ch] text-[15px] leading-6 text-ink-soft">
                {t("for_2_text")}
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 3. Как это работает: последовательность, нумерация оправдана */}
      <section id="how" className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <h2 className="font-display text-[22px] font-semibold tracking-tight">
          {t("how_title")}
        </h2>
        <ol className="mt-2">
          {[
            { title: t("how_1_title"), text: t("how_1_text") },
            { title: t("how_2_title"), text: t("how_2_text") },
            { title: t("how_3_title"), text: t("how_3_text") },
          ].map((s, i) => (
            <li
              key={s.title}
              className="relative grid gap-1 border-b border-line py-6 pl-14 last:border-b-0 sm:pl-16"
            >
              <span
                aria-hidden
                className="absolute left-0 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-[15px] font-semibold text-paper"
              >
                {i + 1}
              </span>
              {i < 2 ? (
                <span
                  aria-hidden
                  className="absolute bottom-[-13px] left-[17px] top-[68px] w-px bg-line"
                />
              ) : null}
              <h3 className="font-display text-[16px] font-semibold">
                {s.title}
              </h3>
              <p className="max-w-[62ch] text-[15px] leading-6 text-ink-soft">
                {s.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Преимущества: строки меню с точечными лидерами, не карточки */}
      <section id="benefits" className="border-t border-line bg-paper">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
          <h2 className="font-display text-[22px] font-semibold tracking-tight">
            {t("benefits_title")}
          </h2>
          <dl className="mt-4">
            {[
              { title: t("benefit_1_title"), text: t("benefit_1_text") },
              { title: t("benefit_2_title"), text: t("benefit_2_text") },
              { title: t("benefit_3_title"), text: t("benefit_3_text") },
              { title: t("benefit_4_title"), text: t("benefit_4_text") },
            ].map((b) => (
              <div
                key={b.title}
                className="flex items-baseline gap-3 border-b border-dotted border-line py-5 last:border-b-0"
              >
                <dt className="shrink-0 font-display text-[15px] font-semibold">
                  {b.title}
                </dt>
                <span aria-hidden className="ts-leader" />
                <dd className="max-w-[46ch] text-right text-[14px] leading-6 text-ink-soft sm:text-left">
                  {b.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 5. Честно про MVP */}
      <section
        id="limits"
        className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8"
      >
        <div className="max-w-2xl">
          <h2 className="font-display text-[19px] font-semibold tracking-tight">
            {t("limits_title")}
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-ink-soft">
            {t("limits_text")}
          </p>
          <ul className="mt-4 space-y-2 text-[14px] leading-6 text-ink-soft">
            {[t("limit_1"), t("limit_2"), t("limit_3"), t("limit_4")].map(
              (l) => (
                <li key={l} className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-tandoor"
                  />
                  <span>{l}</span>
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* 6. Финал */}
      <section id="final" className="px-5 pb-16 sm:px-8">
        <div className="mx-auto w-full max-w-6xl bg-leaf-deep px-6 py-12 sm:px-12">
          <h2 className="max-w-[22ch] font-display text-[clamp(24px,3.4vw,32px)] font-semibold leading-tight tracking-tight text-paper">
            {t("final_title")}
          </h2>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-6 text-paper/80">
            {t("final_text")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={loginHref}
              className="rounded-xl bg-tag px-5 py-3 text-[15px] font-bold text-ink"
            >
              {t("final_primary")}
            </a>
            <a
              href={loginHref}
              className="rounded-xl border border-paper/40 px-5 py-3 text-[15px] font-semibold text-paper"
            >
              {t("final_secondary")}
            </a>
          </div>
        </div>
      </section>

      <SiteFooter
        title={t("contacts_title")}
        text={t("contacts_text")}
        whatsappLabel={t("contacts_whatsapp")}
      />
    </main>
  );
}
