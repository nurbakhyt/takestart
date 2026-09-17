import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { normalizeLocale } from "@/lib/locale-text";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user) redirect(`/${locale}/dashboard`);

  const t = await getTranslations("auth");
  const dashboardHref = `/${locale}/dashboard`;

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-fog px-6 py-16">
      <div className="ts-enter w-full max-w-sm rounded-lg border border-line bg-paper p-6">
        <div className="text-center">
          <h1 className="font-display text-[22px] font-semibold">TakeStart</h1>
          <p className="mt-1.5 text-[14px] text-ink-soft">{t("subtitle")}</p>
        </div>

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: dashboardHref });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-ink px-4 py-3 text-[15px] font-medium text-paper active:opacity-90"
          >
            {t("google")}
          </button>
        </form>

        <div className="my-4 text-center text-[13px] text-ink-faint">
          {t("or")}
        </div>

        <form
          action={async (formData: FormData) => {
            "use server";
            const email = String(formData.get("email") ?? "").trim();
            await signIn("resend", { email, redirectTo: dashboardHref });
          }}
          className="flex flex-col gap-3"
        >
          <input
            name="email"
            type="email"
            required
            placeholder={t("emailPh")}
            autoComplete="email"
            className="w-full rounded-none border-0 border-b border-line bg-transparent px-0 py-2.5 text-[15px] outline-none placeholder:text-ink-faint focus:border-ink"
          />
          <button
            type="submit"
            className="w-full rounded-lg border border-ink bg-paper px-4 py-3 text-[15px] font-medium text-ink active:bg-fog"
          >
            {t("emailCta")}
          </button>
        </form>
        <p className="mt-4 text-center text-[13px] text-ink-faint">
          {t("emailHint")}
        </p>
      </div>
    </main>
  );
}
