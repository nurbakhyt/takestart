"use client";

import { usePathname } from "next/navigation";

/** Вкладки кабинета: активная подчёркивается печатью tandoor. */
export function ShopTabs({
  tabs,
}: {
  tabs: { key: string; label: string; href: string }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-5 overflow-x-auto border-b border-line">
      {tabs.map((tab) => (
        <a
          key={tab.key}
          href={tab.href}
          data-active={pathname === tab.href}
          className="ts-tab shrink-0 text-[15px]"
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
