import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { normalizeLocale } from "@/lib/locale-text";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const t = await getTranslations("dashboard");

  return (
    <div className="min-h-dvh bg-fog">
      <div className="mx-auto min-w-0 max-w-3xl pb-10">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
          <a
            href={`/${locale}/dashboard`}
            className="font-display text-[16px] font-semibold"
          >
            TakeStart
          </a>
          <div className="flex items-center gap-3">
            <span className="max-w-40 truncate text-[13px] text-ink-faint">
              {session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: `/${locale}/login` });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-line bg-paper px-3 py-1.5 text-[13px] font-medium text-ink-soft"
              >
                {t("logout")}
              </button>
            </form>
          </div>
        </header>
        <main className="px-4 pt-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
