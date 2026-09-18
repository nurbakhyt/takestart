/**
 * Общий футер сайта с контактами.
 * Серверный, без локали внутри — строки приходят пропсами,
 * поэтому годится для любой страницы под [locale].
 */
export function SiteFooter({
  title,
  text,
  whatsappLabel,
}: {
  title: string;
  text: string;
  whatsappLabel: string;
}) {
  return (
    <footer id="contacts" className="border-t border-line bg-paper">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <h2 className="font-display text-[19px] font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-2 max-w-[52ch] text-[14px] leading-6 text-ink-soft">
            {text}
          </p>
        </div>
        <address className="flex flex-col gap-2 text-[15px] font-medium not-italic sm:items-end">
          <a
            href="https://wa.me/77711779855"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:underline"
          >
            +7 771 177 98 55 · {whatsappLabel}
          </a>
          <a
            href="mailto:info@takestart.cc"
            className="text-ink-soft underline-offset-4 hover:underline"
          >
            info@takestart.cc
          </a>
        </address>
      </div>
    </footer>
  );
}
