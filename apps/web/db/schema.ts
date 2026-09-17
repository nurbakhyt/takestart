import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now());

/** Shop: магазин/меню кафе. Один Seller владеет N Shops, slug уникален глобально. */
export const shops = sqliteTable("shops", {
  id: id(),
  ownerId: text("owner_id").notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** WhatsApp-номер магазина в E.164 без плюса, напр. 77011234567 */
  whatsappE164: text("whatsapp_e164").notNull(),
  currency: text("currency").notNull().default("KZT"),
  logoR2Key: text("logo_r2_key"),
  addressText: text("address_text"),
  /** delivery | pickup | both */
  fulfillmentMode: text("fulfillment_mode").notNull().default("both"),
  deliveryFeeTiyin: integer("delivery_fee_tiyin").notNull().default(0),
  minOrderTiyin: integer("min_order_tiyin").notNull().default(0),
  /** 1 = витрина открыта, 0 = скрыта */
  isActive: integer("is_active").notNull().default(1),
  createdAt: createdAt(),
});

/** Category: обязательная группировка Product внутри Shop. */
export const categories = sqliteTable(
  "categories",
  {
    id: id(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    nameRu: text("name_ru").notNull(),
    nameKk: text("name_kk"),
    nameEn: text("name_en"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("categories_shop_idx").on(t.shopId)],
);

/** Product: позиция каталога. Цена в тиынах, вариантов в MVP нет. */
export const products = sqliteTable(
  "products",
  {
    id: id(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    nameRu: text("name_ru").notNull(),
    nameKk: text("name_kk"),
    nameEn: text("name_en"),
    descRu: text("desc_ru"),
    descKk: text("desc_kk"),
    descEn: text("desc_en"),
    priceTiyin: integer("price_tiyin").notNull(),
    photoR2Key: text("photo_r2_key"),
    /** 1 = в продаже, 0 = стоп-лист */
    isAvailable: integer("is_available").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("products_shop_idx").on(t.shopId),
    index("products_category_idx").on(t.categoryId),
  ],
);

/**
 * Order: снапшот Cart, созданный в статусе new в момент нажатия
 * «Заказать в WhatsApp» (см. ADR-0002). itemsJson: [{productId, name, qty, priceTiyin}].
 * status: new | accepted | done | cancelled.
 */
export const orders = sqliteTable(
  "orders",
  {
    id: id(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    /** Человекочитаемый код для WA-переписки, напр. DAN-260918-0042 */
    code: text("code").notNull(),
    itemsJson: text("items_json").notNull(),
    totalTiyin: integer("total_tiyin").notNull(),
    customerName: text("customer_name").notNull().default(""),
    customerPhone: text("customer_phone").notNull(),
    customerAddress: text("customer_address").notNull().default(""),
    comment: text("comment").notNull().default(""),
    status: text("status").notNull().default("new"),
    createdAt: createdAt(),
  },
  (t) => [index("orders_shop_idx").on(t.shopId, t.createdAt)],
);
