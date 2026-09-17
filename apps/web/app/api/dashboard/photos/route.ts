import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { shops } from "@/db/schema";
import { extFromMime, PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_MIME_TYPES, productPhotoKey } from "@/lib/r2";

/**
 * Загрузка фото товара в R2. Клиент заранее ресайзит (≤1600px, JPEG),
 * сервер проверяет тип/размер и владение магазином.
 * Ответ: { key, url }.
 */
export async function POST(req: Request) {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_form" }, { status: 400 });
  }
  const shopId = String(form.get("shopId") ?? "");
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (
    !(PRODUCT_IMAGE_MIME_TYPES as readonly string[]).includes(file.type) ||
    file.size <= 0 ||
    file.size > PRODUCT_IMAGE_MAX_BYTES
  ) {
    return NextResponse.json({ error: "bad_file" }, { status: 400 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(shops)
    .where(eq(shops.id, shopId))
    .limit(1);
  const shop = rows[0];
  if (!shop || shop.ownerId !== ownerId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ext = extFromMime(file.type) ?? "jpg";
  const key = productPhotoKey(shop.slug, crypto.randomUUID(), ext);
  const { env } = getCloudflareContext();
  await env.SHOP_IMAGES.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return NextResponse.json({ key, url: `/api/images/${key}` });
}
