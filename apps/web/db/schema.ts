import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now());

/** Shop: магазин/меню кафе. Один Seller владеет N Shops, slug уникален глобально. */
export const shops = sqliteTable(
  "shops",
  {
    id: id(),
    /** users.id владельца (FK не ставим: сид owner_demo живёт без users-строки) */
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
  },
  (t) => [index("shops_owner_idx").on(t.ownerId)],
);

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

// ---------------------------------------------------------------------------
// Auth.js (next-auth v5) + @auth/d1-adapter. Имена/типы колонок — по контракту
// адаптера, не переименовывать.
// ---------------------------------------------------------------------------

export const users = sqliteTable("users", {
  id: id(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified"),
  image: text("image"),
});

export const accounts = sqliteTable(
  "accounts",
  {
    id: id(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    // @auth/d1-adapter >= 1.11 пишет OAuth 1.0a токены в linkAccount;
    // без этих колонок Google-вход падает с D1_ERROR "no column named oauth_token".
    oauth_token: text("oauth_token"),
    oauth_token_secret: text("oauth_token_secret"),
  },
  (t) => [
    unique("accounts_provider_unique").on(t.provider, t.providerAccountId),
  ],
);

export const sessions = sqliteTable("sessions", {
  id: id(),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires").notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: integer("expires").notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);
