"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartLine = {
  id: string;
  name: string;
  priceTiyin: number;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalTiyin: number;
  qtyOf: (id: string) => number;
  add: (line: Omit<CartLine, "qty">) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const MAX_QTY = 99;

function storageKey(slug: string) {
  return `takestart:cart:${slug}`;
}

function load(slug: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) =>
        typeof l.id === "string" &&
        typeof l.name === "string" &&
        typeof l.priceTiyin === "number" &&
        typeof l.qty === "number" &&
        l.qty > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>(() => load(slug));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(lines));
    } catch {
      // переполненное хранилище — корзина живёт только в памяти
    }
  }, [lines, slug]);

  const add = useCallback((line: Omit<CartLine, "qty">) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === line.id);
      if (found) {
        return prev.map((l) =>
          l.id === line.id ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l,
        );
      }
      return [...prev, { ...line, qty: 1 }];
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) =>
            l.id === id ? { ...l, qty: Math.min(MAX_QTY, qty) } : l,
          ),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotalTiyin = lines.reduce((n, l) => n + l.qty * l.priceTiyin, 0);
    return {
      lines,
      count,
      subtotalTiyin,
      qtyOf: (id) => lines.find((l) => l.id === id)?.qty ?? 0,
      add,
      setQty,
      clear,
    };
  }, [lines, add, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
