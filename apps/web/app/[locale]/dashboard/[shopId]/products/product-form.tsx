import { getTranslations } from "next-intl/server";
import { PhotoField } from "@/components/dashboard/photo-field";
import { saveProduct } from "../../actions";

export type ProductDefaults = {
  id: string;
  nameRu: string;
  nameKk: string | null;
  nameEn: string | null;
  descRu: string | null;
  priceTiyin: number;
  categoryId: string | null;
  photoR2Key: string | null;
  isAvailable: number;
};

export async function ProductForm({
  locale,
  shopId,
  categories,
  defaults,
  errorCode,
}: {
  locale: string;
  shopId: string;
  categories: { id: string; nameRu: string }[];
  defaults: ProductDefaults | null;
  errorCode?: string;
}) {
  const t = await getTranslations("dashboard");
  const inputCls =
    "w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-zinc-900";

  return (
    <form action={saveProduct} className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="shopId" value={shopId} />
      {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}

      <PhotoField
        shopId={shopId}
        initialKey={defaults?.photoR2Key ?? null}
        initialUrl={defaults?.photoR2Key ? `/api/images/${defaults.photoR2Key}` : null}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium">{t("nameRu")} *</span>
          <input name="nameRu" required maxLength={80} defaultValue={defaults?.nameRu ?? ""} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium">{t("nameKk")}</span>
          <input name="nameKk" maxLength={80} defaultValue={defaults?.nameKk ?? ""} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium">{t("nameEn")}</span>
          <input name="nameEn" maxLength={80} defaultValue={defaults?.nameEn ?? ""} className={inputCls} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-medium">{t("desc")}</span>
        <textarea
          name="descRu"
          rows={2}
          maxLength={500}
          defaultValue={defaults?.descRu ?? ""}
          className={`${inputCls} resize-y`}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium">{t("price")} *</span>
          <input
            name="priceTenge"
            type="number"
            required
            min={0}
            max={100000000}
            defaultValue={defaults ? Math.round(defaults.priceTiyin / 100) : ""}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium">{t("category")}</span>
          <select name="categoryId" defaultValue={defaults?.categoryId ?? ""} className={inputCls}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameRu}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2.5 text-[14px] font-medium">
        <input
          type="checkbox"
          name="isAvailable"
          defaultChecked={(defaults?.isAvailable ?? 1) === 1}
          className="h-5 w-5"
        />
        {t("available")}
      </label>

      {errorCode ? (
        <p className="text-[14px] text-red-600">{t(`errors.${errorCode}`)}</p>
      ) : null}

      <button
        type="submit"
        className="rounded-2xl bg-zinc-900 px-4 py-3 text-[15px] font-medium text-white active:scale-[0.99]"
      >
        {t("save")}
      </button>
    </form>
  );
}
