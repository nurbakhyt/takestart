/** R2-хелперы для фото товаров. Ключи только под shops/<slug>/... (см. image-route). */

export const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const PRODUCT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function productPhotoKey(
  shopSlug: string,
  productId: string,
  ext: "jpg" | "png" | "webp",
): string {
  return `shops/${shopSlug}/products/${productId}.${ext}`;
}

export function extFromMime(mime: string): "jpg" | "png" | "webp" | null {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

export async function putProductPhoto(
  bucket: R2Bucket,
  key: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<void> {
  await bucket.put(key, bytes, {
    httpMetadata: { contentType },
  });
}

export async function deleteProductPhoto(
  bucket: R2Bucket,
  key: string,
): Promise<void> {
  await bucket.delete(key);
}
