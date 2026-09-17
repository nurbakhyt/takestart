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
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">TakeStart</h1>
        <p className="mt-1 text-[14px] text-zinc-500">{t("subtitle")}</p>
      </div>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: dashboardHref });
        }}
      >
        <button
          type="submit"
          className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-[15px] font-medium text-white active:scale-[0.99]"
        >
          {t("google")}
        </button>
      </form>

      <div className="text-center text-[13px] text-zinc-400">{t("or")}</div>

      <form
        action={async (formData: FormData) => {
          "use server";
          const email = String(formData.get("email") ?? "").trim();
          await signIn("resend", { email, redirectTo: dashboardHref });
        }}
        className="flex flex-col gap-2.5"
      >
        <input
          name="email"
          type="email"
          required
          placeholder={t("emailPh")}
          autoComplete="email"
          className="w-full rounded-xl border border-zinc-300 px-3.5 py-3 text-[15px] outline-none focus:border-zinc-900"
        />
        <button
          type="submit"
          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-[15px] font-medium active:scale-[0.99]"
        >
          {t("emailCta")}
        </button>
      </form>
      <p className="text-center text-[13px] text-zinc-400">{t("emailHint")}</p>
    </main>
  );
}
