import { describe, expect, it } from "vitest";

import { LIMITS, validateTranslateRequest } from "../src/contract";

const valid = {
  entity: "product",
  from: "ru",
  to: ["kk", "en"],
  texts: ["Лагман с говядиной"],
};

describe("validateTranslateRequest", () => {
  it("accepts a well-formed request", () => {
    expect(validateTranslateRequest(valid)).toEqual({
      ok: true,
      value: valid,
    });
  });

  it("trims texts", () => {
    const result = validateTranslateRequest({
      ...valid,
      texts: ["  Лагман  "],
    });
    expect(result).toEqual({ ok: true, value: { ...valid, texts: ["Лагман"] } });
  });

  it("keeps target languages in the given order", () => {
    const result = validateTranslateRequest({ ...valid, to: ["en", "kk"] });
    expect(result).toEqual({
      ok: true,
      value: { ...valid, to: ["en", "kk"] },
    });
  });

  it.each([
    ["non-object body", "nope", "body must be a JSON object"],
    ["null body", null, "body must be a JSON object"],
    ["array body", [], "body must be a JSON object"],
    ["unknown entity", { ...valid, entity: "shop" }, "entity must be one of: product, category"],
    ["unknown from", { ...valid, from: "de" }, "from must be a supported language"],
    ["empty to", { ...valid, to: [] }, "to must be a non-empty array of languages"],
    ["unsupported target", { ...valid, to: ["kz"] }, "to must contain only supported languages"],
    ["duplicate target", { ...valid, to: ["kk", "kk"] }, "to must not contain duplicates"],
    ["source is a target", { ...valid, to: ["ru", "kk"] }, "from must not be a target language"],
    ["empty texts", { ...valid, texts: [] }, "texts must be a non-empty array of strings"],
    ["non-string text", { ...valid, texts: [42] }, "every text must be a string"],
    ["blank text", { ...valid, texts: ["   "] }, "texts must not contain empty strings"],
    [
      "too many texts",
      { ...valid, texts: Array.from({ length: LIMITS.maxTexts + 1 }, () => "Лагман") },
      `texts must contain at most ${LIMITS.maxTexts} items`,
    ],
    [
      "over-long text",
      { ...valid, texts: ["я".repeat(LIMITS.maxTextLength + 1)] },
      `every text must be at most ${LIMITS.maxTextLength} characters long`,
    ],
  ])("rejects %s", (_name, body, message) => {
    expect(validateTranslateRequest(body)).toEqual({ ok: false, message });
  });

  it("accepts a request at the limits", () => {
    const result = validateTranslateRequest({
      ...valid,
      texts: Array.from({ length: LIMITS.maxTexts }, () =>
        "я".repeat(LIMITS.maxTextLength),
      ),
    });
    expect(result.ok).toBe(true);
  });
});
