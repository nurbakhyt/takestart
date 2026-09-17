import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";

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
  return <Home />;
}

function Home() {
  const t = useTranslations("home");
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-fog px-6 py-20 text-center">
      <div className="ts-enter flex max-w-md flex-col items-center">
        <p className="font-display text-[13px] font-medium text-ink-faint">
          TakeStart
        </p>
        <h1 className="mt-3 font-display text-[30px] font-semibold leading-tight">
          {t("subtitle")}
        </h1>
        <p className="mt-4 max-w-sm text-[15px] text-ink-soft">{t("hint")}</p>
      </div>
    </main>
  );
}
