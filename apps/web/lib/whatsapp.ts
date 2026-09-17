import { formatKZT } from "./locale-text";

export type ReceiptLocale = "ru" | "kk" | "en";
export type Fulfillment = "delivery" | "pickup";

/** Лимит текста wa.me с запасом (официально ~4096 символов на сообщение). */
const WA_TEXT_LIMIT = 3800;

const LABELS: Record<
  ReceiptLocale,
  {
    order: string;
    total: string;
    delivery: string;
    pickup: string;
    name: string;
    phone: string;
    address: string;
    comment: string;
    moreItems: (n: number) => string;
  }
> = {
  ru: {
    order: "Заказ",
    total: "Итого",
    delivery: "Доставка",
    pickup: "Самовывоз",
    name: "Имя",
    phone: "Тел",
    address: "Адрес",
    comment: "Коммент",
    moreItems: (n) => `… и ещё ${n} поз.`,
  },
  kk: {
    order: "Тапсырыс",
    total: "Барлығы",
    delivery: "Жеткізу",
    pickup: "Өзі алып кету",
    name: "Аты",
    phone: "Тел",
    address: "Мекенжай",
    comment: "Пікір",
    moreItems: (n) => `… тағы ${n} атау`,
  },
  en: {
    order: "Order",
    total: "Total",
    delivery: "Delivery",
    pickup: "Pickup",
    name: "Name",
    phone: "Phone",
    address: "Address",
    comment: "Note",
    moreItems: (n) => `… and ${n} more items`,
  },
};

/**
 * Нормализация KZ-номера к 11 цифрам с ведущей 7.
 * Принимает +7..., 8..., 7... с пробелами/дефисами/скобками.
 * Возвращает null, если номер не похож на казахстанский мобильный.
 */
export function normalizeKzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let norm = digits;
  if (norm.length === 11 && norm.startsWith("8")) norm = "7" + norm.slice(1);
  // 10 цифр без кода страны (701...) — дописываем 7
  if (norm.length === 10 && norm.startsWith("7")) norm = "7" + norm;
  if (!/^7\d{10}$/.test(norm)) return null;
  return norm;
}

export type ReceiptLine = { name: string; qty: number; priceTiyin: number };

export function buildOrderText(args: {
  locale: ReceiptLocale;
  code: string;
  shopName: string;
  lines: ReceiptLine[];
  deliveryFeeTiyin: number;
  totalTiyin: number;
  fulfillment: Fulfillment;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  comment: string;
}): string {
  const L = LABELS[args.locale];
  const fmt = (t: number) => formatKZT(t, args.locale);

  const head = `🧾 ${L.order} ${args.code}\n${args.shopName}`;
  const fulfillmentLine =
    args.fulfillment === "pickup" ? `📦 ${L.pickup}` : null;

  const renderLines = (lines: ReceiptLine[]) =>
    lines.map((l) => `— ${l.name} ×${l.qty} — ${fmt(l.qty * l.priceTiyin)}`);

  const tail = [
    fulfillmentLine,
    args.deliveryFeeTiyin > 0
      ? `${L.delivery}: ${fmt(args.deliveryFeeTiyin)}`
      : null,
    `${L.total}: ${fmt(args.totalTiyin)}`,
    args.customerName ? `${L.name}: ${args.customerName}` : null,
    `${L.phone}: +${args.customerPhone}`,
    args.fulfillment === "delivery" && args.customerAddress
      ? `${L.address}: ${args.customerAddress}`
      : null,
    args.comment ? `${L.comment}: ${args.comment}` : null,
  ].filter((s): s is string => s !== null);

  // Схлопывание при переполнении: сначала жертвуем комментарием, потом серединой позиций.
  let comment: string | null = args.comment || null;
  let lines = args.lines;
  for (;;) {
    const text = [head, ...renderLines(lines), ...tail].join("\n");
    if (text.length <= WA_TEXT_LIMIT) return text;
    if (comment) {
      comment = null;
      const idx = tail.findIndex((s) => s.startsWith(`${L.comment}:`));
      if (idx >= 0) tail.splice(idx, 1);
      continue;
    }
    if (lines.length > 3) {
      const keep = 2;
      const dropped = lines.length - keep;
      lines = [...lines.slice(0, keep)];
      const moreLine = L.moreItems(dropped);
      const text2 = [head, ...renderLines(lines), moreLine, ...tail].join("\n");
      if (text2.length <= WA_TEXT_LIMIT) return text2;
      lines = lines.slice(0, 1);
      continue;
    }
    return [head, ...renderLines(lines), ...tail].join("\n").slice(0, WA_TEXT_LIMIT);
  }
}

export function buildWaLink(shopPhoneE164: string, text: string): string {
  return `https://wa.me/${shopPhoneE164}?text=${encodeURIComponent(text)}`;
}

/** Код заказа: <SHOP3>-<YYMMDD>-<seq>. Напр. DAN-260918-0042. */
export function makeOrderCode(
  slug: string,
  now: Date,
  seq: number,
): string {
  const prefix =
    slug
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3)
      .padEnd(3, "X") || "XXX";
  const yy = String(now.getUTCFullYear()).slice(2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${prefix}-${yy}${mm}${dd}-${String(seq).padStart(4, "0")}`;
}
