import { getTranslations } from "next-intl/server";
import { LocalizedNames } from "@/components/dashboard/localized-names";
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
    "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] outline-none focus:border-ink";

  return (
    <form action={saveProduct} className="flex flex-col gap-4 rounded-lg border border-line bg-paper p-4 sm:p-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="shopId" value={shopId} />
      {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}

      <PhotoField
        shopId={shopId}
        initialKey={defaults?.photoR2Key ?? null}
        initialUrl={defaults?.photoR2Key ? `/api/images/${defaults.photoR2Key}` : null}
      />

      <LocalizedNames
        shopId={shopId}
        entity="product"
        defaults={
          defaults
            ? { ru: defaults.nameRu, kk: defaults.nameKk, en: defaults.nameEn }
            : null
        }
        maxLength={80}
        inputClassName={inputCls}
        requiredRu
      />

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
        <p className="text-[14px] text-tandoor">{t(`errors.${errorCode}`)}</p>
      ) : null}

      <button
        type="submit"
        className="rounded-lg bg-ink px-4 py-3 text-[15px] font-medium text-paper active:opacity-90"
      >
        {t("save")}
      </button>
    </form>
  );
}
