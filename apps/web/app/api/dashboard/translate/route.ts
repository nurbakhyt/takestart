import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { shops } from "@/db/schema";

/**
 * Прокси к воркеру apps/ai (service binding AI_SERVICE). Браузер не знает
 * адрес сервиса и не может тратить наш AI-лимит без магазина: сначала
 * проверяем владение shopId. Контракт тела проверяет сам сервис.
 * Тело: { shopId, entity, from, to, texts } → { translations: string[][] }.
 */
export async function POST(req: Request) {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const payload = (body ?? {}) as Record<string, unknown>;
  const shopId = typeof payload.shopId === "string" ? payload.shopId : "";
  if (!shopId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
  const shop = rows[0];
  if (!shop || shop.ownerId !== ownerId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Название магазина и цену не отправляем — сервису нужен только текст названия.
  const { env } = getCloudflareContext();
  const ai = await env.AI_SERVICE.fetch("https://takestart-ai/translate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      entity: payload.entity,
      from: payload.from,
      to: payload.to,
      texts: payload.texts,
    }),
  }).catch(() => null);

  if (!ai || !ai.ok) {
    const detail = ai ? await ai.text().catch(() => "") : "network";
    console.error("ai translate failed", ai?.status, detail);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  return new NextResponse(await ai.text(), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
