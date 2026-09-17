import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { shops } from "@/db/schema";

/** Текущий userId или редирект на login. */
export async function requireUserId(locale: string): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect(`/${locale}/login`);
  return id;
}

/** Магазин владельца или редирект на список. Чужое не отдаём. */
export async function requireShop(locale: string, shopId: string) {
  const ownerId = await requireUserId(locale);
  const db = getDb();
  const rows = await db
    .select()
    .from(shops)
    .where(eq(shops.id, shopId))
    .limit(1);
  const shop = rows[0];
  if (!shop || shop.ownerId !== ownerId) redirect(`/${locale}/dashboard`);
  return shop;
}

export type ShopRow = Awaited<ReturnType<typeof requireShop>>;
