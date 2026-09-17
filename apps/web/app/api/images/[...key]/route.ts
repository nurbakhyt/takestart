import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Отдаёт фото товаров из R2. Ключи строго под shops/ — чужое не отдаём. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");

  if (!objectKey.startsWith("shops/") || objectKey.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const { env } = getCloudflareContext();
  const obj = await env.SHOP_IMAGES.get(objectKey);
  if (!obj) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type":
        obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      ...(obj.httpEtag ? { ETag: obj.httpEtag } : {}),
    },
  });
}
