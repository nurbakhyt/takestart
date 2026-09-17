import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products, shops } from "@/db/schema";

export async function getShopBySlug(slug: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(shops)
    .where(eq(shops.slug, slug))
    .limit(1);
  const shop = rows[0];
  if (!shop || shop.isActive !== 1) return undefined;
  return shop;
}

export type MenuCategory = {
  id: string;
  nameRu: string;
  nameKk: string | null;
  nameEn: string | null;
  items: MenuItem[];
};

export type MenuItem = {
  id: string;
  categoryId: string | null;
  nameRu: string;
  nameKk: string | null;
  nameEn: string | null;
  descRu: string | null;
  descKk: string | null;
  descEn: string | null;
  priceTiyin: number;
  photoR2Key: string | null;
  isAvailable: number;
};

export async function getMenu(shopId: string): Promise<MenuCategory[]> {
  const db = getDb();
  const [cats, prods] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(eq(categories.shopId, shopId))
      .orderBy(asc(categories.sortOrder)),
    db
      .select()
      .from(products)
      .where(eq(products.shopId, shopId))
      .orderBy(asc(products.sortOrder)),
  ]);

  const byCategory = new Map<string, MenuItem[]>();
  const withoutCategory: MenuItem[] = [];
  for (const p of prods) {
    const item: MenuItem = {
      id: p.id,
      categoryId: p.categoryId,
      nameRu: p.nameRu,
      nameKk: p.nameKk,
      nameEn: p.nameEn,
      descRu: p.descRu,
      descKk: p.descKk,
      descEn: p.descEn,
      priceTiyin: p.priceTiyin,
      photoR2Key: p.photoR2Key,
      isAvailable: p.isAvailable,
    };
    if (p.categoryId) {
      const list = byCategory.get(p.categoryId) ?? [];
      list.push(item);
      byCategory.set(p.categoryId, list);
    } else {
      withoutCategory.push(item);
    }
  }

  const menu: MenuCategory[] = cats.map((c) => ({
    id: c.id,
    nameRu: c.nameRu,
    nameKk: c.nameKk,
    nameEn: c.nameEn,
    items: byCategory.get(c.id) ?? [],
  }));

  // Категории без товаров скрываем, товары без категории — в хвост «Без категории» не выводим,
  // а присоединяем к первой категории, чтобы меню не распадалось. Если категорий нет вовсе —
  // показываем всё одним списком.
  if (cats.length === 0 && withoutCategory.length > 0) {
    menu.push({
      id: "all",
      nameRu: "Меню",
      nameKk: "Мәзір",
      nameEn: "Menu",
      items: withoutCategory,
    });
  }
  return menu.filter((c) => c.items.length > 0);
}
