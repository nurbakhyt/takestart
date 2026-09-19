import { describe, expect, it } from "vitest";

import { LIMITS } from "../src/contract";
import { parseTranslations } from "../src/parse";

const rows = (value: string) => `{"translations": ${value}}`;

describe("parseTranslations", () => {
  it("reads one row per text with one value per target language", () => {
    const result = parseTranslations(
      rows('[["Лағман қой етімен","Lagman with beef"],["Сорпа","Soup"]]'),
      2,
      2,
    );
    expect(result).toEqual({
      ok: true,
      translations: [
        ["Лағман қой етімен", "Lagman with beef"],
        ["Сорпа", "Soup"],
      ],
    });
  });

  it("trims surrounding whitespace", () => {
    const result = parseTranslations(rows('[["  Лағман  "," Lagman "]]'), 1, 2);
    expect(result).toEqual({ ok: true, translations: [["Лағман", "Lagman"]] });
  });

  it("reads JSON wrapped in a markdown fence or in prose", () => {
    const fenced = parseTranslations(
      "```json\n" + rows('[["Лағман","Lagman"]]') + "\n```",
      1,
      2,
    );
    const prose = parseTranslations(
      "Sure! Here you go:\n" + rows('[["Лағман","Lagman"]]') + "\nHope that helps.",
      1,
      2,
    );
    expect(fenced).toEqual({ ok: true, translations: [["Лағман", "Lagman"]] });
    expect(prose).toEqual({ ok: true, translations: [["Лағман", "Lagman"]] });
  });

  it.each([
    [
      "an extra closing bracket before the final brace",
      '{"translations": [["Лағман","Lagman"]]]}',
    ],
    ["a trailing comma", '{"translations": [["Лағман","Lagman"],]}'],
    ["a bare array without the wrapper", '[["Лағман","Lagman"]]'],
    [
      "a fence around an extra bracket",
      "```json\n{\"translations\": [[\"Лағман\",\"Lagman\"]]]}\n```",
    ],
  ])("repairs %s", (_name, raw) => {
    expect(parseTranslations(raw, 1, 2)).toEqual({
      ok: true,
      translations: [["Лағман", "Lagman"]],
    });
  });

  it.each([
    ["plain text", "I cannot help with that", "model did not return a JSON object"],
    ["truncated JSON", '{"translations": [["Лағман",', "model did not return a JSON object"],
    ["missing key", '{"result": []}', "translations is not an array"],
    ["too few rows", rows("[]"), "expected 1 rows, got 0"],
    ["too many rows", rows('[["a","b"],["c","d"]]'), "expected 1 rows, got 2"],
    ["row is not an array", rows('["a"]'), "row 0 is not an array"],
    ["too few values", rows('[["Лағман"]]'), "row 0 has 1 values, expected 2"],
    ["too many values", rows('[["a","b","c"]]'), "row 0 has 3 values, expected 2"],
    ["non-string value", rows("[[1, 2]]"), "row 0 contains a non-string value"],
    ["blank value", rows('[["   ","Lagman"]]'), "row 0 contains an empty translation"],
    [
      "over-long value",
      rows(`[["${"я".repeat(LIMITS.maxTextLength + 1)}","Lagman"]]`),
      "row 0 contains an over-long translation",
    ],
  ])("rejects %s", (_name, raw, reason) => {
    expect(parseTranslations(raw, 1, 2)).toEqual({ ok: false, reason });
  });

  it("rejects a second bad row even when the first one is fine", () => {
    const result = parseTranslations(
      rows('[["Лағман","Lagman"],["   ","Soup"]]'),
      2,
      2,
    );
    expect(result).toEqual({
      ok: false,
      reason: "row 1 contains an empty translation",
    });
  });
});
