import { setRequestLocale } from "next-intl/server";
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

  return (
    <div className="mx-auto min-w-0 max-w-3xl pb-10">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <a href={`/${locale}/dashboard`} className="text-[16px] font-semibold">
          TakeStart
        </a>
        <div className="flex items-center gap-3">
          <span className="max-w-40 truncate text-[13px] text-zinc-500">
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
              className="rounded-full bg-zinc-100 px-3 py-1.5 text-[13px] font-medium"
            >
              ×
            </button>
          </form>
        </div>
      </header>
      <main className="px-4 pt-4">{children}</main>
    </div>
  );
}
