"use client";

import { useEffect, useState } from "react";

/** Вкладки категорий с подчёркиванием активного раздела при прокрутке. */
export function CategoryNav({
  items,
}: {
  items: { id: string; label: string }[];
}) {
  const [active, setActive] = useState<string | null>(
    items.length > 0 ? items[0].id : null,
  );

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id.replace(/^cat-/, ""));
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const { id } of items) {
      const el = document.getElementById(`cat-${id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Категории"
      className="flex gap-5 overflow-x-auto px-4 pb-1 sm:px-6"
    >
      {items.map((c) => (
        <a
          key={c.id}
          href={`#cat-${c.id}`}
          data-active={active === c.id}
          className="ts-tab shrink-0 text-[15px]"
        >
          {c.label}
        </a>
      ))}
    </nav>
  );
}
