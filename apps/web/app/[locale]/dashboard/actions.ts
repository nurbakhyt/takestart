"use server";

import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { categories, orders, products, shops } from "@/db/schema";
import { requireShop, requireUserId } from "@/lib/dashboard";
import { normalizeKzPhone } from "@/lib/whatsapp";

const SLUG_RE = /^[a-z0-9-]{3,48}$/;
const STATUSES = ["new", "accepted", "done", "cancelled"] as const;

function localeOf(fd: FormData): string {
  const l = String(fd.get("locale") ?? "ru");
  return l === "kk" || l === "en" ? l : "ru";
}

function fail(locale: string, base: string, code: string): never {
  redirect(`${base}?err=${code}`);
}

// --- shops ---

export async function createShop(formData: FormData) {
  const locale = localeOf(formData);
  const ownerId = await requireUserId(locale);
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const whatsapp = normalizeKzPhone(String(formData.get("whatsapp") ?? ""));

  const base = `/${locale}/dashboard`;
  if (!name) fail(locale, base, "name_required");
  if (!SLUG_RE.test(slug)) fail(locale, base, "bad_slug");
  if (!whatsapp) fail(locale, base, "bad_whatsapp");

  const db = getDb();
  const taken = await db
    .select({ id: shops.id })
    .from(shops)
    .where(eq(shops.slug, slug))
    .limit(1);
  if (taken.length > 0) fail(locale, base, "slug_taken");

  const id = crypto.randomUUID();
  await db.insert(shops).values({
    id,
    ownerId,
    slug,
    name,
    whatsappE164: whatsapp,
  });
  redirect(`/${locale}/dashboard/${id}`);
}

export async function updateShop(formData: FormData) {
  const locale = localeOf(formData);
  const shopId = String(formData.get("shopId") ?? "");
  const shop = await requireShop(locale, shopId);
  const base = `/${locale}/dashboard/${shop.id}`;

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const whatsapp = normalizeKzPhone(String(formData.get("whatsapp") ?? ""));
  const addressText = String(formData.get("addressText") ?? "").trim().slice(0, 200);
  const fulfillmentMode = String(formData.get("fulfillmentMode") ?? "both");
  const deliveryFeeTenge = Math.max(
    0,
    Math.min(1_000_000, Number.parseInt(String(formData.get("deliveryFeeTenge") ?? "0"), 10) || 0),
  );
  const minOrderTenge = Math.max(
    0,
    Math.min(10_000_000, Number.parseInt(String(formData.get("minOrderTenge") ?? "0"), 10) || 0),
  );
  const isActive = formData.get("isActive") === "on" ? 1 : 0;

  if (!name) fail(locale, base, "name_required");
  if (!SLUG_RE.test(slug)) fail(locale, base, "bad_slug");
  if (!whatsapp) fail(locale, base, "bad_whatsapp");
  if (!["delivery", "pickup", "both"].includes(fulfillmentMode)) {
    fail(locale, base, "bad_mode");
  }

  const db = getDb();
  if (slug !== shop.slug) {
    const taken = await db
      .select({ id: shops.id })
      .from(shops)
      .where(and(eq(shops.slug, slug), ne(shops.id, shop.id)))
      .limit(1);
    if (taken.length > 0) fail(locale, base, "slug_taken");
  }

  await db
    .update(shops)
    .set({
      name,
      slug,
      whatsappE164: whatsapp,
      addressText,
      fulfillmentMode,
      deliveryFeeTiyin: deliveryFeeTenge * 100,
      minOrderTiyin: minOrderTenge * 100,
      isActive,
    })
    .where(eq(shops.id, shop.id));
  redirect(`${base}?saved=1`);
}

// --- categories ---

export async function createCategory(formData: FormData) {
  const locale = localeOf(formData);
  const shop = await requireShop(locale, String(formData.get("shopId") ?? ""));
  const base = `/${locale}/dashboard/${shop.id}/categories`;
  const nameRu = String(formData.get("nameRu") ?? "").trim().slice(0, 60);
  if (!nameRu) fail(locale, base, "name_required");

  const db = getDb();
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.shopId, shop.id));
  await db.insert(categories).values({
    id: crypto.randomUUID(),
    shopId: shop.id,
    nameRu,
    nameKk: String(formData.get("nameKk") ?? "").trim().slice(0, 60) || null,
    nameEn: String(formData.get("nameEn") ?? "").trim().slice(0, 60) || null,
    sortOrder: existing.length,
  });
  redirect(base);
}

export async function renameCategory(formData: FormData) {
  const locale = localeOf(formData);
  const shop = await requireShop(locale, String(formData.get("shopId") ?? ""));
  const base = `/${locale}/dashboard/${shop.id}/categories`;
  const id = String(formData.get("id") ?? "");
  const nameRu = String(formData.get("nameRu") ?? "").trim().slice(0, 60);
  if (!nameRu) fail(locale, base, "name_required");

  const db = getDb();
  await db
    .update(categories)
    .set({
      nameRu,
      nameKk: String(formData.get("nameKk") ?? "").trim().slice(0, 60) || null,
      nameEn: String(formData.get("nameEn") ?? "").trim().slice(0, 60) || null,
    })
    .where(and(eq(categories.id, id), eq(categories.shopId, shop.id)));
  redirect(base);
}

export async function deleteCategory(formData: FormData) {
  const locale = localeOf(formData);
  const shop = await requireShop(locale, String(formData.get("shopId") ?? ""));
  const base = `/${locale}/dashboard/${shop.id}/categories`;
  const db = getDb();
  await db
    .delete(categories)
    .where(
      and(
        eq(categories.id, String(formData.get("id") ?? "")),
        eq(categories.shopId, shop.id),
      ),
    );
  redirect(base);
}

// --- products ---

const productFields = z.object({
  nameRu: z.string().trim().min(1).max(80),
  nameKk: z.string().trim().max(80).optional().default(""),
  nameEn: z.string().trim().max(80).optional().default(""),
  descRu: z.string().trim().max(500).optional().default(""),
  priceTenge: z.coerce.number().int().min(0).max(100_000_000),
  categoryId: z.string().max(64).optional().default(""),
  isAvailable: z.string().optional().default(""),
  photoR2Key: z.string().max(200).optional().default(""),
});

export async function saveProduct(formData: FormData) {
  const locale = localeOf(formData);
  const shop = await requireShop(locale, String(formData.get("shopId") ?? ""));
  const base = `/${locale}/dashboard/${shop.id}/products`;
  const parsed = productFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail(locale, base, "bad_product");
  const f = parsed.data;

  const db = getDb();
  let categoryId: string | null = f.categoryId || null;
  if (categoryId) {
    const cat = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.shopId, shop.id)))
      .limit(1);
    if (cat.length === 0) categoryId = null;
  }

  let photoR2Key: string | null = f.photoR2Key || null;
  if (photoR2Key && !photoR2Key.startsWith(`shops/${shop.slug}/products/`)) {
    photoR2Key = null; // чужой ключ не принимаем
  }

  const values = {
    shopId: shop.id,
    categoryId,
    nameRu: f.nameRu,
    nameKk: f.nameKk || null,
    nameEn: f.nameEn || null,
    descRu: f.descRu || null,
    descKk: null,
    descEn: null,
    priceTiyin: f.priceTenge * 100,
    photoR2Key,
    isAvailable: f.isAvailable === "on" ? 1 : 0,
  };

  const id = String(formData.get("id") ?? "");
  if (id) {
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.shopId, shop.id)))
      .limit(1);
    if (existing.length === 0) fail(locale, base, "not_found");
    const oldKey = existing[0].photoR2Key;
    await db.update(products).set(values).where(eq(products.id, id));
    if (oldKey && oldKey !== photoR2Key) {
      await deleteR2Key(oldKey).catch(() => {});
    }
  } else {
    const siblings = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.shopId, shop.id));
    await db.insert(products).values({
      id: crypto.randomUUID(),
      ...values,
      sortOrder: siblings.length,
    });
  }
  redirect(base);
}

export async function deleteProduct(formData: FormData) {
  const locale = localeOf(formData);
  const shop = await requireShop(locale, String(formData.get("shopId") ?? ""));
  const base = `/${locale}/dashboard/${shop.id}/products`;
  const id = String(formData.get("id") ?? "");
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.shopId, shop.id)))
    .limit(1);
  if (rows[0]) {
    await db.delete(products).where(eq(products.id, id));
    if (rows[0].photoR2Key) await deleteR2Key(rows[0].photoR2Key).catch(() => {});
  }
  redirect(base);
}

async function deleteR2Key(key: string): Promise<void> {
  const { env } = getCloudflareContext();
  await env.SHOP_IMAGES.delete(key);
}

// --- orders ---

export async function updateOrderStatus(formData: FormData) {
  const locale = localeOf(formData);
  const shop = await requireShop(locale, String(formData.get("shopId") ?? ""));
  const status = String(formData.get("status") ?? "");
  if (!(STATUSES as readonly string[]).includes(status)) {
    redirect(`/${locale}/dashboard/${shop.id}/orders`);
  }
  const db = getDb();
  await db
    .update(orders)
    .set({ status })
    .where(
      and(
        eq(orders.id, String(formData.get("id") ?? "")),
        eq(orders.shopId, shop.id),
      ),
    );
  redirect(`/${locale}/dashboard/${shop.id}/orders`);
}
